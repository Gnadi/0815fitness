import { color, font } from '../theme';
import * as S from '../styles';
import { RouteSilhouette } from './primitives';
import { MedalBadge } from './medals';
import { useUnits } from '../hooks/useUnits';
import { avgSpeedMps, durationS, elevationProfile, fmtClock, fmtTimeOfDay, whenLabel } from '../lib/stats';
import type { Medal } from '../lib/medals';
import type { Activity } from '../types';

/** One session as the Overview shows it: what it was, when it was, and the three
 *  figures anyone actually looks for afterwards — over its own elevation profile.
 *
 *  The dense `ActivityRow` is still what the log, a route's repeats and a figure's
 *  contributors use; this is the same session read at arm's length, which is what a
 *  start screen is for. */
export function ActivityCard({ activity, onOpen, now, medals = [] }: { activity: Activity; onOpen: () => void; now: number; medals?: Medal[] }) {
  const units = useUnits();
  const speed = avgSpeedMps(activity);
  // A flat profile — a treadmill, a manual entry, a device that reported no altitude —
  // draws as an empty band, so the card simply ends after its figures instead.
  const profile = elevationProfile(activity);
  const hasRelief = profile.length > 2 && Math.max(...profile) - Math.min(...profile) > 0;
  const run = activity.sport === 'run';
  const tint = run ? color.metricPace : color.metricSpeed;

  const pace = run
    ? { label: 'pace', value: speed > 0.2 ? units.fmtPace(1000 / speed) : '—:—', unit: units.paceUnit }
    : activity.derived.avgPower
      ? { label: 'power', value: String(Math.round(activity.derived.avgPower)), unit: 'W' }
      : { label: 'speed', value: units.fmtSpeed(speed), unit: units.speedUnit };

  const figures = [
    { label: 'distance', value: units.fmtDistance(activity.distance, 2), unit: units.distanceUnit },
    { label: 'time', value: fmtClock(durationS(activity)), unit: '' },
    pace,
  ];

  return (
    <button className="ct-card" onClick={onOpen} aria-label={`${activity.title}, ${whenLabel(activity.startedAt, now)}`} style={cardStyle}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: tint, flex: 'none' }} />
        <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: '.1em', color: color.textMuted }}>
          {run ? 'RUN' : 'RIDE'}
        </span>
        <span style={{ flex: 1, textAlign: 'right', fontFamily: font.mono, fontSize: 11, color: color.textFaint, ...S.mono }}>
          {whenLabel(activity.startedAt, now)} · {fmtTimeOfDay(activity.startedAt)}
        </span>
        <MedalBadge medals={medals} />
        <span className="ct-cue-dot" style={{ fontSize: 13, lineHeight: 1, paddingBottom: 1 }}>
          ›
        </span>
      </span>

      <span style={{ fontSize: 15, fontWeight: 600, color: color.text, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {activity.title}
      </span>

      <span style={{ display: 'flex', gap: 22 }}>
        {figures.map((f) => (
          <span key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ ...S.metric, color: color.text }}>{f.value}</span>
              {f.unit && <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textMuted }}>{f.unit}</span>}
            </span>
            <span style={{ ...S.label, fontSize: 10 }}>{f.label}</span>
          </span>
        ))}
      </span>

      {/* The profile is the card's floor rather than an element on it: full-bleed,
          dim, and the one thing that makes two sessions of the same length look
          different at a glance. */}
      {hasRelief && (
        <RouteSilhouette
          elevations={profile}
          width={320}
          height={26}
          fill={color.metricElevation}
          style={{ display: 'block', width: 'calc(100% + 28px)', margin: '2px -14px -13px' }}
        />
      )}
    </button>
  );
}

const cardStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 8,
  padding: '13px 14px',
  overflow: 'hidden',
};
