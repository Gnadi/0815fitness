// Every figure on the Overview opens the same shape of detail: the number in its own
// window, the twelve weeks behind it, a table of those weeks, and the sessions that
// actually add up to it. This module derives that shape; the screen only renders it.
import type { Activity, Settings } from '../types';
import type { UnitFormat } from './units';
import {
  activityStress,
  aggregateZoneSeconds,
  chronicSeries,
  computeStreak,
  fmtClock,
  fmtDayMonth,
  hoursMinutes,
  isoWeekLabel,
  lastNWeekStarts,
  loadBalance,
  loadOf,
  rampPct,
  rollupWeeks,
  streakSegments,
  trainedDayGrid,
  type TrainedDay,
  type WeekRollup,
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

export function buildStatDetail(key: StatKey, activities: Activity[], settings: Settings, now: number, units: UnitFormat): StatDetail {
  const weekStarts = lastNWeekStarts(TREND_WEEKS, now);
  const rollups = rollupWeeks(activities, weekStarts, settings);
  const thisWeekStart = weekStarts[weekStarts.length - 1];
  const thisWeek = rollups[rollups.length - 1];
  const lastWeek = rollups[rollups.length - 2];
  const scope = `This week · ${weekRange(thisWeekStart)}`;
  const weekActivities = inWeek(activities, thisWeekStart);

  // Rollups are kept in kilometres and metres, whatever the screen shows, so every
  // conversion happens here on the way out and nothing downstream has to know.
  const U = units.distanceUnit;
  const km = (value: number, digits = 1) => units.distance(value * 1000).toFixed(digits);
  const dist = (metres: number, digits = 1) => units.fmtDistance(metres, digits);
  const stressed = settings.loadModel === 'stress';
  const loadUnitLabel = stressed ? 'pts' : U;
  const load = (r: WeekRollup) => (stressed ? r.stress : units.distance(loadOf(r, settings) * 1000));
  const activityLoadValue = (a: Activity) => units.distance(a.sport === 'run' ? a.distance : a.distance / 3);

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
        value: km(thisWeek.runKm, 2),
        unit: `${U} run`,
        sub: deltaSentence(units.distance(delta * 1000), U),
        subTone: toneForDelta(delta),
        trendLabel: `Run ${U} · 12 weeks`,
        trend: trendOf((i) => units.distance(rollups[i].runKm * 1000)),
        trendFormat: (v) => v.toFixed(0),
        columns: [{ label: 'WEEK', width: 48 }, { label: U.toUpperCase() }, { label: 'RUNS' }, { label: 'AVG' }],
        rows: tableWeeks.map((w, i) => {
          const weekRuns = inWeek(activities, w.weekStart).filter((a) => a.sport === 'run');
          const avg = weekRuns.length > 0 ? w.runKm / weekRuns.length : 0;
          return {
            key: String(w.weekStart),
            values: [isoWeekLabel(w.weekStart), km(w.runKm), String(weekRuns.length), avg > 0 ? km(avg) : '—'],
            current: i === 0,
          };
        }),
        contributorsLabel: 'Runs this week',
        contributors: runs.map((a) => ({ activity: a, contribution: `${dist(a.distance, 2)} ${U}` })),
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
      const E = units.elevationUnit;
      return {
        key,
        title: STAT_TITLES[key],
        scope,
        value: units.fmtElevation(thisWeek.ascentM),
        unit: `${E === 'm' ? 'metres' : 'feet'} climbed`,
        sub: `${delta >= 0 ? '+' : '−'}${units.fmtElevation(Math.abs(delta))} ${E} on last week`,
        subTone: toneForDelta(delta),
        trendLabel: 'Ascent · 12 weeks',
        trend: trendOf((i) => units.elevation(rollups[i].ascentM)),
        trendFormat: (v) => String(Math.round(v)),
        columns: [{ label: 'WEEK', width: 48 }, { label: 'ASCENT' }, { label: U.toUpperCase() }, { label: `${E}/${U}` }],
        rows: tableWeeks.map((w, i) => {
          const distance = w.runKm + w.rideKm;
          return {
            key: String(w.weekStart),
            values: [
              isoWeekLabel(w.weekStart),
              units.fmtElevation(w.ascentM),
              km(distance),
              distance > 0 ? (units.elevation(w.ascentM) / units.distance(distance * 1000)).toFixed(1) : '—',
            ],
            current: i === 0,
          };
        }),
        contributorsLabel: 'Climbing this week',
        contributors: climbed.map((a) => ({ activity: a, contribution: `${units.fmtElevation(a.ascent)} ${E}` })),
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
        value: km(thisWeek.rideKm),
        unit: `${U} ridden`,
        sub: deltaSentence(units.distance(delta * 1000), U),
        subTone: toneForDelta(delta),
        trendLabel: `Ride ${U} · 12 weeks`,
        trend: trendOf((i) => units.distance(rollups[i].rideKm * 1000)),
        trendFormat: (v) => v.toFixed(0),
        columns: [
          { label: 'WEEK', width: 48 },
          { label: U.toUpperCase() },
          { label: 'RIDES' },
          { label: units.speedUnit.toUpperCase() },
        ],
        rows: tableWeeks.map((w, i) => {
          const weekRides = inWeek(activities, w.weekStart).filter((a) => a.sport === 'ride');
          const time = weekRides.reduce((s, a) => s + durationS(a), 0);
          const speed = time > 0 ? (w.rideKm * 1000) / time : 0;
          return {
            key: String(w.weekStart),
            values: [isoWeekLabel(w.weekStart), km(w.rideKm), String(weekRides.length), speed > 0 ? units.fmtSpeed(speed) : '—'],
            current: i === 0,
          };
        }),
        contributorsLabel: 'Rides this week',
        contributors: rides.map((a) => ({ activity: a, contribution: `${dist(a.distance)} ${U}` })),
        note: stressed
          ? 'Ride distance in full here. The load figures are on training stress rather than distance, so a ride counts for what it cost rather than how far it went.'
          : 'Ride kilometres in full here. On the load and volume figures they count as a third of a run kilometre, which is the exchange rate this app holds to.',
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
          contribution: `${dist(a.distance)} ${U} · ${fmtClock(durationS(a))}`,
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
        columns: [{ label: 'FROM', width: 56 }, { label: 'TO' }, { label: 'DAYS' }, { label: U.toUpperCase() }],
        rows: segments.map((seg) => ({
          key: String(seg.startDay),
          values: [
            fmtDayMonth(seg.startDay),
            fmtDayMonth(seg.endDay),
            String(seg.days),
            km(
              activities
                .filter((a) => a.startedAt >= seg.startDay && a.startedAt < seg.endDay + DAY_MS)
                .reduce((s, a) => s + (a.sport === 'run' ? a.distance / 1000 : a.distance / 3000), 0),
            ),
          ],
          current: seg.current,
        })),
        contributorsLabel: 'Last 14 days',
        contributors: activities
          .filter((a) => now - a.startedAt < 14 * DAY_MS)
          .sort((a, b) => b.startedAt - a.startedAt)
          .map((a) => ({ activity: a, contribution: `${dist(a.distance)} ${U}` })),
        note: 'A day counts as trained if anything was recorded on it. Today never breaks a streak while it is still running. Nothing here is a target — a rest day is not a broken anything.',
        grid,
      };
    }

    case 'volume': {
      const current = load(thisWeek);
      const chronic = chronicSeries(rollups.map(load));
      const avg4 = chronic[chronic.length - 1];
      const delta = current - avg4;
      return {
        key,
        title: STAT_TITLES[key],
        scope,
        value: current.toFixed(stressed ? 0 : 1),
        unit: `${loadUnitLabel} load`,
        sub: `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(stressed ? 0 : 1)} ${loadUnitLabel} on the 4-week average of ${avg4.toFixed(stressed ? 0 : 1)}`,
        subTone: toneForDelta(delta),
        trendLabel: `Load ${loadUnitLabel} · 12 weeks`,
        trend: trendOf((i) => load(rollups[i])),
        trendFormat: (v) => v.toFixed(0),
        columns: [{ label: 'WEEK', width: 48 }, { label: 'RUN' }, { label: 'RIDE' }, { label: 'LOAD' }],
        rows: tableWeeks.map((w, i) => ({
          key: String(w.weekStart),
          values: [isoWeekLabel(w.weekStart), km(w.runKm), km(w.rideKm), load(w).toFixed(stressed ? 0 : 1)],
          current: i === 0,
        })),
        contributorsLabel: 'Sessions this week',
        contributors: weekActivities.map((a) => ({
          activity: a,
          contribution: stressed
            ? `${Math.round(activityStressValue(a, settings))} pts`
            : `${activityLoadValue(a).toFixed(1)} ${U} load`,
        })),
        note: stressed
          ? 'One series carries both sports, in training stress: an hour at threshold is 100 points, measured from power against FTP where there is a meter, heart rate against threshold where there is a strap, and duration times perceived effort where there is neither.'
          : 'One series carries both sports: run kilometres plus ride kilometres ÷ 3. It is a rough exchange rate, not physiology, and it exists so a week of riding does not read as a week off.',
      };
    }

    case 'load': {
      const balance = loadBalance(activities, settings, now);
      const acuteSeries = rollups.map(load);
      const chronic = chronicSeries(acuteSeries);
      const ratio = balance.ratio;
      const last7 = activities
        .filter((a) => a.startedAt >= now - 7 * DAY_MS)
        .sort((a, b) => b.startedAt - a.startedAt);
      const zoneTotal = aggregateZoneSeconds(last7, settings).reduce((a, b) => a + b, 0);
      const shown = (value: number) => (stressed ? value : units.distance(value * 1000));
      const digits = stressed ? 0 : 1;
      return {
        key,
        title: STAT_TITLES[key],
        scope: 'Rolling 7 days ÷ rolling 28 days',
        value: ratio > 0 ? ratio.toFixed(2) : '—',
        unit: 'ratio',
        sub:
          ratio === 0
            ? 'no load recorded in the last four weeks'
            : `${shown(balance.acute).toFixed(digits)} ${loadUnitLabel} acute against ${shown(balance.chronic).toFixed(digits)} ${loadUnitLabel} chronic · ramp ${balance.ramp >= 0 ? '+' : '−'}${Math.abs(balance.ramp).toFixed(1)} %`,
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
              acuteSeries[idx].toFixed(digits),
              chronic[idx].toFixed(digits),
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
          contribution: stressed
            ? `${Math.round(activityStressValue(a, settings))} pts`
            : `${activityLoadValue(a).toFixed(1)} ${U} load`,
        })),
        note: stressed
          ? 'Rolling windows, not calendar weeks — a calendar week would read as detraining every Monday. The band from 0.8 to 1.3 is where the acute week sits close to the month behind it. Load here is training stress, so an easy hour and a hard one are not the same week.'
          : zoneTotal > 0
            ? 'Rolling windows, not calendar weeks — a calendar week would read as detraining every Monday. The band from 0.8 to 1.3 is where the acute week sits close to the month behind it. The table below is by calendar week, so its top row is still filling up.'
            : 'Rolling windows, not calendar weeks — a calendar week would read as detraining every Monday, and the table below is by calendar week, so its top row is still filling up. This ratio is built from distance alone; pair a heart-rate strap and the zones tab weights it by intensity.',
        ratio,
      };
    }
  }
}

function activityStressValue(a: Activity, settings: Settings): number {
  return activityStress(a, settings).value;
}
