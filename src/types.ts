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

export interface Activity {
  id: string;
  sport: Sport;
  startedAt: number;
  endedAt: number;
  title: string;
  notes: string;
  effort: number; // 1-10
  gearId: string | null;
  points: GeoSample[];
  laps: Lap[];
  hr: HrSample[];
  power: PowerSample[];
  cadence: CadenceSample[];
  distance: number; // metres, final cumulative
  ascent: number; // metres
  demo?: boolean;
}

export interface GearItem {
  id: string;
  sport: Sport;
  name: string;
}

export interface PlanEntry {
  sessionIdx: number;
}

export interface Settings {
  maxHr: number;
  gear: GearItem[];
  plan: number[]; // 7 entries, Mon..Sun — index into PLANNED_SESSIONS
}
