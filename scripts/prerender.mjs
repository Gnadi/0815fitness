// Fügt das vorgerenderte HTML in dist/index.html ein und lädt die wichtigsten Schriften vor.
// Läuft mit TZ=Europe/Vienna, damit Datum und Kalenderwoche zur Zielgruppe passen.
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { render } from '../dist-ssr/entry-server.js'

const pfad = 'dist/index.html'
let html = readFileSync(pfad, 'utf8')

const schriften = readdirSync('dist/assets').filter((f) =>
  /^zettel-(serif|titel)-[\w-]{8}\.woff2$/.test(f),
)
const preload = schriften
  .map((f) => `<link rel="preload" href="./assets/${f}" as="font" type="font/woff2" crossorigin />`)
  .join('\n    ')

// CSS direkt ins HTML: spart eine blockierende Anfrage. Relative URLs zeigen danach auf assets/.
const cssLink = html.match(/<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+\.css)"[^>]*>/)
if (cssLink) {
  const css = readFileSync(`dist/assets/${cssLink[1]}`, 'utf8').replace(/url\(\.\/(?!assets\/)/g, 'url(./assets/')
  html = html.replace(cssLink[0], `<style>${css}</style>`)
}

html = html
  .replace('</title>', `</title>\n    ${preload}`)
  .replace('<div id="root"></div>', `<div id="root">${render()}</div>`)

writeFileSync(pfad, html)
rmSync('dist-ssr', { recursive: true, force: true })
console.log(`prerender: ${schriften.length} Schriften vorgeladen, CSS ${cssLink ? 'eingebettet' : 'nicht gefunden'}, ${Math.round(html.length / 1024)} KB HTML`)
