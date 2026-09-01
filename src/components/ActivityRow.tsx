import { color, font } from '../theme';
import * as S from '../styles';
import { RouteSilhouette } from './primitives';
import { MedalBadge } from './medals';
import { useUnits } from '../hooks/useUnits';
import type { UnitFormat } from '../lib/units';
import { avgSpeedMps, elevationProfile, fmtDayMonth } from '../lib/stats';
import type { Medal } from '../lib/medals';
import type { Activity } from '../types';

/** The headline figure for one session: pace for a run, power — or speed, without a
 *  meter — for a ride. The same line the Overview's latest sessions have always shown,
 *  lifted out so the history, a route's repeats and a figure's contributors all read
 *  the same. */
function activityMetric(activity: Activity, units: UnitFormat): string {
  const speed = avgSpeedMps(activity);
  const distance = `${units.fmtDistance(activity.distance, 1)} ${units.distanceUnit}`;
  if (activity.sport === 'run') {
    return `${distance} · ${speed > 0.2 ? `${units.fmtPace(1000 / speed)}${units.paceUnit}` : '—:—'}`;
  }
  const power = activity.derived.avgPower;
  return `${distance} · ${power ? `${Math.round(power)} W` : `${units.fmtSpeed(speed)} ${units.speedUnit}`}`;
}

export function ActivityRow({
  activity,
  onOpen,
  right,
  trailing = '›',
  medals = [],
}: {
  activity: Activity;
  onOpen: () => void;
  /** Replaces the default metric line — a route's repeats show a delta instead. */
  right?: string;
  trailing?: string;
  medals?: Medal[];
}) {
  const units = useUnits();
  return (
    <button
      className="ct-row"
      onClick={onOpen}
      style={{ ...S.listRow, width: '100%', gap: 10, border: 'none', borderTop: `1px solid ${color.dividerHairline}`, cursor: 'pointer', textAlign: 'left', background: 'none' }}
    >
      <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint, width: 34, flex: 'none', fontFeatureSettings: "'tnum' 1" }}>
        {fmtDayMonth(activity.startedAt)}
      </span>
      <RouteSilhouette elevations={elevationProfile(activity)} width={56} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: color.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {activity.title}
      </span>
      <MedalBadge medals={medals} />
      <span style={{ ...S.tableNum, color: color.textMuted, whiteSpace: 'nowrap' }}>{right ?? activityMetric(activity, units)}</span>
      <span className="ct-cue-dot" style={{ fontSize: 13, lineHeight: 1, paddingBottom: 1 }}>
        {trailing}
      </span>
    </button>
  );
}
