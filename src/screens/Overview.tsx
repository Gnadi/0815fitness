import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { color, font } from '../theme';
import * as S from '../styles';
import { Label, RouteSilhouette, SectionHeader } from '../components/primitives';
import { VolumeBars, LoadRatioBar } from '../components/charts';
import {
  computeStreak,
  elevationProfile,
  fmtDayMonth,
  fmtPace,
  hoursMinutes,
  isoWeekLabel,
  lastNWeekStarts,
  loadBalance,
  rollupWeeks,
} from '../lib/stats';
import type { StatKey } from '../lib/statDetails';
import { MAX_COMPARE } from '../lib/compare';
import { generateDemoHistory } from '../lib/demoSeed';
import type { Activity, Settings } from '../types';

const WEEKDAYS = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];

/** The cue that marks a block as an entry into its own detail: an optional word and
 *  the chevron badge, both lit by the card they sit in (see .ct-card in index.css). */
function Cue({ text }: { text?: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 'none' }}>
      {text && (
        <span className="ct-cue" style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          {text}
        </span>
      )}
      <span className="ct-cue-dot" style={{ fontSize: 13, lineHeight: 1, paddingBottom: 1 }}>
        ›
      </span>
    </span>
  );
}

/** Every figure on this screen opens its own detail, so each one is a card: its own
 *  surface, its label and cue on the header line, the figure below. */
function StatCard({
  onOpen,
  name,
  label,
  meta,
  cue,
  style,
  children,
}: {
  onOpen: () => void;
  /** Names the detail this card opens — used verbatim for the accessible name. */
  name: string;
  label: ReactNode;
  meta?: ReactNode;
  cue?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <button className="ct-card" onClick={onOpen} aria-label={`${name} detail`} style={{ ...S.cardBody, ...style }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Label>{label}</Label>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {meta}
          <Cue text={cue} />
        </span>
      </span>
      {children}
    </button>
  );
}

export function Overview({
  activities,
  settings,
  onRecord,
  onAnalyse,
  onStat,
  onCompare,
  onReplaceActivities,
}: {
  activities: Activity[];
  settings: Settings;
  onRecord: () => void;
  onAnalyse: () => void;
  onStat: (key: StatKey) => void;
  onCompare: (ids: string[]) => void;
  onReplaceActivities: (next: Activity[]) => void;
}) {
  // One stable reference time per mount, so memoised aggregates don't churn.
  const [now] = useState(() => Date.now());
  const weekStarts = useMemo(() => lastNWeekStarts(8, now), [now]);
  const rollups = useMemo(() => rollupWeeks(activities, weekStarts), [activities, weekStarts]);
  const streak = useMemo(() => computeStreak(activities, now), [activities, now]);

  const thisWeek = rollups[rollups.length - 1];
  const lastWeek = rollups[rollups.length - 2];
  const balance = useMemo(() => loadBalance(activities, now), [activities, now]);
  const ratio = balance.ratio;
  const delta = thisWeek.runKm - lastWeek.runKm;

  const d = new Date(now);
  const dateLine = `${WEEKDAYS[(d.getDay() + 6) % 7]} ${fmtDayMonth(now)}.${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const latest = activities.slice(0, 3);
  const empty = activities.length === 0;

  // The three newest sessions of one sport are what a comparison would open with.
  const compareSeed = useMemo(() => {
    const sport = latest[0]?.sport;
    return activities
      .filter((a) => a.sport === sport)
      .slice(0, MAX_COMPARE)
      .map((a) => a.id);
  }, [activities, latest]);

  const daysElapsedThisWeek = Math.floor((now - thisWeek.weekStart) / 86400000) + 1;
  const restDaysThisWeek = Math.max(0, daysElapsedThisWeek - thisWeek.activeDays.size);
  const weekStats: { key: StatKey; name: string; label: string; value: string; unit: string }[] = [
    { key: 'time', name: 'Training time', label: 'Time', value: hoursMinutes(thisWeek.timeS), unit: 'hours' },
    { key: 'ascent', name: 'Ascent', label: 'Ascent', value: String(Math.round(thisWeek.ascentM)), unit: 'metres' },
    { key: 'rideKm', name: 'Ride distance', label: 'Ride', value: thisWeek.rideKm.toFixed(0), unit: 'km' },
    { key: 'sessions', name: 'Sessions', label: 'Sessions', value: String(thisWeek.sessions), unit: `${restDaysThisWeek} rest` },
  ];

  const ratioNote =
    ratio === 0 ? 'no load recorded yet' : ratio > 1.3 ? 'ratio · above the steady band' : ratio < 0.8 ? 'ratio · below the steady band' : 'ratio · inside the steady band';

  const weekRange = `${fmtDayMonth(weekStarts[weekStarts.length - 1])}–${fmtDayMonth(weekStarts[weekStarts.length - 1] + 6 * 86400000)}`;

  return (
    <div style={S.screen}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px 12px' }}>
        <span style={S.title}>Overview</span>
        <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textFaint, fontFeatureSettings: "'tnum' 1, 'zero' 1" }}>{dateLine}</span>
      </div>

      <div className="ct-scroll" style={{ ...S.scrollArea, paddingBottom: 110, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {empty ? (
          <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ ...S.body, color: color.textMuted, textWrap: 'pretty' }}>
              No activities recorded yet. Tap RECORD to start one — your week, streak and load build from what you record here.
            </span>
            <button
              onClick={() => onReplaceActivities(generateDemoHistory(settings.maxHr))}
              style={{ ...S.linkButton, alignSelf: 'flex-start', fontSize: 13 }}
            >
              Load 13 weeks of sample history →
            </button>
            <span style={{ ...S.caption, color: color.textFaint }}>Sample history is synthetic and marked as such; recording your own replaces nothing.</span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionHeader right={<span style={{ ...S.caption, color: color.textFaint }}>every card opens its detail</span>}>This week · {weekRange}</SectionHeader>

              <div style={S.cardStack}>
                <StatCard onOpen={() => onStat('runKm')} name="Run distance" label="Run distance" cue="Details">
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ ...S.metricHero, color: color.text }}>{thisWeek.runKm.toFixed(2)}</span>
                    <span style={{ fontFamily: font.mono, fontSize: 20, color: color.textMuted }}>km run</span>
                  </span>
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: delta >= 0 ? 'rgba(79,158,106,0.14)' : color.surfaceSunk,
                      border: `1px solid ${delta >= 0 ? 'rgba(79,158,106,0.4)' : color.border}`,
                      fontFamily: font.mono,
                      fontSize: 11,
                      fontFeatureSettings: "'tnum' 1",
                      color: delta >= 0 ? color.positive : color.textMuted,
                    }}
                  >
                    {delta >= 0 ? '+' : '−'}
                    {Math.abs(delta).toFixed(1)} km vs last week
                  </span>
                </StatCard>

                <div style={S.tileGrid}>
                  {weekStats.map((w) => (
                    <StatCard key={w.key} onOpen={() => onStat(w.key)} name={w.name} label={w.label} style={S.tileBody}>
                      <span style={{ ...S.metric, fontWeight: 600, color: color.text }}>{w.value}</span>
                      <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint }}>{w.unit}</span>
                    </StatCard>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionHeader
                right={
                  <button onClick={onAnalyse} style={S.linkButton}>
                    Analyse →
                  </button>
                }
              >
                Trends
              </SectionHeader>

              <div style={S.cardStack}>
                <StatCard
                  onOpen={() => onStat('streak')}
                  name="Streak"
                  label="Streak · days trained"
                  cue="Details"
                >
                  <span style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                    <span style={{ ...S.metricLarge, color: color.text }}>{streak.current}</span>
                    <span style={{ fontSize: 13, color: color.textMuted, paddingBottom: 3 }}>
                      days · longest {streak.longest}
                    </span>
                  </span>
                  <span style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 50 }}>
                    {streak.last14.map((day) => (
                      <span key={day.dayKey} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                        <span
                          style={{
                            width: '100%',
                            height: day.trained ? 30 : 10,
                            borderRadius: 2,
                            background: day.isToday ? 'rgba(139,132,247,0.5)' : day.trained ? color.metricPace : color.dividerHairline,
                            boxShadow: day.isToday ? `inset 0 0 0 1px ${color.accent}` : undefined,
                          }}
                        />
                        <span style={{ fontFamily: font.mono, fontSize: 10, color: day.isToday ? color.accent : color.textFaint }}>{day.letter}</span>
                      </span>
                    ))}
                  </span>
                  <span style={{ fontSize: 12, lineHeight: 1.35, color: color.textFaint }}>
                    {streak.restDaysLast21} rest days in the last 21 — recorded days, not a target.
                  </span>
                </StatCard>

                <StatCard onOpen={() => onStat('volume')} name="Volume" label="Volume · last 8 weeks" cue="Details">
                  <VolumeBars weeks={rollups.map((r) => ({ label: isoWeekLabel(r.weekStart).slice(1), runKm: r.runKm, rideKm: r.rideKm }))} />
                  <span style={{ display: 'flex', gap: 16 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: color.textMuted }}>
                      <span style={{ width: 14, height: 2, background: color.metricPace }} />
                      run km
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: color.textMuted }}>
                      <span style={{ width: 14, height: 2, background: color.metricSpeed }} />
                      ride km ÷ 3
                    </span>
                  </span>
                </StatCard>

                <StatCard onOpen={() => onStat('load')} name="Load balance" label="Load · 7 day vs 28 day" cue="Details">
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ ...S.metricLarge, color: color.text }}>{ratio.toFixed(2)}</span>
                    <span style={{ flex: 1, fontSize: 13, color: color.textMuted }}>{ratioNote}</span>
                  </span>
                  <LoadRatioBar ratio={ratio} />
                  <span style={{ display: 'flex', justifyContent: 'space-between', fontFamily: font.mono, fontSize: 10, color: color.textFaint }}>
                    <span>0.6 detraining</span>
                    <span>0.8–1.3 steady</span>
                    <span>1.6 spike</span>
                  </span>
                </StatCard>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionHeader
                right={
                  compareSeed.length >= 2 ? (
                    <button onClick={() => onCompare(compareSeed)} style={S.linkButton}>
                      Compare →
                    </button>
                  ) : undefined
                }
              >
                Latest
              </SectionHeader>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {latest.map((a) => {
                  const durationS = (a.endedAt - a.startedAt) / 1000;
                  const avgSpeed = durationS > 0 ? a.distance / durationS : 0;
                  const metric =
                    a.sport === 'run'
                      ? `${(a.distance / 1000).toFixed(1)} km · ${avgSpeed > 0.2 ? fmtPace(1000 / avgSpeed) : '—:—'}`
                      : `${(a.distance / 1000).toFixed(1)} km · ${a.power.length > 1 ? `${Math.round(a.power.reduce((s, p) => s + p.watts, 0) / a.power.length)} W` : `${(avgSpeed * 3.6).toFixed(1)} km/h`}`;
                  return (
                    <button
                      key={a.id}
                      className="ct-row"
                      onClick={() => onCompare([a.id])}
                      style={{ ...S.listRow, width: '100%', gap: 10, border: 'none', borderTop: `1px solid ${color.dividerHairline}`, cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint, width: 34, fontFeatureSettings: "'tnum' 1" }}>{fmtDayMonth(a.startedAt)}</span>
                      <RouteSilhouette elevations={elevationProfile(a)} width={56} />
                      <span style={{ flex: 1, fontSize: 13, color: color.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</span>
                      <span style={{ ...S.tableNum, color: color.textMuted }}>{metric}</span>
                      <span className="ct-cue-dot" style={{ fontSize: 13, lineHeight: 1, paddingBottom: 1 }}>
                        ›
                      </span>
                    </button>
                  );
                })}
              </div>
              <span style={{ padding: '0 16px', fontSize: 12, color: color.textFaint }}>Tap a session to compare it against another.</span>
            </div>
          </>
        )}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 16px 24px', background: 'linear-gradient(to top,#0B0C0D 62%,rgba(11,12,13,0))' }}>
        <button
          onClick={onRecord}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 999,
            background: color.accent,
            border: 'none',
            color: color.onAccent,
            fontFamily: font.mono,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '.12em',
            cursor: 'pointer',
          }}
        >
          RECORD
        </button>
      </div>
    </div>
  );
}
