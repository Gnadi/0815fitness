import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { color, font } from '../theme';
import * as S from '../styles';
import { Label } from '../components/primitives';
import { ActivityCard } from '../components/ActivityCard';
import { awardMedals } from '../lib/medals';
import { useUnits } from '../hooks/useUnits';
import {
  computeStreak,
  fmtClock,
  fmtDayMonth,
  gearUsage,
  hoursMinutes,
  lastNWeekStarts,
  rollupWeeks,
  WEEKDAY_LABELS,
} from '../lib/stats';
import type { StatKey } from '../lib/statDetails';
import { MAX_COMPARE } from '../lib/compare';
import { generateDemoHistory } from '../lib/demoSeed';
import type { RecorderCheckpoint } from '../lib/recorder';
import type { Activity, ActivitySamples, Settings } from '../types';

/** How many sessions the start screen shows before handing over to the log. */
const RECENT = 8;

function greeting(hour: number): string {
  if (hour < 5) return 'Still up';
  if (hour < 11) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** The one thing on this screen that is not a session: a recording a previous launch
 *  was in the middle of when the app went away. It sits above everything else because
 *  it is the only state in the app that is lost by being ignored. */
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
    <div style={{ margin: '0 16px', padding: 13, border: `1px solid ${color.warning}`, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
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

/** One figure in the week strip. Small on purpose: this screen is about the sessions,
 *  and the week is the single line of context they sit in — every figure still opens
 *  the twelve weeks behind it. */
function WeekFigure({ onOpen, name, label, value, unit }: { onOpen: () => void; name: string; label: string; value: string; unit: string }) {
  return (
    <button
      onClick={onOpen}
      className="ct-quiet"
      aria-label={`${name} detail`}
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '10px 6px 11px',
        background: 'none',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ ...S.metric, color: color.text }}>{value}</span>
        <span style={{ fontFamily: font.mono, fontSize: 10, color: color.textMuted }}>{unit}</span>
      </span>
      <span style={{ ...S.label, fontSize: 10 }}>{label}</span>
    </button>
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
  const weekStarts = useMemo(() => lastNWeekStarts(2, now), [now]);
  const rollups = useMemo(() => rollupWeeks(activities, weekStarts, settings), [activities, weekStarts, settings]);
  const streak = useMemo(() => computeStreak(activities, now), [activities, now]);
  // One pass over the log gives every session its medals, so a card can carry its count
  // without the list asking the question once per row.
  const medals = useMemo(() => awardMedals(activities), [activities]);
  const thisWeek = rollups[rollups.length - 1];

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
  const dateLine = `${WEEKDAY_LABELS[(d.getDay() + 6) % 7]} ${fmtDayMonth(now)}.${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const recent = activities.slice(0, RECENT);
  const empty = activities.length === 0;

  // The newest sessions of one sport are what a comparison would open with.
  // Keyed on the log itself, not on the slice above: that is a fresh array every
  // render, and a dependency that is never the same twice is a memo that never holds.
  const compareSeed = useMemo(() => {
    const sport = activities[0]?.sport;
    return activities
      .filter((a) => a.sport === sport)
      .slice(0, MAX_COMPARE)
      .map((a) => a.id);
  }, [activities]);

  const weekFigures: { key: StatKey; name: string; label: string; value: string; unit: string }[] = [
    { key: 'runKm', name: 'Run distance', label: 'run', value: units.distance(thisWeek.runKm * 1000).toFixed(1), unit: units.distanceUnit },
    { key: 'rideKm', name: 'Ride distance', label: 'ride', value: units.distance(thisWeek.rideKm * 1000).toFixed(0), unit: units.distanceUnit },
    { key: 'time', name: 'Training time', label: 'time', value: hoursMinutes(thisWeek.timeS), unit: 'h' },
    { key: 'sessions', name: 'Sessions', label: 'sessions', value: String(thisWeek.sessions), unit: '' },
  ];

  const quietLink: CSSProperties = {
    background: 'none',
    border: 'none',
    padding: '9px 12px',
    fontSize: 12,
    color: color.textMuted,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  return (
    <div style={S.screen}>
      {/* The header is the app's own greeting rather than a screen title: this is where
          it opens, so it says the day and gets out of the way. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '0 16px 14px' }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: '.08em', color: color.textFaint, fontFeatureSettings: "'tnum' 1, 'zero' 1" }}>
            {dateLine}
          </span>
          <span style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>{greeting(d.getHours())}</span>
        </span>
        <button
          onClick={onSettings}
          aria-label="Settings"
          style={{ background: 'none', border: 'none', padding: '4px 0 0', cursor: 'pointer', color: color.textFaint, fontSize: 17, flex: 'none' }}
        >
          ⚙
        </button>
      </div>

      <div className="ct-scroll" style={{ ...S.scrollArea, paddingBottom: 110, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {recovery && (
          <RecoveryCard checkpoint={recovery} onResume={onResumeRecovery} onSave={onSaveRecovery} onDiscard={onDiscardRecovery} />
        )}

        {empty ? (
          <div style={{ padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ ...S.body, color: color.textMuted, textWrap: 'pretty' }}>
              {loaded
                ? 'Nothing recorded yet. Tap RECORD to start a session — everything this screen shows is built from what you record.'
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
                  borderRadius: 10,
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

            {/* One line of context, not a wall of it: the week so far, and the way
                through to the analysis that does go into depth. */}
            <div
              style={{
                // `overflow: hidden` rounds the corners off the strip's own rows, and it
                // also lets a flex child collapse — so this one says it does not.
                flex: 'none',
                margin: '0 16px',
                border: `1px solid ${color.border}`,
                borderRadius: 12,
                background: color.surface,
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'stretch', padding: '0 6px' }}>
                {weekFigures.map((f) => (
                  <WeekFigure key={f.key} onOpen={() => onStat(f.key)} name={f.name} label={f.label} value={f.value} unit={f.unit} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${color.dividerHairline}` }}>
                <button
                  onClick={() => onStat('streak')}
                  className="ct-quiet"
                  aria-label="Streak detail"
                  style={{ ...quietLink, flex: 1, justifyContent: 'flex-start' }}
                >
                  <span style={{ ...S.mono, color: color.text }}>{streak.current}</span> day streak
                </button>
                <span style={{ width: 1, alignSelf: 'stretch', background: color.dividerHairline }} />
                <button onClick={onAnalyse} className="ct-quiet" style={{ ...quietLink, flex: 1, justifyContent: 'flex-end', color: color.accent }}>
                  Analyse →
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px' }}>
                <Label>Latest sessions</Label>
                {compareSeed.length >= 2 && (
                  <button onClick={() => onCompare(compareSeed)} style={S.linkButton}>
                    Compare →
                  </button>
                )}
              </div>

              <div style={{ ...S.cardStack, gap: 10 }}>
                {recent.map((a) => (
                  <ActivityCard key={a.id} activity={a} now={now} medals={medals.get(a.id) ?? []} onOpen={() => onActivity(a.id)} />
                ))}
              </div>

              <button
                onClick={onHistory}
                style={{
                  margin: '2px 16px 0',
                  padding: '11px 0',
                  background: 'none',
                  border: `1px solid ${color.border}`,
                  borderRadius: 999,
                  color: color.textMuted,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
                className="ct-row"
              >
                All {activities.length} sessions →
              </button>
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
