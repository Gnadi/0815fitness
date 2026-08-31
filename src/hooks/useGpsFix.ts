import { useEffect, useRef, useState } from 'react';
import { fixStrengthFromAccuracy } from '../lib/geo';

export type GpsStatus = 'unsupported' | 'denied' | 'acquiring' | 'locked';

export interface GpsFixState {
  status: GpsStatus;
  accuracy: number | null;
  strength: number; // 0-12, see fixStrengthFromAccuracy
  coords: { lat: number; lon: number; alt: number | null } | null;
}

const LOCK_ACCURACY_M = 20;

/** Watches the device's real GPS fix while `active` is true — used on the pre-start
 *  screen so the fix quality shown is the browser's actual Geolocation accuracy,
 *  not a simulated countdown. */
export function useGpsFix(active: boolean): GpsFixState {
  const [state, setState] = useState<GpsFixState>(() => ({
    status: 'geolocation' in navigator ? 'acquiring' : 'unsupported',
    accuracy: null,
    strength: 0,
    coords: null,
  }));
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !('geolocation' in navigator)) return;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracy = pos.coords.accuracy;
        setState({
          status: accuracy <= LOCK_ACCURACY_M ? 'locked' : 'acquiring',
          accuracy,
          strength: fixStrengthFromAccuracy(accuracy),
          coords: { lat: pos.coords.latitude, lon: pos.coords.longitude, alt: pos.coords.altitude },
        });
      },
      (err) => {
        setState({
          status: err.code === err.PERMISSION_DENIED ? 'denied' : 'acquiring',
          accuracy: null,
          strength: 0,
          coords: null,
        });
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );

    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [active]);

  return state;
}
