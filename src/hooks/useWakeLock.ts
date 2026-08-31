import { useEffect, useRef } from 'react';

/** Holds a screen wake lock while `active` — a capture screen glanced at mid-run is
 *  useless if the display has gone to sleep. Silently does nothing where the API
 *  isn't available, and re-acquires when the tab comes back to the foreground. */
export function useWakeLock(active: boolean) {
  const sentinel = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void lock.release();
          return;
        }
        sentinel.current = lock;
      } catch {
        /* denied or unsupported — the screen just sleeps as usual */
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
}
