import { useEffect, useRef, useState } from 'react';

/** Whether the screen can be kept awake, which is the one thing standing between a
 *  recording and a browser that stops reporting locations.
 *
 *  `denied` is not a theoretical state: Chrome refuses a wake lock when battery saver is
 *  on, which is exactly the setting someone is likely to have enabled before a long
 *  ride. It is worth knowing before setting off rather than after. */
export type WakeLockState = 'idle' | 'held' | 'denied' | 'unsupported';

const supported = () => typeof navigator !== 'undefined' && 'wakeLock' in navigator;

/** Holds a screen wake lock while `active` — a capture screen glanced at mid-run is
 *  useless if the display has gone to sleep. Silently does nothing where the API
 *  isn't available, and re-acquires when the tab comes back to the foreground. */
export function useWakeLock(active: boolean): WakeLockState {
  const sentinel = useRef<WakeLockSentinel | null>(null);
  // Only the outcome of the request is state; whether the API exists at all, and whether
  // it is even being asked for, are known at render time.
  const [outcome, setOutcome] = useState<'held' | 'denied' | null>(null);

  useEffect(() => {
    if (!active || !supported()) return;
    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void lock.release();
          return;
        }
        sentinel.current = lock;
        setOutcome('held');
        // The system can take the lock back — a battery-saver threshold crossed
        // mid-ride — and the screen sleeping is exactly what stops the track.
        lock.addEventListener('release', () => {
          if (!cancelled && document.visibilityState === 'visible') setOutcome('denied');
        });
      } catch {
        if (!cancelled) setOutcome('denied');
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && sentinel.current?.released !== false) void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel.current?.release();
      sentinel.current = null;
    };
  }, [active]);

  if (!active) return 'idle';
  if (!supported()) return 'unsupported';
  return outcome ?? 'idle';
}
