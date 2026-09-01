import { describe, expect, it } from 'vitest';
import { awardMedals, medalsFor, medalTally, MIN_PRIOR } from './medals';
import { makeActivity, makeSamples, makeTrack } from './testFixtures';
import type { Activity } from '../types';

const DAY = 86400000;
const day0 = Date.parse('2026-03-02T08:00:00Z');

/** One session on the same loop, at the speed given — which is the only thing that
 *  differs between the repeats these tests are built from. */
function repeat(index: number, speedMps: number, overrides: Partial<Activity> = {}): Activity {
  const startedAt = day0 + index * 7 * DAY;
  const points = makeTrack({ startedAt, speedMps, distanceM: 5000, turn: Math.PI * 2 });
  const samples = makeSamples(`r${index}`, points);
  return makeActivity({
    id: `r${index}`,
    startedAt,
    endedAt: points[points.length - 1].t,
    title: `Morning Run · Donauufer Loop`,
    distance: 5000,
    samples,
    ...overrides,
  });
}

describe('what earns a medal', () => {
  it('awards nothing until there is a field to beat', () => {
    const early = [repeat(0, 3), repeat(1, 3.1), repeat(2, 3.2)];
    const medals = awardMedals(early);
    expect(medals.size).toBe(0);
    expect(MIN_PRIOR).toBe(3);
  });

  it('gives gold to the session that beat everything older than it', () => {
    // Three ordinary repeats, then a fast one.
    const log = [repeat(0, 3), repeat(1, 3.05), repeat(2, 2.95), repeat(3, 3.6)];
    const medals = medalsFor(log[3], log);
    const route = medals.find((m) => m.kind === 'route');
    expect(route?.tier).toBe('gold');
    expect(route?.label).toBe('Donauufer Loop');
    expect(route?.detail).toContain('faster than the previous best');
  });

  it('ranks a session that was good but not the best', () => {
    // Two faster times in the history and three slower ones, so this comes third of
    // six — a placing, and a session better than most of what came before it.
    const log = [repeat(0, 2.6), repeat(1, 2.7), repeat(2, 2.8), repeat(3, 3.5), repeat(4, 3.6), repeat(5, 3.2)];
    const route = medalsFor(log[5], log).find((m) => m.kind === 'route');
    expect(route?.tier).toBe('bronze');
    expect(route?.rank).toBe(3);
    expect(route?.detail).toContain('third best of 6');
  });

  it('gives nothing to a session slower than three earlier ones', () => {
    const log = [repeat(0, 3.6), repeat(1, 3.5), repeat(2, 3.4), repeat(3, 2.6)];
    expect(medalsFor(log[3], log).some((m) => m.kind === 'route')).toBe(false);
  });

  it('refuses a placing in a thin field that was not actually an improvement', () => {
    // Third of four: a placing, but slower than most of what came before it — the
    // bronze that used to make achievements worth nothing.
    const log = [repeat(0, 3.6), repeat(1, 3.5), repeat(2, 2.9), repeat(3, 3.2)];
    expect(medalsFor(log[3], log).some((m) => m.kind === 'route')).toBe(false);
  });

  it('is decided by what came before, so a later session cannot take a medal away', () => {
    const first = [repeat(0, 3), repeat(1, 3.05), repeat(2, 2.95), repeat(3, 3.6)];
    const before = medalsFor(first[3], first);
    // Two faster sessions afterwards would have pushed it to third — if medals were
    // ranked against the whole log rather than against its own past.
    const later = [...first, repeat(4, 3.9), repeat(5, 4.1)];
    expect(medalsFor(first[3], later)).toEqual(before);
  });
});

describe('medals for the sections inside a session', () => {
  it('marks the kilometres that were the fastest that stretch has been', () => {
    const history = [repeat(0, 3), repeat(1, 3), repeat(2, 3)];
    const faster = repeat(3, 3.4);
    const medals = medalsFor(faster, [...history, faster]);
    const segments = medals.filter((m) => m.kind === 'segment');
    // Five kilometres of loop, every one of them quicker than all three earlier times.
    expect(segments).toHaveLength(4);
    expect(segments.every((m) => m.tier === 'gold')).toBe(true);
    expect(segments.map((m) => m.km)).toEqual([1, 2, 3, 4]);
  });

  it('marks only the section that improved, not the whole session', () => {
    const history = [repeat(0, 3), repeat(1, 3), repeat(2, 3)];
    // The same loop, but the third kilometre run hard and the rest a shade slower.
    const mixed = repeat(3, 3);
    mixed.derived = { ...mixed.derived, kmSplitS: mixed.derived.kmSplitS.map((s, i) => (i === 2 ? s * 0.85 : s * 1.05)) };
    const segments = medalsFor(mixed, [...history, mixed]).filter((m) => m.kind === 'segment');
    expect(segments).toHaveLength(1);
    expect(segments[0].km).toBe(3);
    expect(segments[0].tier).toBe('gold');
    expect(segments[0].label).toBe('Kilometre 3');
  });

  it('does not rank a section against the same loop run the other way round', () => {
    const history = [repeat(0, 3), repeat(1, 3), repeat(2, 3)];
    const startedAt = day0 + 3 * 7 * DAY;
    // The identical loop, covered backwards: the same route, but its fourth kilometre
    // is a different stretch of road.
    const backwards = makeTrack({ startedAt, speedMps: 3.4, distanceM: 5000, turn: -Math.PI * 2, bearing: Math.PI });
    const other = makeActivity({
      id: 'rev',
      startedAt,
      endedAt: backwards[backwards.length - 1].t,
      title: 'Morning Run · Donauufer Loop',
      distance: 5000,
      samples: makeSamples('rev', backwards),
    });
    const medals = medalsFor(other, [...history, other]);
    expect(medals.some((m) => m.kind === 'segment')).toBe(false);
  });

  it('says what a section beat', () => {
    const history = [repeat(0, 3), repeat(1, 3), repeat(2, 3)];
    const faster = repeat(3, 3.4);
    const segment = medalsFor(faster, [...history, faster]).find((m) => m.kind === 'segment');
    expect(segment?.detail).toMatch(/faster than the previous best|your best over/);
  });
});

describe('medals for a best effort', () => {
  it('gives a run its fastest kilometre against every earlier run', () => {
    const runs = [0, 1, 2].map((i) => {
      const startedAt = day0 + i * DAY;
      const points = makeTrack({ startedAt, speedMps: 3, distanceM: 4000, bearing: i });
      return makeActivity({ id: `e${i}`, startedAt, endedAt: points[points.length - 1].t, distance: 4000, samples: makeSamples(`e${i}`, points) });
    });
    const startedAt = day0 + 4 * DAY;
    const points = makeTrack({ startedAt, speedMps: 4.2, distanceM: 4000, bearing: 5 });
    const quick = makeActivity({ id: 'quick', startedAt, endedAt: points[points.length - 1].t, distance: 4000, samples: makeSamples('quick', points) });

    const effort = medalsFor(quick, [...runs, quick]).find((m) => m.kind === 'effort');
    expect(effort?.tier).toBe('gold');
    expect(effort?.label).toBe('Fastest 1 km');
  });

  it("reads a ride's power curve rather than a run's distances", () => {
    const rides = [180, 190, 200, 260].map((watts, i) => {
      const startedAt = day0 + i * DAY;
      const points = makeTrack({ startedAt, speedMps: 8, distanceM: 20000, bearing: i });
      const samples = makeSamples(`p${i}`, points, { power: points.map((p) => ({ t: p.t, watts })) });
      return makeActivity({ id: `p${i}`, sport: 'ride', startedAt, endedAt: points[points.length - 1].t, distance: 20000, samples });
    });
    const medals = medalsFor(rides[3], rides);
    expect(medals.some((m) => m.kind === 'effort' && m.tier === 'gold')).toBe(true);
    expect(medals.every((m) => !m.label.includes('km'))).toBe(true);
  });
});

describe('reading a handful of medals', () => {
  it('lists gold first, and the whole session before its sections', () => {
    const history = [repeat(0, 3), repeat(1, 3), repeat(2, 3)];
    const faster = repeat(3, 3.4);
    const medals = medalsFor(faster, [...history, faster]);
    expect(medals[0].rank).toBe(1);
    const kinds = medals.map((m) => m.kind);
    expect(kinds.indexOf('route')).toBeLessThan(kinds.indexOf('segment'));
  });

  it('counts the tiers for the badge a card carries', () => {
    const history = [repeat(0, 3), repeat(1, 3), repeat(2, 3)];
    const faster = repeat(3, 3.4);
    const tally = medalTally(medalsFor(faster, [...history, faster]));
    expect(tally.total).toBeGreaterThan(0);
    expect(tally.gold + tally.silver + tally.bronze).toBe(tally.total);
  });

  it('has nothing to say about a log with no repeats in it', () => {
    expect(awardMedals([makeActivity()]).size).toBe(0);
    expect(awardMedals([]).size).toBe(0);
  });
});
