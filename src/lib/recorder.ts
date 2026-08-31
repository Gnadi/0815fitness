import type { Sport, GeoSample, HrSample, PowerSample, CadenceSample, Lap } from '../types';
import { haversineMeters } from './geo';

export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'autoPaused' | 'finished';

const AUTO_PAUSE_SPEED_MPS = 0.5;
const AUTO_PAUSE_AFTER_S = 8;
const RESUME_SPEED_MPS = 0.9;
const MAX_PLAUSIBLE_SPEED_MPS = 14; // ~50 km/h — beyond this a GPS jump is treated as noise
const MAX_ACCEPT_ACCURACY_M = 50;
const PACE_WINDOW_S = 25;

export interface RecorderSnapshot {
  status: RecorderStatus;
  locked: boolean;
  sport: Sport;
  startedAt: number | null;
  elapsedS: number;
  distanceM: number;
  ascentM: number;
  points: GeoSample[];
  laps: Lap[];
  currentLapNo: number;
  currentLapDistM: number;
  currentLapDurationS: number;
  prevLapDurationS: number | null;
  accuracy: number | null;
  gpsOk: boolean;
  liveSpeedMps: number | null;
  hr: HrSample[];
  power: PowerSample[];
  cadence: CadenceSample[];
  liveHr: number | null;
  livePower: number | null;
  liveCadence: number | null;
}

type Listener = (s: RecorderSnapshot) => void;

export class Recorder {
  private sport: Sport;
  private status: RecorderStatus = 'idle';
  private locked = false;
  private startedAt: number | null = null;
  private pausedAccumS = 0;
  private pauseStartedAt: number | null = null;
  private points: GeoSample[] = [];
  private distanceM = 0;
  private ascentM = 0;
  private laps: Lap[] = [];
  private lapNo = 1;
  private lapStartT = 0;
  private lapStartDist = 0;
  private prevLapDurationS: number | null = null;
  private hr: HrSample[] = [];
  private power: PowerSample[] = [];
  private cadence: CadenceSample[] = [];
  private liveHr: number | null = null;
  private livePower: number | null = null;
  private liveCadence: number | null = null;
  private accuracy: number | null = null;
  private gpsOk = false;
  private belowThresholdSinceT: number | null = null;
  private listeners = new Set<Listener>();
  private tickHandle: ReturnType<typeof setInterval> | null = null;

  constructor(sport: Sport) {
    this.sport = sport;
  }

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    cb(this.snapshot());
    return () => this.listeners.delete(cb);
  }

  private emit() {
    const s = this.snapshot();
    for (const l of this.listeners) l(s);
  }

  private now() {
    return Date.now();
  }

  start() {
    this.status = 'recording';
    this.startedAt = this.now();
    this.lapStartT = this.startedAt;
    this.lapStartDist = 0;
    this.pausedAccumS = 0;
    this.pauseStartedAt = null;
    this.points = [];
    this.distanceM = 0;
    this.ascentM = 0;
    this.laps = [];
    this.lapNo = 1;
    this.prevLapDurationS = null;
    this.tickHandle = setInterval(() => this.emit(), 1000);
    this.emit();
  }

  stop() {
    if (this.tickHandle) clearInterval(this.tickHandle);
    this.tickHandle = null;
    this.status = 'finished';
    this.emit();
  }

  togglePause() {
    if (this.status === 'recording' || this.status === 'autoPaused') {
      this.status = 'paused';
      this.pauseStartedAt = this.now();
      this.belowThresholdSinceT = null;
    } else if (this.status === 'paused') {
      this.resumeFromPause();
    }
    this.emit();
  }

  private resumeFromPause() {
    if (this.pauseStartedAt) this.pausedAccumS += (this.now() - this.pauseStartedAt) / 1000;
    this.pauseStartedAt = null;
    this.status = 'recording';
    this.belowThresholdSinceT = null;
  }

  lock() {
    this.locked = true;
    this.emit();
  }
  unlock() {
    this.locked = false;
    this.emit();
  }

  addLap() {
    if (this.status === 'finished' || this.status === 'idle') return;
    const t = this.now();
    this.laps.push({ lapNo: this.lapNo, startT: this.lapStartT, endT: t, startDist: this.lapStartDist, endDist: this.distanceM });
    this.prevLapDurationS = (t - this.lapStartT) / 1000;
    this.lapNo += 1;
    this.lapStartT = t;
    this.lapStartDist = this.distanceM;
    this.emit();
  }

  private maybeAutoLap() {
    const km = Math.floor(this.distanceM / 1000);
    const lapStartKm = Math.floor(this.lapStartDist / 1000);
    if (km > lapStartKm) this.addLap();
  }

  addGeoSample(sample: GeoSample) {
    this.accuracy = sample.accuracy ?? this.accuracy;
    this.gpsOk = sample.accuracy == null || sample.accuracy <= MAX_ACCEPT_ACCURACY_M;
    if (!this.gpsOk) return;

    const last = this.points[this.points.length - 1];
    this.points.push(sample);

    if (last) {
      const dtS = (sample.t - last.t) / 1000;
      const dM = haversineMeters(last, sample);
      const speed = dtS > 0 ? dM / dtS : 0;
      if (dtS > 0 && speed <= MAX_PLAUSIBLE_SPEED_MPS) {
        this.distanceM += dM;
        if (last.ele != null && sample.ele != null) {
          const rise = sample.ele - last.ele;
          if (rise > 0.3) this.ascentM += rise;
        }
        this.evaluateAutoPause(speed);
      }
    }

    this.maybeAutoLap();
    this.emit();
  }

  private evaluateAutoPause(instSpeedMps: number) {
    if (this.status === 'recording') {
      if (instSpeedMps < AUTO_PAUSE_SPEED_MPS) {
        if (this.belowThresholdSinceT == null) this.belowThresholdSinceT = this.now();
        else if ((this.now() - this.belowThresholdSinceT) / 1000 >= AUTO_PAUSE_AFTER_S) {
          this.status = 'autoPaused';
        }
      } else {
        this.belowThresholdSinceT = null;
      }
    } else if (this.status === 'autoPaused') {
      if (instSpeedMps >= RESUME_SPEED_MPS) {
        this.status = 'recording';
        this.belowThresholdSinceT = null;
      }
    }
  }

  addHr(bpm: number) {
    const t = this.now();
    this.liveHr = bpm;
    if (this.status === 'recording' || this.status === 'autoPaused') this.hr.push({ t, bpm });
    this.emit();
  }
  addPower(watts: number) {
    const t = this.now();
    this.livePower = watts;
    if (this.status === 'recording' || this.status === 'autoPaused') this.power.push({ t, watts });
    this.emit();
  }
  addCadence(rpm: number) {
    const t = this.now();
    this.liveCadence = rpm;
    if (this.status === 'recording' || this.status === 'autoPaused') this.cadence.push({ t, rpm });
    this.emit();
  }

  private elapsedS(): number {
    if (!this.startedAt) return 0;
    const end = this.status === 'finished' ? this.now() : this.now();
    let pausedTotal = this.pausedAccumS;
    if (this.pauseStartedAt) pausedTotal += (end - this.pauseStartedAt) / 1000;
    return Math.max(0, (end - this.startedAt) / 1000 - pausedTotal);
  }

  private liveSpeed(): number | null {
    const now = this.now();
    const windowPts = this.points.filter((p) => now - p.t <= PACE_WINDOW_S * 1000);
    if (windowPts.length < 2) return null;
    const first = windowPts[0];
    const last = windowPts[windowPts.length - 1];
    const dtS = (last.t - first.t) / 1000;
    if (dtS < 3) return null;
    return cumulativeSegment(windowPts) / dtS;
  }

  snapshot(): RecorderSnapshot {
    const currentLapDistM = Math.max(0, this.distanceM - this.lapStartDist);
    const currentLapDurationS = this.startedAt ? (this.status === 'finished' ? 0 : Math.max(0, this.elapsedFrom(this.lapStartT))) : 0;
    return {
      status: this.status,
      locked: this.locked,
      sport: this.sport,
      startedAt: this.startedAt,
      elapsedS: this.elapsedS(),
      distanceM: this.distanceM,
      ascentM: this.ascentM,
      points: this.points,
      laps: this.laps,
      currentLapNo: this.lapNo,
      currentLapDistM,
      currentLapDurationS,
      prevLapDurationS: this.prevLapDurationS,
      accuracy: this.accuracy,
      gpsOk: this.gpsOk,
      liveSpeedMps: this.liveSpeed(),
      hr: this.hr,
      power: this.power,
      cadence: this.cadence,
      liveHr: this.liveHr,
      livePower: this.livePower,
      liveCadence: this.liveCadence,
    };
  }

  private elapsedFrom(t: number): number {
    const now = this.now();
    // Approximation: pauses since lap start aren't separately tracked, which only
    // under-counts a lap's duration by however long the app was paused mid-lap.
    return (now - t) / 1000;
  }
}

function cumulativeSegment(points: GeoSample[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversineMeters(points[i - 1], points[i]);
  return d;
}
