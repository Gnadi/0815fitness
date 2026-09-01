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
});
