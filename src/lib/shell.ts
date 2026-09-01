import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

// The parts of being an Android app that have nothing to do with recording: the system
// bars the WebView draws under, the hardware back gesture, and the launcher shortcut.

/** Paints the system bars to match the app.
 *
 *  The WebView draws edge to edge — every screen already pads with `env(safe-area-inset-*)`,
 *  which it did as an installed PWA — so the status bar is made transparent and overlaid
 *  rather than given a strip of its own. Light content, because the app is dark. */
export function styleSystemBars(): void {
  if (!Capacitor.isNativePlatform()) return;
  void StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  void StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
}

/** Wires Android's back gesture to the app's own screen stack.
 *
 *  The WebView's history already follows the stack, so back mostly works by itself. Two
 *  things it does not get right on its own: at the root, back should leave the app the
 *  way Android expects — minimised, still in recents, log intact — rather than navigating
 *  a WebView with nowhere left to go; and inside a recording it must do nothing at all,
 *  because a session ends with FINISH or DISCARD and a stray swipe is not either.
 *
 *  Returns the unsubscribe. */
export function onHardwareBack(handler: () => { handled: boolean }): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};
  const listener = App.addListener('backButton', () => {
    const { handled } = handler();
    if (!handled) void App.minimizeApp();
  });
  return () => void listener.then((l) => l.remove());
}

/** Calls back when the app is launched, or resumed, through `contour://record` — the
 *  long-press shortcut on the launcher icon.
 *
 *  Both halves matter: `getLaunchUrl` covers a cold start, the listener covers a
 *  shortcut tapped while the app is already in recents. */
export function onRecordShortcut(handler: () => void): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};
  const isRecord = (url: string | undefined) => url?.startsWith('contour://record') ?? false;

  void App.getLaunchUrl()
    .then((launch) => {
      if (isRecord(launch?.url)) handler();
    })
    .catch(() => {});

  const listener = App.addListener('appUrlOpen', ({ url }) => {
    if (isRecord(url)) handler();
  });
  return () => void listener.then((l) => l.remove());
}
