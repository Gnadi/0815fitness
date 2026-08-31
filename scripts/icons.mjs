// Rasterises the Contour mark in public/logo.svg into the PNG sizes a manifest and
// iOS need. Run after changing the logo: `npm run icons`.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = new URL('../public/', import.meta.url);
const logo = readFileSync(new URL('logo.svg', OUT), 'utf8');

// The mark is drawn edge to edge, so a maskable icon is just the same drawing without
// the rounded corner it would be cropped through anyway. Nothing meaningful sits
// outside Android's 80 % safe zone: the ridge and its peak are centred, and it is only
// the terrain's corners a circular mask takes off.
const inner = logo
  .replace(/^[\s\S]*<g clip-path="url\(#ct-bounds\)">/, '')
  .replace(/<\/g>\s*<rect[\s\S]*$/, '');

const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">${inner}</svg>`;

const targets = [
  { name: 'icon-192.png', size: 192, svg: logo },
  { name: 'icon-512.png', size: 512, svg: logo },
  { name: 'icon-maskable-512.png', size: 512, svg: maskable },
  // iOS puts its own mask over this one and never renders a transparent corner,
  // so it gets the full-bleed ground rather than the rounded mark.
  { name: 'apple-touch-icon.png', size: 180, svg: maskable },
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.size, height: t.size }, deviceScaleFactor: 1 });
  await page.setContent(
    `<style>html,body{margin:0;padding:0}svg{display:block;width:${t.size}px;height:${t.size}px}</style>${t.svg}`,
  );
  const buf = await page.locator('svg').screenshot({ omitBackground: true });
  writeFileSync(new URL(t.name, OUT), buf);
  console.log(`${t.name}  ${t.size}×${t.size}  ${(buf.length / 1024).toFixed(1)} kB`);
  await page.close();
}
await browser.close();
