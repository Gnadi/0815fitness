import { useEffect, useState } from 'react';
import { fixStrengthFromAccuracy } from '../lib/geo';
import { watchLocation } from '../lib/location';

export type GpsStatus = 'denied' | 'disabled' | 'acquiring' | 'locked';

export interface GpsFixState {
  status: GpsStatus;
  accuracy: number | null;
  strength: number; // 0-12, see fixStrengthFromAccuracy
  coords: { lat: number; lon: number; alt: number | null } | null;
}

const LOCK_ACCURACY_M = 20;

const ACQUIRING: GpsFixState = { status: 'acquiring', accuracy: null, strength: 0, coords: null };

/** Watches the device's real GPS fix while `active` is true — used on the pre-start
 *  screen so the fix quality shown is the receiver's actual accuracy, not a simulated
 *  countdown.
 *
 *  This watch is deliberately a foreground one: no notification, and it stops when the
 *  screen does. Standing on the pre-start screen is not recording, and an ongoing
 *  notification that says otherwise would be a lie the person has to dismiss. The
 *  background service starts when the session does. */
export function useGpsFix(active: boolean): GpsFixState {
  const [state, setState] = useState<GpsFixState>(ACQUIRING);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const pending = watchLocation({
      onFix: (sample) => {
        if (cancelled) return;
        const accuracy = sample.accuracy ?? null;
        setState({
          status: accuracy != null && accuracy <= LOCK_ACCURACY_M ? 'locked' : 'acquiring',
          accuracy,
          strength: fixStrengthFromAccuracy(accuracy),
          coords: { lat: sample.lat, lon: sample.lon, alt: sample.ele ?? null },
        });
      },
      onError: (denial) => {
        if (cancelled) return;
        // A receiver that is merely struggling reads as a fix that has not landed yet;
        // only a refusal the person can act on is reported as one.
        setState({ ...ACQUIRING, status: denial === 'unavailable' ? 'acquiring' : denial });
      },
    });

    return () => {
      cancelled = true;
      void pending.then((handle) => handle.stop());
    };
  }, [active]);

  return active ? state : ACQUIRING;
}
