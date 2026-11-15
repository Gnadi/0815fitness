# Die Radlbäckerin · Linz (Mockup)

Klick-Mockup einer Webseite, auf der man Gebäck für **Sonntag** vorbestellt, das dann
per **Lastenrad** in Linz zugestellt wird. Kein Backend – Bestellungen werden nicht verschickt,
der Warenkorb startet bei jedem Laden leer und wird nirgends gespeichert.

```bash
npm install
npm run dev     # Entwicklungsserver
npm test        # Tests der Datums-/Preislogik
npm run build   # Typecheck, Build, PWA und Vorrendern des Zettels
```

### Ladezeit & PWA

- **Vorgerendert:** `npm run build` rendert den Zettel einmal zu HTML (`src/entry-server.tsx`, `scripts/prerender.mjs`,
  Zeitzone Europe/Vienna). Er ist sofort sichtbar, React übernimmt danach mit der echten Uhrzeit.
  CSS wird ins HTML eingebettet, die zwei wichtigsten Schriften werden vorgeladen.
- **Schriften** liegen zugeschnitten in `src/fonts` (nur Latein + deutsche Zeichen, nur genutzte Gewichte):
  152 KB statt 444 KB. Neu erzeugen mit `scripts/schriften-zuschneiden.sh` (braucht `pip install fonttools brotli`).
- **Motion** wird schlank geladen (`LazyMotion`), die Animations-Features kommen als eigener Chunk nach.
- **PWA:** installierbar (Manifest mit Screenshots, Verknüpfung, maskierbarem Icon, Apple-Icon), komplett offline
  nutzbar, mit Install- und Offline-Hinweis. `vercel.json` setzt lange Cache-Zeiten für `assets/`.

Die Seite ist der **Sonntagszettel** der Woche: ein Bestellzettel auf Papier, der sich mit der Woche verändert
(Zettel offen → Teig ruht → Ofen läuft → Radl unterwegs → Danke). Oben gibt es eine Mockup-„Zeitmaschine“,
um die Phasen vorzuführen. Schriften: Newsreader und Shantell Sans (selbst gehostet), Animationen mit [Motion](https://motion.dev).

Konzept und Business Plan: [docs/KONZEPT.md](docs/KONZEPT.md) · UX-Recherche: [docs/UX-RECHERCHE.md](docs/UX-RECHERCHE.md).

## Ablauf

1. Gebäck auf dem Zettel ankreuzen (oder „wie letzte Woche“)
2. Gasse, Uhrzeit und Bezahlung einkreisen, optional ein Sackerl für die Nachbarschaft spendieren
3. Zettel abgeben – man behält den abgerissenen Abschnitt (mit Kalendereintrag)

Bestellschluss ist **Freitag 20:00** für den kommenden Sonntag; danach rutscht die
Bestellung automatisch auf den Sonntag darauf. Zustellung kostet 2,50 €, ab 20 € gratis. Gassen, Mengen und Preise sind Platzhalter in `src/data/produkte.ts`.
