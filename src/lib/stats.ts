import type { Activity, HrHistogram, Settings, Sport } from '../types';
import { resample } from './geo';
import { histogramMean, PB_DISTANCES, POWER_DURATIONS } from './derived';
import { HR_ZONE_BOUNDS, LTHR_ZONE_BOUNDS } from '../theme';

export { PB_DISTANCES, POWER_DURATIONS };

const DAY_MS = 86400000;

export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** The local midnight `days` days from the one `t` falls in.
 *
 *  Calendar arithmetic rather than `t ± days * DAY_MS`: on the two days a year the
 *  clocks move, local midnights are 23 or 25 hours apart, and a fixed-millisecond step
 *  walks off the day it was aiming for — which is a streak that breaks itself every
 *  spring. */
export function addDays(t: number, days: number): number {
  const d = new Date(t);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfWeek(t: number): number {
  const d = new Date(startOfDay(t));
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return d.getTime();
}

/** A day is identified by the epoch millisecond its local midnight falls on.
 *
 *  Local, not UTC: an activity recorded at 23:00 in Vienna belongs to the day the
 *  calendar on the wall says it does, and an ISO date derived from the UTC instant
 *  would file it under the next one — which used to make an evening session read as a
 *  break in the streak. Numeric, because it is compared and offset far more often than
 *  it is displayed. */
export const dayKey = startOfDay;

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

export function fmtTimeOfDay(t: number): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
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

export function durationS(a: Activity): number {
  return (a.endedAt - a.startedAt) / 1000;
}

export function avgSpeedMps(a: Activity): number {
  const d = durationS(a);
  return d > 0 ? a.distance / d : 0;
}

/** Grade-adjusted pace: the pace this run would have been on the level for the same
 *  cost. Null when the device recorded no altitude to adjust against. */
export function gapSecPerKm(a: Activity): number | null {
  const flat = a.derived.gapDistanceM;
  if (!flat || flat <= 0) return null;
  const moving = a.derived.movingS || durationS(a);
  return moving > 0 ? moving / (flat / 1000) : null;
}

// ── training stress ───────────────────────────────────────────────
export type StressSource = 'power' | 'hr' | 'rpe';

export interface Stress {
  value: number;
  source: StressSource;
}

/** Threshold heart rate to score against.
 *
 *  Someone who has never tested theirs still has a max, and threshold sits near 90 % of
 *  it for most people — close enough to score a session's stress, and stated as an
 *  estimate wherever it is used. */
export function effectiveLthr(settings: Settings): number {
  return settings.lthr ?? Math.round(settings.maxHr * 0.9);
}

/** What one session cost, in points, where an hour at threshold is 100.
 *
 *  Three ways of arriving at the same scale, in descending order of how directly they
 *  measure the work: power against FTP, heart rate against threshold, and — when the
 *  session carries neither — the duration times how hard it felt. The source is
 *  returned with the number, because a figure derived from a guess should never be
 *  displayed as though it were measured. */
export function activityStress(a: Activity, settings: Settings): Stress {
  const seconds = a.derived.movingS || durationS(a);
  const np = a.derived.normalizedPower;
  if (settings.ftp && np && np > 0) {
    const intensity = np / settings.ftp;
    return { value: (seconds * np * intensity) / (settings.ftp * 3600) * 100, source: 'power' };
  }

  const hist = a.derived.hrHist;
  if (hist) {
    const lthr = effectiveLthr(settings);
    // Seconds weighted by the square of intensity: twice the pace over threshold is
    // four times the cost, which is the shape every heart-rate load score agrees on.
    let points = 0;
    for (let i = 0; i < hist.seconds.length; i++) {
      const ratio = (hist.lo + i) / lthr;
      points += hist.seconds[i] * ratio * ratio;
    }
    return { value: (points / 3600) * 100, source: 'hr' };
  }

  // Session RPE: minutes times perceived effort, scaled so an hour at 7/10 — a solid
  // steady session — also lands on 100.
  return { value: ((seconds / 60) * a.effort * 100) / 420, source: 'rpe' };
}

// ── weekly rollups ────────────────────────────────────────────────
export interface WeekRollup {
  weekStart: number;
  runKm: number;
  rideKm: number;
  timeS: number;
  ascentM: number;
  sessions: number;
  stress: number;
  activeDays: Set<number>;
}

/** Rolls the given activities up into the given weeks in one pass over each.
 *
 *  The weeks are consecutive, so which one an activity belongs to is arithmetic on its
 *  start time rather than a search: twelve weeks of history no longer means twelve
 *  filtered copies of the whole log, times the five figures each week reports. */
export function rollupWeeks(activities: Activity[], weekStarts: number[], settings: Settings): WeekRollup[] {
  const rollups: WeekRollup[] = weekStarts.map((weekStart) => ({
    weekStart,
    runKm: 0,
    rideKm: 0,
    timeS: 0,
    ascentM: 0,
    sessions: 0,
    stress: 0,
    activeDays: new Set<number>(),
  }));
  if (rollups.length === 0) return rollups;

  const first = weekStarts[0];
  const weekMs = 7 * DAY_MS;
  for (const a of activities) {
    if (a.startedAt < first) continue;
    const i = Math.floor((a.startedAt - first) / weekMs);
    if (i >= rollups.length) continue;
    const week = rollups[i];
    if (a.sport === 'run') week.runKm += a.distance / 1000;
    else week.rideKm += a.distance / 1000;
    week.timeS += durationS(a);
    week.ascentM += a.ascent;
    week.sessions += 1;
    week.stress += activityStress(a, settings).value;
    week.activeDays.add(dayKey(a.startedAt));
  }
  return rollups;
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
  last14: { dayKey: number; letter: string; trained: boolean; isToday: boolean }[];
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function computeStreak(activities: Activity[], reference = Date.now()): StreakInfo {
  const trainedDays = new Set<number>();
  for (const a of activities) trainedDays.add(dayKey(a.startedAt));
  const today = startOfDay(reference);

  // A streak isn't broken until the day is over, so an untrained today doesn't end it.
  let current = 0;
  for (let day = trainedDays.has(today) ? today : addDays(today, -1); trainedDays.has(day); day = addDays(day, -1)) {
    current++;
  }

  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const day of [...trainedDays].sort((a, b) => a - b)) {
    run = prev != null && addDays(prev, 1) === day ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = day;
  }
  longest = Math.max(longest, current);

  let restDaysLast21 = 0;
  const last14: StreakInfo['last14'] = [];
  for (let i = 20; i >= 0; i--) {
    const day = addDays(today, -i);
    if (!trainedDays.has(day)) restDaysLast21++;
    if (i > 13) continue;
    last14.push({
      dayKey: day,
      letter: DAY_LETTERS[(new Date(day).getDay() + 6) % 7],
      trained: trainedDays.has(day),
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
/** The five zones as heart rates, cut against whichever reference the settings name. */
export function zoneCuts(settings: Settings): number[] {
  const bounds = settings.zoneModel === 'lthr' ? LTHR_ZONE_BOUNDS : HR_ZONE_BOUNDS;
  const reference = settings.zoneModel === 'lthr' ? effectiveLthr(settings) : settings.maxHr;
  return bounds.map((b) => b * reference);
}

export function zoneLabel(settings: Settings): string {
  return settings.zoneModel === 'lthr'
    ? `${effectiveLthr(settings)} bpm threshold${settings.lthr ? '' : ' (estimated)'}`
    : `${settings.maxHr} bpm max`;
}

/** Seconds in each zone, read off the stored per-bpm histogram rather than the samples.
 *
 *  Because the histogram is settings-independent, moving a max heart rate or switching
 *  to threshold zones re-cuts the whole season instantly and correctly, instead of
 *  leaving every past session bucketed against the setting of the day it was saved. */
export function zoneSecondsFromHistogram(hist: HrHistogram | null, cuts: number[]): number[] {
  const zones = [0, 0, 0, 0, 0];
  if (!hist) return zones;
  for (let i = 0; i < hist.seconds.length; i++) {
    const seconds = hist.seconds[i];
    if (seconds <= 0) continue;
    const bpm = hist.lo + i;
    let zone = 0;
    for (let z = cuts.length - 2; z >= 0; z--) {
      if (bpm >= cuts[z]) {
        zone = z;
        break;
      }
    }
    zones[zone] += seconds;
  }
  return zones;
}

export function zoneSecondsForActivity(activity: Activity, settings: Settings): number[] {
  return zoneSecondsFromHistogram(activity.derived.hrHist, zoneCuts(settings));
}

export function aggregateZoneSeconds(activities: Activity[], settings: Settings): number[] {
  const cuts = zoneCuts(settings);
  const totals = [0, 0, 0, 0, 0];
  for (const a of activities) {
    const z = zoneSecondsFromHistogram(a.derived.hrHist, cuts);
    for (let i = 0; i < 5; i++) totals[i] += z[i];
  }
  return totals;
}

// ── cadence ──────────────────────────────────────────────────────
export function mergeHistograms(histograms: (HrHistogram | null)[]): HrHistogram | null {
  const present = histograms.filter((h): h is HrHistogram => h != null && h.seconds.length > 0);
  if (present.length === 0) return null;
  const lo = Math.min(...present.map((h) => h.lo));
  const hi = Math.max(...present.map((h) => h.lo + h.seconds.length - 1));
  const seconds = new Array(hi - lo + 1).fill(0);
  for (const h of present) {
    for (let i = 0; i < h.seconds.length; i++) seconds[h.lo + i - lo] += h.seconds[i];
  }
  return { lo, seconds };
}

export interface CadenceSummary {
  hist: HrHistogram | null;
  mean: number | null;
  /** The band the middle half of the time was spent in. */
  p25: number | null;
  p75: number | null;
  sessions: number;
}

export function cadenceSummary(activities: Activity[]): CadenceSummary {
  const withCadence = activities.filter((a) => a.derived.cadenceHist);
  const hist = mergeHistograms(withCadence.map((a) => a.derived.cadenceHist));
  return {
    hist,
    mean: histogramMean(hist),
    p25: histogramPercentile(hist, 0.25),
    p75: histogramPercentile(hist, 0.75),
    sessions: withCadence.length,
  };
}

export function histogramPercentile(hist: HrHistogram | null, fraction: number): number | null {
  if (!hist) return null;
  const total = hist.seconds.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let seen = 0;
  for (let i = 0; i < hist.seconds.length; i++) {
    seen += hist.seconds[i];
    if (seen >= total * fraction) return hist.lo + i;
  }
  return hist.lo + hist.seconds.length - 1;
}

// ── personal bests ────────────────────────────────────────────────
export interface PbResult {
  key: string;
  label: string;
  bestS: number;
  bestActivityId: string;
  date: number;
  previousBestS: number | null;
  history: { date: number; s: number }[]; // chronological best-so-far, for the sparkline
}

/** Reads each activity's stored best efforts, which were swept out of its samples once,
 *  when it was saved. */
export function computePersonalBests(activities: Activity[], sport: Sport): PbResult[] {
  const sorted = activities.filter((a) => a.sport === sport).sort((a, b) => a.startedAt - b.startedAt);

  const running = PB_DISTANCES.map(() => ({
    best: null as { s: number; id: string; date: number } | null,
    previousBest: null as number | null,
    history: [] as { date: number; s: number }[],
  }));

  for (const a of sorted) {
    PB_DISTANCES.forEach((d, i) => {
      const s = a.derived.pbEfforts?.[d.key];
      if (s == null) return;
      const acc = running[i];
      if (!acc.best || s < acc.best.s) {
        acc.previousBest = acc.best?.s ?? null;
        acc.best = { s, id: a.id, date: a.startedAt };
      }
      acc.history.push({ date: a.startedAt, s: acc.best.s });
    });
  }

  return PB_DISTANCES.map((d, i) => ({
    key: d.key,
    label: d.label,
    bestS: running[i].best?.s ?? NaN,
    bestActivityId: running[i].best?.id ?? '',
    date: running[i].best?.date ?? 0,
    previousBestS: running[i].previousBest,
    history: running[i].history,
  })).filter((r) => !Number.isNaN(r.bestS));
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
export function powerCurve(activities: Activity[]): { key: string; watts: number }[] {
  const best = POWER_DURATIONS.map(() => 0);
  for (const a of activities) {
    if (a.sport !== 'ride') continue;
    POWER_DURATIONS.forEach((d, i) => {
      const watts = a.derived.powerBests?.[d.key];
      if (watts != null && watts > best[i]) best[i] = watts;
    });
  }
  return POWER_DURATIONS.map((d, i) => ({ key: d.key, watts: Math.round(best[i]) }));
}

// ── aerobic decoupling ──────────────────────────────────────────────
export function weeklyDecoupling(activities: Activity[], weekStart: number): number | null {
  const weekEnd = weekStart + 7 * DAY_MS;
  let sum = 0;
  let count = 0;
  for (const a of activities) {
    if (a.startedAt < weekStart || a.startedAt >= weekEnd) continue;
    const value = a.derived.decoupling;
    if (value == null) continue;
    sum += value;
    count++;
  }
  return count === 0 ? null : sum / count;
}

// ── the load unit ───────────────────────────────────────────────────
/** Distance load: run kilometres plus ride kilometres ÷ 3, so one series can carry
 *  both sports. A fixed divisor, and honest about being one — it treats a recovery
 *  spin like a threshold ride, which is what the stress model exists to fix. */
export function loadKm(rollup: WeekRollup): number {
  return rollup.runKm + rollup.rideKm / 3;
}

export function loadOf(rollup: WeekRollup, settings: Settings): number {
  return settings.loadModel === 'stress' ? rollup.stress : loadKm(rollup);
}

export function loadUnit(settings: Settings): string {
  return settings.loadModel === 'stress' ? 'pts' : 'km';
}

export function loadBetween(activities: Activity[], from: number, to: number, settings: Settings): number {
  let total = 0;
  for (const a of activities) {
    if (a.startedAt < from || a.startedAt >= to) continue;
    total +=
      settings.loadModel === 'stress'
        ? activityStress(a, settings).value
        : a.sport === 'run'
          ? a.distance / 1000
          : a.distance / 3000;
  }
  return total;
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
export function loadBalance(activities: Activity[], settings: Settings, reference = Date.now()): LoadBalance {
  const acute = loadBetween(activities, reference - 7 * DAY_MS, reference + 1, settings);
  const previousAcute = loadBetween(activities, reference - 14 * DAY_MS, reference - 7 * DAY_MS, settings);
  const chronic = loadBetween(activities, reference - 28 * DAY_MS, reference + 1, settings) / 4;
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
  const profile = activity.derived.elevation;
  return profile && profile.length > 1 ? profile : [0, 0];
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
  const trained = new Set<number>();
  for (const a of activities) trained.add(dayKey(a.startedAt));
  const days = [...trained].sort((a, b) => a - b);
  if (days.length === 0) return [];
  const today = startOfDay(reference);
  const yesterday = addDays(today, -1);
  const segments: StreakSegment[] = [];
  let start = days[0];
  let prev = days[0];
  let length = 1;
  for (let i = 1; i <= days.length; i++) {
    const day = days[i];
    if (day != null && addDays(prev, 1) === day) {
      prev = day;
      length++;
      continue;
    }
    segments.push({
      startDay: start,
      endDay: prev,
      days: length,
      current: prev === today || prev === yesterday,
    });
    if (day == null) break;
    start = day;
    prev = day;
    length = 1;
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
    const key = dayKey(a.startedAt);
    const entry = byDay.get(key) ?? { sessions: 0, loadKm: 0 };
    entry.sessions += 1;
    entry.loadKm += a.sport === 'run' ? a.distance / 1000 : a.distance / 3000;
    byDay.set(key, entry);
  }
  const out: TrainedDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    const entry = byDay.get(day);
    out.push({ day, trained: entry != null, sessions: entry?.sessions ?? 0, loadKm: entry?.loadKm ?? 0, isToday: i === 0 });
  }
  return out;
}

// ── gear ────────────────────────────────────────────────────────────
export interface GearUse {
  km: number;
  sessions: number;
  lastUsed: number | null;
}

export function gearUsage(activities: Activity[]): Map<string, GearUse> {
  const totals = new Map<string, GearUse>();
  for (const a of activities) {
    if (!a.gearId) continue;
    const entry = totals.get(a.gearId) ?? { km: 0, sessions: 0, lastUsed: null };
    entry.km += a.distance / 1000;
    entry.sessions += 1;
    entry.lastUsed = Math.max(entry.lastUsed ?? 0, a.startedAt);
    totals.set(a.gearId, entry);
  }
  return totals;
}
