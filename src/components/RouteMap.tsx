import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { color, font, medalColor, paceColor } from '../theme';
import { TRACK_GAP_S } from '../lib/derived';
import {
  fitFraming,
  markerSpacingM,
  paceRibbon,
  panFraming,
  positionsAtDistances,
  projectToView,
  tilePixels,
  tileUrl,
  trackPaths,
  viewFor,
  zoomFramingAt,
  type Framing,
} from '../lib/tiles';
import type { MedalTier } from '../lib/medals';
import type { GeoSample } from '../types';

// What the map is drawn at before it has measured itself — the first paint, and any
// browser that gives no size back (a test renderer, a display:none parent).
const FALLBACK_WIDTH = 358;

/** A medal to pin on the track, at the kilometre it was won over. */
export interface MapMedal {
  km: number;
  tier: MedalTier;
  label: string;
}

/** The recorded track, over an OpenStreetMap basemap, as the map of a session.
 *
 *  This is the one thing in the app that talks to the network, and it is deliberately
 *  the only one: a tile request tells a third-party server roughly where you were, so it
 *  is a setting, it is off the recording screen — which is the screen used at a trailhead
 *  with no signal — and when the tiles do not arrive the drawing underneath is the map
 *  rather than a grey hole.
 *
 *  What is drawn on top of the basemap is the session, not a line: the track is coloured
 *  by how fast each stretch of it was against the rest of the session, the kilometres are
 *  marked along it, and the sections that earned a medal are pinned where they were won.
 *
 *  Standard OSM tiles are a light map in a dark-only app, so they are inverted through a
 *  filter into the palette rather than swapped for a dark tile server that would need an
 *  account and a key. */
export function RouteMap({
  points,
  height,
  tiles: tilesEnabled = true,
  interactive = false,
  colourByPace = true,
  medals = [],
  showMarkers = true,
  onExpand,
}: {
  points: GeoSample[];
  height: number;
  tiles?: boolean;
  /** Lets the map be dragged, pinched and zoomed. Off on a session screen, which
   *  scrolls, and on for the fullscreen map, which is the place to explore a route. */
  interactive?: boolean;
  colourByPace?: boolean;
  medals?: MapMedal[];
  showMarkers?: boolean;
  onExpand?: () => void;
}) {
  const [failed, setFailed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  // The map lays real tile images out in pixels, so it has to know how wide it actually
  // is rather than how wide the phone layout used to be: the app fills whatever column
  // the viewport gives it, and a basemap planned for the wrong width leaves a gap.
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  const box = useRef<HTMLDivElement | null>(null);
  const measure = useCallback((node: HTMLDivElement | null) => {
    box.current = node;
    const w = node?.getBoundingClientRect().width ?? 0;
    if (w > 0) setWidth(Math.round(w));
  }, []);

  useEffect(() => {
    const node = box.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setWidth(Math.round(w));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // The framing that shows the whole session, and — only once someone has moved it —
  // the one they moved it to. Kept apart so that "show all of it again" is dropping a
  // piece of state rather than recomputing a fit.
  const fit = useMemo(() => fitFraming(points, width, height), [points, width, height]);
  // A framing someone dragged the map to, remembered against the fit it was a departure
  // from: when the fit changes — the track, or the size of the frame — the departure is
  // no longer about anything, and the map goes back to showing all of the session.
  const [moved, setMoved] = useState<{ of: Framing; framing: Framing } | null>(null);
  const movedFraming = interactive && moved?.of === fit ? moved.framing : null;
  const moveTo = useCallback((next: Framing) => setMoved(fit ? { of: fit, framing: next } : null), [fit]);

  const framing = movedFraming ?? fit;
  const view = useMemo(() => (framing ? viewFor(framing, width, height) : null), [framing, width, height]);
  const paths = useMemo(() => (view ? trackPaths(points, view, TRACK_GAP_S) : null), [points, view]);
  const ribbon = useMemo(() => (view && colourByPace ? paceRibbon(points, view, TRACK_GAP_S) : []), [points, view, colourByPace]);

  // A gesture is measured against the view it started on, so a drag moves the map by
  // exactly the distance the finger travelled rather than compounding frame by frame.
  const gesture = useRef<{ pointers: Map<number, { x: number; y: number }>; startView: typeof view; startSpan: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !view) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const pointers = gesture.current?.pointers ?? new Map<number, { x: number; y: number }>();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const list = [...pointers.values()];
    gesture.current = {
      pointers,
      startView: view,
      startSpan: list.length > 1 ? Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y) : 0,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const active = gesture.current;
    if (!interactive || !active || !active.startView || !active.pointers.has(e.pointerId)) return;
    const start = active.pointers.get(e.pointerId)!;
    const others = [...active.pointers.entries()].filter(([id]) => id !== e.pointerId);

    if (others.length === 0) {
      moveTo(panFraming(active.startView, e.clientX - start.x, e.clientY - start.y));
      return;
    }
    // Two fingers: the pinch is the change in the distance between them, anchored on
    // the point halfway between — so the map grows around the thing being looked at.
    const other = others[0][1];
    const span = Math.hypot(e.clientX - other.x, e.clientY - other.y);
    if (active.startSpan <= 0 || span <= 0) return;
    const rect = box.current?.getBoundingClientRect();
    const midX = (e.clientX + other.x) / 2 - (rect?.left ?? 0);
    const midY = (e.clientY + other.y) / 2 - (rect?.top ?? 0);
    moveTo(zoomFramingAt(active.startView, Math.log2(span / active.startSpan), midX, midY));
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const active = gesture.current;
    if (!active) return;
    active.pointers.delete(e.pointerId);
    if (active.pointers.size === 0) gesture.current = null;
    else gesture.current = { ...active, startView: view, startSpan: 0 };
  };

  // Wheel has to be bound by hand: React's listener is passive, and a map that scrolls
  // the page while it is being zoomed is not a map.
  useEffect(() => {
    const node = box.current;
    if (!node || !interactive || !view) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = node.getBoundingClientRect();
      moveTo(zoomFramingAt(view, -e.deltaY / 320, e.clientX - rect.left, e.clientY - rect.top));
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [interactive, view, moveTo]);

  const step = (by: number) => {
    if (view) moveTo(zoomFramingAt(view, by, width / 2, height / 2));
  };

  // Every tile refused: no network, a blocked request, a server saying no. The drawing
  // underneath is not a degraded map — it is what the app showed before there were
  // tiles at all, and everything drawn on top of it is unchanged.
  const allRefused = view != null && view.tiles.length > 0 && failed >= view.tiles.length;
  const showTiles = tilesEnabled && !allRefused;

  const start = view && points.length ? projectToView(points[0], view) : null;
  const end = view && points.length ? projectToView(points[points.length - 1], view) : null;

  const trackM = useMemo(() => (points.length > 1 ? approximateLength(points) : 0), [points]);
  const marks = useMemo(() => {
    if (!view || !showMarkers || trackM < 1000) return [];
    const spacing = markerSpacingM(trackM);
    const targets: number[] = [];
    for (let m = spacing; m < trackM; m += spacing) targets.push(m);
    return positionsAtDistances(points, view, targets).map((p) => ({ ...p, km: Math.round(p.m / 1000) }));
  }, [points, view, showMarkers, trackM]);

  // A medal belongs to a kilometre of road, not to a point, so it is pinned at the
  // middle of the stretch it was won over.
  const pins = useMemo(() => {
    if (!view || medals.length === 0) return [];
    const targets = medals.map((m) => (m.km - 0.5) * 1000);
    const placed = positionsAtDistances(points, view, targets);
    return medals
      .map((medal) => {
        const at = placed.find((p) => Math.abs(p.m - (medal.km - 0.5) * 1000) < 1);
        return at ? { ...medal, x: at.x, y: at.y } : null;
      })
      .filter((p): p is MapMedal & { x: number; y: number } => p != null);
  }, [medals, points, view]);

  if (!view) return null;

  const tileSize = tilePixels(view);

  return (
    <div
      ref={measure}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onClick={interactive ? undefined : onExpand}
      style={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
        background: color.surfaceSunk,
        touchAction: interactive ? 'none' : undefined,
        cursor: interactive ? 'grab' : onExpand ? 'pointer' : undefined,
      }}
    >
      {/* The drawing the app has always had, under the tiles rather than instead of
          them: it is what is left when the basemap is off or unreachable. */}
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} aria-hidden style={{ position: 'absolute', inset: 0, display: 'block' }}>
        <path d="M-10 210 C60 190 90 236 170 224 C250 212 300 250 380 236" stroke={color.chartGrid} strokeWidth={1} fill="none" />
        <path d="M-10 120 C70 104 120 148 190 130 C260 112 320 152 380 132" stroke={color.chartGrid} strokeWidth={1} fill="none" />
        <path d="M-10 52 C60 40 110 74 180 58 C250 42 310 72 380 56" stroke={color.chartGrid} strokeWidth={1} fill="none" />
      </svg>

      {showTiles && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            // Inverting a light basemap is what puts it in this app's palette; the
            // hue-rotate puts the greens and blues back the right way round after it.
            filter: 'invert(1) hue-rotate(180deg) brightness(0.78) contrast(0.92) saturate(0.65)',
            opacity: loaded > 0 ? 1 : 0,
            transition: 'opacity 200ms ease',
          }}
        >
          {view.tiles.map((tile) => (
            <img
              key={`${tile.z}/${tile.x}/${tile.y}`}
              src={tileUrl(tile)}
              alt=""
              width={tileSize}
              height={tileSize}
              loading="lazy"
              decoding="async"
              draggable={false}
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setLoaded((n) => n + 1)}
              onError={() => setFailed((n) => n + 1)}
              style={{ position: 'absolute', left: tile.left, top: tile.top, width: tileSize, height: tileSize, display: 'block' }}
            />
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
        role="img"
        aria-label={`The recorded route${medals.length ? `, with ${medals.length} ${medals.length === 1 ? 'medal' : 'medals'} marked on it` : ''}`}
      >
        {/* A stretch the GPS never recorded is a straight line the app guessed, so it is
            drawn as a guess: thin, dashed and dimmed, under the recorded track. */}
        {paths?.inferred && (
          <path d={paths.inferred} stroke={color.textFaint} strokeWidth={1.5} strokeDasharray="5 5" fill="none" strokeLinecap="round" opacity={0.85} />
        )}
        {/* Three passes: a dark casing so the line stays legible over any tile, the
            track itself, and then the pace colours over it. The plain track is drawn
            whether or not the colours are — a stretch whose speed the recording does
            not vouch for is left the colour of the track rather than left out of it. */}
        <path d={paths?.recorded} stroke="rgba(0,0,0,0.6)" strokeWidth={6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <path d={paths?.recorded} stroke={color.metricPace} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {ribbon.map((segment, i) => (
          <path key={i} d={segment.d} stroke={paceColor(segment.tone)} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {marks.map((mark) => (
          <g key={mark.m}>
            <circle cx={mark.x} cy={mark.y} r={7} fill="rgba(10,11,12,0.78)" stroke={color.borderStrong} strokeWidth={1} />
            <text
              x={mark.x}
              y={mark.y + 3.2}
              textAnchor="middle"
              fill={color.textMuted}
              fontFamily={font.mono}
              fontSize={8.5}
            >
              {mark.km}
            </text>
          </g>
        ))}

        {start && <circle cx={start.x} cy={start.y} r={5.5} fill={color.positive} stroke={color.mapInk} strokeWidth={2} />}
        {end && <rect x={end.x - 4.5} y={end.y - 4.5} width={9} height={9} rx={1.5} fill={color.accent} stroke={color.mapInk} strokeWidth={2} />}

        {pins.map((pin) => (
          <g key={`${pin.km}-${pin.tier}`}>
            <title>{`${pin.label} · ${pin.tier}`}</title>
            <MedalPin x={pin.x} y={pin.y} tier={pin.tier} />
          </g>
        ))}
      </svg>

      {colourByPace && ribbon.length > 1 && <PaceLegend />}

      {onExpand && (
        <button
          onClick={onExpand}
          aria-label="Open the map full screen"
          style={{ ...chipStyle, top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
        >
          <ExpandGlyph />
          Expand
        </button>
      )}

      {interactive && (
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => step(1)} aria-label="Zoom in" style={squareButton}>
            +
          </button>
          <button onClick={() => step(-1)} aria-label="Zoom out" style={squareButton}>
            −
          </button>
          {movedFraming && (
            <button onClick={() => setMoved(null)} aria-label="Fit the whole route" style={{ ...squareButton, fontSize: 10 }}>
              FIT
            </button>
          )}
        </div>
      )}

      {/* Required by the tile server's terms, and the honest thing to show anyway. */}
      {showTiles && (
        <span
          style={{
            position: 'absolute',
            // The fullscreen map carries a figures bar along its bottom edge, and the
            // tile server's terms are not met by attribution behind a gradient.
            right: 4,
            ...(interactive ? { top: 6, left: 6, right: 'auto' as const } : { bottom: 3 }),
            padding: '1px 5px',
            borderRadius: 3,
            background: 'rgba(11,12,13,0.66)',
            fontFamily: font.mono,
            fontSize: 9,
            color: color.textFaint,
          }}
        >
          © OpenStreetMap
        </span>
      )}
    </div>
  );
}

/** Roughly how long the track is, for spacing the kilometre marks.
 *
 *  Roughly is enough: this decides whether the marks go every kilometre or every five,
 *  and the figure the session is filed under is the one that gets displayed. */
function approximateLength(points: GeoSample[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dLat = (b.lat - a.lat) * 111320;
    const dLon = (b.lon - a.lon) * 111320 * Math.cos((a.lat * Math.PI) / 180);
    total += Math.hypot(dLat, dLon);
  }
  return total;
}

/** The medal as it appears on the map: a disc on a stem, so it reads as pinned to the
 *  stretch below it rather than floating over it. */
function MedalPin({ x, y, tier }: { x: number; y: number; tier: MedalTier }) {
  const fill = medalColor[tier];
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      <path d="M0 0 L-3 -9 L3 -9 Z" fill={color.mapInk} opacity={0.85} />
      <circle cx={0} cy={-15} r={8} fill={color.mapInk} opacity={0.85} />
      <circle cx={0} cy={-15} r={6.5} fill={fill} stroke={color.mapInk} strokeWidth={1} />
      <circle cx={0} cy={-15} r={3.4} fill="none" stroke="rgba(10,11,12,0.45)" strokeWidth={1.2} />
    </g>
  );
}

/** What the colours on the track mean. Without it the ribbon is decoration; with it,
 *  it is a reading. */
function PaceLegend() {
  return (
    <div style={{ ...chipStyle, left: 8, bottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span>slower</span>
      <span
        style={{
          width: 44,
          height: 5,
          borderRadius: 999,
          background: `linear-gradient(to right, ${paceColor(0)}, ${paceColor(0.5)}, ${paceColor(1)})`,
        }}
      />
      <span>faster</span>
    </div>
  );
}

function ExpandGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden style={{ display: 'block' }}>
      <path d="M0.5 3.5V0.5H3.5M6.5 0.5H9.5V3.5M9.5 6.5V9.5H6.5M3.5 9.5H0.5V6.5" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}

const chipStyle: CSSProperties = {
  position: 'absolute',
  padding: '4px 7px',
  borderRadius: 999,
  border: `1px solid ${color.border}`,
  background: 'rgba(11,12,13,0.74)',
  fontFamily: font.mono,
  fontSize: 10,
  letterSpacing: '.04em',
  color: color.textMuted,
};

const squareButton: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 6,
  border: `1px solid ${color.border}`,
  background: 'rgba(11,12,13,0.74)',
  color: color.text,
  fontFamily: font.mono,
  fontSize: 16,
  lineHeight: 1,
  cursor: 'pointer',
};
