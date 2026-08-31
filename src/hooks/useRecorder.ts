import { useEffect, useMemo, useRef, useState } from 'react';
import { Recorder, type RecorderSnapshot } from '../lib/recorder';
import type { Sport } from '../types';

/** Owns a Recorder for the lifetime of a recording session: starts a real GPS watch
 *  the moment `armed` becomes true, feeds every position straight into the recorder,
 *  and tears the watch down when the session ends. */
export function useRecorder(sport: Sport, armed: boolean) {
  const [recorder] = useState(() => new Recorder(sport));
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
      recorder.start();
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
