import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { color, font, medalColor } from '../theme';
import * as S from '../styles';
import { ScreenHeader } from '../components/primitives';
import { RouteMap } from '../components/RouteMap';
import { MedalIcon } from '../components/medals';
import { useUnits } from '../hooks/useUnits';
import { awardMedals, mapPins } from '../lib/medals';
import { getSamples } from '../lib/storage';
import { avgSpeedMps, durationS, fmtClock } from '../lib/stats';
import type { Activity, ActivitySamples, Settings } from '../types';

/** The route, with the whole screen to itself.
 *
 *  The map on a session screen is a picture of the session, framed to show all of it and
 *  sized to leave room for the figures under it. This is the other thing a map is for:
 *  the actual ground. It pans, it zooms, it keeps the pace colours and the medals, and
 *  it is the only screen in the app with nothing else on it. */
export function MapScreen({
  activity,
  activities,
  settings,
  onBack,
}: {
  activity: Activity | null;
  activities: Activity[];
  settings: Settings;
  onBack: () => void;
}) {
  const units = useUnits();
  const [loaded, setLoaded] = useState<{ id: string; samples: ActivitySamples | null } | null>(null);
  const [height, setHeight] = useState(420);
  const frame = useRef<HTMLDivElement | null>(null);

  const measure = useCallback((node: HTMLDivElement | null) => {
    frame.current = node;
    const h = node?.getBoundingClientRect().height ?? 0;
    if (h > 0) setHeight(Math.round(h));
  }, []);

  useEffect(() => {
    const node = frame.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? 0;
      if (h > 0) setHeight(Math.round(h));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const id = activity?.id;
  useEffect(() => {
    if (!id) return;
    let live = true;
    void getSamples(id).then((found) => {
      if (live) setLoaded({ id, samples: found });
    });
    return () => {
      live = false;
    };
  }, [id]);

  const medals = useMemo(() => (activity ? (awardMedals(activities).get(activity.id) ?? []) : []), [activity, activities]);
  const pins = mapPins(medals).map((m) => ({ km: m.km as number, tier: m.tier, label: m.label }));
  const samples = loaded && loaded.id === id ? loaded.samples : null;

  if (!activity) {
    return (
      <div style={S.screen}>
        <ScreenHeader title="Map" onBack={onBack} />
        <span style={{ padding: '8px 16px', ...S.body, color: color.textMuted }}>This session is no longer in the log.</span>
      </div>
    );
  }

  const run = activity.sport === 'run';
  const speed = avgSpeedMps(activity);
  const figures = [
    { label: 'Distance', value: `${units.fmtDistance(activity.distance, 2)} ${units.distanceUnit}` },
    { label: 'Time', value: fmtClock(durationS(activity)) },
    run
      ? { label: 'Pace', value: speed > 0.2 ? `${units.fmtPace(1000 / speed)} ${units.paceUnit}` : '—' }
      : { label: 'Speed', value: `${units.fmtSpeed(speed)} ${units.speedUnit}` },
  ];

  return (
    <div style={S.screen}>
      <ScreenHeader title={activity.title} onBack={onBack} />

      <div ref={measure} style={{ flex: 1, position: 'relative', minHeight: 0, borderTop: `1px solid ${color.dividerHairline}` }}>
        {samples && samples.points.length >= 2 ? (
          <RouteMap points={samples.points} height={height} tiles={settings.mapTiles} interactive medals={pins} />
        ) : (
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', ...S.body, color: color.textFaint }}>
            {activity.hasSamples ? 'Reading the track…' : 'This session has no track to draw.'}
          </span>
        )}

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '10px 12px max(12px, env(safe-area-inset-bottom))',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'linear-gradient(to top, rgba(11,12,13,0.92) 55%, rgba(11,12,13,0))',
            pointerEvents: 'none',
          }}
        >
          {figures.map((f) => (
            <span key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ ...S.monoTick }}>{f.label.toUpperCase()}</span>
              <span style={{ ...S.tableNum, fontSize: 15, color: color.text }}>{f.value}</span>
            </span>
          ))}
          {medals.length > 0 && (
            // The whole session's count, not the pins': the map thins its pins so a
            // route whose every kilometre was a best is still a map.
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MedalIcon tier={medals[0].tier} size={16} />
              <span style={{ fontFamily: font.mono, fontSize: 13, color: medalColor[medals[0].tier] }}>{medals.length}</span>
            </span>
          )}
        </div>
      </div>

      <span style={{ padding: '9px 16px max(10px, env(safe-area-inset-bottom))', ...S.caption, color: color.textFaint, textWrap: 'pretty' }}>
        Drag to move, pinch or scroll to zoom, FIT to see the whole route again. The track is coloured by pace against the rest of
        this session; a pin marks a kilometre that earned a medal.
      </span>
    </div>
  );
}
