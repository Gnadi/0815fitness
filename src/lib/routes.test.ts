import { describe, expect, it } from 'vitest';
import { clusterRoutes, isSameRoute, matchToleranceM, routeOffsetM } from './routes';
import { makeActivity, makeSamples, makeTrack } from './testFixtures';
import type { RouteSignature } from '../types';

const DAY = 86400000;
const base = Date.parse('2026-04-06T08:00:00Z');

function loop(id: string, dayOffset: number, options: { distanceM?: number; turn?: number; bearing?: number; lat?: number; speedMps?: number } = {}) {
  const startedAt = base + dayOffset * DAY;
  const points = makeTrack({
    startedAt,
    speedMps: options.speedMps ?? 3,
    distanceM: options.distanceM ?? 5000,
    turn: options.turn ?? Math.PI * 2,
    bearing: options.bearing ?? 0,
    lat: options.lat ?? 48.3,
  });
  return makeActivity({
    id,
    startedAt,
    endedAt: points[points.length - 1].t,
    distance: options.distanceM ?? 5000,
    title: `Morning Run · ${options.bearing ? 'Freinberg' : 'Donauufer Loop'}`,
    samples: makeSamples(id, points),
  });
}

const sigOf = (id: string, dayOffset: number, options?: Parameters<typeof loop>[2]) => loop(id, dayOffset, options).derived.route as RouteSignature;

describe('matching one route against another', () => {
  it('matches the same loop run again at a different pace', () => {
    const monday = sigOf('a', 0);
    const thursday = sigOf('b', 3, { speedMps: 4 });
    expect(routeOffsetM(monday, thursday)).toBeLessThan(matchToleranceM(monday.totalM));
    expect(isSameRoute(monday, thursday)).toBe(true);
  });

  it('does not match a loop that heads a different way', () => {
    expect(isSameRoute(sigOf('a', 0), sigOf('c', 1, { bearing: Math.PI / 2 }))).toBe(false);
  });

  it('does not match a route of a clearly different length', () => {
    expect(isSameRoute(sigOf('a', 0), sigOf('d', 1, { distanceM: 9000 }))).toBe(false);
  });

  it('scales its tolerance with the route, within bounds', () => {
    expect(matchToleranceM(1000)).toBe(60);
    expect(matchToleranceM(10000)).toBe(200);
    expect(matchToleranceM(100000)).toBe(250);
  });
});

describe('clustering a log', () => {
  it('groups repeats and leaves one-offs out', () => {
    const log = [
      loop('r1', 0),
      loop('r2', 7),
      loop('r3', 14),
      loop('other', 3, { bearing: Math.PI / 2, distanceM: 8000 }),
    ];
    const clusters = clusterRoutes(log);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].activities.map((a) => a.id).sort()).toEqual(['r1', 'r2', 'r3']);
    // Newest first, like every other list in the app.
    expect(clusters[0].activities[0].id).toBe('r3');
    expect(clusters[0].name).toBe('Donauufer Loop');
  });

  it('never mixes sports, however alike the tracks are', () => {
    const run = loop('run', 0);
    const ride = { ...loop('ride', 1), sport: 'ride' as const };
    expect(clusterRoutes([run, ride])).toHaveLength(0);
  });

  it('ignores sessions with no track to match', () => {
    const manual = makeActivity({ id: 'manual', hasSamples: false, samples: makeSamples('manual', []) });
    expect(clusterRoutes([loop('r1', 0), loop('r2', 7), manual])[0].activities).toHaveLength(2);
  });
});
