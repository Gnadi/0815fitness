import type { GeoSample } from '../types';
import { haversineMeters } from './geo';
import { MAX_PLAUSIBLE_SPEED_MPS } from './recorder';

/** Web Mercator, which is the projection every raster tile server is cut in.
 *
 *  There is no map library here on purpose: the projection is a dozen lines, and the
 *  alternative is a dependency whose stylesheet the app would have to carry offline for
 *  a basemap that only ever appears online. */

export const TILE_SIZE = 256;
export const MAX_ZOOM = 18;
export const MIN_ZOOM = 1;
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
  /** The integer zoom the tiles themselves are addressed at. */
  zoom: number;
  /** CSS pixels per tile pixel, 1 ≤ scale < 2 — the fractional part of the framing.
   *
   *  Tiles only exist at whole zooms, so a track that falls between two of them used to
   *  be drawn at the lower one and left filling as little as half the frame it was
   *  given. Drawing the lower zoom's tiles slightly enlarged closes that gap: the
   *  basemap is a little softer, and the track is the size of its frame. */
  scale: number;
  /** World-pixel coordinate of the viewport's top-left corner, at `zoom`. */
  originX: number;
  originY: number;
  width: number;
  height: number;
  tiles: TileRef[];
}

/** Where a map is looking: a centre, and how far in. Kept apart from the tiles it
 *  resolves to because panning and zooming move this and nothing else — the view is
 *  rebuilt from it on every frame and after every resize. */
export interface Framing {
  centreLat: number;
  centreLon: number;
  /** Fractional: 14.6 is most of the way from zoom 14 to zoom 15. */
  zoom: number;
}

export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

/** Turns world pixels at one zoom back into a latitude. The inverse of `latToWorldY`,
 *  which panning needs: a drag moves pixels, and the framing it lands on is a place. */
export function worldYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / (TILE_SIZE * 2 ** zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export function worldXToLon(x: number, zoom: number): number {
  return (x / (TILE_SIZE * 2 ** zoom)) * 360 - 180;
}

/** The framing that shows the whole of a track inside `width` × `height`.
 *
 *  Zoom is chosen rather than offered for the map on a session screen: it is a picture
 *  of one recorded session, and the only framing that makes sense for it is the one
 *  that shows all of it. The fullscreen map starts here too, and then hands the framing
 *  over to whoever is dragging it. */
export function fitFraming(points: { lat: number; lon: number }[], width: number, height: number): Framing | null {
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

  // The centre is taken in world pixels rather than as a mean of the coordinates: a
  // Mercator degree of latitude is not a constant number of pixels, so the midpoint of
  // the two latitudes is not the middle of the picture.
  const centreY0 = (latToWorldY(minLat, 0) + latToWorldY(maxLat, 0)) / 2;
  return {
    centreLat: worldYToLat(centreY0, 0),
    centreLon: (minLon + maxLon) / 2,
    zoom: clampZoom(Math.min(fitX, fitY)),
  };
}

/** The tiles that cover `width` × `height` at a framing, and the transform that puts a
 *  coordinate on them. */
export function viewFor(framing: Framing, width: number, height: number): TileView {
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.floor(framing.zoom)));
  const scale = 2 ** (framing.zoom - zoom);
  // Everything below works in world pixels at the tile zoom, so the viewport is
  // measured there too: on screen it is `width`, on the map it is `width / scale`.
  const worldW = width / scale;
  const worldH = height / scale;
  const originX = lonToWorldX(framing.centreLon, zoom) - worldW / 2;
  const originY = latToWorldY(framing.centreLat, zoom) - worldH / 2;

  const span = 2 ** zoom;
  const tiles: TileRef[] = [];
  const firstX = Math.floor(originX / TILE_SIZE);
  const lastX = Math.floor((originX + worldW) / TILE_SIZE);
  const firstY = Math.floor(originY / TILE_SIZE);
  const lastY = Math.floor((originY + worldH) / TILE_SIZE);
  for (let ty = firstY; ty <= lastY; ty++) {
    // There is no map above the pole or below it; there is one east of the date line.
    if (ty < 0 || ty >= span) continue;
    for (let tx = firstX; tx <= lastX; tx++) {
      tiles.push({
        z: zoom,
        x: ((tx % span) + span) % span,
        y: ty,
        left: (tx * TILE_SIZE - originX) * scale,
        top: (ty * TILE_SIZE - originY) * scale,
      });
    }
  }

  return { zoom, scale, originX, originY, width, height, tiles };
}

/** The drawn size of one tile in this view, in CSS pixels. */
export function tilePixels(view: TileView): number {
  return TILE_SIZE * view.scale;
}

/** The framing that fits a track, resolved to the tiles that cover it. */
export function planTiles(points: { lat: number; lon: number }[], width: number, height: number): TileView | null {
  const framing = fitFraming(points, width, height);
  return framing ? viewFor(framing, width, height) : null;
}

/** Where one fix lands in the viewport the tiles were planned for. */
export function projectToView(point: { lat: number; lon: number }, view: TileView): { x: number; y: number } {
  return {
    x: (lonToWorldX(point.lon, view.zoom) - view.originX) * view.scale,
    y: (latToWorldY(point.lat, view.zoom) - view.originY) * view.scale,
  };
}

/** The place a point of the viewport is looking at — the inverse of `projectToView`,
 *  which is what a pinch needs: the coordinate under the fingers has to stay under
 *  them while the zoom changes around it. */
export function unprojectFromView(x: number, y: number, view: TileView): { lat: number; lon: number } {
  return {
    lat: worldYToLat(view.originY + y / view.scale, view.zoom),
    lon: worldXToLon(view.originX + x / view.scale, view.zoom),
  };
}

/** The framing `view` is showing, shifted by a drag of `dx`, `dy` screen pixels. */
export function panFraming(view: TileView, dx: number, dy: number): Framing {
  const centre = unprojectFromView(view.width / 2 - dx, view.height / 2 - dy, view);
  return { centreLat: centre.lat, centreLon: centre.lon, zoom: view.zoom + Math.log2(view.scale) };
}

/** Zooms `by` steps about a point of the viewport, keeping whatever is under that point
 *  where it is — which is what a pinch means, and what a double tap on a hill means.
 *
 *  Worked in world pixels at the *new* zoom: the anchor's coordinate is projected there,
 *  and the centre is placed the same number of pixels from it as the anchor is from the
 *  middle of the frame. */
export function zoomFramingAt(view: TileView, by: number, anchorX: number, anchorY: number): Framing {
  const current = view.zoom + Math.log2(view.scale);
  const next = clampZoom(current + by);
  const anchor = unprojectFromView(anchorX, anchorY, view);
  const centreX = lonToWorldX(anchor.lon, next) - anchorX + view.width / 2;
  const centreY = latToWorldY(anchor.lat, next) - anchorY + view.height / 2;
  return { centreLat: worldYToLat(centreY, next), centreLon: worldXToLon(centreX, next), zoom: next };
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

/** Thins a track, but remembers where the fixes stopped.
 *
 *  Gaps are found on the full track and then carried onto the thinned one, because
 *  thinning a long ride can put more than `gapS` between two kept points on its own —
 *  and a stride is not a gap. */
export function thinTrackWithGaps(points: GeoSample[], max = 600, gapS = 20): { point: GeoSample; gapBefore: boolean }[] {
  if (points.length === 0) return [];
  const stride = points.length <= max ? 1 : Math.ceil(points.length / max);
  const out: { point: GeoSample; gapBefore: boolean }[] = [];
  let pendingGap = false;
  for (let i = 0; i < points.length; i++) {
    if (i > 0 && (points[i].t - points[i - 1].t) / 1000 > gapS) pendingGap = true;
    const keep = i % stride === 0 || i === points.length - 1;
    if (!keep) continue;
    out.push({ point: points[i], gapBefore: pendingGap && out.length > 0 });
    pendingGap = false;
  }
  return out;
}

export interface TrackPaths {
  /** The stretches the GPS actually recorded. */
  recorded: string;
  /** The straight lines across stretches it did not — an assumption, drawn as one. */
  inferred: string;
}

/** The track as two paths: what was recorded, and what was only joined up.
 *
 *  A phone that stopped reporting for twenty minutes leaves two fixes and a straight
 *  line between them. Drawing that line like any other stretch of road claims a route
 *  that was never recorded, so it is split out and drawn as the guess it is. */
export function trackPaths(points: GeoSample[], view: TileView, gapS = 20): TrackPaths {
  const thinned = thinTrackWithGaps(points, 600, gapS);
  let recorded = '';
  let inferred = '';
  let penDown = false;
  for (let i = 0; i < thinned.length; i++) {
    const { x, y } = projectToView(thinned[i].point, view);
    const here = `${x.toFixed(1)} ${y.toFixed(1)}`;
    if (i === 0) {
      recorded += `M${here} `;
      penDown = true;
      continue;
    }
    if (thinned[i].gapBefore) {
      const previous = projectToView(thinned[i - 1].point, view);
      inferred += `M${previous.x.toFixed(1)} ${previous.y.toFixed(1)} L${here} `;
      // The recorded path restarts on the far side of the gap rather than running
      // through it.
      recorded += `M${here} `;
      penDown = true;
      continue;
    }
    recorded += `${penDown ? 'L' : 'M'}${here} `;
    penDown = true;
  }
  return { recorded: recorded.trim(), inferred: inferred.trim() };
}

export function tileUrl(tile: TileRef): string {
  return `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`;
}

// ── reading the track as data, not just a line ─────────────────────
/** A stretch of track, and how fast it was against the rest of the session.
 *
 *  A single-coloured line says where you went. It cannot say where the hill was, where
 *  the traffic light was, or which half of the loop you were still fresh for — all of
 *  which the recording knows and the map was throwing away. */
export interface RibbonSegment {
  d: string;
  /** 0 = this session's slowest stretch, 1 = its fastest. Relative to the session
   *  itself, because an absolute scale would paint every recovery run one colour. */
  tone: number;
}

/** Speed over each drawn stretch, smoothed over its neighbours.
 *
 *  Smoothed because a single fix landing a few metres off puts a sprint and a stop next
 *  to each other in a track that was neither. */
function segmentSpeeds(thinned: { point: GeoSample; gapBefore: boolean }[]): (number | null)[] {
  const raw: (number | null)[] = [];
  for (let i = 1; i < thinned.length; i++) {
    if (thinned[i].gapBefore) {
      raw.push(null);
      continue;
    }
    const a = thinned[i - 1].point;
    const b = thinned[i].point;
    const dtS = (b.t - a.t) / 1000;
    const dM = haversineMeters(a, b);
    const speed = dtS > 0 ? dM / dtS : null;
    raw.push(speed != null && speed <= MAX_PLAUSIBLE_SPEED_MPS ? speed : null);
  }

  return raw.map((_, i) => {
    let sum = 0;
    let n = 0;
    for (let k = Math.max(0, i - 1); k <= Math.min(raw.length - 1, i + 1); k++) {
      const v = raw[k];
      if (v == null) continue;
      sum += v;
      n += 1;
    }
    return n > 0 ? sum / n : null;
  });
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.max(0, Math.min(sorted.length - 1, Math.round(q * (sorted.length - 1))));
  return sorted[i];
}

/** The recorded track cut into stretches coloured by how fast each one was.
 *
 *  Tones are quantised and neighbouring stretches of the same tone merged, so a long
 *  ride is a few dozen paths rather than several hundred — the picture is the same and
 *  the map is one element per band of pace instead of one per fix. */
export function paceRibbon(points: GeoSample[], view: TileView, gapS = 20, max = 320): RibbonSegment[] {
  const thinned = thinTrackWithGaps(points, max, gapS);
  if (thinned.length < 2) return [];
  const speeds = segmentSpeeds(thinned);
  const known = speeds.filter((v): v is number => v != null).sort((a, b) => a - b);
  if (known.length === 0) return [];
  // The ends of the scale are the 10th and 90th percentile rather than the extremes: a
  // single stop at a crossing should not be the anchor the whole session is read
  // against.
  const lo = quantile(known, 0.1);
  const hi = quantile(known, 0.9);
  const span = hi - lo;
  // A session held to within a few per cent of one speed — a treadmill, a turbo, a
  // steady tempo — has nothing for the colours to say, and stretching that spread
  // across the whole ramp would paint noise as terrain. It stays the plain track.
  if (span < Math.max(0.2, lo * 0.05)) return [];

  const STEPS = 11;
  const out: RibbonSegment[] = [];
  let current: { tone: number; d: string } | null = null;
  for (let i = 1; i < thinned.length; i++) {
    const speed = speeds[i - 1];
    const from = projectToView(thinned[i - 1].point, view);
    const to = projectToView(thinned[i].point, view);
    const at = (p: { x: number; y: number }) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    if (thinned[i].gapBefore || speed == null) {
      // Nothing was recorded across a gap, so nothing is coloured across it either.
      current = null;
      continue;
    }
    const tone = Math.round(Math.max(0, Math.min(1, (speed - lo) / span)) * (STEPS - 1)) / (STEPS - 1);
    if (current && current.tone === tone) {
      current.d += ` L${at(to)}`;
      continue;
    }
    current = { tone, d: `M${at(from)} L${at(to)}` };
    out.push(current);
  }
  return out;
}

/** A place along the track, in metres from its start. */
export interface TrackPosition {
  m: number;
  x: number;
  y: number;
}

/** Where the given distances along the track land in the viewport.
 *
 *  Used for the kilometre marks and for the medals, which belong to a stretch of the
 *  route rather than to a point of it and so are pinned at its middle. */
export function positionsAtDistances(points: GeoSample[], view: TileView, targetsM: number[]): TrackPosition[] {
  const wanted = [...targetsM].filter((m) => m > 0).sort((a, b) => a - b);
  if (points.length < 2 || wanted.length === 0) return [];
  const out: TrackPosition[] = [];
  let cursor = 0;
  let covered = 0;
  for (let i = 1; i < points.length && cursor < wanted.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dtS = (b.t - a.t) / 1000;
    const dM = haversineMeters(a, b);
    // The same implausible jumps the distance the session is filed under refuses, so a
    // marker sits where the recording says the kilometre was.
    const step = dtS > 0 && dM / dtS > MAX_PLAUSIBLE_SPEED_MPS ? 0 : dM;
    while (cursor < wanted.length && wanted[cursor] <= covered + step) {
      const f = step > 0 ? (wanted[cursor] - covered) / step : 0;
      const at = projectToView({ lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f }, view);
      out.push({ m: wanted[cursor], x: at.x, y: at.y });
      cursor += 1;
    }
    covered += step;
  }
  return out;
}

/** How far apart the kilometre marks should be, so a long ride is not pinned into
 *  illegibility. Always a round multiple of a kilometre. */
export function markerSpacingM(totalM: number, maxMarks = 12): number {
  for (const km of [1, 2, 5, 10, 20, 50, 100]) {
    if (totalM / (km * 1000) <= maxMarks) return km * 1000;
  }
  return 100000;
}
