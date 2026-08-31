import type { GeoSample } from '../types';

const EARTH_R = 6371000;

export function haversineMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function cumulativeDistance(points: GeoSample[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversineMeters(points[i - 1], points[i]);
  return d;
}

export function totalAscent(points: GeoSample[]): number {
  let asc = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].ele;
    const cur = points[i].ele;
    if (prev == null || cur == null) continue;
    const d = cur - prev;
    if (d > 0.3) asc += d; // ignore GPS altitude jitter under ~0.3m
  }
  return asc;
}

/** GPS accuracy (metres) → a coarse 0-12 "fix strength" used for the pre-start signal bars.
 *  The Geolocation API never exposes a real satellite count, so this approximates one
 *  from reported accuracy rather than inventing a number the platform can't back up. */
export function fixStrengthFromAccuracy(accuracy: number | null): number {
  if (accuracy == null) return 0;
  if (accuracy <= 5) return 12;
  if (accuracy <= 8) return 10;
  if (accuracy <= 15) return 8;
  if (accuracy <= 25) return 6;
  if (accuracy <= 40) return 4;
  if (accuracy <= 60) return 2;
  return 1;
}

/** Smallest and largest value in a series.
 *
 *  A loop rather than `Math.min(...values)`: the series here are recorded tracks, and
 *  spreading one of those into an argument list is both slower than a scan and a
 *  RangeError waiting for the ride long enough to hit the engine's argument limit. */
export function extent(values: ArrayLike<number>): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

/** Project a lat/lon track onto a flat local plane (metres), fitted into the given viewBox
 *  with a margin, for rendering as an SVG path. Good enough for a single run/ride's extent. */
export function projectTrackToViewBox(
  points: { lat: number; lon: number }[],
  vbW: number,
  vbH: number,
  margin = 12,
): { x: number; y: number }[] {
  if (points.length === 0) return [];
  const lat0 = points[0].lat;
  const mPerDegLat = 111320;
  const mPerDegLon = 111320 * Math.cos((lat0 * Math.PI) / 180);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    const x = p.lon * mPerDegLon;
    const y = p.lat * mPerDegLat;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const scale = Math.min((vbW - margin * 2) / spanX, (vbH - margin * 2) / spanY);
  const offX = (vbW - spanX * scale) / 2;
  const offY = (vbH - spanY * scale) / 2;
  return points.map((p) => ({
    x: offX + (p.lon * mPerDegLon - minX) * scale,
    // flip Y: lat increases north, svg y increases down
    y: vbH - (offY + (p.lat * mPerDegLat - minY) * scale),
  }));
}

export function pathFromPoints(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

/** Resample an elevation profile to a fixed number of points and build a filled silhouette
 *  path in a w×h viewBox — the "signature element" from the brief, used for list rows,
 *  chips and activity detail. */
export function silhouettePath(elevations: number[], w: number, h: number): string {
  if (elevations.length < 2) return `M0 ${h} L${w} ${h} Z`;
  const { min, max } = extent(elevations);
  const span = Math.max(1, max - min);
  const n = elevations.length;
  const pts = elevations.map((e, i) => {
    const x = (i / (n - 1)) * w;
    const y = h - ((e - min) / span) * h * 0.82 - h * 0.06;
    return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return `M0 ${h} ${pts.join(' ')} L${w} ${h} Z`;
}

export function resample(values: number[], count: number): number[] {
  if (values.length === 0) return new Array(count).fill(0);
  if (values.length === count) return values;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const f = (i / (count - 1)) * (values.length - 1);
    const lo = Math.floor(f);
    const hi = Math.min(values.length - 1, lo + 1);
    const t = f - lo;
    out.push(values[lo] * (1 - t) + values[hi] * t);
  }
  return out;
}
