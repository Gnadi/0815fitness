import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { color, font, zoneColors, ZONE_NAMES } from '../theme';
import * as S from '../styles';
import { Label } from '../components/primitives';
import { LoadChart, ZoneMixChart, PowerCurveChart, HistogramBars } from '../components/charts';
import { useUnits } from '../hooks/useUnits';
import { clusterRoutes, type RouteCluster } from '../lib/routes';
import {
  activityStress,
  addDays,
  aggregateZoneSeconds,
  cadenceSummary,
  chronicSeries,
  computePersonalBests,
  fmtClock,
  fmtDayMonth,
  fmtEuroDate,
  histogramPercentile,
  hoursMinutes,
  isoWeekLabel,
  lastNWeekStarts,
  loadBalance,
  loadOf,
  type LoadBalance,
  POWER_DURATIONS,
  powerCurve,
  rampPct,
  rollupWeeks,
  sparkPathFromHistory,
  startOfWeek,
  weeklyDecoupling,
  zoneCuts,
  zoneLabel,
} from '../lib/stats';
import type { Activity, Settings } from '../types';

type Tab = 'load' | 'zones' | 'records' | 'routes' | 'plan';
type Range = '30 D' | '90 D' | '12 MO';

const RANGE_DAYS: Record<Range, number> = { '30 D': 30, '90 D': 90, '12 MO': 365 };

const SESSIONS = [
  { name: 'Rest', detail: 'walk, mobility', km: 0, kind: 'rest' as const, target: '—' },
  { name: 'Easy run', detail: 'zone 2, conversational', km: 10, kind: 'run' as const, target: '10 km' },
  { name: 'Tempo', detail: '8 km @ 4:35', km: 14, kind: 'run' as const, target: '14 km' },
  { name: 'Intervals', detail: '6 × 1 km @ 4:05', km: 12, kind: 'run' as const, target: '12 km' },
  { name: 'Long run', detail: 'zone 2, last 5 km steady', km: 24, kind: 'run' as const, target: '24 km' },
  { name: 'Ride', detail: 'endurance, 190 W', km: 45, kind: 'ride' as const, target: '45 km' },
  { name: 'Long ride', detail: '4 h, 175 W', km: 90, kind: 'ride' as const, target: '90 km' },
];

const DAY_LABELS = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];

export function Analyse({
  activities,
  settings,
  onSettings,
  onBack,
  onRoute,
  onActivity,
}: {
  activities: Activity[];
  settings: Settings;
  onSettings: (s: Settings) => void;
  onBack: () => void;
  onRoute: (id: string) => void;
  onActivity: (id: string) => void;
}) {
  const [tab, setTab] = useState<Tab>('load');
  const [range, setRange] = useState<Range>('90 D');

  // One stable reference time per mount, so memoised aggregates don't churn.
  const [now] = useState(() => Date.now());
  const weekStarts = useMemo(() => lastNWeekStarts(12, now), [now]);
  const rollups = useMemo(() => rollupWeeks(activities, weekStarts, settings), [activities, weekStarts, settings]);
  // Memoised because the load table below is keyed on them: a series rebuilt on every
  // repaint would defeat the memo that keeps decoupling off the render path.
  const acute = useMemo(() => rollups.map((r) => loadOf(r, settings)), [rollups, settings]);
  const chronic = useMemo(() => chronicSeries(acute), [acute]);
  const balance = useMemo(() => loadBalance(activities, settings, now), [activities, settings, now]);

  const inRange = useMemo(
    () => activities.filter((a) => now - a.startedAt <= RANGE_DAYS[range] * 86400000),
    [activities, now, range],
  );

  const tabStyle = (t: Tab): CSSProperties => ({
    fontFamily: font.mono,
    background: 'none',
    border: 'none',
    padding: '12px 0 10px',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '.1em',
    color: tab === t ? color.text : color.textFaint,
    boxShadow: tab === t ? `inset 0 -2px 0 ${color.accent}` : undefined,
  });

  const cycleRange = () => setRange((r) => (r === '90 D' ? '12 MO' : r === '12 MO' ? '30 D' : '90 D'));

  return (
    <div style={S.screen}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={onBack}
            aria-label="Back to overview"
            style={{ background: 'none', border: 'none', color: color.textFaint, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 6px 0 0' }}
          >
            ‹
          </button>
          <span style={S.title}>Analyse</span>
        </div>
        <button
          onClick={cycleRange}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: `1px solid ${color.border}`,
            borderRadius: 999,
            padding: '5px 11px',
            color: color.text,
            fontFamily: font.mono,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '.06em',
            cursor: 'pointer',
          }}
        >
          {range}
        </button>
      </div>

      <div style={{ display: 'flex', padding: '0 16px', gap: 14, borderBottom: `1px solid ${color.dividerHairline}` }}>
        {(['load', 'zones', 'records', 'routes', 'plan'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="ct-scroll" style={{ ...S.scrollArea, padding: '18px 0 40px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {tab === 'load' && <LoadTab activities={activities} settings={settings} rollups={rollups} acute={acute} chronic={chronic} balance={balance} />}
        {tab === 'zones' && <ZonesTab activities={inRange} allActivities={activities} settings={settings} range={range} />}
        {tab === 'records' && <RecordsTab activities={activities} inRange={inRange} settings={settings} range={range} />}
        {tab === 'routes' && <RoutesTab activities={activities} onRoute={onRoute} onActivity={onActivity} />}
        {tab === 'plan' && <PlanTab activities={activities} settings={settings} onSettings={onSettings} currentLoad={balance.acute} now={now} />}
      </div>
    </div>
  );
}

// ── LOAD ──────────────────────────────────────────────────────────
function LoadTab({
  activities,
  settings,
  rollups,
  acute,
  chronic,
  balance,
}: {
  activities: Activity[];
  settings: Settings;
  rollups: ReturnType<typeof rollupWeeks>;
  acute: number[];
  chronic: number[];
  balance: LoadBalance;
}) {
  const units = useUnits();
  const stressed = settings.loadModel === 'stress';
  const unitLabel = stressed ? 'pts' : units.distanceUnit;
  // The rollups are in kilometres; the load series is shown in whatever unit is set.
  const shown = (value: number) => (stressed ? value : units.distance(value * 1000));
  const digits = stressed ? 0 : 1;

  const last = acute.length - 1;
  const ratio = balance.ratio;
  const ramp = balance.ramp;
  const rampColor = ramp > 15 ? color.warning : ramp >= 0 ? color.positive : color.textMuted;
  const hotIndices = acute.map((v, i) => (i > 0 && rampPct(v, acute[i - 1]) > 15 ? i : -1)).filter((i) => i >= 0);
  const labels = [0, 4, 8, last].map((i) => ({ index: i, label: isoWeekLabel(rollups[i].weekStart) }));

  const heads = [
    {
      label: 'Load ratio',
      value: ratio > 0 ? ratio.toFixed(2) : '—',
      note: ratio === 0 ? 'no data' : ratio > 1.3 ? 'above the band' : ratio < 0.8 ? 'below the band' : 'steady band',
      color: color.text,
    },
    {
      label: 'Ramp',
      value: `${ramp >= 0 ? '+' : '−'}${Math.abs(ramp).toFixed(1)}%`,
      note: '7 days on 7',
      color: rampColor,
    },
    { label: '28-day', value: shown(balance.chronic).toFixed(digits), note: `${unitLabel} per week`, color: color.text },
  ];

  // Decoupling walks every session's stored drift, so the six rows below are built once
  // per set of activities rather than on every repaint of this tab.
  const tableWeeks = useMemo(
    () =>
      [...rollups]
        .reverse()
        .slice(0, 6)
        .map((w, i) => {
          const idx = rollups.indexOf(w);
          return {
            week: w,
            first: i === 0,
            ratio: chronic[idx] > 0 ? acute[idx] / chronic[idx] : 0,
            decoupling: weeklyDecoupling(activities, w.weekStart),
          };
        }),
    [rollups, acute, chronic, activities],
  );

  const stressSources = useMemo(() => {
    const counts = { power: 0, hr: 0, rpe: 0 };
    for (const a of activities.slice(0, 40)) counts[activityStress(a, settings).source] += 1;
    return counts;
  }, [activities, settings]);

  return (
    <>
      <div style={{ ...S.cardGrid, flex: 'none', margin: '0 16px' }}>
        {heads.map((h) => (
          <div key={h.label} style={{ ...S.cardCell, padding: '11px 12px 13px' }}>
            <Label>{h.label}</Label>
            <span style={{ ...S.metricLarge, color: h.color, whiteSpace: 'nowrap' }}>{h.value}</span>
            <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint }}>{h.note}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Label style={{ padding: '0 16px' }}>Acute vs chronic load · 12 weeks · {unitLabel}</Label>
        <div style={{ ...S.sunkWell, padding: '12px 0 6px' }}>
          <LoadChart acute={acute.map(shown)} chronic={chronic.map(shown)} labels={labels} hotIndices={hotIndices} />
        </div>
        <div style={{ padding: '0 16px', display: 'flex', gap: 16 }}>
          <LegendItem swatch={color.metricPace}>7-day</LegendItem>
          <LegendItem swatch={color.textFaint}>28-day</LegendItem>
          <LegendItem swatch={color.warning} dot>
            ramp &gt; 15 %
          </LegendItem>
        </div>
      </div>

      <div style={{ flex: 'none', display: 'flex', flexDirection: 'column' }}>
        <div style={S.tableHeaderRow}>
          <span style={{ ...S.monoTick, flex: 'none', width: 48, textAlign: 'left' }}>WEEK</span>
          <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>{unitLabel.toUpperCase()}</span>
          <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>TIME</span>
          <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>ASC</span>
          <span style={{ ...S.monoTick, flex: 'none', width: 48, textAlign: 'right' }}>RATIO</span>
          <span style={{ ...S.monoTick, flex: 'none', width: 48, textAlign: 'right' }}>DEC</span>
        </div>
        {tableWeeks.map(({ week: w, first, ratio: r, decoupling: dec }) => {
          return (
            <div key={w.weekStart} style={{ ...S.tableRow, background: first ? 'rgba(139,132,247,0.08)' : undefined }}>
              <span style={{ ...S.tableNum, flex: 'none', width: 48, textAlign: 'left', color: color.textMuted }}>{isoWeekLabel(w.weekStart)}</span>
              <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', color: color.text }}>{shown(loadOf(w, settings)).toFixed(digits)}</span>
              <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', color: color.text }}>{hoursMinutes(w.timeS)}</span>
              <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', color: color.text }}>{units.fmtElevation(w.ascentM)}</span>
              <span style={{ ...S.tableNum, flex: 'none', width: 48, textAlign: 'right', color: r > 1.15 ? color.warning : color.text }}>
                {r > 0 ? r.toFixed(2) : '—'}
              </span>
              <span style={{ ...S.tableNum, flex: 'none', width: 48, textAlign: 'right', color: dec != null && dec > 5 ? color.warning : color.textMuted }}>
                {dec != null ? `${dec.toFixed(1)} %` : '—'}
              </span>
            </div>
          );
        })}
        <span style={{ padding: '10px 16px 0', fontSize: 12, lineHeight: 1.4, color: color.textFaint, textWrap: 'pretty' }}>
          {stressed ? (
            <>
              Load is training stress: an hour at threshold is 100 points. Of your last {Math.min(40, activities.length)} sessions,{' '}
              {stressSources.power} were scored from power, {stressSources.hr} from heart rate and {stressSources.rpe} from duration and
              perceived effort.
            </>
          ) : (
            <>
              {unitLabel.toUpperCase()} is run distance plus ride distance ÷ 3 — a fixed exchange rate that cannot tell a recovery spin
              from a threshold ride. Switch the load model to training stress in settings and it can.
            </>
          )}{' '}
          Decoupling is heart-rate drift over the second half of each session — under 5 % reads as aerobically durable, and needs a
          paired strap to compute.
        </span>
      </div>
    </>
  );
}

function LegendItem({ swatch, dot, children }: { swatch: string; dot?: boolean; children: React.ReactNode }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: color.textMuted }}>
      <span style={{ width: dot ? 8 : 14, height: dot ? 8 : 2, borderRadius: dot ? 999 : 0, background: swatch }} />
      {children}
    </span>
  );
}

// ── ZONES ─────────────────────────────────────────────────────────
function ZonesTab({
  activities,
  allActivities,
  settings,
  range,
}: {
  activities: Activity[];
  allActivities: Activity[];
  settings: Settings;
  range: Range;
}) {
  const zoneSeconds = useMemo(() => aggregateZoneSeconds(activities, settings), [activities, settings]);
  const total = zoneSeconds.reduce((a, b) => a + b, 0);
  const cadence = useMemo(() => cadenceSummary(activities), [activities]);

  const weekStarts = useMemo(() => lastNWeekStarts(8), []);
  const weeklyMix = useMemo(
    () =>
      weekStarts.map((ws) => {
        const weekActs = allActivities.filter((a) => a.startedAt >= ws && a.startedAt < ws + 7 * 86400000);
        return { label: isoWeekLabel(ws).slice(1), mix: aggregateZoneSeconds(weekActs, settings) };
      }),
    [weekStarts, allActivities, settings],
  );

  const cuts = zoneCuts(settings);
  const runsInRange = activities.some((a) => a.sport === 'run');

  if (total === 0 && !cadence.hist) {
    return (
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ ...S.body, color: color.textMuted }}>No heart-rate or cadence data in this range. Pair a strap on the pre-start screen to build a zone distribution.</span>
        <span style={{ ...S.caption, color: color.textFaint }}>Zones are computed against {zoneLabel(settings)}.</span>
      </div>
    );
  }

  const belowZone3 = total > 0 ? ((zoneSeconds[0] + zoneSeconds[1]) / total) * 100 : 0;
  const z3Share = total > 0 ? (zoneSeconds[2] / total) * 100 : 0;

  return (
    <>
      {total > 0 && (
        <>
          <div style={{ flex: 'none', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Label>Distribution · {range.toLowerCase()} · {zoneLabel(settings)}</Label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ ...S.metricHero, color: color.text }}>{belowZone3.toFixed(0)}</span>
              <span style={{ fontSize: 15, color: color.textMuted }}>% of time below zone 3</span>
            </div>
            <span style={{ fontSize: 13, lineHeight: 1.4, color: color.textFaint }}>
              {belowZone3 >= 75
                ? `Polarised. The middle is thin — ${z3Share.toFixed(0)} % in zone 3, with the hard work in 4 and 5.`
                : `${z3Share.toFixed(0)} % of the time sits in zone 3. More of the week is spent at moderate intensity than a polarised split would put there.`}
            </span>
          </div>

          <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Label style={{ padding: '0 16px' }}>Zone mix by week</Label>
            <ZoneMixChart weeks={weeklyMix} />
          </div>

          <div style={{ flex: 'none', display: 'flex', flexDirection: 'column' }}>
            <div style={S.tableHeaderRow}>
              <span style={{ ...S.monoTick, flex: 'none', width: 106 }}>ZONE</span>
              <span style={{ ...S.monoTick, flex: 'none', width: 62, textAlign: 'right' }}>BPM</span>
              <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>TIME</span>
              <span style={{ ...S.monoTick, flex: 'none', width: 52, textAlign: 'right' }}>SHARE</span>
            </div>
            {ZONE_NAMES.map((name, i) => {
              const share = (zoneSeconds[i] / total) * 100;
              const lo = Math.round(cuts[i]);
              const hi = Math.round(cuts[i + 1]);
              const bpm = i === 0 ? `< ${hi}` : i === 4 ? `> ${lo}` : `${lo}–${hi}`;
              return (
                <div key={name} style={{ ...S.tableRow, position: 'relative', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${share}%`, background: zoneColors[i], opacity: 0.22 }} />
                  <span style={{ ...S.tableNum, flex: 'none', width: 106, display: 'flex', alignItems: 'center', gap: 8, position: 'relative', whiteSpace: 'nowrap', color: color.text }}>
                    <span style={{ width: 8, height: 8, flex: 'none', borderRadius: 1, background: zoneColors[i] }} />
                    {name}
                  </span>
                  <span style={{ ...S.tableNum, flex: 'none', width: 62, textAlign: 'right', position: 'relative', color: color.textMuted }}>{bpm}</span>
                  <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', position: 'relative', color: color.text }}>{fmtClock(zoneSeconds[i])}</span>
                  <span style={{ ...S.tableNum, flex: 'none', width: 52, textAlign: 'right', position: 'relative', color: color.text }}>{share.toFixed(0)} %</span>
                </div>
              );
            })}
            {settings.zoneModel === 'lthr' && !settings.lthr && (
              <span style={{ padding: '10px 16px 0', fontSize: 12, lineHeight: 1.4, color: color.textFaint }}>
                Threshold is estimated at 90 % of max because none is set. Enter your own in settings and every session in the log is
                re-cut against it.
              </span>
            )}
          </div>
        </>
      )}

      {cadence.hist && (
        <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label style={{ padding: '0 16px' }}>
            Cadence · {cadence.sessions} {cadence.sessions === 1 ? 'session' : 'sessions'} in range
          </Label>
          <div style={{ padding: '0 16px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ ...S.metricHero, color: color.text }}>{cadence.mean ? Math.round(cadence.mean) : '—'}</span>
            <span style={{ fontSize: 15, color: color.textMuted }}>{runsInRange ? 'steps per minute, time-weighted' : 'rpm, time-weighted'}</span>
          </div>
          <div style={{ ...S.sunkWell, padding: '10px 0 0' }}>
            <HistogramBars
              hist={cadence.hist}
              markers={[{ value: histogramPercentile(cadence.hist, 0.5) ?? cadence.hist.lo, label: 'median' }]}
            />
          </div>
          <span style={{ padding: '0 16px', fontSize: 12, lineHeight: 1.4, color: color.textFaint, textWrap: 'pretty' }}>
            The middle half of the time sat between {cadence.p25} and {cadence.p75}. Weighted by how long each rate was held rather
            than by how many samples arrived, so a sensor that reports twice as often does not count twice as much.
          </span>
        </div>
      )}
    </>
  );
}

// ── RECORDS ───────────────────────────────────────────────────────
function RecordsTab({
  activities,
  inRange,
  settings,
  range,
}: {
  activities: Activity[];
  inRange: Activity[];
  settings: Settings;
  range: Range;
}) {
  const pbs = useMemo(() => computePersonalBests(activities, 'run'), [activities]);
  const nowCurve = useMemo(() => powerCurve(inRange), [inRange]);
  const seasonCurve = useMemo(() => powerCurve(activities), [activities]);
  const hasPower = seasonCurve.some((p) => p.watts > 0);
  const fiveMin = nowCurve.find((p) => p.key === '5m')?.watts ?? 0;
  const twenty = seasonCurve.find((p) => p.key === '20m')?.watts ?? 0;

  return (
    <>
      <div style={{ flex: 'none', display: 'flex', flexDirection: 'column' }}>
        <Label style={{ padding: '0 16px 8px' }}>Personal bests · running</Label>
        {pbs.length === 0 ? (
          <span style={{ padding: '0 16px', ...S.body, color: color.textMuted }}>
            No run long enough to hold a personal best yet. Record a kilometre and it lands here.
          </span>
        ) : (
          pbs.map((p) => {
            const delta = p.previousBestS != null ? p.bestS - p.previousBestS : null;
            const fresh = delta != null && delta < 0;
            return (
              <div key={p.key} style={{ height: 56, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${color.dividerHairline}`, boxSizing: 'border-box' }}>
                <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: '.06em', color: color.textFaint, flex: 'none', width: 44 }}>{p.label}</span>
                <span style={{ ...S.metric, fontWeight: 600, color: color.text, flex: 'none', width: 74 }}>{fmtClock(p.bestS)}</span>
                <svg viewBox="0 0 92 28" width="92" height="28" style={{ flex: 'none' }}>
                  <path d={sparkPathFromHistory(p.history, 92, 28)} fill="none" stroke={color.borderStrong} strokeWidth={1.5} />
                </svg>
                <span style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ ...S.tableNum, color: fresh ? color.positive : color.textFaint }}>
                    {delta != null ? `${delta < 0 ? '−' : '+'}${Math.abs(Math.round(delta))} s` : 'first'}
                  </span>
                  <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint }}>{fmtEuroDate(p.date)}</span>
                </span>
              </div>
            );
          })
        )}
      </div>

      <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ padding: '0 16px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Label>Power curve · {range.toLowerCase()} vs season</Label>
          {hasPower && <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint }}>{fiveMin} W @ 5 min</span>}
        </div>
        {hasPower ? (
          <>
            <div style={{ ...S.sunkWell, padding: '12px 0 4px' }}>
              <PowerCurveChart
                now={nowCurve.map((p) => p.watts)}
                season={seasonCurve.map((p) => p.watts)}
                labels={POWER_DURATIONS.map((d) => d.key)}
              />
            </div>
            <span style={{ padding: '0 16px', fontSize: 12, lineHeight: 1.4, color: color.textFaint, textWrap: 'pretty' }}>
              Amber is the selected range, dashed grey the season best — both are mean maximal power from your recorded rides.
              {settings.ftp
                ? ` Against the ${settings.ftp} W FTP in settings, that season twenty-minute best is ${((twenty * 0.95) / settings.ftp * 100).toFixed(0)} % of it.`
                : twenty > 0
                  ? ` Ninety-five per cent of the season's best twenty minutes is ${Math.round(twenty * 0.95)} W — set that as your FTP in settings and rides get scored in training stress.`
                  : ''}
            </span>
          </>
        ) : (
          <span style={{ padding: '0 16px', ...S.body, color: color.textMuted }}>
            No rides recorded with a power meter yet. Pair one to get a power curve.
          </span>
        )}
      </div>
    </>
  );
}

// ── ROUTES ────────────────────────────────────────────────────────
function RoutesTab({
  activities,
  onRoute,
  onActivity,
}: {
  activities: Activity[];
  onRoute: (id: string) => void;
  onActivity: (id: string) => void;
}) {
  const units = useUnits();
  const clusters = useMemo(() => clusterRoutes(activities), [activities]);
  const singles = useMemo(() => {
    const grouped = new Set(clusters.flatMap((c) => c.activities.map((a) => a.id)));
    return activities.filter((a) => a.derived.route && !grouped.has(a.id));
  }, [activities, clusters]);

  if (clusters.length === 0) {
    return (
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ ...S.body, color: color.textMuted, textWrap: 'pretty' }}>
          No route has been repeated yet. Run or ride the same loop twice and it shows up here, with every time on it side by side.
        </span>
        {singles.length > 0 && (
          <span style={{ ...S.caption, color: color.textFaint }}>
            {singles.length} recorded {singles.length === 1 ? 'track' : 'tracks'} so far, none of them matching another.
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      <div style={{ flex: 'none', display: 'flex', flexDirection: 'column' }}>
        {clusters.map((cluster) => (
          <RouteRow key={cluster.id} cluster={cluster} onOpen={() => onRoute(cluster.id)} />
        ))}
      </div>
      <span style={{ padding: '0 16px', fontSize: 12, lineHeight: 1.4, color: color.textFaint, textWrap: 'pretty' }}>
        Grouped by the shape of the recorded track, in either direction. {singles.length} other{' '}
        {singles.length === 1 ? 'session has' : 'sessions have'} a track that matches nothing else yet
        {singles.length > 0 ? ' — ' : '.'}
        {singles.length > 0 && (
          <button onClick={() => onActivity(singles[0].id)} style={{ ...S.linkButton, fontSize: 12 }}>
            the most recent is {singles[0].title}
          </button>
        )}
        {singles.length > 0 && '.'}{' '}
        Distances shown are the median of the repeats, because the same loop never measures the same twice — GPS sees to that.
      </span>
      <span style={{ padding: '0 16px', ...S.caption, color: color.textFaint }}>
        {clusters.length} {clusters.length === 1 ? 'route' : 'routes'} ·{' '}
        {units.fmtDistance(clusters.reduce((sum, c) => sum + c.medianDistanceM * c.activities.length, 0), 0)} {units.distanceUnit} over
        all of their repeats.
      </span>
    </>
  );
}

function RouteRow({ cluster, onOpen }: { cluster: RouteCluster; onOpen: () => void }) {
  const units = useUnits();
  const chronological = [...cluster.activities].sort((a, b) => a.startedAt - b.startedAt);
  const timeOf = (a: Activity) => (a.endedAt - a.startedAt) / 1000;
  const fastest = Math.min(...chronological.map(timeOf));
  const latest = timeOf(chronological[chronological.length - 1]);
  const onBest = Math.abs(latest - fastest) < 1;

  return (
    <button
      className="ct-row"
      onClick={onOpen}
      style={{ ...S.listRow, height: 58, width: '100%', border: 'none', borderTop: `1px solid ${color.dividerHairline}`, background: 'none', cursor: 'pointer', textAlign: 'left' }}
    >
      <span style={{ flex: 'none', width: 3, height: 34, borderRadius: 2, background: cluster.sport === 'run' ? color.metricPace : color.metricSpeed }} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, color: color.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cluster.name}</span>
        <span style={{ fontSize: 12, color: color.textFaint }}>
          {cluster.activities.length}× · {units.fmtDistance(cluster.medianDistanceM, 1)} {units.distanceUnit} · last {fmtDayMonth(cluster.lastDate)}
        </span>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span style={{ ...S.tableNum, color: color.text }}>{fmtClock(fastest)}</span>
        <span style={{ fontFamily: font.mono, fontSize: 10, color: onBest ? color.positive : color.textFaint }}>
          {onBest ? 'best is latest' : 'best'}
        </span>
      </span>
      <span className="ct-cue-dot" style={{ fontSize: 13, lineHeight: 1 }}>
        ›
      </span>
    </button>
  );
}

// ── PLAN ──────────────────────────────────────────────────────────
function PlanTab({
  activities,
  settings,
  onSettings,
  currentLoad,
  now,
}: {
  activities: Activity[];
  settings: Settings;
  onSettings: (s: Settings) => void;
  currentLoad: number;
  now: number;
}) {
  const units = useUnits();
  const plannedRun = settings.plan.reduce((a, i) => a + (SESSIONS[i].kind === 'run' ? SESSIONS[i].km : 0), 0);
  const plannedRide = settings.plan.reduce((a, i) => a + (SESSIONS[i].kind === 'ride' ? SESSIONS[i].km : 0), 0);
  const stressed = settings.loadModel === 'stress';
  const hasBasis = currentLoad > 0;
  // The plan is written in distance, so it can only be ramped against distance. Under
  // the stress model there is nothing honest to compare it to, and it says so.
  const ramp = rampPct(plannedRun + plannedRide / 3, currentLoad);
  const hot = hasBasis && !stressed && ramp > 15;

  const nextWeekStart = new Date();
  nextWeekStart.setDate(nextWeekStart.getDate() + (8 - ((nextWeekStart.getDay() + 6) % 7) - 1));
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
  const p2 = (n: number) => String(n).padStart(2, '0');
  const rangeLabel = `${p2(nextWeekStart.getDate())}.${p2(nextWeekStart.getMonth() + 1)}.–${p2(nextWeekEnd.getDate())}.${p2(nextWeekEnd.getMonth() + 1)}.`;

  const cycle = (dayIdx: number) => {
    const next = settings.plan.slice();
    next[dayIdx] = (next[dayIdx] + 1) % SESSIONS.length;
    onSettings({ ...settings, plan: next });
  };

  // What last week's plan actually turned into. The plan repeats every week, so the
  // week that has just finished is the one it can be scored against.
  const lastWeekStart = addDays(startOfWeek(now), -7);
  const scored = useMemo(() => {
    return settings.plan.map((idx, day) => {
      const dayStart = addDays(lastWeekStart, day);
      const done = activities.filter((a) => a.startedAt >= dayStart && a.startedAt < addDays(dayStart, 1));
      const planned = SESSIONS[idx];
      const actualKm = done.reduce((sum, a) => sum + a.distance / 1000, 0);
      return { day, planned, done, actualKm, dayStart };
    });
  }, [settings.plan, activities, lastWeekStart]);

  const plannedLastWeekKm = scored.reduce((sum, s) => sum + s.planned.km, 0);
  const actualLastWeekKm = scored.reduce((sum, s) => sum + s.actualKm, 0);
  const kept = scored.filter((s) => (s.planned.kind === 'rest' ? s.done.length === 0 : s.done.some((a) => a.sport === s.planned.kind))).length;

  return (
    <>
      <div style={{ flex: 'none', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Label>Next week · {rangeLabel}</Label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ ...S.metricHero, color: color.text }}>{units.distance(plannedRun * 1000).toFixed(0)}</span>
          <span style={{ fontFamily: font.mono, fontSize: 20, color: color.textMuted }}>{units.distanceUnit} planned</span>
        </div>
        <span style={{ fontSize: 13, lineHeight: 1.4, color: hot ? color.warning : color.textMuted }}>
          {stressed
            ? 'the plan is written in distance, and load is set to training stress — there is no honest ramp to quote between the two'
            : hasBasis
              ? `${ramp >= 0 ? '+' : ''}${ramp.toFixed(1)} % on the last 7 days`
              : 'nothing recorded in the last 7 days to compare against'}{' '}
          · {units.distance(plannedRide * 1000).toFixed(0)} {units.distanceUnit} riding on top{hot ? ' · above the 15 % ramp you hold to' : ''}
        </span>
      </div>

      <div style={{ flex: 'none', display: 'flex', flexDirection: 'column' }}>
        {settings.plan.map((idx, i) => {
          const t = SESSIONS[idx];
          return (
            <button
              key={DAY_LABELS[i]}
              onClick={() => cycle(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                height: 56,
                padding: '0 16px',
                boxSizing: 'border-box',
                border: 'none',
                borderTop: `1px solid ${color.dividerHairline}`,
                background: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <span style={{ flex: 'none', width: 34, fontFamily: font.mono, fontSize: 11, letterSpacing: '.06em', color: color.textFaint }}>{DAY_LABELS[i]}</span>
              <span
                style={{
                  flex: 'none',
                  width: 3,
                  height: 32,
                  borderRadius: 2,
                  background: t.kind === 'rest' ? color.dividerHairline : t.kind === 'ride' ? color.metricSpeed : color.metricPace,
                }}
              />
              <span style={{ flex: 1, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, color: t.kind === 'rest' ? color.textFaint : color.text }}>{t.name}</span>
                <span style={{ fontSize: 12, color: color.textFaint }}>{t.detail}</span>
              </span>
              <span style={{ ...S.tableNum, flex: 'none', color: t.kind === 'rest' ? color.borderStrong : color.textMuted }}>
                {t.kind === 'rest' ? '—' : `${units.distance(t.km * 1000).toFixed(0)} ${units.distanceUnit}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── what the last week actually became ── */}
      <div style={{ flex: 'none', display: 'flex', flexDirection: 'column' }}>
        <Label style={{ padding: '0 16px 8px' }}>
          Last week against the plan · {fmtDayMonth(lastWeekStart)}–{fmtDayMonth(addDays(lastWeekStart, 6))}
        </Label>
        <div style={S.tableHeaderRow}>
          <span style={{ ...S.monoTick, width: 34 }}>DAY</span>
          <span style={{ ...S.monoTick, flex: 1 }}>PLANNED</span>
          <span style={{ ...S.monoTick, flex: 1 }}>DONE</span>
          <span style={{ ...S.monoTick, width: 56, textAlign: 'right' }}>{units.distanceUnit.toUpperCase()}</span>
        </div>
        {scored.map((row) => {
          const restKept = row.planned.kind === 'rest' && row.done.length === 0;
          const sessionKept = row.planned.kind !== 'rest' && row.done.some((a) => a.sport === row.planned.kind);
          const tone = restKept || sessionKept ? color.positive : row.done.length > 0 ? color.textMuted : color.textFaint;
          return (
            <div key={row.day} style={S.tableRow}>
              <span style={{ ...S.tableNum, width: 34, color: color.textFaint }}>{DAY_LABELS[row.day]}</span>
              <span style={{ flex: 1, fontSize: 12, color: color.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {row.planned.name}
              </span>
              <span style={{ flex: 1, fontSize: 12, color: tone, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {row.done.length === 0 ? (row.planned.kind === 'rest' ? 'rested' : 'nothing') : row.done.map((a) => (a.sport === 'run' ? 'run' : 'ride')).join(', ')}
              </span>
              <span style={{ ...S.tableNum, width: 56, textAlign: 'right', color: color.text }}>
                {row.actualKm > 0 ? units.distance(row.actualKm * 1000).toFixed(1) : '—'}
              </span>
            </div>
          );
        })}
        <span style={{ padding: '10px 16px 0', fontSize: 12, lineHeight: 1.4, color: color.textFaint, textWrap: 'pretty' }}>
          {kept} of 7 days went the way the plan had them, and the week came to{' '}
          {units.distance(actualLastWeekKm * 1000).toFixed(1)} {units.distanceUnit} against {units.distance(plannedLastWeekKm * 1000).toFixed(0)}{' '}
          planned. The plan repeats every week, so this is the same seven days scored against what was actually recorded.
        </span>
      </div>

      <div style={{ flex: 'none', margin: '0 16px', padding: 12, border: `1px dashed ${color.borderStrong}`, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: color.textMuted, lineHeight: 1.45 }}>
          Tap a day to change the session. The plan still sets nothing in motion — no reminders, no notifications, no streak to protect.
          It exists so the week can be read next to the load chart, and now next to what the week actually was.
        </span>
      </div>
    </>
  );
}
