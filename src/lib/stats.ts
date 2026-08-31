import type { Activity, Sport } from '../types';
import { haversineMeters, resample } from './geo';
import { MAX_PLAUSIBLE_SPEED_MPS } from './recorder';
import { HR_ZONE_BOUNDS } from '../theme';

const DAY_MS = 86400000;

export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfWeek(t: number): number {
  const d = new Date(startOfDay(t));
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return d.getTime();
}

export function dateKey(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

export function fmtEuroDate(t: number): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function fmtDayMonth(t: number): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}`;
}

export function fmtClock(totalSeconds: number): string {
  const t = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}

/** Weekly training time reads as H:MM, never M:SS. */
export function hoursMinutes(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function fmtPace(secPerKm: number): string {
  if (!isFinite(secPerKm) || secPerKm <= 0) return '—:—';
  const total = Math.round(secPerKm);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// ── weekly rollups ────────────────────────────────────────────────
export interface WeekRollup {
  weekStart: number;
  runKm: number;
  rideKm: number;
  timeS: number;
  ascentM: number;
  sessions: number;
  activeDays: Set<string>;
}

export function rollupWeeks(activities: Activity[], weekStarts: number[]): WeekRollup[] {
  return weekStarts.map((weekStart) => {
    const weekEnd = weekStart + 7 * DAY_MS;
    const inWeek = activities.filter((a) => a.startedAt >= weekStart && a.startedAt < weekEnd);
    const runKm = inWeek.filter((a) => a.sport === 'run').reduce((s, a) => s + a.distance / 1000, 0);
    const rideKm = inWeek.filter((a) => a.sport === 'ride').reduce((s, a) => s + a.distance / 1000, 0);
    const timeS = inWeek.reduce((s, a) => s + (a.endedAt - a.startedAt) / 1000, 0);
    const ascentM = inWeek.reduce((s, a) => s + a.ascent, 0);
    const activeDays = new Set(inWeek.map((a) => dateKey(a.startedAt)));
    return { weekStart, runKm, rideKm, timeS, ascentM, sessions: inWeek.length, activeDays };
  });
}

export function lastNWeekStarts(n: number, reference = Date.now()): number[] {
  const thisWeek = startOfWeek(reference);
  const out: number[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(thisWeek - i * 7 * DAY_MS);
  return out;
}

export function isoWeekLabel(weekStart: number): string {
  const d = new Date(weekStart);
  const target = new Date(d.valueOf());
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const week = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / DAY_MS - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return `W${week}`;
}

// ── streak ────────────────────────────────────────────────────────
export interface StreakInfo {
  current: number;
  longest: number;
  restDaysLast21: number;
  last14: { dayKey: string; letter: string; trained: boolean; isToday: boolean }[];
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function computeStreak(activities: Activity[], reference = Date.now()): StreakInfo {
  const trainedDays = new Set(activities.map((a) => dateKey(a.startedAt)));
  const today = startOfDay(reference);

  // A streak isn't broken until the day is over, so an untrained today doesn't end it.
  let current = 0;
  for (let i = trainedDays.has(dateKey(today)) ? 0 : 1; ; i++) {
    const day = today - i * DAY_MS;
    if (trainedDays.has(dateKey(day))) current++;
    else break;
  }

  let longest = 0;
  let run = 0;
  const sortedDays = [...trainedDays].sort();
  let prev: number | null = null;
  for (const key of sortedDays) {
    const t = new Date(key).getTime();
    if (prev != null && t - prev === DAY_MS) run++;
    else run = 1;
    longest = Math.max(longest, run);
    prev = t;
  }
  longest = Math.max(longest, current);

  let restDaysLast21 = 0;
  for (let i = 0; i < 21; i++) {
    const day = today - i * DAY_MS;
    if (!trainedDays.has(dateKey(day))) restDaysLast21++;
  }

  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const day = today - i * DAY_MS;
    const d = new Date(day);
    last14.push({
      dayKey: dateKey(day),
      letter: DAY_LETTERS[(d.getDay() + 6) % 7],
      trained: trainedDays.has(dateKey(day)),
      isToday: i === 0,
    });
  }

  return { current, longest, restDaysLast21, last14 };
}

// ── load: acute (this week) vs chronic (trailing 4-week avg) ───────
export function chronicSeries(weeklyKm: number[]): number[] {
  return weeklyKm.map((_, i) => {
    const w = weeklyKm.slice(Math.max(0, i - 3), i + 1);
    return w.reduce((a, b) => a + b, 0) / w.length;
  });
}

export function rampPct(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// ── HR zones ─────────────────────────────────────────────────────
export function zoneSecondsForActivity(activity: Activity, maxHr: number): number[] {
  const zones = [0, 0, 0, 0, 0];
  const samples = activity.hr;
  if (samples.length < 2) return zones;
  for (let i = 1; i < samples.length; i++) {
    const dt = (samples[i].t - samples[i - 1].t) / 1000;
    if (dt <= 0 || dt > 120) continue;
    const pct = samples[i - 1].bpm / maxHr;
    let zone = 0;
    for (let z = HR_ZONE_BOUNDS.length - 2; z >= 0; z--) {
      if (pct >= HR_ZONE_BOUNDS[z]) {
        zone = z;
        break;
      }
    }
    zones[zone] += dt;
  }
  return zones;
}

export function aggregateZoneSeconds(activities: Activity[], maxHr: number): number[] {
  const totals = [0, 0, 0, 0, 0];
  for (const a of activities) {
    const z = zoneSecondsForActivity(a, maxHr);
    for (let i = 0; i < 5; i++) totals[i] += z[i];
  }
  return totals;
}

// ── best-effort pace/time over a target distance ────────────────────
function cumulativeDistanceSeries(activity: Activity): { t: number; d: number }[] {
  const pts = activity.points;
  if (pts.length === 0) return [];
  const out: { t: number; d: number }[] = [{ t: pts[0].t, d: 0 }];
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    // A GPS jump the recorder refused to count must not hand out a personal best either.
    const dtS = (pts[i].t - pts[i - 1].t) / 1000;
    const dM = haversineMeters(pts[i - 1], pts[i]);
    if (dtS > 0 && dM / dtS <= MAX_PLAUSIBLE_SPEED_MPS) d += dM;
    out.push({ t: pts[i].t, d });
  }
  return out;
}

function toSecondGridCumulative(series: { t: number; d: number }[]): number[] {
  if (series.length < 2) return [];
  const t0 = series[0].t;
  const totalS = Math.round((series[series.length - 1].t - t0) / 1000);
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

/** Fastest whole-second time to cover `targetM` anywhere in the activity, via the
 *  classic "smallest window whose sum ≥ target" two-pointer sweep over a monotonic
 *  cumulative-distance series. */
export function bestEffortSeconds(activity: Activity, targetM: number): number | null {
  const grid = toSecondGridCumulative(cumulativeDistanceSeries(activity));
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

export const PB_DISTANCES: { key: string; label: string; metres: number }[] = [
  { key: '1k', label: '1 km', metres: 1000 },
  { key: '5k', label: '5 km', metres: 5000 },
  { key: '10k', label: '10 km', metres: 10000 },
  { key: 'hm', label: 'HM', metres: 21097.5 },
];

export interface PbResult {
  key: string;
  label: string;
  bestS: number;
  bestActivityId: string;
  date: number;
  previousBestS: number | null;
  history: { date: number; s: number }[]; // chronological best-so-far, for the sparkline
}

export function computePersonalBests(activities: Activity[], sport: Sport): PbResult[] {
  const sorted = [...activities].filter((a) => a.sport === sport).sort((a, b) => a.startedAt - b.startedAt);
  return PB_DISTANCES.map((d) => {
    let best: { s: number; id: string; date: number } | null = null;
    let previousBest: number | null = null;
    const history: { date: number; s: number }[] = [];
    for (const a of sorted) {
      const s = bestEffortSeconds(a, d.metres);
      if (s == null) continue;
      if (!best || s < best.s) {
        previousBest = best?.s ?? null;
        best = { s, id: a.id, date: a.startedAt };
      }
      history.push({ date: a.startedAt, s: best.s });
    }
    return {
      key: d.key,
      label: d.label,
      bestS: best?.s ?? NaN,
      bestActivityId: best?.id ?? '',
      date: best?.date ?? 0,
      previousBestS: previousBest,
      history,
    };
  }).filter((r) => !Number.isNaN(r.bestS));
}

export function sparkPathFromHistory(history: { s: number }[], w: number, h: number, padding = 3): string {
  if (history.length === 0) return `M0 ${h - padding} L${w} ${h - padding}`;
  const values = resample(
    history.map((h2) => h2.s),
    Math.min(8, Math.max(2, history.length)),
  );
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const n = values.length;
  return values
    .map((v, i) => {
      const x = padding + (i / (n - 1)) * (w - padding * 2);
      // faster (lower seconds) reads higher on the sparkline
      const y = padding + ((v - min) / span) * (h - padding * 2);
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

// ── power curve (mean maximal power) ────────────────────────────────
export const POWER_DURATIONS = [
  { key: '5s', seconds: 5 },
  { key: '1m', seconds: 60 },
  { key: '5m', seconds: 300 },
  { key: '20m', seconds: 1200 },
  { key: '60m', seconds: 3600 },
];

function powerToSecondGrid(activity: Activity): number[] {
  const samples = activity.power;
  if (samples.length < 2) return [];
  const t0 = samples[0].t;
  const totalS = Math.round((samples[samples.length - 1].t - t0) / 1000);
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

function maxAvgPowerForWindow(grid: number[], windowS: number): number | null {
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

export function powerCurve(activities: Activity[]): { key: string; watts: number }[] {
  const rides = activities.filter((a) => a.sport === 'ride' && a.power.length > 1);
  return POWER_DURATIONS.map((d) => {
    let best = 0;
    for (const a of rides) {
      const grid = powerToSecondGrid(a);
      const v = maxAvgPowerForWindow(grid, d.seconds);
      if (v != null && v > best) best = v;
    }
    return { key: d.key, watts: Math.round(best) };
  });
}

// ── aerobic decoupling ──────────────────────────────────────────────
/** Heart-rate drift across the halves of a session: efficiency factor (speed per beat)
 *  in the first half against the second. Under ~5 % reads as aerobically durable.
 *  Needs both HR samples and GPS, so it returns null when either is missing. */
export function aerobicDecoupling(activity: Activity): number | null {
  if (activity.hr.length < 10 || activity.points.length < 10) return null;
  const start = activity.startedAt;
  const end = activity.endedAt;
  const mid = start + (end - start) / 2;
  if (end - start < 15 * 60 * 1000) return null; // too short to mean anything

  const halfStats = (from: number, to: number) => {
    const pts = activity.points.filter((p) => p.t >= from && p.t <= to);
    const hrs = activity.hr.filter((h) => h.t >= from && h.t <= to);
    if (pts.length < 3 || hrs.length < 3) return null;
    let dist = 0;
    for (let i = 1; i < pts.length; i++) dist += haversineMeters(pts[i - 1], pts[i]);
    const durS = (pts[pts.length - 1].t - pts[0].t) / 1000;
    if (durS <= 0) return null;
    const speed = dist / durS;
    const hr = hrs.reduce((s, h) => s + h.bpm, 0) / hrs.length;
    if (hr <= 0 || speed <= 0) return null;
    return speed / hr;
  };

  const first = halfStats(start, mid);
  const second = halfStats(mid, end);
  if (first == null || second == null) return null;
  return ((first - second) / first) * 100;
}

export function weeklyDecoupling(activities: Activity[], weekStart: number): number | null {
  const weekEnd = weekStart + 7 * DAY_MS;
  const values = activities
    .filter((a) => a.startedAt >= weekStart && a.startedAt < weekEnd)
    .map(aerobicDecoupling)
    .filter((v): v is number => v != null);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** The load unit used across Overview and Analyse: run kilometres plus ride
 *  kilometres ÷ 3, so one series can carry both sports. */
export function loadKm(rollup: WeekRollup): number {
  return rollup.runKm + rollup.rideKm / 3;
}

export function loadKmBetween(activities: Activity[], from: number, to: number): number {
  return activities
    .filter((a) => a.startedAt >= from && a.startedAt < to)
    .reduce((s, a) => s + (a.sport === 'run' ? a.distance / 1000 : a.distance / 3000), 0);
}

export interface LoadBalance {
  acute: number; // last 7 days
  chronic: number; // last 28 days, as a weekly average
  previousAcute: number; // the 7 days before that
  ratio: number;
  ramp: number; // % change week on week
}

/** Rolling 7-day against rolling 28-day, which is what "Load · 7 day vs 28 day"
 *  actually means — a calendar week would read as detraining every Monday. */
export function loadBalance(activities: Activity[], reference = Date.now()): LoadBalance {
  const acute = loadKmBetween(activities, reference - 7 * DAY_MS, reference + 1);
  const previousAcute = loadKmBetween(activities, reference - 14 * DAY_MS, reference - 7 * DAY_MS);
  const chronic = loadKmBetween(activities, reference - 28 * DAY_MS, reference + 1) / 4;
  return {
    acute,
    chronic,
    previousAcute,
    ratio: chronic > 0 ? acute / chronic : 0,
    ramp: rampPct(acute, previousAcute),
  };
}

// ── route silhouette source data ────────────────────────────────────
export function elevationProfile(activity: Activity): number[] {
  const raw = activity.points.map((p) => p.ele ?? 0);
  if (raw.every((e) => e === 0)) return [0, 0];
  return raw;
}

// ── streak history ──────────────────────────────────────────────────
export interface StreakSegment {
  startDay: number;
  endDay: number;
  days: number;
  /** Still running as of the reference day, so it can be marked rather than sorted apart. */
  current: boolean;
}

/** Every run of consecutive trained days, most recent first. */
export function streakSegments(activities: Activity[], reference = Date.now()): StreakSegment[] {
  const days = [...new Set(activities.map((a) => startOfDay(a.startedAt)))].sort((a, b) => a - b);
  if (days.length === 0) return [];
  const today = startOfDay(reference);
  const segments: StreakSegment[] = [];
  let start = days[0];
  let prev = days[0];
  for (let i = 1; i <= days.length; i++) {
    const day = days[i];
    if (day != null && day - prev === DAY_MS) {
      prev = day;
      continue;
    }
    segments.push({
      startDay: start,
      endDay: prev,
      days: Math.round((prev - start) / DAY_MS) + 1,
      current: prev === today || prev === today - DAY_MS,
    });
    if (day == null) break;
    start = day;
    prev = day;
  }
  return segments.reverse();
}

export interface TrainedDay {
  day: number;
  trained: boolean;
  sessions: number;
  loadKm: number;
  isToday: boolean;
}

/** The last `days` calendar days, oldest first — the source for the day grids. */
export function trainedDayGrid(activities: Activity[], days: number, reference = Date.now()): TrainedDay[] {
  const today = startOfDay(reference);
  const byDay = new Map<number, { sessions: number; loadKm: number }>();
  for (const a of activities) {
    const key = startOfDay(a.startedAt);
    const entry = byDay.get(key) ?? { sessions: 0, loadKm: 0 };
    entry.sessions += 1;
    entry.loadKm += a.sport === 'run' ? a.distance / 1000 : a.distance / 3000;
    byDay.set(key, entry);
  }
  const out: TrainedDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = today - i * DAY_MS;
    const entry = byDay.get(day);
    out.push({ day, trained: entry != null, sessions: entry?.sessions ?? 0, loadKm: entry?.loadKm ?? 0, isToday: i === 0 });
  }
  return out;
}
