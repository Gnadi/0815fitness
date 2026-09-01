import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { color, font } from '../theme';
import * as S from '../styles';
import { Label, SectionHeader } from '../components/primitives';
import { ActivityRow } from '../components/ActivityRow';
import { VolumeBars, LoadRatioBar } from '../components/charts';
import { useUnits } from '../hooks/useUnits';
import {
  computeStreak,
  fmtClock,
  fmtDayMonth,
  gearUsage,
  hoursMinutes,
  isoWeekLabel,
  lastNWeekStarts,
  loadBalance,
  loadUnit,
  rollupWeeks,
} from '../lib/stats';
import type { StatKey } from '../lib/statDetails';
import { MAX_COMPARE } from '../lib/compare';
import { generateDemoHistory } from '../lib/demoSeed';
import type { RecorderCheckpoint } from '../lib/recorder';
import type { Activity, ActivitySamples, Settings } from '../types';

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

/** The one thing on this screen that is not a figure: a session a previous launch was
 *  in the middle of recording when the app went away. It sits above everything else
 *  because it is the only state in the app that is lost by being ignored. */
function RecoveryCard({
  checkpoint,
  onResume,
  onSave,
  onDiscard,
}: {
  checkpoint: RecorderCheckpoint;
  onResume: () => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const units = useUnits();
  const elapsed = (checkpoint.savedAt - checkpoint.startedAt) / 1000 - checkpoint.pausedAccumS;
  const action: CSSProperties = {
    flex: 1,
    height: 38,
    borderRadius: 6,
    background: 'none',
    border: `1px solid ${color.border}`,
    color: color.text,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  };
  return (
    <div style={{ margin: '0 16px', padding: 13, border: `1px solid ${color.warning}`, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Label style={{ color: color.warning }}>A recording was interrupted</Label>
      <span style={{ fontSize: 14, lineHeight: 1.45, color: color.text }}>
        {units.fmtDistance(checkpoint.distanceM, 2)} {units.distanceUnit} · {fmtClock(elapsed)} · {checkpoint.sport === 'run' ? 'run' : 'ride'} on{' '}
        {fmtDayMonth(checkpoint.startedAt)}, captured up to the moment the app stopped.
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onResume} style={{ ...action, borderColor: color.accent, color: color.accent }}>
          Carry on
        </button>
        <button onClick={onSave} style={action}>
          Save it
        </button>
        <button onClick={onDiscard} style={{ ...action, color: color.textMuted }}>
          Discard
        </button>
      </div>
    </div>
  );
}

export function Overview({
  activities,
  settings,
  loaded,
  recovery,
  onResumeRecovery,
  onSaveRecovery,
  onDiscardRecovery,
  onRecord,
  onAnalyse,
  onHistory,
  onSettings,
  onStat,
  onCompare,
  onActivity,
  onSeedDemo,
}: {
  activities: Activity[];
  settings: Settings;
  loaded: boolean;
  recovery: RecorderCheckpoint | null;
  onResumeRecovery: () => void;
  onSaveRecovery: () => void;
  onDiscardRecovery: () => void;
  onRecord: () => void;
  onAnalyse: () => void;
  onHistory: () => void;
  onSettings: () => void;
  onStat: (key: StatKey) => void;
  onCompare: (ids: string[]) => void;
  onActivity: (id: string) => void;
  onSeedDemo: (entries: { activity: Activity; samples: ActivitySamples | null }[]) => Promise<void>;
}) {
  const units = useUnits();
  // One stable reference time per mount, so memoised aggregates don't churn.
  const [now] = useState(() => Date.now());
  const weekStarts = useMemo(() => lastNWeekStarts(8, now), [now]);
  const rollups = useMemo(() => rollupWeeks(activities, weekStarts, settings), [activities, weekStarts, settings]);
  const streak = useMemo(() => computeStreak(activities, now), [activities, now]);

  const thisWeek = rollups[rollups.length - 1];
  const lastWeek = rollups[rollups.length - 2];
  const balance = useMemo(() => loadBalance(activities, settings, now), [activities, settings, now]);
  const ratio = balance.ratio;
  const delta = thisWeek.runKm - lastWeek.runKm;

  // Gear past the distance it was meant to be replaced at — the one thing in the log
  // that is about the equipment rather than the training, and easy to miss.
  const wornGear = useMemo(() => {
    const usage = gearUsage(activities);
    return settings.gear.filter((g) => {
      if (g.retired || g.limitKm == null) return false;
      return g.offsetKm + (usage.get(g.id)?.km ?? 0) >= g.limitKm;
    });
  }, [activities, settings.gear]);

  const d = new Date(now);
  const dateLine = `${WEEKDAYS[(d.getDay() + 6) % 7]} ${fmtDayMonth(now)}.${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const latest = activities.slice(0, 3);
  const empty = activities.length === 0;

  // The three newest sessions of one sport are what a comparison would open with.
  // Keyed on the log itself, not on `latest`: that is a fresh slice every render, and a
  // dependency that is never the same twice is a memo that never holds.
  const compareSeed = useMemo(() => {
    const sport = activities[0]?.sport;
    return activities
      .filter((a) => a.sport === sport)
      .slice(0, MAX_COMPARE)
      .map((a) => a.id);
  }, [activities]);

  const daysElapsedThisWeek = Math.floor((now - thisWeek.weekStart) / 86400000) + 1;
  const restDaysThisWeek = Math.max(0, daysElapsedThisWeek - thisWeek.activeDays.size);
  const weekStats: { key: StatKey; name: string; label: string; value: string; unit: string }[] = [
    { key: 'time', name: 'Training time', label: 'Time', value: hoursMinutes(thisWeek.timeS), unit: 'hours' },
    { key: 'ascent', name: 'Ascent', label: 'Ascent', value: units.fmtElevation(thisWeek.ascentM), unit: units.elevationUnit === 'm' ? 'metres' : 'feet' },
    { key: 'rideKm', name: 'Ride distance', label: 'Ride', value: units.distance(thisWeek.rideKm * 1000).toFixed(0), unit: units.distanceUnit },
    { key: 'sessions', name: 'Sessions', label: 'Sessions', value: String(thisWeek.sessions), unit: `${restDaysThisWeek} rest` },
  ];

  const ratioNote =
    ratio === 0 ? 'no load recorded yet' : ratio > 1.3 ? 'ratio · above the steady band' : ratio < 0.8 ? 'ratio · below the steady band' : 'ratio · inside the steady band';

  const weekRange = `${fmtDayMonth(weekStarts[weekStarts.length - 1])}–${fmtDayMonth(weekStarts[weekStarts.length - 1] + 6 * 86400000)}`;

  return (
    <div style={S.screen}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px 12px' }}>
        <span style={S.title}>Overview</span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textFaint, fontFeatureSettings: "'tnum' 1, 'zero' 1" }}>{dateLine}</span>
          <button onClick={onSettings} aria-label="Settings" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: color.textFaint, fontSize: 15 }}>
            ⚙
          </button>
        </span>
      </div>

      <div className="ct-scroll" style={{ ...S.scrollArea, paddingBottom: 110, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {recovery && (
          <RecoveryCard checkpoint={recovery} onResume={onResumeRecovery} onSave={onSaveRecovery} onDiscard={onDiscardRecovery} />
        )}

        {empty ? (
          <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ ...S.body, color: color.textMuted, textWrap: 'pretty' }}>
              {loaded
                ? 'No activities recorded yet. Tap RECORD to start one — your week, streak and load build from what you record here.'
                : 'Opening your log…'}
            </span>
            {loaded && (
              <>
                <button
                  onClick={() => void onSeedDemo(generateDemoHistory(settings.maxHr))}
                  style={{ ...S.linkButton, alignSelf: 'flex-start', fontSize: 13 }}
                >
                  Load 13 weeks of sample history →
                </button>
                <button onClick={onHistory} style={{ ...S.linkButton, alignSelf: 'flex-start', fontSize: 13 }}>
                  Add a session you did without the phone →
                </button>
                <span style={{ ...S.caption, color: color.textFaint }}>Sample history is synthetic and marked as such; recording your own replaces nothing.</span>
              </>
            )}
          </div>
        ) : (
          <>
            {wornGear.length > 0 && (
              <button
                onClick={onSettings}
                className="ct-row"
                style={{
                  margin: '0 16px',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${color.warning}`,
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                  lineHeight: 1.4,
                  color: color.warning,
                }}
              >
                {wornGear.map((g) => g.name).join(', ')} {wornGear.length === 1 ? 'is' : 'are'} past the distance you set for replacing{' '}
                {wornGear.length === 1 ? 'it' : 'them'}.
              </button>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionHeader right={<span style={{ ...S.caption, color: color.textFaint }}>every card opens its detail</span>}>This week · {weekRange}</SectionHeader>

              <div style={S.cardStack}>
                <StatCard onOpen={() => onStat('runKm')} name="Run distance" label="Run distance" cue="Details">
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ ...S.metricHero, color: color.text }}>{units.distance(thisWeek.runKm * 1000).toFixed(2)}</span>
                    <span style={{ fontFamily: font.mono, fontSize: 20, color: color.textMuted }}>{units.distanceUnit} run</span>
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
                    {Math.abs(units.distance(delta * 1000)).toFixed(1)} {units.distanceUnit} vs last week
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
                  <VolumeBars
                    weeks={rollups.map((r) => ({
                      label: isoWeekLabel(r.weekStart).slice(1),
                      runKm: units.distance(r.runKm * 1000),
                      rideKm: units.distance(r.rideKm * 1000),
                    }))}
                  />
                  <span style={{ display: 'flex', gap: 16 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: color.textMuted }}>
                      <span style={{ width: 14, height: 2, background: color.metricPace }} />
                      run {units.distanceUnit}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: color.textMuted }}>
                      <span style={{ width: 14, height: 2, background: color.metricSpeed }} />
                      ride {units.distanceUnit} ÷ 3
                    </span>
                  </span>
                </StatCard>

                <StatCard onOpen={() => onStat('load')} name="Load balance" label={`Load · 7 day vs 28 day · ${loadUnit(settings)}`} cue="Details">
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
                  <span style={{ display: 'flex', gap: 12 }}>
                    {compareSeed.length >= 2 && (
                      <button onClick={() => onCompare(compareSeed)} style={S.linkButton}>
                        Compare →
                      </button>
                    )}
                    <button onClick={onHistory} style={S.linkButton}>
                      All {activities.length} →
                    </button>
                  </span>
                }
              >
                Latest
              </SectionHeader>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {latest.map((a) => (
                  <ActivityRow key={a.id} activity={a} onOpen={() => onActivity(a.id)} />
                ))}
              </div>
              <span style={{ padding: '0 16px', fontSize: 12, color: color.textFaint }}>Tap a session to open it, or History for the whole log.</span>
            </div>
          </>
        )}
      </div>

      <div style={S.bottomBar}>
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
