import { describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { parseExport, parseGpx, toGpx, exportFileName } from './backup';
import { makeActivity, makeSamples, makeTrack } from './testFixtures';

const startedAt = Date.parse('2026-05-01T08:00:00Z');

function sampleActivity() {
  const points = makeTrack({ startedAt, speedMps: 3, distanceM: 900, elevation: (f) => 200 + f * 30 });
  const samples = makeSamples('a1', points, {
    hr: points.map((p) => ({ t: p.t, bpm: 148 })),
    cadence: points.map((p) => ({ t: p.t, rpm: 176 })),
  });
  return { activity: makeActivity({ id: 'a1', startedAt, samples, distance: 900 }), samples };
}

describe('the export file', () => {
  it('reads back an export of its own shape', () => {
    const { activity, samples } = sampleActivity();
    const text = JSON.stringify({
      format: 'contour-log',
      version: 1,
      exportedAt: Date.now(),
      activities: [{ ...activity, samples }],
    });
    const result = parseExport(text);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].activity.title).toBe(activity.title);
    expect(result.entries[0].samples?.points).toHaveLength(samples.points.length);
    // Re-derived on the way in rather than trusted from the file.
    expect(result.entries[0].activity.derived.hrHist).not.toBeNull();
  });

  it('reads the raw array an early build kept in localStorage', () => {
    const points = makeTrack({ startedAt, speedMps: 3, distanceM: 900 });
    const legacy = [
      {
        id: 'old',
        sport: 'run',
        startedAt,
        endedAt: points[points.length - 1].t,
        title: 'Old run',
        notes: '',
        effort: 5,
        gearId: null,
        points,
        laps: [],
        hr: [],
        power: [],
        cadence: [],
        distance: 900,
        ascent: 0,
      },
    ];
    const result = parseExport(JSON.stringify(legacy));
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].activity.source).toBe('imported');
    expect(result.entries[0].activity.derived.version).toBeGreaterThan(0);
  });

  it('skips what it cannot read and says how much', () => {
    const { activity, samples } = sampleActivity();
    const text = JSON.stringify({
      format: 'contour-log',
      version: 1,
      exportedAt: Date.now(),
      activities: [{ ...activity, samples }, { id: 'junk' }, { sport: 'swim', startedAt, distance: 1 }],
    });
    const result = parseExport(text);
    expect(result.entries).toHaveLength(1);
    expect(result.skipped).toBe(2);
  });

  it('refuses a file with nothing readable in it rather than importing silence', () => {
    expect(() => parseExport('{"format":"contour-log","activities":[{"id":"x"}]}')).toThrow();
  });

  it('names an export by the moment it was written', () => {
    expect(exportFileName('contour-log', Date.parse('2026-05-01T09:07:00'), 'json')).toBe('contour-log-20260501-0907.json');
  });
});

describe('GPX', () => {
  it('writes a track other tools can read, sensors included', () => {
    const { activity, samples } = sampleActivity();
    const gpx = toGpx(activity, samples);
    expect(gpx).toContain('<gpx version="1.1"');
    expect(gpx).toContain('<gpxtpx:hr>148</gpxtpx:hr>');
    expect(gpx).toContain('<gpxtpx:cad>176</gpxtpx:cad>');
    expect(gpx).toContain('<type>running</type>');
  });

  it('escapes a title that would otherwise break the file', () => {
    const { activity, samples } = sampleActivity();
    const gpx = toGpx({ ...activity, title: 'Tom & Jerry <hill>' }, samples);
    expect(gpx).toContain('Tom &amp; Jerry &lt;hill&gt;');
    expect(gpx).not.toContain('<hill>');
  });

  it('round-trips its own output', () => {
    const { activity, samples } = sampleActivity();
    const parsed = parseGpx(toGpx(activity, samples));
    expect(parsed.sport).toBe('run');
    expect(parsed.samples.points).toHaveLength(samples.points.length);
    expect(parsed.samples.hr[0].bpm).toBe(148);
    expect(parsed.samples.points[0].ele).toBeCloseTo(200, 1);
  });

  it('reads a ride as a ride', () => {
    const { activity, samples } = sampleActivity();
    const parsed = parseGpx(toGpx({ ...activity, sport: 'ride' }, samples));
    expect(parsed.sport).toBe('ride');
  });

  it('refuses a file with no track in it', () => {
    expect(() => parseGpx('<gpx></gpx>')).toThrow();
  });
});
