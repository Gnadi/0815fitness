import type { Sport, GeoSample, HrSample, PowerSample, CadenceSample, Lap } from '../types';
import { haversineMeters } from './geo';

export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'autoPaused' | 'finished';

export const DEFAULT_AUTO_PAUSE_MPS = 0.5;
const AUTO_PAUSE_AFTER_S = 8;
/** Resuming needs a clearly higher speed than pausing, so a fix wobbling either side of
 *  one threshold does not flip the state every few seconds. */
const RESUME_FACTOR = 1.8;
/** Beyond this a jump between two fixes is noise rather than movement.
 *
 *  It was 14 m/s — 50 km/h — which a browser rarely exceeded because a phone in a
 *  pocket was not reporting at all. A foreground service reports the whole descent, and
 *  50 km/h is an ordinary one, so the old ceiling would have started silently eating the
 *  fastest kilometres of every ride. 25 m/s is 90 km/h: quick for a bicycle, still far
 *  below the continent-crossing leap a bad fix produces. */
export const MAX_PLAUSIBLE_SPEED_MPS = 25;
/** At or under this, a fix is trusted: it counts towards distance like any other, and
 *  the live signal indicator reads as good. */
const TRUSTED_ACCURACY_M = 50;
/** Past this a fix is noise — a cell-tower guess in the wrong suburb — and is dropped.
 *  Between the two it is kept for the shape of the track but has to earn its distance. */
const KEEP_ACCURACY_M = 200;
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
  /** How long since the last accepted fix, or null before the first one lands. */
  secondsSinceFix: number | null;
}

/** Everything a session in progress would lose if the app went away.
 *
 *  A recording lived only in memory, so a reload, an app evicted under memory
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

  /** The lap button. */
  addLap() {
    if (this.cutLap(this.now())) this.emit();
  }

  /** Closes the current lap at `t`.
   *
   *  The time is passed in rather than read off the clock because a lap can be cut by a
   *  fix as well as by a thumb, and a fix carries its own timestamp — one that may be
   *  minutes old by the time it is ingested, if it was recorded while the app was not
   *  on screen. Stamping it `now` would put the kilometre marker where the app woke up
   *  instead of where it was crossed. */
  private cutLap(t: number): boolean {
    if (this.status === 'finished' || this.status === 'idle') return false;
    this.laps.push({ lapNo: this.lapNo, startT: this.lapStartT, endT: t, startDist: this.lapStartDist, endDist: this.distanceM });
    this.prevLapDurationS = (t - this.lapStartT) / 1000;
    this.lapNo += 1;
    this.lapStartT = t;
    this.lapStartDist = this.distanceM;
    return true;
  }

  private maybeAutoLap(atT: number) {
    const km = Math.floor(this.distanceM / 1000);
    const lapStartKm = Math.floor(this.lapStartDist / 1000);
    if (km > lapStartKm) this.cutLap(atT);
  }

  /** A fix landed. */
  addGeoSample(sample: GeoSample) {
    this.ingestGeoSample(sample);
    this.sampled();
  }

  /** A run of fixes landed at once.
   *
   *  The location service keeps recording while the app is not on screen, so coming back
   *  to it can mean twenty minutes of ride arriving in one callback. Feeding them through
   *  `addGeoSample` one at a time would be correct but would also emit a snapshot per
   *  fix — a thousand renders for a stretch nobody watched happen. They are ingested in
   *  time order and announced once.
   *
   *  Fixes at or before the last one already recorded are dropped: a drain that overlaps
   *  what was already delivered live must not add the same metres twice. */
  addGeoSamples(samples: GeoSample[]) {
    if (samples.length === 0) return;
    const ordered = [...samples].sort((a, b) => a.t - b.t);
    let ingested = 0;
    for (const sample of ordered) {
      const last = this.points[this.points.length - 1];
      if (last && sample.t <= last.t) continue;
      this.ingestGeoSample(sample);
      ingested += 1;
    }
    if (ingested > 0) this.emit();
  }

  /** Takes one fix into the session, without announcing it.
   *
   *  An uncertain fix used to be discarded outright, which is how a ride could come back
   *  as two points and a straight line: a phone in a pocket, or a receiver that has
   *  fallen back to a coarse wifi or cell fix, reports fifty to two hundred metres
   *  routinely, and every one of those was thrown away. Accuracy now decides whether a
   *  fix is *trusted with distance*, not whether it is recorded at all — a fix good to
   *  eighty metres still says which road you were on.
   *
   *  Every time decision here is made from `sample.t`, never from the clock. A fix can be
   *  minutes old by the time it is ingested, and judging an eight-second auto-pause or a
   *  kilometre marker against the moment of arrival rather than the moment of recording
   *  is how a replayed stretch would come back with its pauses and laps in the wrong
   *  places. */
  private ingestGeoSample(sample: GeoSample) {
    const accuracy = sample.accuracy ?? null;
    this.accuracy = accuracy ?? this.accuracy;
    this.gpsOk = accuracy == null || accuracy <= TRUSTED_ACCURACY_M;
    if (accuracy != null && accuracy > KEEP_ACCURACY_M) return;

    const last = this.points[this.points.length - 1];
    this.points.push(sample);

    if (last) {
      const dtS = (sample.t - last.t) / 1000;
      const dM = haversineMeters(last, sample);
      const speed = dtS > 0 ? dM / dtS : 0;
      // An uncertain fix only earns distance for movement bigger than its own error —
      // otherwise a stationary phone drifting inside its accuracy circle rides kilometres.
      const earnsDistance = accuracy == null || accuracy <= TRUSTED_ACCURACY_M || dM > accuracy;
      if (dtS > 0 && speed <= MAX_PLAUSIBLE_SPEED_MPS && earnsDistance) {
        this.distanceM += dM;
        if (last.ele != null && sample.ele != null) {
          const rise = sample.ele - last.ele;
          if (rise > 0.3) this.ascentM += rise;
        }
        this.evaluateAutoPause(speed, sample.t);
      }
    }

    this.maybeAutoLap(sample.t);
  }

  /** Decides whether standing still has lasted long enough to be a pause.
   *
   *  `atT` is the timestamp of the fix that produced this speed, not the clock. The
   *  eight seconds are eight seconds of the ride: replaying a stretch recorded while the
   *  app was away must reach the same verdict it would have reached live, and measuring
   *  from arrival would collapse the whole backlog into a single instant that never
   *  crosses the threshold. */
  private evaluateAutoPause(instSpeedMps: number, atT: number) {
    const was = this.status;
    if (this.status === 'recording') {
      if (instSpeedMps < this.autoPauseMps) {
        if (this.belowThresholdSinceT == null) this.belowThresholdSinceT = atT;
        else if ((atT - this.belowThresholdSinceT) / 1000 >= AUTO_PAUSE_AFTER_S) {
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
   *  It comes back *paused*, with everything between the last checkpoint and now counted
   *  as paused time. That is still right on Android, and worth saying why: the location
   *  service is bound to the activity and is stopped with it, so an app that is gone is
   *  a session that genuinely stopped recording. A recorder that resumed itself would
   *  claim minutes nothing measured — which is the one thing this app does not do. */
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
      secondsSinceFix: this.secondsSinceLastFix(),
    };
  }

  /** Seconds since the GPS last reported, which is how a stretch of lost track is
   *  measured the moment the app comes back rather than after it is saved. */
  secondsSinceLastFix(): number | null {
    const last = this.points[this.points.length - 1];
    return last ? Math.max(0, (this.now() - last.t) / 1000) : null;
  }

  private elapsedFrom(t: number): number {
    const now = this.now();
    // Approximation: pauses since lap start aren't separately tracked, which only
    // under-counts a lap's duration by however long the app was paused mid-lap.
    return (now - t) / 1000;
  }
}
