import { describe, expect, it } from 'vitest';
import { latToWorldY, lonToWorldX, planTiles, projectToView, thinTrack, thinTrackWithGaps, TILE_SIZE, tileUrl, trackPaths } from './tiles';
import { makeTrack } from './testFixtures';

const startedAt = Date.parse('2026-05-01T08:00:00Z');

describe('the projection', () => {
  it('puts the null island at the middle of the world', () => {
    expect(lonToWorldX(0, 0)).toBeCloseTo(TILE_SIZE / 2, 6);
    expect(latToWorldY(0, 0)).toBeCloseTo(TILE_SIZE / 2, 6);
  });

  it('puts the date line at the edges and the north at the top', () => {
    expect(lonToWorldX(-180, 0)).toBeCloseTo(0, 6);
    expect(lonToWorldX(180, 0)).toBeCloseTo(TILE_SIZE, 6);
    expect(latToWorldY(85.05, 0)).toBeLessThan(1);
  });

  it('clamps past the Mercator limit rather than running to infinity', () => {
    expect(isFinite(latToWorldY(90, 3))).toBe(true);
    expect(isFinite(latToWorldY(-90, 3))).toBe(true);
  });

  it('doubles the world with each zoom step', () => {
    expect(lonToWorldX(14.28, 5)).toBeCloseTo(lonToWorldX(14.28, 4) * 2, 6);
  });
});

describe('framing a track', () => {
  const points = makeTrack({ startedAt, speedMps: 3, distanceM: 5000, turn: Math.PI * 2 });

  it('fits the whole track inside the viewport', () => {
    const view = planTiles(points, 358, 220);
    expect(view).not.toBeNull();
    const projected = points.map((p) => projectToView(p, view!));
    expect(Math.min(...projected.map((p) => p.x))).toBeGreaterThanOrEqual(0);
    expect(Math.max(...projected.map((p) => p.x))).toBeLessThanOrEqual(358);
    expect(Math.min(...projected.map((p) => p.y))).toBeGreaterThanOrEqual(0);
    expect(Math.max(...projected.map((p) => p.y))).toBeLessThanOrEqual(220);
  });

  it('zooms in further for a shorter track', () => {
    const short = planTiles(makeTrack({ startedAt, speedMps: 3, distanceM: 500, turn: Math.PI * 2 }), 358, 220);
    const long = planTiles(makeTrack({ startedAt, speedMps: 3, distanceM: 20000, turn: Math.PI * 2 }), 358, 220);
    expect(short!.zoom).toBeGreaterThan(long!.zoom);
  });

  it('covers the viewport with tiles and no more', () => {
    const view = planTiles(points, 358, 220)!;
    for (const tile of view.tiles) {
      expect(tile.left).toBeLessThan(view.width);
      expect(tile.top).toBeLessThan(view.height);
      expect(tile.left + TILE_SIZE).toBeGreaterThan(0);
      expect(tile.top + TILE_SIZE).toBeGreaterThan(0);
      expect(tile.x).toBeGreaterThanOrEqual(0);
      expect(tile.y).toBeGreaterThanOrEqual(0);
      expect(tile.x).toBeLessThan(2 ** tile.z);
      expect(tile.y).toBeLessThan(2 ** tile.z);
    }
    // A 358×220 viewport needs at most a 3×2 grid of 256 px tiles.
    expect(view.tiles.length).toBeLessThanOrEqual(6);
  });

  it('asks for no tile above the pole', () => {
    const polar = planTiles([{ lat: 84.9, lon: 0 }, { lat: 84.95, lon: 0.1 }], 358, 220);
    expect(polar!.tiles.every((t) => t.y >= 0 && t.y < 2 ** t.z)).toBe(true);
  });

  it('wraps rather than breaks across the date line', () => {
    const view = planTiles([{ lat: 0, lon: 179.95 }, { lat: 0.01, lon: -179.95 }], 358, 220);
    expect(view!.tiles.every((t) => t.x >= 0 && t.x < 2 ** t.z)).toBe(true);
  });

  it('has nothing to frame without points', () => {
    expect(planTiles([], 358, 220)).toBeNull();
    expect(planTiles([{ lat: NaN, lon: NaN }], 358, 220)).toBeNull();
  });

  it('still frames a session that never moved', () => {
    const view = planTiles([{ lat: 48.3, lon: 14.28 }], 358, 220);
    expect(view).not.toBeNull();
    expect(view!.zoom).toBeGreaterThan(10);
  });
});

describe('drawing the track', () => {
  it('thins a long track to something a screen can resolve, keeping both ends', () => {
    const points = makeTrack({ startedAt, speedMps: 3, distanceM: 20000 });
    const thinned = thinTrack(points, 200);
    expect(thinned.length).toBeLessThanOrEqual(201);
    expect(thinned[0]).toBe(points[0]);
    expect(thinned[thinned.length - 1]).toBe(points[points.length - 1]);
  });

  it('leaves a short track alone', () => {
    const points = makeTrack({ startedAt, speedMps: 3, distanceM: 300 });
    expect(thinTrack(points, 600)).toBe(points);
  });
});

describe('the tile server', () => {
  it('addresses OpenStreetMap over https', () => {
    expect(tileUrl({ z: 14, x: 8807, y: 5681, left: 0, top: 0 })).toBe('https://tile.openstreetmap.org/14/8807/5681.png');
  });
});

describe('drawing a track that has holes in it', () => {
  const at = (second: number, lat: number) => ({ t: Date.parse('2026-05-01T08:00:00Z') + second * 1000, lat, lon: 14.28 });
  const view = planTiles([at(0, 48.30), at(1, 48.34)], 358, 220)!;

  it('draws a continuous track as one recorded stroke and nothing inferred', () => {
    const points = Array.from({ length: 40 }, (_, i) => at(i, 48.3 + i * 0.001));
    const paths = trackPaths(points, view, 20);
    expect(paths.inferred).toBe('');
    expect(paths.recorded.match(/M/g)).toHaveLength(1);
  });

  it('lifts the recorded stroke across a gap and draws the guess separately', () => {
    // Ten fixes, twenty minutes of nothing, ten more.
    const first = Array.from({ length: 10 }, (_, i) => at(i, 48.3 + i * 0.001));
    const second = Array.from({ length: 10 }, (_, i) => at(1200 + i, 48.32 + i * 0.001));
    const paths = trackPaths([...first, ...second], view, 20);
    // Two recorded strokes, and one straight line joining them.
    expect(paths.recorded.match(/M/g)).toHaveLength(2);
    expect(paths.inferred.match(/M/g)).toHaveLength(1);
    expect(paths.inferred).toContain('L');
  });

  it('draws two fixes far apart as a guess and no recorded stroke between them', () => {
    const paths = trackPaths([at(0, 48.3), at(1161, 48.34)], view, 20);
    expect(paths.inferred).not.toBe('');
    // Both endpoints are moves, so nothing is claimed as recorded route.
    expect(paths.recorded.includes('L')).toBe(false);
  });

  it('does not mistake a thinning stride for a gap', () => {
    // An hour at 1 Hz thins to a stride well over the twenty-second gap threshold; the
    // gaps are found on the full track, so none of these strides count as one.
    const points = Array.from({ length: 3600 }, (_, i) => at(i, 48.3 + i * 0.00001));
    const marked = thinTrackWithGaps(points, 600, 20);
    expect(marked.length).toBeLessThanOrEqual(601);
    expect(marked.some((m) => m.gapBefore)).toBe(false);
  });

  it('keeps the first and last fix through thinning', () => {
    const points = Array.from({ length: 2000 }, (_, i) => at(i, 48.3 + i * 0.00001));
    const marked = thinTrackWithGaps(points, 600, 20);
    expect(marked[0].point).toBe(points[0]);
    expect(marked[marked.length - 1].point).toBe(points[points.length - 1]);
  });
});
