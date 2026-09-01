import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import * as db from './db';
import { makeActivity, makeSamples, makeTrack } from './testFixtures';

const startedAt = Date.parse('2026-05-01T08:00:00Z');

function withSamples(id: string, dayOffset = 0) {
  const start = startedAt + dayOffset * 86400000;
  const points = makeTrack({ startedAt: start, speedMps: 3, distanceM: 900 });
  const samples = makeSamples(id, points);
  return { activity: makeActivity({ id, startedAt: start, samples }), samples };
}

beforeEach(async () => {
  // A fresh database per test: fake-indexeddb keeps one per factory.
  globalThis.indexedDB = new IDBFactory();
  db.resetDbHandle();
});

describe('the store', () => {
  it('keeps summaries and samples apart, and reads them back', async () => {
    const { activity, samples } = withSamples('a1');
    await db.putActivity(activity, samples);

    const summaries = await db.getAllActivities();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].id).toBe('a1');
    // The summary alone carries no sample arrays — that is the point of the split.
    expect(Object.keys(summaries[0])).not.toContain('points');

    const loaded = await db.getSamples('a1');
    expect(loaded?.points).toHaveLength(samples.points.length);
  });

  it('returns the log newest first', async () => {
    await db.putManyActivities([withSamples('old', 0), withSamples('new', 5)]);
    expect((await db.getAllActivities()).map((a) => a.id)).toEqual(['new', 'old']);
  });

  it('updates a summary without disturbing its samples', async () => {
    const { activity, samples } = withSamples('a1');
    await db.putActivity(activity, samples);
    await db.putActivitySummary({ ...activity, title: 'Renamed' });

    expect((await db.getAllActivities())[0].title).toBe('Renamed');
    expect((await db.getSamples('a1'))?.points).toHaveLength(samples.points.length);
  });

  it('takes the samples with the activity when one is deleted', async () => {
    const { activity, samples } = withSamples('a1');
    await db.putActivity(activity, samples);
    await db.deleteActivity('a1');
    expect(await db.getAllActivities()).toHaveLength(0);
    expect(await db.getSamples('a1')).toBeNull();
  });

  it('deletes a named set and leaves the rest alone', async () => {
    await db.putManyActivities([withSamples('a', 0), withSamples('b', 1), withSamples('c', 2)]);
    await db.deleteActivities(['a', 'c']);
    expect((await db.getAllActivities()).map((a) => a.id)).toEqual(['b']);
    expect(await db.getSamples('b')).not.toBeNull();
  });

  it('reads several sample streams in one pass', async () => {
    await db.putManyActivities([withSamples('a', 0), withSamples('b', 1)]);
    const loaded = await db.getManySamples(['a', 'b', 'missing']);
    expect([...loaded.keys()].sort()).toEqual(['a', 'b']);
  });

  it('stores and clears the key/value slot the checkpoint lives in', async () => {
    await db.setKv('session.inflight', { distanceM: 1200 });
    expect(await db.getKv<{ distanceM: number }>('session.inflight')).toEqual({ distanceM: 1200 });
    await db.deleteKv('session.inflight');
    expect(await db.getKv('session.inflight')).toBeNull();
  });

  it('does not choke on an empty database', async () => {
    expect(await db.getAllActivities()).toEqual([]);
    expect(await db.getManySamples([])).toEqual(new Map());
  });
});
