import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { color, font, zoneColors, HR_ZONE_BOUNDS, ZONE_NAMES } from '../theme';
import * as S from '../styles';
import { Label } from '../components/primitives';
import { LoadChart, ZoneMixChart, PowerCurveChart } from '../components/charts';
import { StatusStrip } from '../components/PhoneFrame';
import {
  aggregateZoneSeconds,
  chronicSeries,
  computePersonalBests,
  fmtClock,
  fmtEuroDate,
  hoursMinutes,
  isoWeekLabel,
  lastNWeekStarts,
  loadBalance,
  loadKm,
  type LoadBalance,
  POWER_DURATIONS,
  powerCurve,
  rampPct,
  rollupWeeks,
  sparkPathFromHistory,
  weeklyDecoupling,
} from '../lib/stats';
import type { Activity, Settings } from '../types';

type Tab = 'load' | 'zones' | 'records' | 'plan';
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
}: {
  activities: Activity[];
  settings: Settings;
  onSettings: (s: Settings) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>('load');
  const [range, setRange] = useState<Range>('90 D');

  // One stable reference time per mount, so memoised aggregates don't churn.
  const [now] = useState(() => Date.now());
  const weekStarts = useMemo(() => lastNWeekStarts(12, now), [now]);
  const rollups = useMemo(() => rollupWeeks(activities, weekStarts), [activities, weekStarts]);
  const acute = rollups.map(loadKm);
  const chronic = chronicSeries(acute);
  const balance = useMemo(() => loadBalance(activities, now), [activities, now]);

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
      <StatusStrip />
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

      <div style={{ display: 'flex', padding: '0 16px', gap: 18, borderBottom: `1px solid ${color.dividerHairline}` }}>
        {(['load', 'zones', 'records', 'plan'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="ct-scroll" style={{ ...S.scrollArea, padding: '18px 0 40px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {tab === 'load' && <LoadTab activities={activities} rollups={rollups} acute={acute} chronic={chronic} balance={balance} />}
        {tab === 'zones' && <ZonesTab activities={inRange} allActivities={activities} settings={settings} range={range} />}
        {tab === 'records' && <RecordsTab activities={activities} inRange={inRange} settings={settings} range={range} />}
        {tab === 'plan' && <PlanTab settings={settings} onSettings={onSettings} currentLoadKm={balance.acute} />}
      </div>
    </div>
  );
}

// ── LOAD ──────────────────────────────────────────────────────────
function LoadTab({
  activities,
  rollups,
  acute,
  chronic,
  balance,
}: {
  activities: Activity[];
  rollups: ReturnType<typeof rollupWeeks>;
  acute: number[];
  chronic: number[];
  balance: LoadBalance;
}) {
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
    { label: '28-day', value: balance.chronic.toFixed(1), note: 'km per week', color: color.text },
  ];

  const tableWeeks = [...rollups].reverse().slice(0, 6);

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
        <Label style={{ padding: '0 16px' }}>Acute vs chronic load · 12 weeks</Label>
        <div style={{ ...S.sunkWell, padding: '12px 0 6px' }}>
          <LoadChart acute={acute} chronic={chronic} labels={labels} hotIndices={hotIndices} />
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
          <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>KM</span>
          <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>TIME</span>
          <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>ASC</span>
          <span style={{ ...S.monoTick, flex: 'none', width: 48, textAlign: 'right' }}>RATIO</span>
          <span style={{ ...S.monoTick, flex: 'none', width: 48, textAlign: 'right' }}>DEC</span>
        </div>
        {tableWeeks.map((w, i) => {
          const idx = rollups.indexOf(w);
          const r = chronic[idx] > 0 ? acute[idx] / chronic[idx] : 0;
          const dec = weeklyDecoupling(activities, w.weekStart);
          return (
            <div key={w.weekStart} style={{ ...S.tableRow, background: i === 0 ? 'rgba(139,132,247,0.08)' : undefined }}>
              <span style={{ ...S.tableNum, flex: 'none', width: 48, textAlign: 'left', color: color.textMuted }}>{isoWeekLabel(w.weekStart)}</span>
              <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', color: color.text }}>{loadKm(w).toFixed(1)}</span>
              <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', color: color.text }}>{hoursMinutes(w.timeS)}</span>
              <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', color: color.text }}>{Math.round(w.ascentM)}</span>
              <span style={{ ...S.tableNum, flex: 'none', width: 48, textAlign: 'right', color: r > 1.15 ? color.warning : color.text }}>
                {r > 0 ? r.toFixed(2) : '—'}
              </span>
              <span style={{ ...S.tableNum, flex: 'none', width: 48, textAlign: 'right', color: dec != null && dec > 5 ? color.warning : color.textMuted }}>
                {dec != null ? `${dec.toFixed(1)} %` : '—'}
              </span>
            </div>
          );
        })}
        <span style={{ padding: '10px 16px 0', fontSize: 12, lineHeight: 1.4, color: color.textFaint }}>
          KM is run distance plus ride distance ÷ 3. Decoupling is heart-rate drift over the second half of each session — under 5 % reads as
          aerobically durable, and needs a paired strap to compute.
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
  const zoneSeconds = useMemo(() => aggregateZoneSeconds(activities, settings.maxHr), [activities, settings.maxHr]);
  const total = zoneSeconds.reduce((a, b) => a + b, 0);

  const weekStarts = useMemo(() => lastNWeekStarts(8), []);
  const weeklyMix = useMemo(
    () =>
      weekStarts.map((ws) => {
        const weekActs = allActivities.filter((a) => a.startedAt >= ws && a.startedAt < ws + 7 * 86400000);
        return { label: isoWeekLabel(ws).slice(1), mix: aggregateZoneSeconds(weekActs, settings.maxHr) };
      }),
    [weekStarts, allActivities, settings.maxHr],
  );

  if (total === 0) {
    return (
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ ...S.body, color: color.textMuted }}>No heart-rate data in this range. Pair a strap on the pre-start screen to build a zone distribution.</span>
        <span style={{ ...S.caption, color: color.textFaint }}>Zones are computed against a max heart rate of {settings.maxHr} bpm.</span>
      </div>
    );
  }

  const belowZone3 = ((zoneSeconds[0] + zoneSeconds[1]) / total) * 100;
  const z3Share = (zoneSeconds[2] / total) * 100;

  return (
    <>
      <div style={{ flex: 'none', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Label>Distribution · {range.toLowerCase()}</Label>
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
          const lo = Math.round(HR_ZONE_BOUNDS[i] * settings.maxHr);
          const hi = Math.round(HR_ZONE_BOUNDS[i + 1] * settings.maxHr);
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
      </div>
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
          {hasPower && settings.maxHr > 0 && (
            <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint }}>{fiveMin} W @ 5 min</span>
          )}
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
            <span style={{ padding: '0 16px', fontSize: 12, lineHeight: 1.4, color: color.textFaint }}>
              Amber is the selected range, dashed grey the season best — both are mean maximal power from your recorded rides.
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

// ── PLAN ──────────────────────────────────────────────────────────
function PlanTab({
  settings,
  onSettings,
  currentLoadKm,
}: {
  settings: Settings;
  onSettings: (s: Settings) => void;
  currentLoadKm: number;
}) {
  const plannedRun = settings.plan.reduce((a, i) => a + (SESSIONS[i].kind === 'run' ? SESSIONS[i].km : 0), 0);
  const plannedRide = settings.plan.reduce((a, i) => a + (SESSIONS[i].kind === 'ride' ? SESSIONS[i].km : 0), 0);
  const hasBasis = currentLoadKm > 0;
  const ramp = rampPct(plannedRun + plannedRide / 3, currentLoadKm);
  const hot = hasBasis && ramp > 15;

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

  return (
    <>
      <div style={{ flex: 'none', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Label>Next week · {rangeLabel}</Label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ ...S.metricHero, color: color.text }}>{plannedRun}</span>
          <span style={{ fontFamily: font.mono, fontSize: 20, color: color.textMuted }}>km planned</span>
        </div>
        <span style={{ fontSize: 13, lineHeight: 1.4, color: hot ? color.warning : color.textMuted }}>
          {hasBasis ? `${ramp >= 0 ? '+' : ''}${ramp.toFixed(1)} % on the last 7 days` : 'nothing recorded in the last 7 days to compare against'} ·{' '}
          {plannedRide} km riding on top{hot ? ' · above the 15 % ramp you hold to' : ''}
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
              <span style={{ ...S.tableNum, flex: 'none', color: t.kind === 'rest' ? color.borderStrong : color.textMuted }}>{t.target}</span>
            </button>
          );
        })}
      </div>

      <div style={{ flex: 'none', margin: '0 16px', padding: 12, border: `1px dashed ${color.borderStrong}`, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: color.textMuted, lineHeight: 1.45 }}>
          Tap a day to change the session. The plan sets nothing in motion — no reminders, no notifications, no streak to protect. It exists so the week
          can be read next to the load chart.
        </span>
      </div>
    </>
  );
}
