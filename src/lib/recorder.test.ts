import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Recorder } from './recorder';
import type { GeoSample } from '../types';

const START = Date.parse('2026-05-01T08:00:00Z');
const M_PER_DEG_LAT = 111320;

/** A fix `metres` north of the origin, `second` seconds in. */
function fix(second: number, metres: number, extras: Partial<GeoSample> = {}): GeoSample {
  return { t: START + second * 1000, lat: 48.3 + metres / M_PER_DEG_LAT, lon: 14.28, accuracy: 5, ...extras };
}

describe('the recorder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('measures distance over the accepted fixes', () => {
    const recorder = new Recorder('run');
    recorder.start();
    recorder.addGeoSample(fix(0, 0));
    recorder.addGeoSample(fix(1, 3));
    recorder.addGeoSample(fix(2, 6));
    expect(recorder.snapshot().distanceM).toBeCloseTo(6, 0);
  });

  it('refuses a fix that jumped further than anyone can move', () => {
    const recorder = new Recorder('run');
    recorder.start();
    recorder.addGeoSample(fix(0, 0));
    recorder.addGeoSample(fix(1, 500)); // 500 m in a second
    expect(recorder.snapshot().distanceM).toBe(0);
  });

  it('refuses a fix the device says it is not sure about', () => {
    const recorder = new Recorder('run');
    recorder.start();
    recorder.addGeoSample(fix(0, 0));
    recorder.addGeoSample(fix(1, 3, { accuracy: 120 }));
    expect(recorder.snapshot().distanceM).toBe(0);
    expect(recorder.snapshot().gpsOk).toBe(false);
  });

  it('counts only the climbing, and ignores altitude jitter', () => {
    const recorder = new Recorder('run');
    recorder.start();
    recorder.addGeoSample(fix(0, 0, { ele: 100 }));
    recorder.addGeoSample(fix(1, 3, { ele: 110 }));
    recorder.addGeoSample(fix(2, 6, { ele: 105 }));
    recorder.addGeoSample(fix(3, 9, { ele: 105.1 })); // jitter, not a climb
    expect(recorder.snapshot().ascentM).toBeCloseTo(10, 1);
  });

  it('auto-pauses when the movement stops, and resumes on a clearly higher speed', () => {
    const recorder = new Recorder('run', 0.5);
    recorder.start();
    for (let s = 0; s <= 5; s++) {
      vi.setSystemTime(START + s * 1000);
      recorder.addGeoSample(fix(s, s * 3));
    }
    expect(recorder.snapshot().status).toBe('recording');

    // Standing still: the same spot, second after second, past the eight-second wait.
    for (let s = 6; s <= 20; s++) {
      vi.setSystemTime(START + s * 1000);
      recorder.addGeoSample(fix(s, 15.01));
    }
    expect(recorder.snapshot().status).toBe('autoPaused');

    vi.setSystemTime(START + 22000);
    recorder.addGeoSample(fix(22, 20));
    expect(recorder.snapshot().status).toBe('recording');
  });

  it('honours a slower auto-pause threshold from settings', () => {
    // A brisk walk: fast enough for the default threshold, too slow for this one.
    const recorder = new Recorder('run', 1.5);
    recorder.start();
    for (let s = 0; s <= 20; s++) {
      vi.setSystemTime(START + s * 1000);
      recorder.addGeoSample(fix(s, s * 1));
    }
    expect(recorder.snapshot().status).toBe('autoPaused');
  });

  it('cuts a lap at every kilometre, and on demand', () => {
    const recorder = new Recorder('run');
    recorder.start();
    recorder.addGeoSample(fix(0, 0));
    vi.setSystemTime(START + 300000);
    recorder.addGeoSample(fix(300, 1100));
    expect(recorder.snapshot().laps).toHaveLength(1);
    recorder.addLap();
    expect(recorder.snapshot().laps).toHaveLength(2);
    expect(recorder.snapshot().currentLapNo).toBe(3);
  });

  describe('how long since the GPS last said anything', () => {
    it('has nothing to report before the first fix', () => {
      const recorder = new Recorder('run');
      recorder.start();
      expect(recorder.secondsSinceLastFix()).toBeNull();
      recorder.stop();
    });

    it('measures the silence from the last accepted fix', () => {
      const recorder = new Recorder('run');
      recorder.start();
      recorder.addGeoSample(fix(0, 0));
      vi.setSystemTime(START + 372_000);
      expect(recorder.secondsSinceLastFix()).toBeCloseTo(372, 0);
      recorder.stop();
    });

    it('counts a fix it kept but did not trust with distance', () => {
      const recorder = new Recorder('run');
      recorder.start();
      recorder.addGeoSample(fix(0, 0));
      // Coarse, but still a fix: it is on the track, so the silence restarts from it.
      vi.setSystemTime(START + 60_000);
      recorder.addGeoSample(fix(60, 30, { accuracy: 120 }));
      expect(recorder.secondsSinceLastFix()).toBeCloseTo(0, 1);
      recorder.stop();
    });
  });

  describe('what an uncertain fix is allowed to do', () => {
    it('keeps a coarse fix on the track instead of discarding it', () => {
      const recorder = new Recorder('run');
      recorder.start();
      recorder.addGeoSample(fix(0, 0, { accuracy: 80 }));
      recorder.addGeoSample(fix(1, 3, { accuracy: 80 }));
      expect(recorder.snapshot().points).toHaveLength(2);
      // Three metres is well inside an eighty-metre error, so it earns no distance.
      expect(recorder.snapshot().distanceM).toBe(0);
      recorder.stop();
    });

    it('lets a coarse fix earn distance once the movement outruns its error', () => {
      const recorder = new Recorder('run');
      recorder.start();
      recorder.addGeoSample(fix(0, 0, { accuracy: 60 }));
      recorder.addGeoSample(fix(30, 120, { accuracy: 60 }));
      expect(recorder.snapshot().distanceM).toBeCloseTo(120, 0);
      recorder.stop();
    });

    it('still drops a fix that is pure noise', () => {
      const recorder = new Recorder('run');
      recorder.start();
      recorder.addGeoSample(fix(0, 0));
      recorder.addGeoSample(fix(1, 3, { accuracy: 900 }));
      expect(recorder.snapshot().points).toHaveLength(1);
      recorder.stop();
    });

    it('reports the signal as poor for a coarse fix even though it keeps it', () => {
      const recorder = new Recorder('run');
      recorder.start();
      recorder.addGeoSample(fix(0, 0, { accuracy: 120 }));
      expect(recorder.snapshot().gpsOk).toBe(false);
      expect(recorder.snapshot().points).toHaveLength(1);
      recorder.stop();
    });
  });

  describe('checkpoints', () => {
    it('carries everything a session in progress holds', () => {
      const recorder = new Recorder('ride');
      recorder.start();
      recorder.addGeoSample(fix(0, 0, { ele: 100 }));
      vi.setSystemTime(START + 60000);
      recorder.addGeoSample(fix(60, 200, { ele: 120 }));
      recorder.addHr(150);
      recorder.addPower(220);

      const checkpoint = recorder.toCheckpoint();
      expect(checkpoint).not.toBeNull();
      expect(checkpoint?.sport).toBe('ride');
      expect(checkpoint?.points).toHaveLength(2);
      expect(checkpoint?.hr).toHaveLength(1);
      expect(checkpoint?.distanceM).toBeCloseTo(200, 0);
    });

    it('has nothing to checkpoint before a session starts or after it ends', () => {
      const recorder = new Recorder('run');
      expect(recorder.toCheckpoint()).toBeNull();
      recorder.start();
      recorder.stop();
      expect(recorder.toCheckpoint()).toBeNull();
    });

    it('comes back paused, counting the gap as paused rather than recorded', () => {
      const recorder = new Recorder('run');
      recorder.start();
      recorder.addGeoSample(fix(0, 0));
      vi.setSystemTime(START + 600000); // ten minutes of running
      recorder.addGeoSample(fix(600, 1800));
      const checkpoint = recorder.toCheckpoint();

      // The app is gone for five minutes, then comes back.
      vi.setSystemTime(START + 900000);
      const resumed = new Recorder('run');
      resumed.restore(checkpoint as NonNullable<typeof checkpoint>);
      const snapshot = resumed.snapshot();

      expect(snapshot.status).toBe('paused');
      expect(snapshot.distanceM).toBeCloseTo(1800, -1);
      // Ten minutes recorded, not the fifteen the wall clock shows.
      expect(snapshot.elapsedS).toBeCloseTo(600, 0);
      resumed.stop();
    });

    it('closes an open pause into the total, so a pause is not counted twice', () => {
      const recorder = new Recorder('run');
      recorder.start();
      recorder.addGeoSample(fix(0, 0));
      vi.setSystemTime(START + 60000);
      recorder.togglePause();
      vi.setSystemTime(START + 120000);
      const checkpoint = recorder.toCheckpoint();
      expect(checkpoint?.pausedAccumS).toBeCloseTo(60, 0);
      recorder.stop();
    });
  });
  describe('a stretch recorded while the app was not on screen', () => {
    // The pivot's whole point: the location service keeps going with the screen off, so
    // fixes can arrive long after the moment they describe, and in bulk. What comes back
    // has to be the ride that happened, not the ride as timed by when the app woke up.

    it('measures a drained backlog exactly as it would have measured it live', () => {
      const samples = Array.from({ length: 60 }, (_, i) => fix(i, i * 4));

      const live = new Recorder('run');
      live.start();
      for (const s of samples) live.addGeoSample(s);

      const drained = new Recorder('run');
      drained.start();
      vi.setSystemTime(START + 60_000); // the app comes back a minute later
      drained.addGeoSamples(samples);

      expect(drained.snapshot().distanceM).toBeCloseTo(live.snapshot().distanceM, 3);
      expect(drained.snapshot().points).toHaveLength(60);
      live.stop();
      drained.stop();
    });

    it('takes ascent off a backlog the same way', () => {
      const samples = [fix(0, 0, { ele: 100 }), fix(1, 4, { ele: 110 }), fix(2, 8, { ele: 105 }), fix(3, 12, { ele: 120 })];
      const drained = new Recorder('ride');
      drained.start();
      vi.setSystemTime(START + 300_000);
      drained.addGeoSamples(samples);
      // Ten up, five down and ignored, fifteen up.
      expect(drained.snapshot().ascentM).toBeCloseTo(25, 3);
      drained.stop();
    });

    it('orders a backlog that arrives shuffled', () => {
      const ordered = [fix(0, 0), fix(1, 4), fix(2, 8), fix(3, 12)];
      const shuffled = [ordered[2], ordered[0], ordered[3], ordered[1]];
      const recorder = new Recorder('run');
      recorder.start();
      recorder.addGeoSamples(shuffled);
      expect(recorder.snapshot().points.map((p) => p.t)).toEqual(ordered.map((p) => p.t));
      expect(recorder.snapshot().distanceM).toBeCloseTo(12, 0);
      recorder.stop();
    });

    it('does not count a fix twice when a drain overlaps what arrived live', () => {
      const samples = [fix(0, 0), fix(1, 4), fix(2, 8)];
      const recorder = new Recorder('run');
      recorder.start();
      recorder.addGeoSample(samples[0]);
      recorder.addGeoSample(samples[1]);
      // The service hands back everything it buffered, including the two already seen.
      recorder.addGeoSamples(samples);
      expect(recorder.snapshot().points).toHaveLength(3);
      expect(recorder.snapshot().distanceM).toBeCloseTo(8, 0);
      recorder.stop();
    });

    it('announces a drain once rather than once per fix', () => {
      const recorder = new Recorder('run');
      recorder.start();
      let emitted = 0;
      const unsub = recorder.subscribe(() => {
        emitted += 1;
      });
      emitted = 0; // subscribe delivers the current snapshot first
      recorder.addGeoSamples(Array.from({ length: 40 }, (_, i) => fix(i, i * 4)));
      expect(emitted).toBe(1);
      unsub();
      recorder.stop();
    });

    it('auto-pauses on the ride\'s own clock, not on when the fixes turned up', () => {
      // Standing still for twenty seconds, recorded while the app was away.
      const samples = [fix(0, 0), ...Array.from({ length: 20 }, (_, i) => fix(i + 1, 0.05 * (i + 1)))];
      const recorder = new Recorder('run');
      recorder.start();
      vi.setSystemTime(START + 600_000);
      recorder.addGeoSamples(samples);
      expect(recorder.snapshot().status).toBe('autoPaused');
      recorder.stop();
    });

    it('puts a kilometre marker where it was crossed, not where the app woke up', () => {
      const samples = Array.from({ length: 101 }, (_, i) => fix(i * 2, i * 12));
      const recorder = new Recorder('run');
      recorder.start();
      vi.setSystemTime(START + 900_000);
      recorder.addGeoSamples(samples);
      const [lap] = recorder.snapshot().laps;
      expect(lap).toBeDefined();
      // The kilometre falls a shade past 83 fixes of 12 m, two seconds apart.
      expect((lap.endT - START) / 1000).toBeCloseTo(168, 0);
      expect(lap.endT).toBeLessThan(START + 900_000);
      recorder.stop();
    });
  });

  describe('the ceiling on a plausible speed', () => {
    it('keeps a fast descent that the old 50 km/h ceiling would have eaten', () => {
      const recorder = new Recorder('ride');
      recorder.start();
      // 18 m/s is 65 km/h: an ordinary descent, and over the ceiling as it used to be.
      recorder.addGeoSample(fix(0, 0));
      recorder.addGeoSample(fix(1, 18));
      recorder.addGeoSample(fix(2, 36));
      expect(recorder.snapshot().distanceM).toBeCloseTo(36, 0);
      recorder.stop();
    });

    it('still refuses a leap no bicycle makes', () => {
      const recorder = new Recorder('ride');
      recorder.start();
      recorder.addGeoSample(fix(0, 0));
      recorder.addGeoSample(fix(1, 200)); // 720 km/h
      expect(recorder.snapshot().distanceM).toBe(0);
      recorder.stop();
    });
  });
});
