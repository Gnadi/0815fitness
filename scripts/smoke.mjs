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

await browser.close();
console.log('done');
