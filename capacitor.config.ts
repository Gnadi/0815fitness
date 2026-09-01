import type { CapacitorConfig } from '@capacitor/cli';

/** Contour as an Android app.
 *
 *  The pivot exists for one reason: a browser only delivers positions to a page that is
 *  on screen, so a pocketed phone stopped the track. Everything here is in service of a
 *  WebView that behaves like an app — an opaque dark window that comes up before React
 *  does, and a location foreground service that outlives the screen. */
const config: CapacitorConfig = {
  appId: 'app.contour',
  appName: 'Contour',
  webDir: 'dist',
  android: {
    // The app is dark-only. Without this the WebView flashes white between the splash
    // and the first paint, which on a phone reads as a crash and back.
    backgroundColor: '#0B0C0D',
    // Release builds have no business talking plaintext; the only network the app does
    // is OSM tiles over HTTPS.
    allowMixedContent: false,
  },
  server: {
    // Serving the WebView from https://localhost keeps the app on a secure origin, which
    // is what IndexedDB persistence and the crypto used for activity ids expect.
    androidScheme: 'https',
  },
};

export default config;
