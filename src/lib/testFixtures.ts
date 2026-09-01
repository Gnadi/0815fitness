import type { Activity, ActivitySamples, Settings, Sport } from '../types';
import { deriveActivity } from './derived';
import { DEFAULT_SETTINGS } from './storage';

/** Builders for the tests. Everything here produces the real shapes the app stores, and
 *  runs them through the real derivation, so a test is never checking a hand-written
 *  figure the app would not have computed. */

const M_PER_DEG_LAT = 111320;

export interface TrackOptions {
  startedAt: number;
  /** Metres between consecutive fixes, one fix per `intervalS`. */
  speedMps: number;
  distanceM: number;
  intervalS?: number;
  /** Altitude at fraction f along the track. */
  elevation?: (f: number) => number;
  lat?: number;
  lon?: number;
  /** Heading in radians; a straight line unless `turn` is given. */
  bearing?: number;
  turn?: number;
}

export function makeTrack(options: TrackOptions): ActivitySamples['points'] {
  const { startedAt, speedMps, distanceM, intervalS = 1, elevation, lat = 48.3, lon = 14.28, bearing = 0, turn = 0 } = options;
  const stepM = speedMps * intervalS;
  const n = Math.max(2, Math.round(distanceM / stepM));
  const points: ActivitySamples['points'] = [];
  let currentLat = lat;
  let currentLon = lon;
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    points.push({
      t: startedAt + i * intervalS * 1000,
      lat: currentLat,
      lon: currentLon,
      ele: elevation ? elevation(f) : undefined,
      accuracy: 5,
    });
    const heading = bearing + turn * f;
    const mPerDegLon = M_PER_DEG_LAT * Math.cos((currentLat * Math.PI) / 180);
    currentLat += (Math.sin(heading) * stepM) / M_PER_DEG_LAT;
    currentLon += (Math.cos(heading) * stepM) / mPerDegLon;
  }
  return points;
}

export function makeSamples(id: string, points: ActivitySamples['points'], extras: Partial<ActivitySamples> = {}): ActivitySamples {
  return { id, points, hr: [], power: [], cadence: [], ...extras };
}

export function constantStream(points: ActivitySamples['points'], value: number): { t: number; v: number }[] {
  return points.map((p) => ({ t: p.t, v: value }));
}

export function makeActivity(overrides: Partial<Activity> & { samples?: ActivitySamples } = {}): Activity {
  const id = overrides.id ?? 'a1';
  const sport: Sport = overrides.sport ?? 'run';
  const startedAt = overrides.startedAt ?? Date.parse('2026-06-01T08:00:00Z');
  const samples = overrides.samples ?? makeSamples(id, makeTrack({ startedAt, speedMps: 3, distanceM: 3000 }));
  const endedAt = overrides.endedAt ?? (samples.points.length ? samples.points[samples.points.length - 1].t : startedAt + 600000);
  const { samples: _ignored, ...rest } = overrides;
  return {
    id,
    sport,
    startedAt,
    endedAt,
    title: 'Test session',
    notes: '',
    effort: 5,
    gearId: null,
    laps: [],
    distance: 3000,
    ascent: 0,
    source: 'recorded',
    hasSamples: samples.points.length > 0,
    derived: deriveActivity({ sport, startedAt, endedAt, samples }),
    ...rest,
  };
}

export function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}
