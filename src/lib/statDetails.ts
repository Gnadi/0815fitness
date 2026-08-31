// Every figure on the Overview opens the same shape of detail: the number in its own
// window, the twelve weeks behind it, a table of those weeks, and the sessions that
// actually add up to it. This module derives that shape; the screen only renders it.
import type { Activity, Settings } from '../types';
import {
  aggregateZoneSeconds,
  chronicSeries,
  computeStreak,
  fmtClock,
  fmtDayMonth,
  hoursMinutes,
  isoWeekLabel,
  lastNWeekStarts,
  loadBalance,
  loadKm,
  rampPct,
  rollupWeeks,
  streakSegments,
  trainedDayGrid,
  type TrainedDay,
} from './stats';

export type StatKey = 'runKm' | 'time' | 'ascent' | 'rideKm' | 'sessions' | 'streak' | 'volume' | 'load';

export type Tone = 'text' | 'muted' | 'faint' | 'positive' | 'warning';

export interface TrendPoint {
  weekStart: number;
  label: string;
  value: number;
}

export interface DetailColumn {
  label: string;
  width?: number; // fixed px; omitted columns share the remaining space
}

export interface DetailRow {
  key: string;
  values: string[];
  tones?: (Tone | undefined)[];
  current?: boolean;
}

export interface Contributor {
  activity: Activity;
  contribution: string;
}

export interface StatDetail {
  key: StatKey;
  title: string;
  scope: string;
  value: string;
  unit: string;
  sub: string;
  subTone: Tone;
  trendLabel: string;
  trend: TrendPoint[];
  trendFormat: (v: number) => string;
  columns: DetailColumn[];
  rows: DetailRow[];
  contributorsLabel: string;
  contributors: Contributor[];
  note: string;
  /** Only the streak detail draws a day grid, and only the load detail the ratio band. */
  grid?: TrainedDay[];
  ratio?: number;
}

const DAY_MS = 86400000;
const TREND_WEEKS = 12;
const TABLE_WEEKS = 8;

export const STAT_TITLES: Record<StatKey, string> = {
  runKm: 'Run distance',
  time: 'Training time',
  ascent: 'Ascent',
  rideKm: 'Ride distance',
  sessions: 'Sessions',
  streak: 'Streak',
  volume: 'Volume',
  load: 'Load balance',
};

function inWeek(activities: Activity[], weekStart: number): Activity[] {
  return activities
    .filter((a) => a.startedAt >= weekStart && a.startedAt < weekStart + 7 * DAY_MS)
    .sort((a, b) => b.startedAt - a.startedAt);
}

function weekRange(weekStart: number): string {
  return `${fmtDayMonth(weekStart)}–${fmtDayMonth(weekStart + 6 * DAY_MS)}`;
}

function durationS(a: Activity): number {
  return (a.endedAt - a.startedAt) / 1000;
}

function deltaSentence(delta: number, unit: string, digits = 1): string {
  const sign = delta >= 0 ? '+' : '−';
  return `${sign}${Math.abs(delta).toFixed(digits)} ${unit} on last week`;
}

function toneForDelta(delta: number): Tone {
  return delta > 0 ? 'positive' : delta < 0 ? 'muted' : 'faint';
}

export function buildStatDetail(key: StatKey, activities: Activity[], settings: Settings, now: number): StatDetail {
  const weekStarts = lastNWeekStarts(TREND_WEEKS, now);
  const rollups = rollupWeeks(activities, weekStarts);
  const thisWeekStart = weekStarts[weekStarts.length - 1];
  const thisWeek = rollups[rollups.length - 1];
  const lastWeek = rollups[rollups.length - 2];
  const scope = `This week · ${weekRange(thisWeekStart)}`;
  const weekActivities = inWeek(activities, thisWeekStart);

  // The table reads newest first; the trend chart reads left to right in time.
  const tableWeeks = [...rollups].slice(-TABLE_WEEKS).reverse();
  const trendOf = (pick: (i: number) => number): TrendPoint[] =>
    rollups.map((r, i) => ({ weekStart: r.weekStart, label: isoWeekLabel(r.weekStart).slice(1), value: pick(i) }));

  switch (key) {
    case 'runKm': {
      const delta = thisWeek.runKm - lastWeek.runKm;
      const runs = weekActivities.filter((a) => a.sport === 'run');
      return {
        key,
        title: STAT_TITLES[key],
        scope,
        value: thisWeek.runKm.toFixed(2),
        unit: 'km run',
        sub: deltaSentence(delta, 'km'),
        subTone: toneForDelta(delta),
        trendLabel: 'Run km · 12 weeks',
        trend: trendOf((i) => rollups[i].runKm),
        trendFormat: (v) => v.toFixed(0),
        columns: [{ label: 'WEEK', width: 48 }, { label: 'KM' }, { label: 'RUNS' }, { label: 'AVG' }],
        rows: tableWeeks.map((w, i) => {
          const weekRuns = inWeek(activities, w.weekStart).filter((a) => a.sport === 'run');
          const avg = weekRuns.length > 0 ? w.runKm / weekRuns.length : 0;
          return {
            key: String(w.weekStart),
            values: [isoWeekLabel(w.weekStart), w.runKm.toFixed(1), String(weekRuns.length), avg > 0 ? avg.toFixed(1) : '—'],
            current: i === 0,
          };
        }),
        contributorsLabel: 'Runs this week',
        contributors: runs.map((a) => ({ activity: a, contribution: `${(a.distance / 1000).toFixed(2)} km` })),
        note: 'Every run started inside the calendar week, measured over its GPS track. Rides are counted separately under ride distance.',
      };
    }

    case 'time': {
      const delta = (thisWeek.timeS - lastWeek.timeS) / 60;
      return {
        key,
        title: STAT_TITLES[key],
        scope,
        value: hoursMinutes(thisWeek.timeS),
        unit: 'hours',
        sub: `${delta >= 0 ? '+' : '−'}${Math.abs(Math.round(delta))} min on last week`,
        subTone: toneForDelta(delta),
        trendLabel: 'Hours · 12 weeks',
        trend: trendOf((i) => rollups[i].timeS / 3600),
        trendFormat: (v) => v.toFixed(1),
        columns: [{ label: 'WEEK', width: 48 }, { label: 'TIME' }, { label: 'SESSIONS' }, { label: 'AVG' }],
        rows: tableWeeks.map((w, i) => ({
          key: String(w.weekStart),
          values: [
            isoWeekLabel(w.weekStart),
            hoursMinutes(w.timeS),
            String(w.sessions),
            w.sessions > 0 ? fmtClock(w.timeS / w.sessions) : '—',
          ],
          current: i === 0,
        })),
        contributorsLabel: 'Sessions this week',
        contributors: weekActivities.map((a) => ({ activity: a, contribution: fmtClock(durationS(a)) })),
        note: 'Elapsed time from start to finish of each session, auto-pause included. It is what the week cost you, not moving time.',
      };
    }

    case 'ascent': {
      const delta = thisWeek.ascentM - lastWeek.ascentM;
      const climbed = weekActivities.filter((a) => a.ascent > 0);
      return {
        key,
        title: STAT_TITLES[key],
        scope,
        value: String(Math.round(thisWeek.ascentM)),
        unit: 'metres climbed',
        sub: `${delta >= 0 ? '+' : '−'}${Math.abs(Math.round(delta))} m on last week`,
        subTone: toneForDelta(delta),
        trendLabel: 'Ascent · 12 weeks',
        trend: trendOf((i) => rollups[i].ascentM),
        trendFormat: (v) => String(Math.round(v)),
        columns: [{ label: 'WEEK', width: 48 }, { label: 'ASCENT' }, { label: 'KM' }, { label: 'M/KM' }],
        rows: tableWeeks.map((w, i) => {
          const km = w.runKm + w.rideKm;
          return {
            key: String(w.weekStart),
            values: [isoWeekLabel(w.weekStart), String(Math.round(w.ascentM)), km.toFixed(1), km > 0 ? (w.ascentM / km).toFixed(1) : '—'],
            current: i === 0,
          };
        }),
        contributorsLabel: 'Climbing this week',
        contributors: climbed.map((a) => ({ activity: a, contribution: `${Math.round(a.ascent)} m` })),
        note: 'Summed from the barometric or GPS altitude of the recorded track, ignoring rises under 30 cm so altitude jitter does not read as climbing.',
      };
    }

    case 'rideKm': {
      const delta = thisWeek.rideKm - lastWeek.rideKm;
      const rides = weekActivities.filter((a) => a.sport === 'ride');
      return {
        key,
        title: STAT_TITLES[key],
        scope,
        value: thisWeek.rideKm.toFixed(1),
        unit: 'km ridden',
        sub: deltaSentence(delta, 'km'),
        subTone: toneForDelta(delta),
        trendLabel: 'Ride km · 12 weeks',
        trend: trendOf((i) => rollups[i].rideKm),
        trendFormat: (v) => v.toFixed(0),
        columns: [{ label: 'WEEK', width: 48 }, { label: 'KM' }, { label: 'RIDES' }, { label: 'KM/H' }],
        rows: tableWeeks.map((w, i) => {
          const weekRides = inWeek(activities, w.weekStart).filter((a) => a.sport === 'ride');
          const time = weekRides.reduce((s, a) => s + durationS(a), 0);
          const speed = time > 0 ? (w.rideKm * 1000) / time : 0;
          return {
            key: String(w.weekStart),
            values: [isoWeekLabel(w.weekStart), w.rideKm.toFixed(1), String(weekRides.length), speed > 0 ? (speed * 3.6).toFixed(1) : '—'],
            current: i === 0,
          };
        }),
        contributorsLabel: 'Rides this week',
        contributors: rides.map((a) => ({ activity: a, contribution: `${(a.distance / 1000).toFixed(1)} km` })),
        note: 'Ride kilometres in full here. On the load and volume figures they count as a third of a run kilometre, which is the exchange rate this app holds to.',
      };
    }

    case 'sessions': {
      const daysElapsed = Math.floor((now - thisWeekStart) / DAY_MS) + 1;
      const rest = Math.max(0, daysElapsed - thisWeek.activeDays.size);
      const delta = thisWeek.sessions - lastWeek.sessions;
      return {
        key,
        title: STAT_TITLES[key],
        scope,
        value: String(thisWeek.sessions),
        unit: `sessions · ${rest} rest`,
        sub: `${delta >= 0 ? '+' : '−'}${Math.abs(delta)} on last week · ${thisWeek.activeDays.size} of ${daysElapsed} days trained`,
        subTone: toneForDelta(delta),
        trendLabel: 'Sessions · 12 weeks',
        trend: trendOf((i) => rollups[i].sessions),
        trendFormat: (v) => String(Math.round(v)),
        columns: [{ label: 'WEEK', width: 48 }, { label: 'SESSIONS' }, { label: 'DAYS' }, { label: 'REST' }],
        rows: tableWeeks.map((w, i) => {
          const elapsed = i === 0 ? daysElapsed : 7;
          return {
            key: String(w.weekStart),
            values: [isoWeekLabel(w.weekStart), String(w.sessions), String(w.activeDays.size), String(Math.max(0, elapsed - w.activeDays.size))],
            current: i === 0,
          };
        }),
        contributorsLabel: 'Sessions this week',
        contributors: weekActivities.map((a) => ({
          activity: a,
          contribution: `${(a.distance / 1000).toFixed(1)} km · ${fmtClock(durationS(a))}`,
        })),
        note: 'Two sessions on one day count twice here and once as a trained day. The rest count runs against the days of the week that have happened, not against seven.',
      };
    }

    case 'streak': {
      const streak = computeStreak(activities, now);
      const segments = streakSegments(activities, now).slice(0, TABLE_WEEKS);
      // Eight rows that end on the current week: start on the Monday seven weeks back
      // so every row is a calendar week and today sits in the last one.
      const dow = (new Date(now).getDay() + 6) % 7;
      const grid = trainedDayGrid(activities, 50 + dow, now);
      return {
        key,
        title: STAT_TITLES[key],
        scope: 'Consecutive days trained',
        value: String(streak.current),
        unit: streak.current === 1 ? 'day' : 'days',
        sub: `longest ${streak.longest} days · ${streak.restDaysLast21} rest days in the last 21`,
        subTone: 'muted',
        trendLabel: 'Days trained per week · 12 weeks',
        trend: trendOf((i) => rollups[i].activeDays.size),
        trendFormat: (v) => String(Math.round(v)),
        columns: [{ label: 'FROM', width: 56 }, { label: 'TO' }, { label: 'DAYS' }, { label: 'KM' }],
        rows: segments.map((seg) => ({
          key: String(seg.startDay),
          values: [
            fmtDayMonth(seg.startDay),
            fmtDayMonth(seg.endDay),
            String(seg.days),
            activities
              .filter((a) => a.startedAt >= seg.startDay && a.startedAt < seg.endDay + DAY_MS)
              .reduce((s, a) => s + (a.sport === 'run' ? a.distance / 1000 : a.distance / 3000), 0)
              .toFixed(1),
          ],
          current: seg.current,
        })),
        contributorsLabel: 'Last 14 days',
        contributors: activities
          .filter((a) => now - a.startedAt < 14 * DAY_MS)
          .sort((a, b) => b.startedAt - a.startedAt)
          .map((a) => ({ activity: a, contribution: `${(a.distance / 1000).toFixed(1)} km` })),
        note: 'A day counts as trained if anything was recorded on it. Today never breaks a streak while it is still running. Nothing here is a target — a rest day is not a broken anything.',
        grid,
      };
    }

    case 'volume': {
      const load = loadKm(thisWeek);
      const chronic = chronicSeries(rollups.map(loadKm));
      const avg4 = chronic[chronic.length - 1];
      const delta = load - avg4;
      return {
        key,
        title: STAT_TITLES[key],
        scope,
        value: load.toFixed(1),
        unit: 'km load',
        sub: `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)} km on the 4-week average of ${avg4.toFixed(1)}`,
        subTone: toneForDelta(delta),
        trendLabel: 'Load km · 12 weeks',
        trend: trendOf((i) => loadKm(rollups[i])),
        trendFormat: (v) => v.toFixed(0),
        columns: [{ label: 'WEEK', width: 48 }, { label: 'RUN' }, { label: 'RIDE' }, { label: 'LOAD' }],
        rows: tableWeeks.map((w, i) => ({
          key: String(w.weekStart),
          values: [isoWeekLabel(w.weekStart), w.runKm.toFixed(1), w.rideKm.toFixed(1), loadKm(w).toFixed(1)],
          current: i === 0,
        })),
        contributorsLabel: 'Sessions this week',
        contributors: weekActivities.map((a) => ({
          activity: a,
          contribution: `${(a.sport === 'run' ? a.distance / 1000 : a.distance / 3000).toFixed(1)} km load`,
        })),
        note: 'One series carries both sports: run kilometres plus ride kilometres ÷ 3. It is a rough exchange rate, not physiology, and it exists so a week of riding does not read as a week off.',
      };
    }

    case 'load': {
      const balance = loadBalance(activities, now);
      const acuteSeries = rollups.map(loadKm);
      const chronic = chronicSeries(acuteSeries);
      const ratio = balance.ratio;
      const last7 = activities
        .filter((a) => a.startedAt >= now - 7 * DAY_MS)
        .sort((a, b) => b.startedAt - a.startedAt);
      const zoneTotal = aggregateZoneSeconds(last7, settings.maxHr).reduce((a, b) => a + b, 0);
      return {
        key,
        title: STAT_TITLES[key],
        scope: 'Rolling 7 days ÷ rolling 28 days',
        value: ratio > 0 ? ratio.toFixed(2) : '—',
        unit: 'ratio',
        sub:
          ratio === 0
            ? 'no load recorded in the last four weeks'
            : `${balance.acute.toFixed(1)} km acute against ${balance.chronic.toFixed(1)} km chronic · ramp ${balance.ramp >= 0 ? '+' : '−'}${Math.abs(balance.ramp).toFixed(1)} %`,
        subTone: ratio > 1.3 || balance.ramp > 15 ? 'warning' : ratio > 0 && ratio < 0.8 ? 'muted' : 'positive',
        trendLabel: 'Weekly ratio · 12 weeks',
        trend: trendOf((i) => (chronic[i] > 0 ? acuteSeries[i] / chronic[i] : 0)),
        trendFormat: (v) => v.toFixed(2),
        columns: [{ label: 'WEEK', width: 48 }, { label: '7-DAY' }, { label: '28-DAY' }, { label: 'RATIO' }, { label: 'RAMP', width: 56 }],
        rows: tableWeeks.map((w, i) => {
          const idx = rollups.indexOf(w);
          const r = chronic[idx] > 0 ? acuteSeries[idx] / chronic[idx] : 0;
          const ramp = idx > 0 ? rampPct(acuteSeries[idx], acuteSeries[idx - 1]) : 0;
          return {
            key: String(w.weekStart),
            values: [
              isoWeekLabel(w.weekStart),
              acuteSeries[idx].toFixed(1),
              chronic[idx].toFixed(1),
              r > 0 ? r.toFixed(2) : '—',
              `${ramp >= 0 ? '+' : '−'}${Math.abs(ramp).toFixed(0)} %`,
            ],
            tones: [undefined, undefined, undefined, r > 1.3 ? 'warning' : undefined, ramp > 15 ? 'warning' : undefined],
            current: i === 0,
          };
        }),
        contributorsLabel: 'The last 7 days',
        contributors: last7.map((a) => ({
          activity: a,
          contribution: `${(a.sport === 'run' ? a.distance / 1000 : a.distance / 3000).toFixed(1)} km load`,
        })),
        note:
          zoneTotal > 0
            ? 'Rolling windows, not calendar weeks — a calendar week would read as detraining every Monday. The band from 0.8 to 1.3 is where the acute week sits close to the month behind it. The table below is by calendar week, so its top row is still filling up.'
            : 'Rolling windows, not calendar weeks — a calendar week would read as detraining every Monday, and the table below is by calendar week, so its top row is still filling up. This ratio is built from distance alone; pair a heart-rate strap and the zones tab weights it by intensity.',
        ratio,
      };
    }
  }
}
