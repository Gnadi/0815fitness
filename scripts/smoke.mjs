// Drives the built app in Chromium with a simulated GPS track so the recording
// flow can be exercised end to end without real hardware. Screenshots land in
// scripts/shots/ for a visual check against the design.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = new URL('./shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const shot = async (page, name) => {
  await page.screenshot({ path: `${OUT}${name}.png` });
  console.log('shot:', name);
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  permissions: ['geolocation'],
  geolocation: { latitude: 48.3069, longitude: 14.2858, accuracy: 6 },
  locale: 'de-AT',
});
// The basemap is the one thing in the app that talks to the network, and a smoke run
// must not hammer a public tile server. Each stand-in tile draws its own z/x/y and its
// own border, so a misplaced or duplicated tile is visible in the screenshots.
let tilesServed = 0;
await context.route('https://tile.openstreetmap.org/**', async (route) => {
  const [, z, x, y] = route.request().url().match(/\/(\d+)\/(\d+)\/(\d+)\.png$/);
  tilesServed++;
  await route.fulfill({
    status: 200,
    contentType: 'image/svg+xml',
    body: `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
      <rect width="256" height="256" fill="#f2efe9"/>
      <path d="M0 128 H256 M128 0 V256" stroke="#d8d2c6" stroke-width="6"/>
      <path d="M20 236 C 90 150 150 190 240 40" stroke="#a8c8a0" stroke-width="14" fill="none"/>
      <text x="8" y="24" font-family="monospace" font-size="16" fill="#7a736a">${z}/${x}/${y}</text>
    </svg>`,
  });
});

const page = await context.newPage();
page.on('console', (m) => m.type() === 'error' && console.log('console.error:', m.text()));
page.on('pageerror', (e) => console.log('pageerror:', e.message));

await page.goto(BASE);
await page.waitForTimeout(500);
await shot(page, '01-overview-empty');

// Seed sample history so the aggregate screens have something to compute over.
await page.getByText('Load 13 weeks of sample history').click();
await page.waitForTimeout(800);
await shot(page, '02-overview');

await page.getByText('Analyse →').click();
await page.waitForTimeout(400);
await shot(page, '03-analyse-load');
await page.getByRole('button', { name: 'ZONES' }).click();
await page.waitForTimeout(300);
await shot(page, '04-analyse-zones');
await page.getByRole('button', { name: 'RECORDS' }).click();
await page.waitForTimeout(600);
await shot(page, '05-analyse-records');
await page.getByRole('button', { name: 'PLAN' }).click();
await page.waitForTimeout(300);
await shot(page, '06-analyse-plan');

await page.getByRole('button', { name: 'Back to overview' }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'RECORD' }).click();
await page.waitForTimeout(1200);
await shot(page, '07-prestart');

// Pre-start says what browser GPS will and will not do before the session starts. This
// Chromium grants no wake lock, so it is the denied wording that appears here.
const wakeNote = await page.getByText(/screen/i).first().isVisible();
console.log(`${wakeNote ? 'ok  ' : 'FAIL'}: pre-start says what the screen has to do`);

await page.getByRole('button', { name: 'START' }).click();

// Walk the simulated position along a route so distance, pace and laps accrue.
let lat = 48.3069;
let lon = 14.2858;
for (let i = 0; i < 40; i++) {
  lat += 0.00022;
  lon += 0.00016 * Math.sin(i / 4);
  await context.setGeolocation({ latitude: lat, longitude: lon, accuracy: 5 });
  await page.waitForTimeout(120);
}
await page.waitForTimeout(600);
await shot(page, '08-recording');

await page.getByText('TAP TO EXPAND MAP').click();
await page.waitForTimeout(400);
await shot(page, '09-recording-map');

await page.getByRole('button', { name: 'Lock screen' }).click();
await page.waitForTimeout(300);
await shot(page, '10-recording-locked');
await page.getByText('DOUBLE-TAP TO UNLOCK').dblclick();
await page.waitForTimeout(300);

await page.getByRole('button', { name: 'PAUSE' }).click();
await page.waitForTimeout(300);
await shot(page, '11-recording-paused');

await page.getByRole('button', { name: 'FINISH & SAVE' }).click();
await page.waitForTimeout(700);
await shot(page, '12-save');

await page.getByRole('button', { name: 'Save', exact: true }).click();
await page.waitForTimeout(600);
await shot(page, '13-overview-after-save');

// Stat details: every figure on the Overview opens one, and the streak and load
// details each render their own extra element (day grid, ratio band).
await page.getByRole('button', { name: 'Run distance detail' }).click();
await page.waitForTimeout(500);
await shot(page, '14-stat-run-distance');

await page.getByRole('button', { name: 'Back to overview' }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Streak detail' }).click();
await page.waitForTimeout(400);
await shot(page, '15-stat-streak');

// The load and volume windows hang off the analysis rather than the start screen:
// the Overview keeps the week and the sessions, everything deeper is a screen away.
await page.getByRole('button', { name: 'Back to overview' }).click();
await page.waitForTimeout(300);
await page.getByText('Analyse →').click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Load detail →' }).click();
await page.waitForTimeout(400);
await shot(page, '16-stat-load');
await page.getByRole('button', { name: 'Compare →' }).click();
await page.waitForTimeout(600);
await shot(page, '17-compare-from-detail');

// Comparison: swap the just-recorded stub out for an older run, then read them
// side by side.
await page.getByRole('button', { name: 'Back to selection' }).click();
await page.waitForTimeout(300);
const pickRows = page.locator('.ct-scroll > button');
await pickRows.nth(0).click();
await pickRows.nth(3).click();
await page.waitForTimeout(300);
await shot(page, '18-compare-picker');
await page.getByRole('button', { name: 'COMPARE 3' }).click();
await page.waitForTimeout(600);
await page.evaluate(() => document.querySelector('.ct-scroll').scrollBy(0, 700));
await page.waitForTimeout(300);
await shot(page, '19-compare-charts');
await page.evaluate(() => document.querySelector('.ct-scroll').scrollBy(0, 900));
await page.waitForTimeout(300);
await shot(page, '20-compare-splits');

// The history, one session on its own, the routes it repeats and the settings that
// decide how all of it is measured.
let failed = 0;
const check = (label, passed) => {
  console.log(`${passed ? 'ok  ' : 'FAIL'}: ${label}`);
  if (!passed) failed++;
};

await page.goto(BASE);
await page.waitForTimeout(600);
await page.getByRole('button', { name: /^All \d+ sessions →$/ }).click();
await page.waitForTimeout(500);
await shot(page, '21-history');

await page.getByLabel('Search the log').fill('Pöstlingberg');
await page.waitForTimeout(400);
await shot(page, '22-history-search');
check('search narrows the log', (await page.locator('.ct-row').count()) > 0);
await page.getByLabel('Search the log').fill('');
await page.waitForTimeout(300);

await page.locator('.ct-row').first().click();
await page.waitForTimeout(1200);
await shot(page, '23-activity-detail');
check('a session opens on its own', await page.getByText('Moving time').isVisible());
check('the basemap loads under the track', tilesServed > 0);
check('the basemap is attributed', await page.getByText('© OpenStreetMap').isVisible());
await page.evaluate(() => document.querySelector('.ct-scroll').scrollBy(0, 900));
await page.waitForTimeout(400);
await shot(page, '24-activity-charts');
await page.evaluate(() => document.querySelector('.ct-scroll').scrollBy(0, 1200));
await page.waitForTimeout(400);
await shot(page, '25-activity-splits');

// Comparing from a session opens the picker with that session held as the reference:
// which one it is read against is the person's choice, not the app's.
await page.evaluate(() => document.querySelector('.ct-scroll').scrollBy(0, 4000));
await page.waitForTimeout(300);
await page.getByRole('button', { name: /^Compare with another session/ }).click();
await page.waitForTimeout(500);
await shot(page, '26-compare-pick-from-detail');
check('comparing from a session opens the picker', await page.getByRole('button', { name: 'SELECT 1 MORE' }).isVisible());
check('the session it was opened from is the reference', await page.getByText('is the reference').isVisible());
await page.locator('.ct-scroll > button').nth(1).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'COMPARE 2' }).click();
await page.waitForTimeout(700);
await shot(page, '26b-compare-from-detail');
check('the chosen pair is compared', await page.getByText('reference · ').isVisible());

await page.goBack();
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Edit' }).click();
await page.waitForTimeout(400);
await shot(page, '26c-activity-edit');
check('a saved session can be deleted', await page.getByRole('button', { name: 'Delete this session' }).isVisible());

await page.goto(BASE);
await page.waitForTimeout(600);
await page.getByRole('button', { name: /^All \d+ sessions →$/ }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: '+ Manual' }).click();
await page.waitForTimeout(400);
await shot(page, '27-manual-entry');

await page.goto(BASE);
await page.waitForTimeout(600);
await page.getByText('Analyse →').click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'ROUTES' }).click();
await page.waitForTimeout(700);
await shot(page, '28-analyse-routes');
const routeRows = page.locator('.ct-row');
check('repeated routes are grouped', (await routeRows.count()) > 0);
if (await routeRows.count()) {
  await routeRows.first().click();
  await page.waitForTimeout(700);
  await shot(page, '29-route-detail');
}

await page.goto(BASE);
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Settings' }).click();
await page.waitForTimeout(500);
await shot(page, '30-settings');
await page.getByRole('button', { name: 'MI · FT' }).click();
await page.waitForTimeout(400);
await shot(page, '31-settings-imperial');
await page.getByRole('button', { name: 'Back', exact: true }).click();
await page.waitForTimeout(500);
await shot(page, '32-overview-imperial');
// The Overview's week strip and its session cards both carry the unit, so a switch
// has to reach the start screen rather than only the screens that analyse it.
const runFigure = await page.getByRole('button', { name: 'Run distance detail' }).innerText();
const firstCard = await page.locator('.ct-card').first().innerText();
check('switching units restates the Overview', runFigure.includes('mi') && firstCard.includes('mi'));
await page.getByRole('button', { name: 'Settings' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'KM · M' }).click();
await page.waitForTimeout(300);
// With the basemap off, a saved track falls back to the drawing and nothing is fetched.
await page.getByRole('button', { name: 'DRAWN TRACK' }).click();
await page.waitForTimeout(300);
const tilesBefore = tilesServed;
await page.getByRole('button', { name: 'Back', exact: true }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /^All \d+ sessions →$/ }).click();
await page.waitForTimeout(400);
await page.locator('.ct-row').first().click();
await page.waitForTimeout(900);
await shot(page, '35-activity-detail-no-tiles');
check('turning the basemap off stops the requests', tilesServed === tilesBefore);
await page.getByRole('button', { name: 'Back', exact: true }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Back', exact: true }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Settings' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'OPENSTREETMAP' }).click();
await page.waitForTimeout(200);
await page.getByRole('button', { name: 'TRAINING STRESS' }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Back', exact: true }).click();
await page.waitForTimeout(500);
await shot(page, '33-overview-stress-load');
await page.getByText('Analyse →').click();
await page.waitForTimeout(600);
await shot(page, '34-analyse-load-stress');

await page.goto(BASE);
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Streak detail' }).click();
await page.waitForTimeout(400);
await page.goBack();
await page.waitForTimeout(400);
check('back out of a stat detail lands on the Overview', await page.getByRole('button', { name: 'RECORD' }).isVisible());
await page.goForward();
await page.waitForTimeout(400);
check('forward re-opens the detail', await page.getByRole('button', { name: 'Back to overview' }).isVisible());
await page.getByRole('button', { name: 'Back to overview' }).click();
await page.waitForTimeout(400);
check('the in-app back button lands on the Overview too', await page.getByRole('button', { name: 'RECORD' }).isVisible());

await browser.close();
console.log(failed ? `done — ${failed} check(s) failed` : 'done');
process.exitCode = failed ? 1 : 0;
