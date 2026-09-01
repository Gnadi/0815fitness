import type { GeoSample } from '../types';

/** Web Mercator, which is the projection every raster tile server is cut in.
 *
 *  There is no map library here on purpose: the projection is a dozen lines, and the
 *  alternative is a dependency whose stylesheet the app would have to carry offline for
 *  a basemap that only ever appears online. */

export const TILE_SIZE = 256;
const MAX_ZOOM = 17;
const MIN_ZOOM = 1;
/** The share of the viewport the track is allowed to fill, so it is not drawn hard
 *  against the edges. */
const FIT = 0.86;

export function lonToWorldX(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * TILE_SIZE * 2 ** zoom;
}

export function latToWorldY(lat: number, zoom: number): number {
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const rad = (clamped * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * TILE_SIZE * 2 ** zoom;
}

export interface TileRef {
  z: number;
  x: number;
  y: number;
  /** Where the tile's top-left corner sits in the viewport, in CSS pixels. */
  left: number;
  top: number;
}

export interface TileView {
  zoom: number;
  /** World-pixel coordinate of the viewport's top-left corner. */
  originX: number;
  originY: number;
  width: number;
  height: number;
  tiles: TileRef[];
}

/** The zoom at which the whole track fits the viewport, and the tiles that cover it.
 *
 *  Zoom is chosen rather than offered: this map is a picture of one recorded session,
 *  not something to pan around, so the only framing that makes sense is the one that
 *  shows all of it. */
export function planTiles(points: { lat: number; lon: number }[], width: number, height: number): TileView | null {
  if (points.length === 0 || width <= 0 || height <= 0) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const p of points) {
    if (!isFinite(p.lat) || !isFinite(p.lon)) continue;
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lon < minLon) minLon = p.lon;
    if (p.lon > maxLon) maxLon = p.lon;
  }
  if (!isFinite(minLat) || !isFinite(minLon)) return null;

  // Spans at zoom 0, where the whole world is one tile, so the zoom that fits them is
  // a logarithm rather than a search.
  const spanX0 = lonToWorldX(maxLon, 0) - lonToWorldX(minLon, 0);
  const spanY0 = latToWorldY(minLat, 0) - latToWorldY(maxLat, 0);
  const fitX = spanX0 > 0 ? Math.log2((width * FIT) / spanX0) : MAX_ZOOM;
  const fitY = spanY0 > 0 ? Math.log2((height * FIT) / spanY0) : MAX_ZOOM;
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.floor(Math.min(fitX, fitY))));

  const centreX = (lonToWorldX(minLon, zoom) + lonToWorldX(maxLon, zoom)) / 2;
  const centreY = (latToWorldY(minLat, zoom) + latToWorldY(maxLat, zoom)) / 2;
  const originX = centreX - width / 2;
  const originY = centreY - height / 2;

  const span = 2 ** zoom;
  const tiles: TileRef[] = [];
  const firstX = Math.floor(originX / TILE_SIZE);
  const lastX = Math.floor((originX + width) / TILE_SIZE);
  const firstY = Math.floor(originY / TILE_SIZE);
  const lastY = Math.floor((originY + height) / TILE_SIZE);
  for (let ty = firstY; ty <= lastY; ty++) {
    // There is no map above the pole or below it; there is one east of the date line.
    if (ty < 0 || ty >= span) continue;
    for (let tx = firstX; tx <= lastX; tx++) {
      tiles.push({
        z: zoom,
        x: ((tx % span) + span) % span,
        y: ty,
        left: tx * TILE_SIZE - originX,
        top: ty * TILE_SIZE - originY,
      });
    }
  }

  return { zoom, originX, originY, width, height, tiles };
}

/** Where one fix lands in the viewport the tiles were planned for. */
export function projectToView(point: { lat: number; lon: number }, view: TileView): { x: number; y: number } {
  return {
    x: lonToWorldX(point.lon, view.zoom) - view.originX,
    y: latToWorldY(point.lat, view.zoom) - view.originY,
  };
}

/** Thins a track to at most `max` fixes before it is drawn.
 *
 *  A two-hour ride is thousands of points, and the path they build has more segments
 *  than the screen has pixels to resolve them. */
export function thinTrack<T>(points: T[], max = 600): T[] {
  if (points.length <= max) return points;
  const stride = Math.ceil(points.length / max);
  const out: T[] = [];
  for (let i = 0; i < points.length; i += stride) out.push(points[i]);
  const last = points[points.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

export function tileUrl(tile: TileRef): string {
  return `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`;
}

export function trackPath(points: GeoSample[], view: TileView): string {
  return thinTrack(points)
    .map((p, i) => {
      const { x, y } = projectToView(p, view);
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}
