import type { Sport, GeoSample, HrSample, PowerSample, CadenceSample, Lap } from '../types';
import { haversineMeters } from './geo';

export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'autoPaused' | 'finished';

export const DEFAULT_AUTO_PAUSE_MPS = 0.5;
const AUTO_PAUSE_AFTER_S = 8;
/** Resuming needs a clearly higher speed than pausing, so a fix wobbling either side of
 *  one threshold does not flip the state every few seconds. */
const RESUME_FACTOR = 1.8;
export const MAX_PLAUSIBLE_SPEED_MPS = 14; // ~50 km/h — beyond this a GPS jump is treated as noise
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
  /** Mean of every recorded power sample, kept as a running total rather than summed
   *  out of `power` on each read — that array grows for the whole ride. */
  avgPowerW: number | null;
}

/** Everything a session in progress would lose if the app went away.
 *
 *  A recording lived only in memory, so a reload, a browser tab evicted under memory
 *  pressure or a crash two hours into a long ride took the whole session with it — the
 *  one moment in the app where the data cannot be recovered by any other means. The
 *  recorder writes one of these to the database every few seconds; the next launch
 *  offers it back. */
export interface RecorderCheckpoint {
  version: 1;
  savedAt: number;
  sport: Sport;
  startedAt: number;
  pausedAccumS: number;
  points: GeoSample[];
  distanceM: number;
  ascentM: number;
  laps: Lap[];
  lapNo: number;
  lapStartT: number;
  lapStartDist: number;
  prevLapDurationS: number | null;
  hr: HrSample[];
  power: PowerSample[];
  cadence: CadenceSample[];
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
  private powerSumW = 0;
  private cadence: CadenceSample[] = [];
  private liveHr: number | null = null;
  private livePower: number | null = null;
  private liveCadence: number | null = null;
  private accuracy: number | null = null;
  private gpsOk = false;
  private belowThresholdSinceT: number | null = null;
  private listeners = new Set<Listener>();
  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private autoPauseMps: number;

  constructor(sport: Sport, autoPauseMps = DEFAULT_AUTO_PAUSE_MPS) {
    this.sport = sport;
    this.autoPauseMps = autoPauseMps;
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

  /** A sample landed. A running session repaints from its own once-a-second tick — the
   *  clock has to move between fixes anyway — so a strap, a power meter and a foot pod
   *  all reporting inside the same second cost one render between them instead of
   *  three. Outside a running session there is no tick, so the change goes out now. */
  private sampled() {
    if (!this.tickHandle) this.emit();
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
    this.hr = [];
    this.power = [];
    this.powerSumW = 0;
    this.cadence = [];
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
    this.sampled();
  }

  private evaluateAutoPause(instSpeedMps: number) {
    const was = this.status;
    if (this.status === 'recording') {
      if (instSpeedMps < this.autoPauseMps) {
        if (this.belowThresholdSinceT == null) this.belowThresholdSinceT = this.now();
        else if ((this.now() - this.belowThresholdSinceT) / 1000 >= AUTO_PAUSE_AFTER_S) {
          this.status = 'autoPaused';
        }
      } else {
        this.belowThresholdSinceT = null;
      }
    } else if (this.status === 'autoPaused') {
      if (instSpeedMps >= this.autoPauseMps * RESUME_FACTOR) {
        this.status = 'recording';
        this.belowThresholdSinceT = null;
      }
    }
    // Entering or leaving an auto-pause is a state change the banner has to show at
    // once, not on the next tick with the rest of the second's samples.
    if (this.status !== was) this.emit();
  }

  addHr(bpm: number) {
    const t = this.now();
    this.liveHr = bpm;
    if (this.status === 'recording' || this.status === 'autoPaused') this.hr.push({ t, bpm });
    this.sampled();
  }
  addPower(watts: number) {
    const t = this.now();
    this.livePower = watts;
    if (this.status === 'recording' || this.status === 'autoPaused') {
      this.power.push({ t, watts });
      this.powerSumW += watts;
    }
    this.sampled();
  }
  addCadence(rpm: number) {
    const t = this.now();
    this.liveCadence = rpm;
    if (this.status === 'recording' || this.status === 'autoPaused') this.cadence.push({ t, rpm });
    this.sampled();
  }

  private elapsedS(): number {
    if (!this.startedAt) return 0;
    const end = this.status === 'finished' ? this.now() : this.now();
    let pausedTotal = this.pausedAccumS;
    if (this.pauseStartedAt) pausedTotal += (end - this.pauseStartedAt) / 1000;
    return Math.max(0, (end - this.startedAt) / 1000 - pausedTotal);
  }

  /** Speed over the last `PACE_WINDOW_S` of the track.
   *
   *  Walked back from the newest fix rather than filtered out of the whole track: this
   *  runs on every snapshot, once a second, and the track only ever grows — the filter
   *  it replaces re-copied two hours of a ride to read its last twenty-five seconds. */
  private liveSpeed(): number | null {
    const pts = this.points;
    const cutoff = this.now() - PACE_WINDOW_S * 1000;
    let from = pts.length;
    while (from > 0 && pts[from - 1].t >= cutoff) from--;
    if (pts.length - from < 2) return null;

    const dtS = (pts[pts.length - 1].t - pts[from].t) / 1000;
    if (dtS < 3) return null;
    let dist = 0;
    for (let i = from + 1; i < pts.length; i++) dist += haversineMeters(pts[i - 1], pts[i]);
    return dist / dtS;
  }

  /** True once the session holds something a person would mind losing. */
  hasContent(): boolean {
    return this.startedAt != null && (this.points.length > 1 || this.hr.length > 1 || this.power.length > 1);
  }

  toCheckpoint(): RecorderCheckpoint | null {
    if (this.startedAt == null || this.status === 'idle' || this.status === 'finished') return null;
    return {
      version: 1,
      savedAt: this.now(),
      sport: this.sport,
      startedAt: this.startedAt,
      // The pause that is open right now is closed into the total, so a session
      // recovered while paused does not count the pause twice.
      pausedAccumS: this.pausedAccumS + (this.pauseStartedAt ? (this.now() - this.pauseStartedAt) / 1000 : 0),
      points: this.points,
      distanceM: this.distanceM,
      ascentM: this.ascentM,
      laps: this.laps,
      lapNo: this.lapNo,
      lapStartT: this.lapStartT,
      lapStartDist: this.lapStartDist,
      prevLapDurationS: this.prevLapDurationS,
      hr: this.hr,
      power: this.power,
      cadence: this.cadence,
    };
  }

  /** Picks a checkpointed session back up.
   *
   *  It comes back *paused*, with everything between the last checkpoint and now
   *  counted as paused time: the app was not recording during the gap, and a session
   *  that resumed itself would silently claim minutes it never measured. */
  restore(cp: RecorderCheckpoint): void {
    this.sport = cp.sport;
    this.status = 'paused';
    this.startedAt = cp.startedAt;
    this.pausedAccumS = cp.pausedAccumS + Math.max(0, (this.now() - cp.savedAt) / 1000);
    this.pauseStartedAt = this.now();
    this.points = cp.points;
    this.distanceM = cp.distanceM;
    this.ascentM = cp.ascentM;
    this.laps = cp.laps;
    this.lapNo = cp.lapNo;
    this.lapStartT = cp.lapStartT;
    this.lapStartDist = cp.lapStartDist;
    this.prevLapDurationS = cp.prevLapDurationS;
    this.hr = cp.hr;
    this.power = cp.power;
    this.powerSumW = cp.power.reduce((sum, p) => sum + p.watts, 0);
    this.cadence = cp.cadence;
    this.belowThresholdSinceT = null;
    if (!this.tickHandle) this.tickHandle = setInterval(() => this.emit(), 1000);
    this.emit();
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
      avgPowerW: this.power.length > 0 ? this.powerSumW / this.power.length : null,
    };
  }

  private elapsedFrom(t: number): number {
    const now = this.now();
    // Approximation: pauses since lap start aren't separately tracked, which only
    // under-counts a lap's duration by however long the app was paused mid-lap.
    return (now - t) / 1000;
  }
}
