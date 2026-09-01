// Rasterises the Contour mark in public/logo.svg into every size Android needs.
// Run after changing the logo: `npm run icons`.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const PUBLIC = new URL('../public/', import.meta.url);
const RES = new URL('../android/app/src/main/res/', import.meta.url);
const logo = readFileSync(new URL('logo.svg', PUBLIC), 'utf8');

// The mark is drawn edge to edge, so a maskable icon is just the same drawing without
// the rounded corner it would be cropped through anyway. Nothing meaningful sits
// outside Android's 80 % safe zone: the ridge and its peak are centred, and it is only
// the terrain's corners a circular mask takes off.
const inner = logo
  .replace(/^[\s\S]*<g clip-path="url\(#ct-bounds\)">/, '')
  .replace(/<\/g>\s*<rect[\s\S]*$/, '');

const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">${inner}</svg>`;

// An adaptive icon's foreground is a 108 dp canvas of which only the middle 72 dp is
// guaranteed to survive the launcher's mask — the rest is what gets shaved into a
// circle, a squircle or a rounded square. The mark is drawn into that safe square and
// the margin left transparent, so the background colour shows through the shave rather
// than the mark losing its edges. Bleeding it to the full 108 dp, which is what the
// web icon does, would cut the ridge off on a round launcher.
const SAFE = 72 / 108;
const adaptive = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
  <g transform="translate(${(108 * (1 - SAFE)) / 2} ${(108 * (1 - SAFE)) / 2}) scale(${(108 * SAFE) / 64})">${inner}</g>
</svg>`;

// Legacy square launcher icon (pre-API 26) at 48 dp, and the adaptive foreground at
// 108 dp, per density bucket.
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const targets = [
  // The web icons stay: the logo is still the app's mark and README/GitHub use them.
  { path: new URL('icon-192.png', PUBLIC), size: 192, svg: logo },
  { path: new URL('icon-512.png', PUBLIC), size: 512, svg: logo },
  { path: new URL('icon-maskable-512.png', PUBLIC), size: 512, svg: square },
];

for (const [bucket, scale] of Object.entries(DENSITIES)) {
  const dir = new URL(`mipmap-${bucket}/`, RES);
  mkdirSync(dir, { recursive: true });
  targets.push(
    { path: new URL('ic_launcher.png', dir), size: Math.round(48 * scale), svg: logo },
    { path: new URL('ic_launcher_round.png', dir), size: Math.round(48 * scale), svg: logo },
    { path: new URL('ic_launcher_foreground.png', dir), size: Math.round(108 * scale), svg: adaptive },
  );
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.size, height: t.size }, deviceScaleFactor: 1 });
  await page.setContent(
    `<style>html,body{margin:0;padding:0}svg{display:block;width:${t.size}px;height:${t.size}px}</style>${t.svg}`,
  );
  const buf = await page.locator('svg').screenshot({ omitBackground: true });
  writeFileSync(t.path, buf);
  console.log(`${t.path.pathname.split('/').slice(-2).join('/')}  ${t.size}×${t.size}  ${(buf.length / 1024).toFixed(1)} kB`);
  await page.close();
}
await browser.close();
