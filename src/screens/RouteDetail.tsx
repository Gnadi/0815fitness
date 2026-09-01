import { useMemo } from 'react';
import { color, font } from '../theme';
import * as S from '../styles';
import { ActionButton, Label, ScreenHeader } from '../components/primitives';
import { StatTrendBars } from '../components/charts';
import { useUnits } from '../hooks/useUnits';
import { clusterRoutes } from '../lib/routes';
import { MAX_COMPARE } from '../lib/compare';
import { avgSpeedMps, durationS, fmtClock, fmtDayMonth, fmtEuroDate, gapSecPerKm } from '../lib/stats';
import type { Activity } from '../types';

/** One route, every time it has been run.
 *
 *  Two sessions side by side say which was faster. A whole cluster of the same loop says
 *  whether the loop is getting easier — which is the question a training log is kept to
 *  answer, and the one comparison the app could not previously make. */
export function RouteDetail({
  routeId,
  activities,
  onBack,
  onActivity,
  onCompare,
}: {
  routeId: string;
  activities: Activity[];
  onBack: () => void;
  onActivity: (id: string) => void;
  onCompare: (ids: string[]) => void;
}) {
  const units = useUnits();
  const cluster = useMemo(() => clusterRoutes(activities).find((c) => c.id === routeId) ?? null, [activities, routeId]);

  if (!cluster) {
    return (
      <div style={S.screen}>
        <ScreenHeader title="Route" onBack={onBack} />
        <span style={{ padding: '8px 16px', ...S.body, color: color.textMuted }}>
          This route no longer has repeats in the log — a session it was built from may have been deleted.
        </span>
      </div>
    );
  }

  const run = cluster.sport === 'run';
  // Oldest first for the trend: a route gets read left to right in time, like every
  // other chart in the app.
  const chronological = [...cluster.activities].sort((a, b) => a.startedAt - b.startedAt);

  const paceOf = (a: Activity) => {
    const speed = avgSpeedMps(a);
    return speed > 0.2 ? 1000 / speed : null;
  };

  const best = chronological.reduce<Activity | null>((fastest, a) => {
    const p = paceOf(a);
    const bp = fastest ? paceOf(fastest) : null;
    return p != null && (bp == null || p < bp) ? a : fastest;
  }, null);
  const bestPace = best ? paceOf(best) : null;

  // Time rather than pace, because these bars grow from zero: a taller bar being a
  // slower day is a reading anyone gets at a glance, where a taller pace bar would mean
  // the opposite of what it looks like.
  const trend = chronological.map((a) => ({
    weekStart: a.startedAt,
    label: fmtDayMonth(a.startedAt),
    value: durationS(a) / 60,
  }));

  const firstPace = paceOf(chronological[0]);
  const latestPace = paceOf(chronological[chronological.length - 1]);
  const change = firstPace != null && latestPace != null ? latestPace - firstPace : null;

  return (
    <div style={S.screen}>
      <ScreenHeader title={cluster.name} onBack={onBack} />

      <div className="ct-scroll" style={{ ...S.scrollArea, padding: '4px 0 40px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ ...S.metricHero, color: color.text }}>{cluster.activities.length}</span>
            <span style={{ fontFamily: font.mono, fontSize: 18, color: color.textMuted }}>times</span>
          </div>
          <span style={{ fontSize: 13, lineHeight: 1.45, color: color.textMuted }}>
            {units.fmtDistance(cluster.medianDistanceM, 1)} {units.distanceUnit} · {run ? 'run' : 'ridden'} since {fmtEuroDate(cluster.firstDate)}
            {bestPace != null && best
              ? ` · best ${run ? `${units.fmtPace(bestPace)}${units.paceUnit}` : `${units.fmtSpeed(1000 / bestPace)} ${units.speedUnit}`} on ${fmtDayMonth(best.startedAt)}`
              : ''}
          </span>
          {change != null && (
            <span style={{ fontSize: 13, color: change < 0 ? color.positive : color.textMuted }}>
              {change < 0 ? 'Faster' : 'Slower'} by {fmtClock(Math.abs(units.paceSecPerUnit(change)))} per {units.distanceUnit} than the first
              time on it.
            </span>
          )}
        </div>

        {trend.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Label style={{ padding: '0 16px' }}>Time · every time on this route</Label>
            <StatTrendBars points={trend} format={(v) => fmtClock(v * 60)} />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={S.tableHeaderRow}>
            <span style={{ ...S.monoTick, width: 44 }}>DATE</span>
            <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>{units.distanceUnit.toUpperCase()}</span>
            <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>TIME</span>
            <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>{run ? 'PACE' : 'SPEED'}</span>
            {run && <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>GAP</span>}
            <span style={{ ...S.monoTick, width: 40, textAlign: 'right' }}>HR</span>
          </div>
          {cluster.activities.map((a) => {
            const pace = paceOf(a);
            const gap = gapSecPerKm(a);
            const isBest = best?.id === a.id;
            return (
              <button
                key={a.id}
                className="ct-row"
                onClick={() => onActivity(a.id)}
                style={{
                  ...S.tableRow,
                  height: 34,
                  width: '100%',
                  border: 'none',
                  borderBottom: `1px solid ${color.dividerHairline}`,
                  background: isBest ? 'rgba(79,158,106,0.08)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <span style={{ ...S.tableNum, width: 44, textAlign: 'left', color: color.textMuted }}>{fmtDayMonth(a.startedAt)}</span>
                <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', color: color.text }}>{units.fmtDistance(a.distance, 1)}</span>
                <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', color: color.text }}>{fmtClock(durationS(a))}</span>
                <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', color: isBest ? color.positive : color.text }}>
                  {pace != null ? (run ? units.fmtPace(pace) : units.fmtSpeed(1000 / pace)) : '—'}
                </span>
                {run && (
                  <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', color: color.textMuted }}>
                    {gap != null ? units.fmtPace(gap) : '—'}
                  </span>
                )}
                <span style={{ ...S.tableNum, width: 40, textAlign: 'right', color: color.textMuted }}>
                  {a.derived.avgHr ? Math.round(a.derived.avgHr) : '—'}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ margin: '0 16px' }}>
          <ActionButton onClick={() => onCompare(cluster.activities.slice(0, MAX_COMPARE).map((a) => a.id))}>
            Compare the last {Math.min(MAX_COMPARE, cluster.activities.length)} times
          </ActionButton>
        </div>

        <span style={{ padding: '0 16px', fontSize: 12, lineHeight: 1.4, color: color.textFaint, textWrap: 'pretty' }}>
          Sessions are matched by shape: each track is reduced to thirty-two evenly spaced points from its start, and two are the same
          route when they run within a couple of per cent of each other's length and stay within a tolerance of the same line — in
          either direction, so an out-and-back run the other way is the same route.
        </span>
      </div>
    </div>
  );
}
