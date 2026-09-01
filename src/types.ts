export type Sport = 'run' | 'ride';

export type SensorState = 'connected' | 'searching' | 'absent';
export type SensorKind = 'hr' | 'power' | 'cadence';

export interface GeoSample {
  t: number; // epoch ms
  lat: number;
  lon: number;
  ele?: number; // metres, when the platform reports altitude
  accuracy?: number; // metres
}

export interface HrSample {
  t: number;
  bpm: number;
}

export interface PowerSample {
  t: number;
  watts: number;
}

export interface CadenceSample {
  t: number;
  rpm: number; // bike cadence or running cadence (steps/min), per-activity sport tells you which
}

export interface Lap {
  lapNo: number;
  startT: number;
  endT: number;
  startDist: number; // metres
  endDist: number;
}

/** The sample streams of one activity — the second-by-second record.
 *
 *  Stored apart from the summary because they are essentially all of the bytes: an hour
 *  of riding with a strap, a meter and a cadence sensor is four streams at roughly 1 Hz,
 *  which is some hundreds of kilobytes, against a summary measured in hundreds of bytes.
 *  Every aggregate screen reads summaries; only the screens that draw one session — its
 *  detail, a comparison — load the streams, and only for the sessions they draw. */
export interface ActivitySamples {
  id: string;
  points: GeoSample[];
  hr: HrSample[];
  power: PowerSample[];
  cadence: CadenceSample[];
}

/** Seconds spent at each heart rate, from `lo` bpm upwards.
 *
 *  The zone boundaries a distribution is cut at depend on the max heart rate — or the
 *  threshold — in settings, and those change: someone's first real max-effort session
 *  moves them. Storing seconds *per zone* would freeze every past session against
 *  whatever the setting was on the day it was saved; storing seconds *per bpm* lets any
 *  zone model be applied to the whole history at once, for a few hundred bytes. */
export interface HrHistogram {
  lo: number;
  seconds: number[];
}

/** Everything about one activity that is derived by walking its samples.
 *
 *  Computed once, when the activity is saved or imported, and stored with the summary,
 *  so that reading a season of history does not mean parsing a season of samples. What
 *  goes in here is only ever settings-independent: the ingredients, never a figure that
 *  a later change to max heart rate, threshold or FTP would silently invalidate. */
export interface ActivityDerived {
  version: number;
  movingS: number;
  hrHist: HrHistogram | null;
  avgHr: number | null;
  maxHr: number | null;
  avgPower: number | null;
  /** Normalised power: the 30 s rolling average raised to the fourth, meaned, rooted. */
  normalizedPower: number | null;
  avgCadence: number | null;
  /** Seconds spent at each cadence, from `lo` rpm — the same argument as `hrHist`. */
  cadenceHist: HrHistogram | null;
  /** Fastest time over each PB distance, keyed by `PB_DISTANCES` key. */
  pbEfforts: Record<string, number>;
  /** Mean maximal power over each window, keyed by `POWER_DURATIONS` key. */
  powerBests: Record<string, number>;
  decoupling: number | null;
  /** Altitude along the track, thinned for the silhouettes and profiles. */
  elevation: number[];
  /** Flat-equivalent distance in metres: what the run would have measured on the level
   *  for the same energetic cost. Null when there is no usable altitude. */
  gapDistanceM: number | null;
  /** The track reduced to a fixed-length, start-relative shape, for matching repeats. */
  route: RouteSignature | null;
  /** How well the fixes actually cover the session — see `TrackQuality`. */
  track: TrackQuality;
}

/** How completely the GPS covered a session.
 *
 *  This used to measure the app's own failure: a browser stopped delivering fixes to a
 *  page in the background, so a phone pocketed mid-ride left two fixes twenty minutes
 *  apart. The location service ended that, and the measurement is still worth taking —
 *  a tunnel, a deep valley or a street of towers will lose the sky for minutes. The line
 *  across a gap is an assumption either way, not a route, and the app has to be able to
 *  say so rather than drawing it like any other stretch of road. */
export interface TrackQuality {
  fixes: number;
  /** The longest stretch with no fix at all, in seconds. */
  longestGapS: number;
  /** How many stretches exceeded the gap threshold. */
  gaps: number;
  /** The share of the session's elapsed time that fixes actually cover, 0–1. */
  coverage: number;
  /** Typical seconds between fixes, as a median so one gap does not skew it. */
  medianIntervalS: number;
}

/** A track reduced to `ROUTE_POINTS` evenly spaced offsets in metres from its start,
 *  which is enough to tell one loop from another and cheap enough to hold for every
 *  activity at once. */
export interface RouteSignature {
  lat: number;
  lon: number;
  totalM: number;
  /** Interleaved east/north offsets in metres: [e0, n0, e1, n1, …]. */
  shape: number[];
}

export type ActivitySource = 'recorded' | 'manual' | 'imported';

/** One activity, without its samples: what every list, rollup and chart reads. */
export interface Activity {
  id: string;
  sport: Sport;
  startedAt: number;
  endedAt: number;
  title: string;
  notes: string;
  effort: number; // 1-10
  gearId: string | null;
  laps: Lap[];
  distance: number; // metres, final cumulative
  ascent: number; // metres
  source: ActivitySource;
  /** False for a manual entry, which has figures but no track to draw or re-derive. */
  hasSamples: boolean;
  derived: ActivityDerived;
  demo?: boolean;
}

/** An activity with its streams loaded — what the detail and comparison screens work on. */
export interface FullActivity extends Activity {
  samples: ActivitySamples;
}

export interface GearItem {
  id: string;
  sport: Sport;
  name: string;
  /** Distance already on it before the log started, in kilometres. */
  offsetKm: number;
  /** Kilometres after which it should be replaced, or null for no limit. */
  limitKm: number | null;
  retired: boolean;
}

export type Units = 'metric' | 'imperial';

/** Which heart rate the zones are cut against: a percentage of max, or of threshold. */
export type ZoneModel = 'maxhr' | 'lthr';

/** How a week's training load is measured: kilometres, or training stress. */
export type LoadModel = 'distance' | 'stress';

export interface Settings {
  maxHr: number;
  /** Lactate threshold heart rate, when it is known. */
  lthr: number | null;
  zoneModel: ZoneModel;
  /** Functional threshold power, when it is known. */
  ftp: number | null;
  units: Units;
  loadModel: LoadModel;
  gear: GearItem[];
  plan: number[]; // 7 entries, Mon..Sun — index into PLANNED_SESSIONS
  /** Speed under which the recorder auto-pauses, in metres per second. */
  autoPauseMps: number;
  /** Whether a saved session's map draws an OpenStreetMap basemap under the track.
   *  The only setting in the app that decides whether it talks to the network. */
  mapTiles: boolean;
}
