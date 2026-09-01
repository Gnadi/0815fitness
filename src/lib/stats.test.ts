import { describe, expect, it } from 'vitest';
import {
  activityStress,
  addDays,
  aggregateZoneSeconds,
  cadenceSummary,
  computePersonalBests,
  computeStreak,
  effectiveLthr,
  gapSecPerKm,
  gearUsage,
  histogramPercentile,
  loadBalance,
  loadOf,
  mergeHistograms,
  powerCurve,
  rollupWeeks,
  startOfWeek,
  zoneCuts,
  zoneSecondsFromHistogram,
} from './stats';
import { makeActivity, makeSamples, makeSettings, makeTrack } from './testFixtures';

const DAY = 86400000;

describe('day arithmetic', () => {
  it('steps by calendar days, not by a fixed number of milliseconds', () => {
    // The last Sunday in March 2026, when European clocks go forward: local midnights
    // that day are 23 hours apart, and a fixed 86 400 000 ms step lands an hour into
    // the wrong day.
    const before = new Date(2026, 2, 28, 12, 0, 0).getTime();
    const stepped = addDays(before, 2);
    const asDate = new Date(stepped);
    expect(asDate.getDate()).toBe(30);
    expect(asDate.getHours()).toBe(0);
  });

  it('starts the week on Monday', () => {
    const sunday = new Date(2026, 5, 7, 22, 0, 0).getTime();
    expect(new Date(startOfWeek(sunday)).getDay()).toBe(1);
    expect(new Date(startOfWeek(sunday)).getDate()).toBe(1);
  });
});

describe('streaks', () => {
  const at = (daysAgo: number, hour = 18) => {
    const d = new Date(2026, 5, 15, hour, 0, 0);
    d.setDate(d.getDate() - daysAgo);
    return d.getTime();
  };
  const now = new Date(2026, 5, 15, 21, 0, 0).getTime();

  it('counts consecutive trained days', () => {
    const log = [0, 1, 2, 4].map((d, i) => makeActivity({ id: `s${i}`, startedAt: at(d) }));
    const streak = computeStreak(log, now);
    expect(streak.current).toBe(3);
    expect(streak.longest).toBe(3);
  });

  it('does not break the streak on a day that is still running', () => {
    const log = [1, 2, 3].map((d, i) => makeActivity({ id: `s${i}`, startedAt: at(d) }));
    expect(computeStreak(log, now).current).toBe(3);
  });

  it('files a late-evening session under the local day it happened on', () => {
    // 23:30 local is the next UTC day east of Greenwich; keyed off UTC this session
    // would land on tomorrow and break the streak it is part of.
    const log = [makeActivity({ id: 'late', startedAt: at(1, 23) }), makeActivity({ id: 'today', startedAt: at(0, 9) })];
    expect(computeStreak(log, now).current).toBe(2);
  });
});

describe('weekly rollups and load', () => {
  const settings = makeSettings();
  const monday = startOfWeek(new Date(2026, 5, 8, 9, 0, 0).getTime());

  it('sums runs and rides into the week they started in', () => {
    const log = [
      makeActivity({ id: 'r1', startedAt: monday + 9 * 3600000, distance: 10000, sport: 'run' }),
      makeActivity({ id: 'r2', startedAt: monday + 2 * DAY, distance: 30000, sport: 'ride' }),
      makeActivity({ id: 'r3', startedAt: monday - 3 * DAY, distance: 5000, sport: 'run' }),
    ];
    const [previous, current] = rollupWeeks(log, [monday - 7 * DAY, monday], settings);
    expect(current.runKm).toBeCloseTo(10);
    expect(current.rideKm).toBeCloseTo(30);
    expect(current.sessions).toBe(2);
    expect(previous.runKm).toBeCloseTo(5);
    // Distance load counts a ride kilometre as a third of a run kilometre.
    expect(loadOf(current, settings)).toBeCloseTo(20);
  });

  it('measures the ratio over rolling windows rather than calendar weeks', () => {
    const now = Date.parse('2026-06-15T12:00:00Z');
    const log = Array.from({ length: 28 }, (_, i) =>
      makeActivity({ id: `d${i}`, startedAt: now - (i + 1) * DAY, distance: 10000, sport: 'run' }),
    );
    const balance = loadBalance(log, settings, now);
    expect(balance.acute).toBeCloseTo(70, 0);
    expect(balance.chronic).toBeCloseTo(70, 0);
    expect(balance.ratio).toBeCloseTo(1, 2);
  });
});

describe('heart-rate zones', () => {
  it('re-cuts a stored histogram when the reference changes, without touching the samples', () => {
    const hist = { lo: 100, seconds: [60, 60, 60, 60, 60, 60, 60, 60, 60, 60] }; // 100–109 bpm
    const againstHigh = zoneSecondsFromHistogram(hist, zoneCuts(makeSettings({ maxHr: 200 })));
    const againstLow = zoneSecondsFromHistogram(hist, zoneCuts(makeSettings({ maxHr: 140 })));
    // 100–109 is barely half of a 200 max — zone 1 — but three quarters of a 140 max.
    expect(againstHigh[0]).toBe(600);
    expect(againstLow[0]).toBe(0);
    expect(againstLow[2]).toBe(600);
  });

  it('cuts against threshold when the settings say so', () => {
    const settings = makeSettings({ zoneModel: 'lthr', lthr: 160 });
    const cuts = zoneCuts(settings);
    expect(cuts[4]).toBeCloseTo(160); // zone 5 starts at threshold itself
    expect(effectiveLthr(settings)).toBe(160);
  });

  it('estimates threshold from max when none is set', () => {
    expect(effectiveLthr(makeSettings({ maxHr: 200, lthr: null }))).toBe(180);
  });

  it('aggregates a log against the current settings', () => {
    const startedAt = Date.parse('2026-06-01T08:00:00Z');
    const points = makeTrack({ startedAt, speedMps: 3, distanceM: 1800 });
    const hr = points.map((p) => ({ t: p.t, bpm: 150 }));
    const activity = makeActivity({ id: 'z', startedAt, samples: makeSamples('z', points, { hr }) });
    const zones = aggregateZoneSeconds([activity], makeSettings({ maxHr: 190 }));
    // 150 of 190 is 79 %, which the max-HR bands put in zone 3.
    expect(zones[2]).toBeGreaterThan(500);
    expect(zones[1]).toBe(0);
    // Against a higher max the same session is an easier one.
    expect(aggregateZoneSeconds([activity], makeSettings({ maxHr: 220 }))[1]).toBeGreaterThan(500);
  });
});

describe('histograms', () => {
  it('merges overlapping ranges without losing time', () => {
    const merged = mergeHistograms([
      { lo: 80, seconds: [10, 10] },
      { lo: 81, seconds: [5, 5] },
    ]);
    expect(merged).toEqual({ lo: 80, seconds: [10, 15, 5] });
  });

  it('reads a percentile off the time spent, not the number of samples', () => {
    expect(histogramPercentile({ lo: 170, seconds: [1, 1, 96, 1, 1] }, 0.5)).toBe(172);
  });

  it('summarises cadence across a log', () => {
    const startedAt = Date.parse('2026-06-01T08:00:00Z');
    const points = makeTrack({ startedAt, speedMps: 3, distanceM: 900 });
    const cadence = points.map((p, i) => ({ t: p.t, rpm: 170 + (i % 5) }));
    const activity = makeActivity({ id: 'c', startedAt, samples: makeSamples('c', points, { cadence }) });
    const summary = cadenceSummary([activity]);
    expect(summary.sessions).toBe(1);
    expect(summary.mean).toBeGreaterThan(170);
    expect(summary.mean).toBeLessThan(175);
  });
});

describe('personal bests and the power curve', () => {
  it('reads best efforts off the stored derivation, newest best first', () => {
    const slow = makeActivity({
      id: 'slow',
      startedAt: Date.parse('2026-05-01T08:00:00Z'),
      samples: makeSamples('slow', makeTrack({ startedAt: Date.parse('2026-05-01T08:00:00Z'), speedMps: 3, distanceM: 2000 })),
    });
    const fast = makeActivity({
      id: 'fast',
      startedAt: Date.parse('2026-05-08T08:00:00Z'),
      samples: makeSamples('fast', makeTrack({ startedAt: Date.parse('2026-05-08T08:00:00Z'), speedMps: 4, distanceM: 2000 })),
    });
    const [best] = computePersonalBests([slow, fast], 'run');
    expect(best.key).toBe('1k');
    expect(best.bestActivityId).toBe('fast');
    expect(best.bestS).toBeCloseTo(250, -1);
    expect(best.previousBestS).toBeCloseTo(333, -1);
  });

  it('takes the season best of each window across rides', () => {
    const startedAt = Date.parse('2026-05-01T08:00:00Z');
    const points = makeTrack({ startedAt, speedMps: 8, distanceM: 4000 });
    const ride = makeActivity({
      id: 'ride',
      sport: 'ride',
      startedAt,
      samples: makeSamples('ride', points, { power: points.map((p) => ({ t: p.t, watts: 240 })) }),
    });
    const curve = powerCurve([ride]);
    expect(curve.find((p) => p.key === '5s')?.watts).toBe(240);
    // Nothing ran for an hour, so the hour window has nothing to report.
    expect(curve.find((p) => p.key === '60m')?.watts).toBe(0);
  });
});

describe('training stress', () => {
  it('scores an hour at threshold power as about a hundred points', () => {
    const startedAt = Date.parse('2026-05-01T08:00:00Z');
    const points = makeTrack({ startedAt, speedMps: 8, distanceM: 8 * 3600 });
    const ride = makeActivity({
      id: 'ftp',
      sport: 'ride',
      startedAt,
      samples: makeSamples('ftp', points, { power: points.map((p) => ({ t: p.t, watts: 250 })) }),
    });
    const stress = activityStress(ride, makeSettings({ ftp: 250 }));
    expect(stress.source).toBe('power');
    expect(stress.value).toBeGreaterThan(90);
    expect(stress.value).toBeLessThan(110);
  });

  it('falls back to heart rate, then to perceived effort, and says which', () => {
    const startedAt = Date.parse('2026-05-01T08:00:00Z');
    const points = makeTrack({ startedAt, speedMps: 3, distanceM: 3 * 3600 });
    const withHr = makeActivity({
      id: 'hr',
      startedAt,
      samples: makeSamples('hr', points, { hr: points.map((p) => ({ t: p.t, bpm: 160 })) }),
    });
    const hrStress = activityStress(withHr, makeSettings({ lthr: 160 }));
    expect(hrStress.source).toBe('hr');
    expect(hrStress.value).toBeGreaterThan(90);
    expect(hrStress.value).toBeLessThan(110);

    const bare = makeActivity({ id: 'bare', startedAt, effort: 7, samples: makeSamples('bare', points) });
    const rpe = activityStress(bare, makeSettings());
    expect(rpe.source).toBe('rpe');
    expect(rpe.value).toBeGreaterThan(90);
    expect(rpe.value).toBeLessThan(110);
  });
});

describe('grade-adjusted pace', () => {
  it('reads a climb as faster than the clock says, and the level as itself', () => {
    const startedAt = Date.parse('2026-05-01T08:00:00Z');
    const climbPoints = makeTrack({ startedAt, speedMps: 3, distanceM: 3000, elevation: (f) => f * 150 });
    const climb = makeActivity({ id: 'climb', startedAt, samples: makeSamples('climb', climbPoints), distance: 3000 });
    const flatPoints = makeTrack({ startedAt, speedMps: 3, distanceM: 3000, elevation: () => 200 });
    const flat = makeActivity({ id: 'flat', startedAt, samples: makeSamples('flat', flatPoints), distance: 3000 });

    const climbGap = gapSecPerKm(climb);
    const flatGap = gapSecPerKm(flat);
    expect(climbGap).not.toBeNull();
    expect(flatGap).not.toBeNull();
    // A 5 % climb costs more than the level, so the flat-equivalent pace is quicker
    // than the pace actually run.
    expect(climbGap as number).toBeLessThan(1000 / 3);
    expect(flatGap as number).toBeCloseTo(1000 / 3, 0);
  });

  it('has nothing to adjust against without altitude', () => {
    expect(gapSecPerKm(makeActivity({ id: 'noele' }))).toBeNull();
  });
});

describe('gear', () => {
  it('totals distance, sessions and the last use per item', () => {
    const log = [
      makeActivity({ id: 'g1', gearId: 'shoes', distance: 10000, startedAt: Date.parse('2026-05-01T08:00:00Z') }),
      makeActivity({ id: 'g2', gearId: 'shoes', distance: 5000, startedAt: Date.parse('2026-05-05T08:00:00Z') }),
      makeActivity({ id: 'g3', gearId: null, distance: 8000, startedAt: Date.parse('2026-05-06T08:00:00Z') }),
    ];
    const usage = gearUsage(log);
    expect(usage.get('shoes')).toEqual({ km: 15, sessions: 2, lastUsed: Date.parse('2026-05-05T08:00:00Z') });
    expect(usage.has('null')).toBe(false);
  });
});
