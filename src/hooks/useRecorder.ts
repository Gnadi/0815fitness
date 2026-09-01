import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Recorder, type RecorderCheckpoint, type RecorderSnapshot } from '../lib/recorder';
import { CHECKPOINT_INTERVAL_MS, clearCheckpoint, saveCheckpoint } from '../lib/session';
import { watchLocation, type LocationDenial, type LocationWatchHandle } from '../lib/location';
import type { GeoSample, Sport } from '../types';

export interface RecorderOptions {
  autoPauseMps?: number;
  /** A session interrupted by a crash or a relaunch, picked up where it stopped. */
  restore?: RecorderCheckpoint | null;
}

/** Owns a Recorder for the lifetime of a recording session: starts the location service
 *  the moment `armed` becomes true, feeds every position into the recorder, and stops
 *  the service when the session ends.
 *
 *  The service is what the pivot bought. It is started from here, with the app on
 *  screen, and it holds a notification for as long as it runs; in exchange Android keeps
 *  delivering positions with the screen off and the phone in a pocket. The screen wake
 *  lock this hook used to depend on is gone, because the screen no longer has anything
 *  to do with whether the track continues.
 *
 *  It also writes the session to the database every few seconds, so a recording survives
 *  whatever happens to the app. */
export function useRecorder(sport: Sport, armed: boolean, options: RecorderOptions = {}) {
  const { autoPauseMps, restore } = options;
  const [recorder] = useState(() => new Recorder(sport, autoPauseMps));
  const [snapshot, setSnapshot] = useState<RecorderSnapshot>(() => recorder.snapshot());
  const watch = useRef<Promise<LocationWatchHandle> | null>(null);
  const wasArmed = useRef(false);
  /** A refusal the person can do something about — the permission, or the system
   *  location switch. Anything else surfaces as a fix that has not landed. */
  const [denial, setDenial] = useState<LocationDenial | null>(null);

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

    // Fixes are taken in runs rather than one at a time. Android throttles a WebView's
    // JavaScript while the app is not on screen, so a stretch ridden with the phone
    // pocketed can be handed over as a burst the moment it comes back. Collecting what
    // arrives within a frame and passing it to `addGeoSamples` keeps that burst in
    // timestamp order, drops anything already recorded, and costs one render instead of
    // several hundred. A single fix arriving at walking pace takes the same path a frame
    // later, which nothing can perceive.
    let pending: GeoSample[] = [];
    let flushHandle: number | null = null;
    const flush = () => {
      flushHandle = null;
      const batch = pending;
      pending = [];
      if (batch.length === 1) recorder.addGeoSample(batch[0]);
      else if (batch.length > 1) recorder.addGeoSamples(batch);
    };

    const handle = watchLocation({
      background: { title: 'Contour', message: 'Recording — the track continues with the screen off.' },
      onFix: (sample) => {
        // A fix is the proof a refusal has been lifted: granting the permission from the
        // banner starts them flowing again, and the banner has to go with it.
        setDenial(null);
        pending.push(sample);
        if (flushHandle == null) flushHandle = setTimeout(flush, 0) as unknown as number;
      },
      onError: setDenial,
    });
    watch.current = handle;

    return () => {
      if (flushHandle != null) clearTimeout(flushHandle);
      flush();
      void handle.then((h) => h.stop());
      if (watch.current === handle) watch.current = null;
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
    // Going to the background no longer costs the track, but it is still the moment the
    // app is most likely to be killed, so the freshest possible checkpoint is written on
    // the way out.
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') write();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(handle);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [armed, recorder]);

  const stopWatch = useCallback(() => {
    const handle = watch.current;
    watch.current = null;
    if (handle) void handle.then((h) => h.stop());
  }, []);

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
        // Before anything else: the notification says the app is recording, and from
        // here it is not.
        stopWatch();
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
    [recorder, stopWatch],
  );

  return { snapshot, actions, denial };
}
