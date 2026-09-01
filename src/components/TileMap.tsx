import { useMemo, useState } from 'react';
import { color, font } from '../theme';
import { TrackMap } from './charts';
import { planTiles, projectToView, TILE_SIZE, tileUrl, trackPath } from '../lib/tiles';
import type { GeoSample } from '../types';

const WIDTH = 358;

/** The recorded track over an OpenStreetMap basemap.
 *
 *  This is the one thing in the app that talks to the network, and it is deliberately
 *  the only one: a tile request tells a third-party server roughly where you were, so it
 *  is a setting, it is off the recording screen — which is the screen used at a trailhead
 *  with no signal — and when the tiles do not arrive the map falls back to the line-and-
 *  contour drawing the app has always used rather than showing a grey hole.
 *
 *  Standard OSM tiles are a light map in a dark-only app, so they are inverted through a
 *  filter into the palette rather than swapped for a dark tile server that would need an
 *  account and a key. */
export function TileMap({ points, height, tiles: tilesEnabled = true }: { points: GeoSample[]; height: number; tiles?: boolean }) {
  const [failed, setFailed] = useState(0);
  const [loaded, setLoaded] = useState(0);

  const view = useMemo(() => (tilesEnabled ? planTiles(points, WIDTH, height) : null), [points, height, tilesEnabled]);
  const path = useMemo(() => (view ? trackPath(points, view) : ''), [points, view]);

  // Every tile refused: no network, a blocked request, a server saying no. The drawn map
  // is not a degraded version of this one — it is what the app showed before there were
  // tiles at all, and it needs nothing.
  const allRefused = view != null && view.tiles.length > 0 && failed >= view.tiles.length;
  if (!view || allRefused) return <TrackMap points={points} height={height} />;

  const start = points.length ? projectToView(points[0], view) : null;
  const end = points.length ? projectToView(points[points.length - 1], view) : null;

  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden', background: color.surfaceSunk }}>
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
            width={TILE_SIZE}
            height={TILE_SIZE}
            loading="lazy"
            decoding="async"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoaded((n) => n + 1)}
            onError={() => setFailed((n) => n + 1)}
            style={{ position: 'absolute', left: tile.left, top: tile.top, width: TILE_SIZE, height: TILE_SIZE, display: 'block' }}
          />
        ))}
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        width="100%"
        height={height}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
        role="img"
        aria-label="The recorded route"
      >
        {/* Drawn twice: a dark casing under the line so it stays legible over any tile. */}
        <path d={path} stroke="rgba(0,0,0,0.55)" strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <path d={path} stroke={color.metricPace} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {start && <circle cx={start.x} cy={start.y} r={5} fill={color.positive} stroke="#000000" strokeWidth={1.5} />}
        {end && <circle cx={end.x} cy={end.y} r={5} fill={color.accent} stroke="#000000" strokeWidth={1.5} />}
      </svg>

      {/* Required by the tile server's terms, and the honest thing to show anyway. */}
      <span
        style={{
          position: 'absolute',
          right: 4,
          bottom: 3,
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
    </div>
  );
}
