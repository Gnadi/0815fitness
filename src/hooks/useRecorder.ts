import { useEffect, useMemo, useRef, useState } from 'react';
import { Recorder, type RecorderCheckpoint, type RecorderSnapshot } from '../lib/recorder';
import { CHECKPOINT_INTERVAL_MS, clearCheckpoint, saveCheckpoint } from '../lib/session';
import type { Sport } from '../types';

export interface RecorderOptions {
  autoPauseMps?: number;
  /** A session interrupted by a crash or a reload, picked up where it stopped. */
  restore?: RecorderCheckpoint | null;
}

/** Owns a Recorder for the lifetime of a recording session: starts a real GPS watch
 *  the moment `armed` becomes true, feeds every position straight into the recorder,
 *  and tears the watch down when the session ends.
 *
 *  It also writes the session to the database every few seconds, so that the recording
 *  survives whatever happens to the tab. */
export function useRecorder(sport: Sport, armed: boolean, options: RecorderOptions = {}) {
  const { autoPauseMps, restore } = options;
  const [recorder] = useState(() => new Recorder(sport, autoPauseMps));
  const [snapshot, setSnapshot] = useState<RecorderSnapshot>(() => recorder.snapshot());
  const watchId = useRef<number | null>(null);
  const wasArmed = useRef(false);

  useEffect(() => {
    const unsub = recorder.subscribe(setSnapshot);
    return unsub;
  }, [recorder]);

  useEffect(() => {
    if (!armed) return;
    // Start once per session; the watch itself is re-established whenever this effect
    // re-runs (StrictMode's double-mount included) so the track never silently stops.
    if (!wasArmed.current) {
      wasArmed.current = true;
      if (restore) recorder.restore(restore);
      else recorder.start();
    }
    if (!('geolocation' in navigator)) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        recorder.addGeoSample({
          t: pos.timestamp,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          ele: pos.coords.altitude ?? undefined,
          accuracy: pos.coords.accuracy,
        });
      },
      () => {
        /* location errors surface as a stalled fix in the UI via gpsOk; nothing else to do here */
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    );
    watchId.current = id;

    return () => {
      navigator.geolocation.clearWatch(id);
      if (watchId.current === id) watchId.current = null;
    };
  }, [armed, recorder, restore]);

  // Checkpoint on a timer rather than on every sample: a write per fix would be a write
  // a second for hours, and what a recovery needs is the last few seconds, not the last
  // few metres.
  useEffect(() => {
    if (!armed) return;
    const write = () => {
      const checkpoint = recorder.toCheckpoint();
      if (checkpoint) void saveCheckpoint(checkpoint);
    };
    const handle = setInterval(write, CHECKPOINT_INTERVAL_MS);
    // Backgrounding the app is the moment before it is most likely to be killed, so the
    // freshest possible checkpoint is written on the way out.
    const onHidden = () => {
      if (document.visibilityState === 'hidden') write();
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      clearInterval(handle);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [armed, recorder]);

  const actions = useMemo(
    () => ({
      togglePause: () => recorder.togglePause(),
      lock: () => recorder.lock(),
      unlock: () => recorder.unlock(),
      addLap: () => recorder.addLap(),
      /** Ends the session and hands back its final state. The caller files the activity
       *  from what is returned rather than from `snapshot`, which is a render behind
       *  until React has processed the stop. */
      finish: (): RecorderSnapshot => {
        if (watchId.current != null) {
          navigator.geolocation.clearWatch(watchId.current);
          watchId.current = null;
        }
        recorder.stop();
        // The checkpoint is dropped here, not after the save screen: from this point the
        // draft is held by the app, and offering it again on the next launch would
        // duplicate whatever the person decides to do with it.
        void clearCheckpoint();
        return recorder.snapshot();
      },
      feedHr: (bpm: number) => recorder.addHr(bpm),
      feedPower: (watts: number) => recorder.addPower(watts),
      feedCadence: (rpm: number) => recorder.addCadence(rpm),
    }),
    [recorder],
  );

  return { snapshot, actions };
}
