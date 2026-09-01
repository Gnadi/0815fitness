// Putting two or three sessions side by side needs them on one common axis: they were
// recorded at different times, over different distances, with sample intervals that
// differ per device. Everything here resamples an activity onto a per-second trace
// first, then aggregates that trace by distance so runs of unequal length still line up.
import type { FullActivity, Sport } from '../types';
import { haversineMeters } from './geo';
import { gradeFactor } from './derived';
import { MAX_PLAUSIBLE_SPEED_MPS } from './recorder';
import type { UnitFormat } from './units';

/** Per-second view of an activity: metres covered, elevation, heart rate, cadence and
 *  power on one time base. Gaps stay null rather than being invented. */
export interface Trace {
  /** Cumulative metres at second i since the first GPS fix. Monotonic. */
  distM: number[];
  /** Cumulative flat-equivalent metres, for grade-adjusted pace. */
  gapM: number[];
  ele: (number | null)[];
  hr: (number | null)[];
  cadence: (number | null)[];
  power: (number | null)[];
  totalM: number;
  totalS: number;
  hasElevation: boolean;
}

const EMPTY_TRACE: Trace = { distM: [], gapM: [], ele: [], hr: [], cadence: [], power: [], totalM: 0, totalS: 0, hasElevation: false };

/** Resamples a sparse sensor stream onto the per-second grid, bridging gaps of up to
 *  three minutes and leaving anything longer as the hole it was. */
function resampleStream<T extends { t: number }>(samples: T[], valueOf: (s: T) => number, t0: number, totalS: number): (number | null)[] {
  const out = new Array<number | null>(totalS + 1).fill(null);
  if (samples.length === 0) return out;
  let i = 0;
  for (let s = 0; s <= totalS; s++) {
    const t = t0 + s * 1000;
    while (i < samples.length - 1 && samples[i + 1].t <= t) i++;
    const a = samples[i];
    const b = samples[Math.min(i + 1, samples.length - 1)];
    if (t < a.t - 180000 || t > b.t + 180000) continue;
    const span = b.t - a.t;
    const f = span > 0 ? Math.min(1, Math.max(0, (t - a.t) / span)) : 0;
    out[s] = valueOf(a) + (valueOf(b) - valueOf(a)) * f;
  }
  return out;
}

/** Cumulative flat-equivalent distance along the per-second grid.
 *
 *  Gradients are read over stretches of at least 25 m for the same reason they are in
 *  the stored figure: a metre of altitude noise between two fixes four metres apart is a
 *  gradient the ground never had. */
function gapSeries(distM: number[], ele: (number | null)[]): number[] {
  const out = new Array<number>(distM.length).fill(0);
  let anchorS = 0;
  let anchorEle: number | null = ele[0];
  let carried = 0;
  for (let s = 1; s < distM.length; s++) {
    const spanM = distM[s] - distM[anchorS];
    const currentEle = ele[s];
    if (spanM >= 25 && anchorEle != null && currentEle != null) {
      carried += spanM * gradeFactor((currentEle - anchorEle) / spanM);
      anchorS = s;
      anchorEle = currentEle;
      out[s] = carried;
      continue;
    }
    if (anchorEle == null) anchorEle = currentEle;
    // Inside a stretch the adjustment is not known yet, so the level distance stands in;
    // it is corrected as soon as the stretch closes.
    out[s] = carried + spanM;
  }
  return out;
}

export function buildTrace(activity: FullActivity): Trace {
  const pts = activity.samples.points;
  if (pts.length < 2) return EMPTY_TRACE;

  const t0 = pts[0].t;
  const totalS = Math.max(1, Math.round((pts[pts.length - 1].t - t0) / 1000));
  if (totalS > 12 * 3600) return EMPTY_TRACE; // nothing sane is a twelve-hour sample grid

  // Discard the same implausible jumps the recorder refuses to count, so the distance
  // axis here agrees with the distance the session is filed under.
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dtS = (pts[i].t - pts[i - 1].t) / 1000;
    const dM = haversineMeters(pts[i - 1], pts[i]);
    cum.push(cum[i - 1] + (dtS > 0 && dM / dtS <= MAX_PLAUSIBLE_SPEED_MPS ? dM : 0));
  }

  const distM = new Array<number>(totalS + 1).fill(0);
  const ele = new Array<number | null>(totalS + 1).fill(null);
  let p = 0;
  let hasElevation = false;
  for (let s = 0; s <= totalS; s++) {
    const t = t0 + s * 1000;
    while (p < pts.length - 2 && pts[p + 1].t <= t) p++;
    const a = pts[p];
    const b = pts[Math.min(p + 1, pts.length - 1)];
    const span = b.t - a.t;
    const f = span > 0 ? Math.min(1, Math.max(0, (t - a.t) / span)) : 0;
    distM[s] = cum[p] + (cum[Math.min(p + 1, cum.length - 1)] - cum[p]) * f;
    if (a.ele != null && b.ele != null) ele[s] = a.ele + (b.ele - a.ele) * f;
    else if (a.ele != null) ele[s] = a.ele;
    if (ele[s] != null) hasElevation = true;
  }

  return {
    distM,
    gapM: hasElevation ? gapSeries(distM, ele) : distM,
    ele,
    hr: resampleStream(activity.samples.hr, (h) => h.bpm, t0, totalS),
    cadence: resampleStream(activity.samples.cadence, (c) => c.rpm, t0, totalS),
    power: resampleStream(activity.samples.power, (w) => w.watts, t0, totalS),
    totalM: distM[totalS],
    totalS,
    hasElevation,
  };
}

// ── metrics for one session ───────────────────────────────────────
export interface Metrics {
  distanceKm: number;
  durationS: number;
  movingS: number;
  paceS: number | null; // seconds per km
  gapS: number | null; // grade-adjusted seconds per km
  speedKmh: number;
  ascentM: number;
  avgHr: number | null;
  peakHr: number | null;
  avgCadence: number | null;
  avgPower: number | null;
  normalizedPower: number | null;
  best1kS: number | null;
  decouplingPct: number | null;
  effort: number;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Almost every figure here was already swept out of the samples when the activity was
 *  saved, so this reads the stored derivation rather than walking the streams again. */
export function metricsFor(activity: FullActivity): Metrics {
  const durationS = Math.max(0, (activity.endedAt - activity.startedAt) / 1000);
  const speed = durationS > 0 ? activity.distance / durationS : 0;
  const d = activity.derived;
  const movingS = d.movingS || durationS;

  return {
    distanceKm: activity.distance / 1000,
    durationS,
    movingS,
    paceS: speed > 0.2 ? 1000 / speed : null,
    gapS: d.gapDistanceM && d.gapDistanceM > 0 ? movingS / (d.gapDistanceM / 1000) : null,
    speedKmh: speed * 3.6,
    ascentM: activity.ascent,
    avgHr: d.avgHr,
    peakHr: d.maxHr,
    avgCadence: d.avgCadence,
    avgPower: d.avgPower,
    normalizedPower: d.normalizedPower,
    best1kS: d.pbEfforts?.['1k'] ?? null,
    decouplingPct: d.decoupling,
    effort: activity.effort,
  };
}

// ── the shared distance axis ──────────────────────────────────────
export interface DistanceSeries {
  pace: (number | null)[]; // seconds per km in each bucket
  ele: (number | null)[];
  hr: (number | null)[];
  cadence: (number | null)[];
  power: (number | null)[];
}

/** Fractional seconds at which the trace first reaches `m` metres, interpolated
 *  between the two seconds either side of it. */
function secondAtDistance(trace: Trace, m: number): number | null {
  if (trace.totalS === 0 || m > trace.totalM) return null;
  if (m <= 0) return 0;
  let lo = 0;
  let hi = trace.totalS;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (trace.distM[mid] >= m) hi = mid;
    else lo = mid + 1;
  }
  const span = trace.distM[lo] - trace.distM[lo - 1];
  return span > 0 ? lo - 1 + (m - trace.distM[lo - 1]) / span : lo;
}

/** Aggregate a trace into `count` buckets of `bucketM` metres. Pace comes from the time
 *  it took to cross each bucket rather than an instantaneous speed, so a stop shows up
 *  as the slower kilometre it actually was. The sensor channels are averaged over the
 *  seconds that fell inside the bucket. */
export function seriesByDistance(trace: Trace, bucketM: number, count: number): DistanceSeries {
  const empty = () => new Array<number | null>(count).fill(null);
  if (trace.totalS === 0 || trace.distM.length === 0) {
    return { pace: empty(), ele: empty(), hr: empty(), cadence: empty(), power: empty() };
  }

  const channels: { source: (number | null)[]; sum: number[]; n: number[] }[] = [trace.ele, trace.hr, trace.cadence, trace.power].map(
    (source) => ({ source, sum: new Array<number>(count).fill(0), n: new Array<number>(count).fill(0) }),
  );

  for (let s = 0; s <= trace.totalS; s++) {
    const b = Math.floor(trace.distM[s] / bucketM);
    if (b < 0 || b >= count) continue;
    for (const channel of channels) {
      const v = channel.source[s];
      if (v == null) continue;
      channel.sum[b] += v;
      channel.n[b] += 1;
    }
  }

  const pace = new Array<number | null>(count).fill(null);
  for (let b = 0; b < count; b++) {
    const from = b * bucketM;
    const to = Math.min((b + 1) * bucketM, trace.totalM);
    // A sliver of a bucket at the end of the track is not a split worth drawing.
    if (to - from < bucketM * 0.4) continue;
    const t0 = secondAtDistance(trace, from);
    const t1 = secondAtDistance(trace, to);
    if (t0 == null || t1 == null || t1 <= t0) continue;
    pace[b] = (t1 - t0) / ((to - from) / 1000);
  }

  const averaged = channels.map((c) => c.n.map((n, b) => (n > 0 ? c.sum[b] / n : null)));
  return { pace, ele: averaged[0], hr: averaged[1], cadence: averaged[2], power: averaged[3] };
}

// ── splits ────────────────────────────────────────────────────────
export interface Split {
  index: number; // 1-based
  distanceM: number; // the split's own length; the last one is usually short
  timeS: number;
  paceS: number; // seconds per km, so a short final split stays comparable
  gapS: number | null; // grade-adjusted, where there is altitude to adjust against
  ascentM: number;
  avgHr: number | null;
  avgCadence: number | null;
  avgPower: number | null;
}

export function splitsFor(trace: Trace, splitM = 1000): Split[] {
  if (trace.totalS === 0) return [];
  const out: Split[] = [];
  let startS = 0;
  let index = 1;

  for (let s = 1; s <= trace.totalS; s++) {
    const crossed = trace.distM[s] >= index * splitM;
    const last = s === trace.totalS;
    if (!crossed && !last) continue;

    const distanceM = Math.min(index * splitM, trace.totalM) - (index - 1) * splitM;
    if (distanceM < 20) break; // a metre or two of overshoot is not a split
    const timeS = s - startS;
    let ascentM = 0;
    for (let i = startS + 1; i <= s; i++) {
      const prev = trace.ele[i - 1];
      const cur = trace.ele[i];
      if (prev == null || cur == null) continue;
      const d = cur - prev;
      if (d > 0.3) ascentM += d;
    }
    const collect = (series: (number | null)[]) => {
      const values: number[] = [];
      for (let i = startS; i <= s; i++) {
        const v = series[i];
        if (v != null) values.push(v);
      }
      return mean(values);
    };
    const gapM = trace.hasElevation ? trace.gapM[s] - trace.gapM[startS] : 0;
    out.push({
      index,
      distanceM,
      timeS,
      paceS: distanceM > 0 ? timeS / (distanceM / 1000) : 0,
      gapS: gapM > 0 ? timeS / (gapM / 1000) : null,
      ascentM,
      avgHr: collect(trace.hr),
      avgCadence: collect(trace.cadence),
      avgPower: collect(trace.power),
    });
    startS = s;
    index += 1;
    if (crossed && last) break;
  }

  return out;
}

// ── a compared session, everything the screen needs in one object ──
export interface Comparand {
  activity: FullActivity;
  color: string;
  metrics: Metrics;
  trace: Trace;
  splits: Split[];
}

/** Line colours for compared sessions, in pick order. Three is the ceiling: a fourth
 *  line is one more than this palette — or a 390 px column layout — can carry. */
export const COMPARE_COLORS = ['#E8EAEB', '#8B84F7', '#4FB3A8'];
export const MAX_COMPARE = 3;

export function buildComparands(activities: FullActivity[], splitM = 1000): Comparand[] {
  return activities.map((activity, i) => {
    const trace = buildTrace(activity);
    return {
      activity,
      color: COMPARE_COLORS[i % COMPARE_COLORS.length],
      metrics: metricsFor(activity),
      trace,
      splits: splitsFor(trace, splitM),
    };
  });
}

// ── metric rows ───────────────────────────────────────────────────
export interface MetricSpec {
  key: string;
  label: string;
  sport?: Sport; // omitted = both
  value: (m: Metrics) => number | null;
  fmt: (v: number) => string;
  fmtDelta: (d: number) => string;
  better?: 'lower' | 'higher';
}

const signed = (d: number, body: string) => `${d > 0 ? '+' : '−'}${body}`;

function fmtClockDelta(d: number): string {
  const t = Math.round(Math.abs(d));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return signed(d, m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s} s`);
}

export function metricSpecs(sport: Sport, units: UnitFormat, fmtClock: (s: number) => string): MetricSpec[] {
  const all: MetricSpec[] = [
    {
      key: 'distance',
      label: 'Distance',
      value: (m) => m.distanceKm,
      fmt: (v) => `${units.fmtDistance(v * 1000)} ${units.distanceUnit}`,
      fmtDelta: (d) => signed(d, `${Math.abs(units.distance(d * 1000)).toFixed(2)} ${units.distanceUnit}`),
    },
    {
      key: 'time',
      label: 'Time',
      value: (m) => m.durationS,
      fmt: (v) => fmtClock(v),
      fmtDelta: fmtClockDelta,
    },
    {
      key: 'pace',
      label: 'Avg pace',
      sport: 'run',
      value: (m) => m.paceS,
      fmt: (v) => `${units.fmtPace(v)}${units.paceUnit}`,
      fmtDelta: (d) => fmtClockDelta(units.paceSecPerUnit(d)),
      better: 'lower',
    },
    {
      key: 'gap',
      label: 'Grade-adj. pace',
      sport: 'run',
      value: (m) => m.gapS,
      fmt: (v) => `${units.fmtPace(v)}${units.paceUnit}`,
      fmtDelta: (d) => fmtClockDelta(units.paceSecPerUnit(d)),
      better: 'lower',
    },
    {
      key: 'speed',
      label: 'Avg speed',
      sport: 'ride',
      value: (m) => m.speedKmh,
      fmt: (v) => `${units.fmtSpeed(v / 3.6)} ${units.speedUnit}`,
      fmtDelta: (d) => signed(d, `${Math.abs(Number(units.fmtSpeed(d / 3.6)))}`),
      better: 'higher',
    },
    {
      key: 'best1k',
      label: 'Best 1 km',
      sport: 'run',
      value: (m) => m.best1kS,
      fmt: (v) => fmtClock(v),
      fmtDelta: fmtClockDelta,
      better: 'lower',
    },
    {
      key: 'power',
      label: 'Avg power',
      sport: 'ride',
      value: (m) => m.avgPower,
      fmt: (v) => `${Math.round(v)} W`,
      fmtDelta: (d) => signed(d, `${Math.abs(Math.round(d))} W`),
      better: 'higher',
    },
    {
      key: 'np',
      label: 'Normalised power',
      sport: 'ride',
      value: (m) => m.normalizedPower,
      fmt: (v) => `${Math.round(v)} W`,
      fmtDelta: (d) => signed(d, `${Math.abs(Math.round(d))} W`),
      better: 'higher',
    },
    {
      key: 'ascent',
      label: 'Ascent',
      value: (m) => m.ascentM,
      fmt: (v) => `${units.fmtElevation(v)} ${units.elevationUnit}`,
      fmtDelta: (d) => signed(d, `${Math.abs(Number(units.fmtElevation(d)))} ${units.elevationUnit}`),
    },
    {
      key: 'hr',
      label: 'Avg HR',
      value: (m) => m.avgHr,
      fmt: (v) => `${Math.round(v)} bpm`,
      fmtDelta: (d) => signed(d, `${Math.abs(Math.round(d))}`),
    },
    {
      key: 'cadence',
      label: 'Avg cadence',
      value: (m) => m.avgCadence,
      fmt: (v) => `${Math.round(v)}`,
      fmtDelta: (d) => signed(d, `${Math.abs(Math.round(d))}`),
    },
    {
      key: 'decoupling',
      label: 'Decoupling',
      value: (m) => m.decouplingPct,
      fmt: (v) => `${v.toFixed(1)} %`,
      fmtDelta: (d) => signed(d, `${Math.abs(d).toFixed(1)} pp`),
      better: 'lower',
    },
    {
      key: 'effort',
      label: 'Effort',
      value: (m) => m.effort,
      fmt: (v) => `${v}/10`,
      fmtDelta: (d) => signed(d, `${Math.abs(d)}`),
    },
  ];
  return all.filter((s) => s.sport == null || s.sport === sport);
}

/** Index of the best value in a row, or -1 where the metric has no direction, fewer
 *  than two sessions have a value to compare, or two of them tie for it. */
export function bestIndex(values: (number | null)[], better?: 'lower' | 'higher'): number {
  if (!better || values.filter((v) => v != null).length < 2) return -1;
  let best = -1;
  let ties = 0;
  values.forEach((v, i) => {
    if (v == null) return;
    if (best === -1) {
      best = i;
      ties = 1;
      return;
    }
    const cur = values[best] as number;
    if (v === cur) ties += 1;
    else if (better === 'lower' ? v < cur : v > cur) {
      best = i;
      ties = 1;
    }
  });
  return ties > 1 ? -1 : best;
}
