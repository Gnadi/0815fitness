// Installing Contour to the home screen is the point of the manifest and the worker in
// src/sw.js: the app then opens without browser chrome, keeps working with no network,
// and holds its training log on the device. This module is the page's half of that.

/** Registers the service worker built by the `contourServiceWorker` Vite plugin.
 *
 *  A worker only exists in a production build — in dev there is nothing to serve from a
 *  cache and a stale one would only mask changes — and registration waits for `load` so
 *  precaching the shell competes with nothing the first screen is still waiting on.
 *
 *  There is no update prompt on purpose. A new worker installs in the background and
 *  takes over the next time the app is opened cold, so an update can never swap the
 *  shell out from under a session that is recording. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  const register = () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {
      /* An unregistrable worker costs the app nothing it had before: it just goes back
         to being an ordinary page that needs the network. */
    });
  };

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

/** True when the app is running as an installed app rather than in a browser tab. */
export function isInstalled(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches ||
    // iOS Safari predates display-mode and still reports standalone this way.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Asks the browser not to evict the training log under storage pressure.
 *
 *  Only when the app is actually installed: some browsers turn this into a permission
 *  prompt, and a visitor who has recorded nothing yet should not be asked to keep
 *  anything. Where it is granted silently — Chromium grants it to installed apps — the
 *  history stops being evictable cache. */
export async function requestPersistentStorage(): Promise<void> {
  if (!navigator.storage?.persist || !isInstalled()) return;
  try {
    if (await navigator.storage.persisted()) return;
    await navigator.storage.persist();
  } catch {
    /* Storage stays best-effort, which is what it was before we asked. */
  }
}
