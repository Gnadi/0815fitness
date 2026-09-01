import { Capacitor, registerPlugin } from '@capacitor/core';
import type {
  BackgroundGeolocationPlugin,
  CallbackError,
  Location,
} from '@capacitor-community/background-geolocation';
import type { GeoSample } from '../types';

// The package ships type definitions and native code but no JavaScript: the bridge
// binding is the consumer's to make.
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

// The app's one seam onto the platform's location service, and the reason it stopped
// being a web page.
//
// `navigator.geolocation.watchPosition` only reports to a page that is on screen, so a
// pocketed phone produced two fixes twenty minutes apart and a straight line between
// them. What replaces it is an Android foreground service: it holds a notification for
// as long as it runs, and in exchange Android keeps delivering positions with the
// screen off and the app in the background.
//
// The service is started from the Record button, while the app is on screen. That makes
// it a "while in use" service, which is why the app never asks for
// ACCESS_BACKGROUND_LOCATION — see the note in AndroidManifest.xml before adding it.

export type LocationDenial = 'denied' | 'disabled' | 'unavailable';

export interface LocationWatchHandle {
  stop: () => Promise<void>;
}

export interface LocationWatchOptions {
  /** The notification text, and the switch that makes this a background watch.
   *
   *  With it, the plugin starts a foreground service and positions keep coming with the
   *  screen off. Without it, the watch only runs while the app is showing — which is
   *  what the pre-start screen wants, since posting an ongoing notification to answer
   *  "how good is the fix here" would be noise. */
  background?: { title: string; message: string } | null;
  onFix: (sample: GeoSample) => void;
  onError?: (denial: LocationDenial) => void;
}

/** The plugin reports a refusal through the same callback as a fix. Only the first two
 *  codes are the person's to fix; anything else is the receiver having a bad day, and
 *  is reported as a fix that has not landed yet rather than as a failure. */
function denialFrom(error: CallbackError): LocationDenial {
  if (error.code === 'NOT_AUTHORIZED') return 'denied';
  if (error.code === 'LOCATION_DISABLED') return 'disabled';
  return 'unavailable';
}

/** A plugin location, as the recorder wants it.
 *
 *  `time` is the moment the fix was *produced*, not the moment it was delivered, and the
 *  difference is the whole point once fixes can arrive late: everything downstream — the
 *  auto-pause clock, the kilometre markers, the gap detection — measures from it. */
export function toGeoSample(location: Location): GeoSample {
  return {
    t: location.time ?? Date.now(),
    lat: location.latitude,
    lon: location.longitude,
    ele: location.altitude ?? undefined,
    accuracy: location.accuracy,
  };
}

/** The desktop-browser stand-in, for `npm run dev` and the smoke run.
 *
 *  This is a development affordance and nothing more: it is the very API the pivot was
 *  made to escape, and it is unreachable from the APK, where `isNativePlatform()` is
 *  always true. Working on a screen should not require a phone, and Playwright can
 *  drive `setGeolocation` but not a foreground service. */
function watchInBrowser({ onFix, onError }: LocationWatchOptions): LocationWatchHandle {
  if (!('geolocation' in navigator)) {
    onError?.('unavailable');
    return { stop: async () => {} };
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => onFix(toGeoSample({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      altitudeAccuracy: pos.coords.altitudeAccuracy,
      simulated: false,
      bearing: pos.coords.heading,
      speed: pos.coords.speed,
      time: pos.timestamp,
    })),
    (err) => onError?.(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
  );
  return {
    stop: async () => {
      navigator.geolocation.clearWatch(id);
    },
  };
}

/** Starts a location watch, and hands back the way to stop it.
 *
 *  Never rejects. A caller that cannot get a location has a session to keep recording —
 *  time, heart rate, power and cadence are all still worth having — so a refusal arrives
 *  through `onError` like any other, and the handle it returns is simply one that stops
 *  nothing.
 *
 *  Stopping matters more here than it did on the web. A forgotten `watchPosition` cost
 *  a browser some battery; a forgotten foreground service leaves a notification saying
 *  the app is recording when it is not. */
export async function watchLocation(options: LocationWatchOptions): Promise<LocationWatchHandle> {
  const { background = null, onFix, onError } = options;

  if (!Capacitor.isNativePlatform()) return watchInBrowser(options);

  let id: string;
  try {
    id = await BackgroundGeolocation.addWatcher(
      {
        ...(background ? { backgroundTitle: background.title, backgroundMessage: background.message } : {}),
        requestPermissions: true,
        // Stale fixes are the receiver's last known position, which can be somewhere
        // the person was yesterday. The recorder would take it for movement.
        stale: false,
        // Every fix, not every N metres: a session standing still is information, and
        // filtering by displacement is how a track loses the shape of a switchback.
        distanceFilter: 0,
      },
      (location: Location | undefined, error: CallbackError | undefined) => {
        if (error) {
          onError?.(denialFrom(error));
          return;
        }
        if (location) onFix(toGeoSample(location));
      },
    );
  } catch {
    // The service would not start at all — no location provider on the device, or a
    // permission refused before the watcher was ever registered.
    onError?.('unavailable');
    return { stop: async () => {} };
  }

  let stopped = false;
  return {
    stop: async () => {
      if (stopped) return;
      stopped = true;
      try {
        await BackgroundGeolocation.removeWatcher({ id });
      } catch {
        // A watcher the platform has already torn down — the service killed, the app
        // restarted — is the state we were asking for anyway.
      }
    },
  };
}

/** Opens the app's own settings page, which is the only route back from a permission
 *  the person has denied permanently. */
export async function openLocationSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await BackgroundGeolocation.openSettings();
  } catch {
    // Nothing to offer beyond having tried.
  }
}
