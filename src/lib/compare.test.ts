import { describe, expect, it } from 'vitest';
import { bestIndex, buildTrace, metricsFor, seriesByDistance, splitsFor } from './compare';
import { makeActivity, makeSamples, makeTrack } from './testFixtures';
import type { FullActivity } from '../types';

const startedAt = Date.parse('2026-05-01T08:00:00Z');

function full(options: { speedMps?: number; distanceM?: number; elevation?: (f: number) => number; hr?: number; cadence?: number } = {}): FullActivity {
  const points = makeTrack({
    startedAt,
    speedMps: options.speedMps ?? 3,
    distanceM: options.distanceM ?? 3000,
    elevation: options.elevation,
  });
  const samples = makeSamples('a1', points, {
    hr: options.hr ? points.map((p) => ({ t: p.t, bpm: options.hr as number })) : [],
    cadence: options.cadence ? points.map((p) => ({ t: p.t, rpm: options.cadence as number })) : [],
  });
  const activity = makeActivity({
    id: 'a1',
    startedAt,
    endedAt: points[points.length - 1].t,
    distance: options.distanceM ?? 3000,
    samples,
  });
  return { ...activity, samples };
}

describe('the per-second trace', () => {
  it('puts an activity on a one-second grid', () => {
    const trace = buildTrace(full({ speedMps: 3, distanceM: 3000 }));
    expect(trace.totalS).toBe(1000);
    expect(trace.totalM).toBeCloseTo(3000, -1);
    expect(trace.distM).toHaveLength(1001);
  });

  it('has nothing to draw for a session with no track', () => {
    const bare = makeActivity({ id: 'bare', hasSamples: false, samples: makeSamples('bare', []) });
    expect(buildTrace({ ...bare, samples: makeSamples('bare', []) }).totalS).toBe(0);
  });

  it('leaves the seconds a sensor was not yet reporting for as the hole they were', () => {
    const points = makeTrack({ startedAt, speedMps: 3, distanceM: 1800 });
    // A strap paired five minutes into the run, then reporting steadily.
    const hr = points.filter((p) => p.t - points[0].t >= 300000).map((p) => ({ t: p.t, bpm: 150 }));
    const samples = makeSamples('gap', points, { hr });
    const activity = makeActivity({ id: 'gap', startedAt, samples });
    const trace = buildTrace({ ...activity, samples });
    // Nothing is invented more than three minutes either side of a reading.
    expect(trace.hr[0]).toBeNull();
    expect(trace.hr[200]).toBeCloseTo(150, 0);
    expect(trace.hr[trace.totalS]).toBeCloseTo(150, 0);
  });
});

describe('splits', () => {
  it('cuts at the split length and keeps the short final one distinguishable', () => {
    const splits = splitsFor(buildTrace(full({ speedMps: 3, distanceM: 2500 })), 1000);
    expect(splits).toHaveLength(3);
    expect(splits[0].distanceM).toBeCloseTo(1000, 0);
    expect(splits[0].paceS).toBeCloseTo(1000 / 3, -1);
    expect(splits[2].distanceM).toBeLessThan(600);
  });

  it('cuts at a mile when that is the unit', () => {
    const splits = splitsFor(buildTrace(full({ speedMps: 3, distanceM: 3300 })), 1609.344);
    expect(splits[0].distanceM).toBeCloseTo(1609.344, 0);
  });

  it('grade-adjusts a split where there is altitude, and reports null where there is not', () => {
    const climbing = splitsFor(buildTrace(full({ distanceM: 2000, elevation: (f) => f * 100 })), 1000);
    expect(climbing[0].gapS).not.toBeNull();
    expect(climbing[0].gapS as number).toBeLessThan(climbing[0].paceS);

    const flat = splitsFor(buildTrace(full({ distanceM: 2000 })), 1000);
    expect(flat[0].gapS).toBeNull();
  });

  it('averages the sensor channels over the split', () => {
    const splits = splitsFor(buildTrace(full({ distanceM: 2000, hr: 150, cadence: 176 })), 1000);
    expect(splits[0].avgHr).toBeCloseTo(150, 0);
    expect(splits[0].avgCadence).toBeCloseTo(176, 0);
  });
});

describe('the distance axis', () => {
  it('reads pace from the time it took to cross each bucket', () => {
    const series = seriesByDistance(buildTrace(full({ speedMps: 4, distanceM: 2000 })), 500, 4);
    expect(series.pace[0]).toBeCloseTo(250, 0);
    expect(series.pace.filter((p) => p != null)).toHaveLength(4);
  });

  it('leaves a sliver of a bucket out rather than calling it a split', () => {
    const series = seriesByDistance(buildTrace(full({ speedMps: 3, distanceM: 1100 })), 1000, 2);
    expect(series.pace[0]).not.toBeNull();
    expect(series.pace[1]).toBeNull();
  });
});

describe('metrics', () => {
  it('reads the session off its stored derivation', () => {
    const metrics = metricsFor(full({ speedMps: 3, distanceM: 3000, hr: 150, cadence: 176 }));
    expect(metrics.distanceKm).toBeCloseTo(3);
    expect(metrics.paceS).toBeCloseTo(1000 / 3, 0);
    expect(metrics.avgHr).toBeCloseTo(150, 0);
    expect(metrics.avgCadence).toBeCloseTo(176, 0);
    expect(metrics.best1kS).toBeGreaterThan(0);
  });
});

describe('picking the better figure', () => {
  it('marks the best where better has a direction', () => {
    expect(bestIndex([300, 280, 320], 'lower')).toBe(1);
    expect(bestIndex([300, 280, 320], 'higher')).toBe(2);
  });

  it('marks nothing where it does not, where there is a tie, or where there is only one value', () => {
    expect(bestIndex([300, 280])).toBe(-1);
    expect(bestIndex([280, 280], 'lower')).toBe(-1);
    expect(bestIndex([300, null], 'lower')).toBe(-1);
  });
});
