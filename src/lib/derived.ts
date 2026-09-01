import type { ActivityDerived, ActivitySamples, GeoSample, HrHistogram, RouteSignature, Sport, TrackQuality } from '../types';
import { haversineMeters } from './geo';
import { MAX_PLAUSIBLE_SPEED_MPS } from './recorder';

/** Bumped whenever anything below changes what it computes, so that activities carrying
 *  an older blob are re-derived from their samples on the next launch rather than
 *  quietly reporting a figure this build no longer stands behind. */
export const DERIVED_VERSION = 3;

export const PB_DISTANCES: { key: string; label: string; metres: number }[] = [
  { key: '1k', label: '1 km', metres: 1000 },
  { key: '5k', label: '5 km', metres: 5000 },
  { key: '10k', label: '10 km', metres: 10000 },
  { key: 'hm', label: 'HM', metres: 21097.5 },
];

export const POWER_DURATIONS = [
  { key: '5s', seconds: 5 },
  { key: '1m', seconds: 60 },
  { key: '5m', seconds: 300 },
  { key: '20m', seconds: 1200 },
  { key: '60m', seconds: 3600 },
];

/** A sample gap longer than this is a stop, a lost fix or a dropped sensor — time that
 *  passed but was not spent training, so nothing is attributed to it. */
const MAX_GAP_S = 120;

/** Under this, the recorder was standing still: waiting at a light, or a stationary
 *  drift of the fix. */
const MOVING_FLOOR_MPS = 0.4;

export const ROUTE_POINTS = 32;

/** Longer than this between two fixes and the stretch between them was not recorded —
 *  it was inferred. At the once-a-second the recorder asks for, twenty seconds is twenty
 *  missed fixes, which is past any ordinary hiccup. */
export const TRACK_GAP_S = 20;

// ── histograms ────────────────────────────────────────────────────
/** Seconds at each integer value of a sampled signal.
 *
 *  Each sample's value carries the time until the *next* sample, which is what a device
 *  reporting "the heart rate is now 148" actually means. */
function histogram<T>(samples: T[], valueOf: (s: T) => number, timeOf: (s: T) => number): HrHistogram | null {
  if (samples.length < 2) return null;
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of samples) {
    const v = Math.round(valueOf(s));
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!isFinite(lo) || !isFinite(hi)) return null;
  const seconds = new Array(hi - lo + 1).fill(0);
  for (let i = 1; i < samples.length; i++) {
    const dt = (timeOf(samples[i]) - timeOf(samples[i - 1])) / 1000;
    if (dt <= 0 || dt > MAX_GAP_S) continue;
    seconds[Math.round(valueOf(samples[i - 1])) - lo] += dt;
  }
  return seconds.some((s) => s > 0) ? { lo, seconds } : null;
}

export function histogramTotalSeconds(h: HrHistogram | null): number {
  if (!h) return 0;
  let total = 0;
  for (const s of h.seconds) total += s;
  return total;
}

/** The time-weighted mean of a histogram — the average the samples would have given,
 *  but weighted by how long each reading actually stood. */
export function histogramMean(h: HrHistogram | null): number | null {
  if (!h) return null;
  let weighted = 0;
  let total = 0;
  for (let i = 0; i < h.seconds.length; i++) {
    weighted += (h.lo + i) * h.seconds[i];
    total += h.seconds[i];
  }
  return total > 0 ? weighted / total : null;
}

// ── per-second grids ──────────────────────────────────────────────
/** Cumulative distance at each fix, refusing the same GPS jumps the recorder refused —
 *  a leap the live distance did not count must not hand out a personal best either. */
function cumulativeDistanceSeries(points: GeoSample[]): { t: number; d: number }[] {
  if (points.length === 0) return [];
  const out: { t: number; d: number }[] = [{ t: points[0].t, d: 0 }];
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    const dtS = (points[i].t - points[i - 1].t) / 1000;
    const dM = haversineMeters(points[i - 1], points[i]);
    if (dtS > 0 && dM / dtS <= MAX_PLAUSIBLE_SPEED_MPS) d += dM;
    out.push({ t: points[i].t, d });
  }
  return out;
}

export function toSecondGridCumulative(series: { t: number; d: number }[]): number[] {
  if (series.length < 2) return [];
  const t0 = series[0].t;
  const totalS = Math.round((series[series.length - 1].t - t0) / 1000);
  if (totalS <= 0 || totalS > 24 * 3600) return [];
  const out = new Array(totalS + 1).fill(0);
  let idx = 0;
  for (let s = 0; s <= totalS; s++) {
    const targetT = t0 + s * 1000;
    while (idx < series.length - 2 && series[idx + 1].t < targetT) idx++;
    const a = series[idx];
    const b = series[Math.min(idx + 1, series.length - 1)];
    const span = b.t - a.t;
    const f = span > 0 ? Math.min(1, Math.max(0, (targetT - a.t) / span)) : 0;
    out[s] = a.d + (b.d - a.d) * f;
  }
  return out;
}

/** Fastest whole-second time to cover `targetM` over a per-second cumulative-distance
 *  grid, via the classic "smallest window whose sum ≥ target" two-pointer sweep. */
export function bestEffortOnGrid(grid: number[], targetM: number): number | null {
  if (grid.length === 0 || grid[grid.length - 1] < targetM) return null;
  let i = 0;
  let best = Infinity;
  for (let j = 0; j < grid.length; j++) {
    while (i <= j && grid[j] - grid[i] >= targetM) {
      best = Math.min(best, j - i);
      i++;
    }
  }
  return isFinite(best) ? best : null;
}

/** The time each whole kilometre of the session took, in order.
 *
 *  Stored with the summary rather than recomputed, because it is what one repeat of a
 *  route is read against another with: comparing the fourth kilometre of this Tuesday's
 *  loop with the fourth kilometre of every previous one is a comparison of the same
 *  ground, and doing it from the sample streams would mean loading a season of them to
 *  draw one screen. Ten numbers for a ten-kilometre run.
 *
 *  Kilometres, not display units, for the same reason nothing else in here is settings-
 *  dependent: a log read in miles must not be a different log. */
export function kilometreSplits(grid: number[], splitM = 1000): number[] {
  if (grid.length === 0) return [];
  const out: number[] = [];
  let previousS = 0;
  let target = splitM;
  for (let s = 1; s < grid.length; s++) {
    while (grid[s] >= target) {
      // Interpolate inside the second the kilometre was crossed in, so a fast runner's
      // splits do not each carry up to a second of rounding.
      const step = grid[s] - grid[s - 1];
      const at = step > 0 ? s - 1 + (target - grid[s - 1]) / step : s;
      out.push(Number((at - previousS).toFixed(1)));
      previousS = at;
      target += splitM;
    }
  }
  return out;
}

function powerToSecondGrid(samples: { t: number; watts: number }[]): number[] {
  if (samples.length < 2) return [];
  const t0 = samples[0].t;
  const totalS = Math.round((samples[samples.length - 1].t - t0) / 1000);
  if (totalS <= 0 || totalS > 24 * 3600) return [];
  const out = new Array(totalS + 1).fill(0);
  let idx = 0;
  let cur = samples[0].watts;
  for (let s = 0; s <= totalS; s++) {
    const targetT = t0 + s * 1000;
    while (idx < samples.length && samples[idx].t <= targetT) {
      cur = samples[idx].watts;
      idx++;
    }
    out[s] = cur;
  }
  return out;
}

export function maxAvgPowerForWindow(grid: number[], windowS: number): number | null {
  if (grid.length < windowS) return null;
  let sum = 0;
  for (let i = 0; i < windowS; i++) sum += grid[i];
  let max = sum;
  for (let i = windowS; i < grid.length; i++) {
    sum += grid[i] - grid[i - windowS];
    if (sum > max) max = sum;
  }
  return max / windowS;
}

/** Normalised power: the fourth root of the mean fourth power of a 30-second rolling
 *  average. The fourth power is what makes it read surges the way the body does — a
 *  ride alternating 100 W and 300 W costs far more than the 200 W its mean reports. */
export function normalizedPower(grid: number[]): number | null {
  const window = 30;
  if (grid.length < window) return null;
  let sum = 0;
  for (let i = 0; i < window; i++) sum += grid[i];
  let quartic = Math.pow(sum / window, 4);
  let count = 1;
  for (let i = window; i < grid.length; i++) {
    sum += grid[i] - grid[i - window];
    quartic += Math.pow(sum / window, 4);
    count++;
  }
  return Math.pow(quartic / count, 0.25);
}

// ── grade-adjusted distance ───────────────────────────────────────
/** The metabolic cost of running a gradient, relative to the level, from Minetti's
 *  measured cost-of-transport curve. A 10 % climb costs roughly twice the level; a
 *  gentle descent costs slightly less; a steep one costs more again, because braking is
 *  work too. Clamped to the range the curve was fitted over. */
export function gradeFactor(gradient: number): number {
  const i = Math.max(-0.3, Math.min(0.3, gradient));
  const cost = 155.4 * i ** 5 - 30.4 * i ** 4 - 43.3 * i ** 3 + 46.3 * i ** 2 + 19.5 * i + 3.6;
  return Math.max(0.4, cost / 3.6);
}

/** Flat-equivalent distance: what this run would have measured on the level for the
 *  same cost. Gradients are taken over stretches of at least `MIN_GRADE_SPAN_M`, because
 *  a GPS altitude that wobbles a metre between two fixes four metres apart is a 25 %
 *  gradient the ground never had. */
const MIN_GRADE_SPAN_M = 25;

export function gradeAdjustedDistance(points: GeoSample[]): number | null {
  if (points.length < 3) return null;
  if (!points.some((p) => p.ele != null && p.ele !== 0)) return null;

  let adjusted = 0;
  let spanM = 0;
  let spanRise = 0;
  let anchorEle = points[0].ele ?? 0;

  for (let i = 1; i < points.length; i++) {
    const dtS = (points[i].t - points[i - 1].t) / 1000;
    const dM = haversineMeters(points[i - 1], points[i]);
    if (dtS <= 0 || dM / dtS > MAX_PLAUSIBLE_SPEED_MPS) continue;
    spanM += dM;
    const ele = points[i].ele ?? anchorEle;
    spanRise = ele - anchorEle;
    if (spanM >= MIN_GRADE_SPAN_M) {
      adjusted += spanM * gradeFactor(spanRise / spanM);
      anchorEle = ele;
      spanM = 0;
      spanRise = 0;
    }
  }
  // The tail is shorter than a gradient can be read over, so it is counted as level.
  adjusted += spanM;
  return adjusted > 0 ? adjusted : null;
}

// ── route signature ───────────────────────────────────────────────
const M_PER_DEG_LAT = 111320;

/** The track as `ROUTE_POINTS` evenly spaced offsets from its start, in metres east and
 *  north. Even *spacing along the path* rather than even spacing in time is what makes
 *  the signature comparable: the same loop run easy and run hard has the same shape, and
 *  a two-minute wait at a crossing does not put a dozen points on one spot. */
export function routeSignature(points: GeoSample[]): RouteSignature | null {
  const clean = points.filter((p, i) => i === 0 || haversineMeters(points[i - 1], p) < MAX_PLAUSIBLE_SPEED_MPS * 60);
  if (clean.length < 4) return null;

  const cum: number[] = [0];
  for (let i = 1; i < clean.length; i++) cum.push(cum[i - 1] + haversineMeters(clean[i - 1], clean[i]));
  const totalM = cum[cum.length - 1];
  if (totalM < 200) return null;

  const lat0 = clean[0].lat;
  const lon0 = clean[0].lon;
  const mPerDegLon = M_PER_DEG_LAT * Math.cos((lat0 * Math.PI) / 180);

  const shape: number[] = [];
  let idx = 0;
  for (let k = 0; k < ROUTE_POINTS; k++) {
    const target = (k / (ROUTE_POINTS - 1)) * totalM;
    while (idx < cum.length - 2 && cum[idx + 1] < target) idx++;
    const span = cum[idx + 1] - cum[idx];
    const f = span > 0 ? (target - cum[idx]) / span : 0;
    const lat = clean[idx].lat + (clean[idx + 1].lat - clean[idx].lat) * f;
    const lon = clean[idx].lon + (clean[idx + 1].lon - clean[idx].lon) * f;
    shape.push((lon - lon0) * mPerDegLon, (lat - lat0) * M_PER_DEG_LAT);
  }
  return { lat: lat0, lon: lon0, totalM, shape };
}

// ── elevation profile ─────────────────────────────────────────────
/** Altitude along the track, thinned to at most `maxPoints` samples.
 *
 *  Nothing draws a profile wider than a few hundred pixels — a list row's silhouette is
 *  56 of them, the save screen's 330 — so keeping every fix of a two-hour ride would
 *  only build an SVG path with thousands of segments the screen cannot resolve.
 *
 *  A device with no altimeter reports nothing rather than zero: a flat line at zero is
 *  an absent profile, not a profile of flat ground, and the callers show it as such. */
export function thinElevation(points: GeoSample[], maxPoints = 256): number[] {
  if (points.length === 0) return [0, 0];
  const stride = Math.max(1, Math.ceil(points.length / maxPoints));
  const out: number[] = [];
  let flat = true;
  for (let i = 0; i < points.length; i += stride) {
    const ele = points[i].ele ?? 0;
    if (ele !== 0) flat = false;
    out.push(ele);
  }
  const last = points[points.length - 1].ele ?? 0;
  if ((points.length - 1) % stride !== 0) {
    if (last !== 0) flat = false;
    out.push(last);
  }
  return flat ? [0, 0] : out;
}

// ── decoupling ────────────────────────────────────────────────────
/** Heart-rate drift across the halves of a session: efficiency factor (speed per beat)
 *  in the first half against the second. Under ~5 % reads as aerobically durable.
 *  Needs both HR samples and GPS, so it returns null when either is missing. */
export function computeDecoupling(samples: ActivitySamples, startedAt: number, endedAt: number): number | null {
  const { hr, points } = samples;
  if (hr.length < 10 || points.length < 10) return null;
  const mid = startedAt + (endedAt - startedAt) / 2;
  if (endedAt - startedAt < 15 * 60 * 1000) return null; // too short to mean anything

  const halfStats = (from: number, to: number) => {
    let firstT = 0;
    let lastT = 0;
    let count = 0;
    let dist = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.t < from || p.t > to) continue;
      if (count === 0) firstT = p.t;
      else dist += haversineMeters(points[i - 1], p);
      lastT = p.t;
      count++;
    }
    if (count < 3) return null;

    let hrSum = 0;
    let hrCount = 0;
    for (const h of hr) {
      if (h.t < from || h.t > to) continue;
      hrSum += h.bpm;
      hrCount++;
    }
    if (hrCount < 3) return null;

    const durS = (lastT - firstT) / 1000;
    if (durS <= 0) return null;
    const speed = dist / durS;
    const meanHr = hrSum / hrCount;
    if (meanHr <= 0 || speed <= 0) return null;
    return speed / meanHr;
  };

  const first = halfStats(startedAt, mid);
  const second = halfStats(mid, endedAt);
  if (first == null || second == null) return null;
  return ((first - second) / first) * 100;
}

// ── how well the fixes covered the session ────────────────────────
export function trackQuality(points: GeoSample[], startedAt: number, endedAt: number): TrackQuality {
  const elapsedS = Math.max(0, (endedAt - startedAt) / 1000);
  if (points.length < 2) {
    return { fixes: points.length, longestGapS: elapsedS, gaps: points.length ? 1 : 0, coverage: 0, medianIntervalS: 0 };
  }

  const intervals: number[] = [];
  let longestGapS = 0;
  let gaps = 0;
  let covered = 0;
  for (let i = 1; i < points.length; i++) {
    const dt = (points[i].t - points[i - 1].t) / 1000;
    if (dt <= 0) continue;
    intervals.push(dt);
    if (dt > TRACK_GAP_S) {
      gaps++;
      if (dt > longestGapS) longestGapS = dt;
    } else {
      covered += dt;
    }
  }
  // The stretches before the first fix and after the last are uncovered too.
  const leading = (points[0].t - startedAt) / 1000;
  const trailing = (endedAt - points[points.length - 1].t) / 1000;
  if (leading > TRACK_GAP_S && leading > longestGapS) longestGapS = leading;
  if (trailing > TRACK_GAP_S && trailing > longestGapS) longestGapS = trailing;

  const sorted = [...intervals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianIntervalS = sorted.length === 0 ? 0 : sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  return {
    fixes: points.length,
    longestGapS,
    gaps,
    coverage: elapsedS > 0 ? Math.min(1, covered / elapsedS) : 0,
    medianIntervalS,
  };
}

// ── moving time ───────────────────────────────────────────────────
/** Time actually spent moving: the elapsed span minus the stops. The recorder's
 *  auto-pause already keeps most of them out of the live clock, but an imported file
 *  carries none of that, and a manual pause is a decision rather than a measurement. */
export function movingSeconds(points: GeoSample[]): number {
  let moving = 0;
  for (let i = 1; i < points.length; i++) {
    const dtS = (points[i].t - points[i - 1].t) / 1000;
    if (dtS <= 0 || dtS > MAX_GAP_S) continue;
    const speed = haversineMeters(points[i - 1], points[i]) / dtS;
    if (speed >= MOVING_FLOOR_MPS && speed <= MAX_PLAUSIBLE_SPEED_MPS) moving += dtS;
  }
  return moving;
}

// ── the whole blob ────────────────────────────────────────────────
export interface DeriveInput {
  sport: Sport;
  startedAt: number;
  endedAt: number;
  samples: ActivitySamples;
}

export function deriveActivity({ sport, startedAt, endedAt, samples }: DeriveInput): ActivityDerived {
  const { points, hr, power, cadence } = samples;

  const distanceGrid = toSecondGridCumulative(cumulativeDistanceSeries(points));
  const pbEfforts: Record<string, number> = {};
  if (sport === 'run') {
    for (const d of PB_DISTANCES) {
      const s = bestEffortOnGrid(distanceGrid, d.metres);
      if (s != null) pbEfforts[d.key] = s;
    }
  }

  const powerGrid = sport === 'ride' ? powerToSecondGrid(power) : [];
  const powerBests: Record<string, number> = {};
  for (const d of POWER_DURATIONS) {
    const v = maxAvgPowerForWindow(powerGrid, d.seconds);
    if (v != null) powerBests[d.key] = Math.round(v);
  }

  const hrHist = histogram(hr, (s) => s.bpm, (s) => s.t);
  const cadenceHist = histogram(cadence, (s) => s.rpm, (s) => s.t);

  return {
    version: DERIVED_VERSION,
    movingS: movingSeconds(points) || Math.max(0, (endedAt - startedAt) / 1000),
    hrHist,
    avgHr: histogramMean(hrHist),
    maxHr: hr.length ? Math.max(...hr.map((h) => h.bpm)) : null,
    avgPower: power.length > 1 ? power.reduce((s, p) => s + p.watts, 0) / power.length : null,
    normalizedPower: powerGrid.length ? normalizedPower(powerGrid) : null,
    avgCadence: histogramMean(cadenceHist),
    cadenceHist,
    pbEfforts,
    kmSplitS: kilometreSplits(distanceGrid),
    powerBests,
    decoupling: computeDecoupling(samples, startedAt, endedAt),
    elevation: thinElevation(points),
    gapDistanceM: sport === 'run' ? gradeAdjustedDistance(points) : null,
    route: routeSignature(points),
    track: trackQuality(points, startedAt, endedAt),
  };
}

/** The blob for an activity that has no samples to walk — a manual entry. Whatever the
 *  person typed in is all there is, and every derived figure says so rather than
 *  reporting a zero that would drag an average down. */
export function manualDerived(opts: {
  movingS: number;
  avgHr?: number | null;
  ascentM?: number;
}): ActivityDerived {
  return {
    version: DERIVED_VERSION,
    movingS: opts.movingS,
    // A single stated average is stored as a one-bucket histogram covering the session,
    // so it lands in the right zone rather than being excluded from the distribution.
    hrHist: opts.avgHr ? { lo: Math.round(opts.avgHr), seconds: [opts.movingS] } : null,
    avgHr: opts.avgHr ?? null,
    maxHr: null,
    avgPower: null,
    normalizedPower: null,
    avgCadence: null,
    cadenceHist: null,
    pbEfforts: {},
    kmSplitS: [],
    powerBests: {},
    decoupling: null,
    elevation: [0, 0],
    gapDistanceM: null,
    route: null,
    track: { fixes: 0, longestGapS: 0, gaps: 0, coverage: 0, medianIntervalS: 0 },
  };
}

export function emptySamples(id: string): ActivitySamples {
  return { id, points: [], hr: [], power: [], cadence: [] };
}
