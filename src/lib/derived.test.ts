import { describe, expect, it } from 'vitest';
import {
  bestEffortOnGrid,
  deriveActivity,
  DERIVED_VERSION,
  gradeAdjustedDistance,
  gradeFactor,
  histogramMean,
  manualDerived,
  maxAvgPowerForWindow,
  movingSeconds,
  normalizedPower,
  routeSignature,
  ROUTE_POINTS,
  thinElevation,
  trackQuality,
} from './derived';
import { makeSamples, makeTrack } from './testFixtures';

const startedAt = Date.parse('2026-05-01T08:00:00Z');

describe('best effort', () => {
  it('finds the fastest window rather than the first one', () => {
    // A metre per second for ten seconds, then two metres per second for ten.
    const grid = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20];
    expect(bestEffortOnGrid(grid, 6)).toBe(3);
  });

  it('reports nothing for a distance the session never covered', () => {
    expect(bestEffortOnGrid([0, 1, 2], 100)).toBeNull();
  });
});

describe('power', () => {
  it('takes the best mean over a window, not the whole-ride mean', () => {
    const grid = [...new Array(60).fill(100), ...new Array(60).fill(300)];
    expect(maxAvgPowerForWindow(grid, 60)).toBeCloseTo(300);
    expect(maxAvgPowerForWindow(grid, 120)).toBeCloseTo(200);
    expect(maxAvgPowerForWindow(grid, 200)).toBeNull();
  });

  it('scores a surging ride above its mean, and a steady one at it', () => {
    const steady = new Array(600).fill(200);
    const surging: number[] = [];
    for (let i = 0; i < 600; i++) surging.push(i % 120 < 60 ? 100 : 300);
    const steadyNp = normalizedPower(steady) as number;
    const surgingNp = normalizedPower(surging) as number;
    expect(steadyNp).toBeCloseTo(200, 0);
    // Both average 200 W; the fourth-power weighting is what makes the surging ride cost more.
    expect(surgingNp).toBeGreaterThan(steadyNp + 15);
  });
});

describe('grade adjustment', () => {
  it('costs the level at one, a climb above it and a gentle descent below', () => {
    expect(gradeFactor(0)).toBeCloseTo(1, 3);
    expect(gradeFactor(0.1)).toBeCloseTo(1.66, 1);
    expect(gradeFactor(-0.05)).toBeLessThan(1);
    // Braking down a steep descent is work again.
    expect(gradeFactor(-0.3)).toBeGreaterThan(gradeFactor(-0.1));
  });

  it('makes a climb measure longer than the ground it covered', () => {
    const climb = makeTrack({ startedAt, speedMps: 3, distanceM: 2000, elevation: (f) => f * 100 });
    const flat = makeTrack({ startedAt, speedMps: 3, distanceM: 2000, elevation: () => 300 });
    expect(gradeAdjustedDistance(climb) as number).toBeGreaterThan(2400);
    expect(gradeAdjustedDistance(flat) as number).toBeCloseTo(2000, -2);
  });

  it('returns nothing when the device reported no altitude', () => {
    expect(gradeAdjustedDistance(makeTrack({ startedAt, speedMps: 3, distanceM: 2000 }))).toBeNull();
  });
});

describe('moving time', () => {
  it('leaves out the seconds spent standing still', () => {
    const moving = makeTrack({ startedAt, speedMps: 3, distanceM: 300 });
    const stopped = Array.from({ length: 60 }, (_, i) => ({
      t: moving[moving.length - 1].t + (i + 1) * 1000,
      lat: moving[moving.length - 1].lat,
      lon: moving[moving.length - 1].lon,
    }));
    const seconds = movingSeconds([...moving, ...stopped]);
    expect(seconds).toBeCloseTo(100, 0);
  });
});

describe('elevation thinning', () => {
  it('reads a device with no altimeter as an absent profile, not flat ground', () => {
    expect(thinElevation(makeTrack({ startedAt, speedMps: 3, distanceM: 600 }))).toEqual([0, 0]);
  });

  it('keeps the last fix so a descent is not cut short', () => {
    const points = makeTrack({ startedAt, speedMps: 3, distanceM: 3000, elevation: (f) => 100 + f * 50 });
    const profile = thinElevation(points, 16);
    expect(profile[profile.length - 1]).toBeCloseTo(150, 0);
  });
});

describe('route signature', () => {
  it('reduces a track to a fixed number of start-relative points', () => {
    const sig = routeSignature(makeTrack({ startedAt, speedMps: 3, distanceM: 3000, turn: Math.PI * 2 }));
    expect(sig).not.toBeNull();
    expect((sig as NonNullable<typeof sig>).shape).toHaveLength(ROUTE_POINTS * 2);
    expect((sig as NonNullable<typeof sig>).shape[0]).toBe(0);
    expect((sig as NonNullable<typeof sig>).shape[1]).toBe(0);
  });

  it('has nothing to say about a track too short to be a route', () => {
    expect(routeSignature(makeTrack({ startedAt, speedMps: 1, distanceM: 50 }))).toBeNull();
  });
});

describe('the whole derivation', () => {
  it('carries the version it was computed at, so a later build can re-derive it', () => {
    const points = makeTrack({ startedAt, speedMps: 3, distanceM: 3000 });
    const derived = deriveActivity({ sport: 'run', startedAt, endedAt: points[points.length - 1].t, samples: makeSamples('x', points) });
    expect(derived.version).toBe(DERIVED_VERSION);
  });

  it('files best efforts under runs and the power curve under rides', () => {
    const points = makeTrack({ startedAt, speedMps: 5, distanceM: 6000 });
    const samples = makeSamples('x', points, { power: points.map((p) => ({ t: p.t, watts: 220 })) });
    const endedAt = points[points.length - 1].t;

    const asRun = deriveActivity({ sport: 'run', startedAt, endedAt, samples });
    expect(asRun.pbEfforts['1k']).toBeGreaterThan(0);
    expect(Object.keys(asRun.powerBests)).toHaveLength(0);

    const asRide = deriveActivity({ sport: 'ride', startedAt, endedAt, samples });
    expect(Object.keys(asRide.pbEfforts)).toHaveLength(0);
    expect(asRide.powerBests['5s']).toBe(220);
  });

  it('weights the heart-rate histogram by time held, not by samples counted', () => {
    const points = makeTrack({ startedAt, speedMps: 3, distanceM: 900 });
    // One reading of 190, held for a single second; the rest at 140.
    const hr = points.map((p, i) => ({ t: p.t, bpm: i === 0 ? 190 : 140 }));
    const derived = deriveActivity({ sport: 'run', startedAt, endedAt: points[points.length - 1].t, samples: makeSamples('x', points, { hr }) });
    expect(derived.hrHist).not.toBeNull();
    expect(histogramMean(derived.hrHist) as number).toBeLessThan(141);
    expect(derived.maxHr).toBe(190);
  });

  it('gives a hand-entered session honest nulls rather than zeroes', () => {
    const derived = manualDerived({ movingS: 2700, avgHr: 145 });
    expect(derived.avgPower).toBeNull();
    expect(derived.decoupling).toBeNull();
    expect(derived.route).toBeNull();
    // A stated average still lands in a zone, as one bucket covering the session.
    expect(derived.hrHist).toEqual({ lo: 145, seconds: [2700] });
  });
});

describe('how well the fixes covered the session', () => {
  const at = (second: number) => ({ t: startedAt + second * 1000, lat: 48.3 + second * 0.0001, lon: 14.28 });

  it('reads a steady 1 Hz track as fully covered', () => {
    const points = makeTrack({ startedAt, speedMps: 3, distanceM: 900 });
    const quality = trackQuality(points, startedAt, points[points.length - 1].t);
    expect(quality.gaps).toBe(0);
    expect(quality.medianIntervalS).toBe(1);
    expect(quality.coverage).toBeGreaterThan(0.99);
  });

  it('finds the stretch where the app was in the background', () => {
    // Two minutes of riding, then nineteen minutes of nothing, then one more fix.
    const points = [...Array.from({ length: 120 }, (_, i) => at(i)), at(119 + 19 * 60)];
    const quality = trackQuality(points, points[0].t, points[points.length - 1].t);
    expect(quality.gaps).toBe(1);
    expect(quality.longestGapS).toBeCloseTo(19 * 60, 0);
    expect(quality.coverage).toBeLessThan(0.15);
  });

  it('calls a two-fix session what it is', () => {
    const points = [at(0), at(1161)];
    const quality = trackQuality(points, points[0].t, points[1].t);
    expect(quality.fixes).toBe(2);
    expect(quality.gaps).toBe(1);
    expect(quality.longestGapS).toBeCloseTo(1161, 0);
    expect(quality.coverage).toBe(0);
  });

  it('counts the wait before the first fix as uncovered', () => {
    const points = Array.from({ length: 60 }, (_, i) => at(300 + i));
    const quality = trackQuality(points, startedAt, points[points.length - 1].t);
    expect(quality.longestGapS).toBeCloseTo(300, 0);
  });

  it('has nothing to report for a session with no track at all', () => {
    expect(trackQuality([], startedAt, startedAt + 60000).fixes).toBe(0);
  });

  it('is carried on the stored derivation', () => {
    const points = makeTrack({ startedAt, speedMps: 3, distanceM: 900 });
    const derived = deriveActivity({ sport: 'run', startedAt, endedAt: points[points.length - 1].t, samples: makeSamples('x', points) });
    expect(derived.track.fixes).toBe(points.length);
  });
});
