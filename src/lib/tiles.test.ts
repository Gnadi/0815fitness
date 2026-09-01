import { describe, expect, it } from 'vitest';
import {
  fitFraming,
  latToWorldY,
  lonToWorldX,
  markerSpacingM,
  paceRibbon,
  panFraming,
  planTiles,
  positionsAtDistances,
  projectToView,
  thinTrack,
  thinTrackWithGaps,
  tilePixels,
  TILE_SIZE,
  tileUrl,
  trackPaths,
  unprojectFromView,
  viewFor,
  zoomFramingAt,
} from './tiles';
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

  it('fills the frame it is given rather than the nearest whole zoom', () => {
    // The fit used to be floored to a whole zoom, which at worst drew a track at half
    // the size of its frame. Drawing the lower zoom's tiles enlarged closes that gap.
    const view = planTiles(points, 358, 220)!;
    const projected = points.map((p) => projectToView(p, view));
    const spanX = Math.max(...projected.map((p) => p.x)) - Math.min(...projected.map((p) => p.x));
    const spanY = Math.max(...projected.map((p) => p.y)) - Math.min(...projected.map((p) => p.y));
    expect(Math.max(spanX / 358, spanY / 220)).toBeGreaterThan(0.8);
    expect(view.scale).toBeGreaterThanOrEqual(1);
    expect(view.scale).toBeLessThan(2);
  });

  it('centres the track in the frame', () => {
    const view = planTiles(points, 358, 220)!;
    const projected = points.map((p) => projectToView(p, view));
    const midX = (Math.max(...projected.map((p) => p.x)) + Math.min(...projected.map((p) => p.x))) / 2;
    const midY = (Math.max(...projected.map((p) => p.y)) + Math.min(...projected.map((p) => p.y))) / 2;
    expect(midX).toBeCloseTo(179, 0);
    expect(midY).toBeCloseTo(110, 0);
  });

  it('zooms in further for a shorter track', () => {
    const short = planTiles(makeTrack({ startedAt, speedMps: 3, distanceM: 500, turn: Math.PI * 2 }), 358, 220);
    const long = planTiles(makeTrack({ startedAt, speedMps: 3, distanceM: 20000, turn: Math.PI * 2 }), 358, 220);
    expect(short!.zoom).toBeGreaterThan(long!.zoom);
  });

  it('covers the viewport with tiles and no more', () => {
    const view = planTiles(points, 358, 220)!;
    const drawn = tilePixels(view);
    for (const tile of view.tiles) {
      expect(tile.left).toBeLessThan(view.width);
      expect(tile.top).toBeLessThan(view.height);
      expect(tile.left + drawn).toBeGreaterThan(0);
      expect(tile.top + drawn).toBeGreaterThan(0);
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

describe('moving the map', () => {
  const points = makeTrack({ startedAt, speedMps: 3, distanceM: 4000, turn: Math.PI * 2 });
  const framing = fitFraming(points, 360, 480)!;
  const view = viewFor(framing, 360, 480);

  it('reads a viewport coordinate back to the place it is showing', () => {
    const at = projectToView(points[0], view);
    const back = unprojectFromView(at.x, at.y, view);
    expect(back.lat).toBeCloseTo(points[0].lat, 6);
    expect(back.lon).toBeCloseTo(points[0].lon, 6);
  });

  it('moves what is under a drag by exactly the drag', () => {
    const before = projectToView(points[0], view);
    const dragged = viewFor(panFraming(view, 40, -25), 360, 480);
    const after = projectToView(points[0], dragged);
    expect(after.x - before.x).toBeCloseTo(40, 3);
    expect(after.y - before.y).toBeCloseTo(-25, 3);
  });

  it('keeps the point a pinch is anchored on under the fingers', () => {
    const anchor = { x: 96, y: 300 };
    const under = unprojectFromView(anchor.x, anchor.y, view);
    const zoomed = viewFor(zoomFramingAt(view, 1.4, anchor.x, anchor.y), 360, 480);
    const after = projectToView(under, zoomed);
    expect(after.x).toBeCloseTo(anchor.x, 2);
    expect(after.y).toBeCloseTo(anchor.y, 2);
  });

  it('refuses to zoom past the map itself', () => {
    expect(zoomFramingAt(view, 40, 180, 240).zoom).toBe(18);
    expect(zoomFramingAt(view, -40, 180, 240).zoom).toBe(1);
  });
});

describe('colouring the track by pace', () => {
  const view = planTiles(makeTrack({ startedAt, speedMps: 3, distanceM: 2000 }), 358, 220)!;

  it('leaves a metronomic session the plain track, and bands a varied one', () => {
    // Held to one speed the whole way: there is nothing for the colours to say, and
    // stretching that spread across the ramp would paint rounding as terrain.
    const steady = makeTrack({ startedAt, speedMps: 3, distanceM: 2000 });
    expect(paceRibbon(steady, view)).toEqual([]);

    // The same track walked for its first half and run for its second.
    const slow = makeTrack({ startedAt, speedMps: 1.6, distanceM: 1000 });
    const fastStart = slow[slow.length - 1];
    const fast = makeTrack({ startedAt: fastStart.t, speedMps: 4.5, distanceM: 1000, lat: fastStart.lat, lon: fastStart.lon });
    const ribbon = paceRibbon([...slow, ...fast], view);
    expect(ribbon.length).toBeGreaterThan(1);
    expect(Math.max(...ribbon.map((r) => r.tone))).toBe(1);
    expect(Math.min(...ribbon.map((r) => r.tone))).toBe(0);
  });

  it('colours nothing across a stretch that was never recorded', () => {
    const before = makeTrack({ startedAt, speedMps: 2, distanceM: 300 });
    const last = before[before.length - 1];
    const after = makeTrack({ startedAt: last.t + 1200_000, speedMps: 4.5, distanceM: 300, lat: last.lat + 0.02, lon: last.lon });
    const ribbon = paceRibbon([...before, ...after], view, 20);
    // Two coloured runs of track, and no band bridging the twenty minutes between them.
    expect(ribbon.every((r) => r.d.startsWith('M'))).toBe(true);
    expect(ribbon.length).toBeGreaterThanOrEqual(2);
  });

  it('has nothing to colour without a track', () => {
    expect(paceRibbon([], view)).toEqual([]);
  });
});

describe('marking distances along the track', () => {
  const points = makeTrack({ startedAt, speedMps: 3, distanceM: 5000 });
  const view = planTiles(points, 358, 220)!;

  it('puts a mark at each kilometre, in order, inside the frame', () => {
    const marks = positionsAtDistances(points, view, [1000, 2000, 3000, 4000, 5000]);
    expect(marks.map((m) => m.m)).toEqual([1000, 2000, 3000, 4000]);
    for (const mark of marks) {
      expect(mark.x).toBeGreaterThanOrEqual(0);
      expect(mark.x).toBeLessThanOrEqual(358);
    }
  });

  it('has no mark past the end of the track', () => {
    expect(positionsAtDistances(points, view, [50000])).toEqual([]);
  });

  it('spaces the marks so a long ride is not pinned into illegibility', () => {
    expect(markerSpacingM(8000)).toBe(1000);
    expect(markerSpacingM(40000)).toBe(5000);
    expect(markerSpacingM(180000)).toBe(20000);
  });
});
