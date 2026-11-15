# Die Radlbäckerin · Linz (Mockup)

Klick-Mockup einer Webseite, auf der man Gebäck für **Sonntag** vorbestellt, das dann
per **Lastenrad** in Linz zugestellt wird. Kein Backend – Bestellungen werden nicht verschickt,
der Warenkorb startet bei jedem Laden leer und wird nirgends gespeichert.

```bash
npm install
npm run dev     # Entwicklungsserver
npm test        # Tests der Datums-/Preislogik
npm run build   # Typecheck + Produktions-Build inkl. PWA
```

Design: Kreuzberg-Startup-Look (Neo-Brutalismus) mit Bricolage Grotesque, Geist und Geist Mono
(selbst gehostet über Fontsource) und Animationen mit [Motion](https://motion.dev).

Konzept und Business Plan: [docs/KONZEPT.md](docs/KONZEPT.md) · UX-Recherche: [docs/UX-RECHERCHE.md](docs/UX-RECHERCHE.md).

## Ablauf

1. Sortiment durchstöbern, Gebäck in den Korb legen
2. Lieferdaten eingeben: Adresse im Liefergebiet, Zeitfenster am Sonntag (7:00–10:00), Zahlungsart
3. Bestätigung mit Bestellnummer

Bestellschluss ist **Freitag 20:00** für den kommenden Sonntag; danach rutscht die
Bestellung automatisch auf den Sonntag darauf. Zustellung kostet 2,50 €, ab 20 € gratis.
