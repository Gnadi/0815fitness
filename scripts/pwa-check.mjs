// Verifies the built app really installs: the worker registers and activates, the
// manifest parses, and a second load with the network cut still boots the app.
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));

let failed = 0;
const check = (label, passed, detail = '') => {
  console.log(`${passed ? 'ok  ' : 'FAIL'}: ${label}${detail ? ` — ${detail}` : ''}`);
  if (!passed) failed++;
};

await page.goto(BASE);
// The worker claims the very first load, which fetched everything itself; until it
// holds the page there is nothing to serve a reload from.
const controlling = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) {
    await new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
      setTimeout(resolve, 5000);
    });
  }
  return { state: reg.active?.state ?? 'none', controlled: navigator.serviceWorker.controller != null };
});
check('service worker activates', controlling.state !== 'none', controlling.state);
check('service worker claims the first load', controlling.controlled);

const manifest = await page.evaluate(async () => {
  const href = document.querySelector('link[rel=manifest]')?.getAttribute('href');
  return href ? await (await fetch(href)).json() : null;
});
check('manifest parses', manifest != null);
check('manifest names the app', manifest?.name?.startsWith('Contour'));
check('manifest is installable (standalone + 192 + 512)', manifest?.display === 'standalone'
  && manifest.icons.some((i) => i.sizes === '192x192') && manifest.icons.some((i) => i.sizes === '512x512'));
check('manifest ships a maskable icon', manifest?.icons.some((i) => i.purpose === 'maskable'));

const cached = await page.evaluate(async () => {
  const names = await caches.keys();
  const cache = await caches.open(names[0]);
  return (await cache.keys()).map((r) => new URL(r.url).pathname).sort();
});
check('shell is precached', cached.includes('/index.html'), `${cached.length} entries`);
check('fonts are precached', cached.some((p) => p.endsWith('.woff2')));
check('no legacy .woff precached', !cached.some((p) => p.endsWith('.woff')));

// Cut the network entirely and reload: everything must come off the worker.
await context.setOffline(true);
await page.reload();
await page.waitForTimeout(600);
check('the app boots offline', await page.getByRole('button', { name: 'RECORD' }).isVisible());
const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
check('bundled fonts survive offline', font.includes('IBM Plex Sans'), font);

// The icon's Record shortcut opens pre-start rather than the Overview.
await context.setOffline(false);
await page.goto(`${BASE}/?screen=record`);
await page.waitForTimeout(600);
check('the Record shortcut opens pre-start', await page.getByRole('button', { name: 'START' }).isVisible());
check('the shortcut query is cleared', new URL(page.url()).search === '', page.url());
await page.getByRole('button', { name: 'Back to overview' }).click();
await page.waitForTimeout(300);
check('back out of a shortcut launch lands on the Overview', await page.getByRole('button', { name: 'RECORD' }).isVisible());

await browser.close();
console.log(failed ? `done — ${failed} check(s) failed` : 'done');
process.exitCode = failed ? 1 : 0;
