# Karriere-Simulator – Konzept

Privates, rein textbasiertes Fußball-Karriere-Spiel. Man schlüpft mit 16 in die Rolle eines Spielers und
trifft bis zum Karriereende Entscheidungen: Vereinswechsel, Privatleben, Kabine, Medien, Moral.
Läuft nur im Browser (mobile-first, PWA), alle Daten liegen lokal.

## Festlegungen

| Thema | Entscheidung |
|---|---|
| Vereine/Ligen | Echte Vereine, kein Lizenzthema (privates Spiel) |
| Ton | Mix aus ernst und Boulevard, darf unterhaltsam und überzogen sein |
| Darstellung | Rein textbasiert, kein Match-Visual, Avatar nur minimal |
| Spiele | Ergebnis + Schlüsselszenen, keine Minuten-Simulation |
| Moral/Risiko | Doping, Wetten, Manipulation, Steuertricks – mit Konsequenzen, aber man kann damit durchkommen |
| Sprache/Plattform | Nur Deutsch, nur mobil, als PWA |
| Länder | Alle 55 UEFA-Verbände, in Wellen (siehe unten) |
| Speicherung | Nur Browser, keine Datenbank/kein Backend |

## Spielablauf

Ein Jahr hat ca. 40 Wochen. Pro Woche: **Trainingsfokus wählen → Spiel (Ergebnis + Schlüsselszenen) → ggf. Ereignis mit Entscheidung.**

- **Karrierephasen:** Jugend (16–18), Durchbruch, Prime, Spätphase, Karriereende (danach Trainer/Experte/Rente).
- **Karriereende:** Zusammenfassung mit Statistiken, Titeln, Rekorden und Hall-of-Fame-Wertung.
- **Schlüsselszenen:** Einzelne Momente im Spiel mit Entscheidung (Elfmeter selbst schießen oder abgeben, Foul ziehen, Schwalbe, Jubel …).

### Charaktererstellung
Land, Name, Position, starker Fuß, **Herkunft** (Arbeiterfamilie / Fußballer-Familie / Akademiker-Haushalt) und
**Spielertyp** (Straßenfußballer / Akademie-Talent / Spätzünder). Beides setzt Start-Boni und -Mali. Das Potenzial bleibt verdeckt.

## Spielermodell

- **Skills (1–100):** Tempo, Schuss, Pass, Dribbling, Defensive, Physis, Technik, Positionsspiel.
- **Traits (0–100):** Moral, Selbstvertrauen, Disziplin, Professionalität, Ehrgeiz, Ruf, Fanbeliebtheit,
  Trainer-Beziehung, Kabine, Fitness, Gesundheit, Privatglück.
- **Sonstiges:** Geld, verdecktes Potenzial, Form pro Spiel, Verletzungsanfälligkeit.

Definiert in `src/engine/types.ts`, Start-Werte in `src/engine/newCareer.ts`.

## Ereignissystem (Herzstück)

Ereignisse sind datengetriebene Karten (TypeScript/JSON) mit:
- **Bedingungen** (Alter, Phase, Werte, Verein, Flags aus früheren Entscheidungen),
- **Gewichtung** (wie wahrscheinlich in einer Woche),
- **Optionen** mit sofortigen Effekten, **verzögerten Folgen** und optionalen **Zufallswürfen**, die von Werten abhängen.

**Ereignisketten** verbinden Entscheidungen zu Geschichten (die Party mit 17 holt dich Monate später ein).
Bei Regelbrüchen gibt es immer einen Erwischt-Wurf: Es kann gut gehen, die Wahrscheinlichkeit hängt von Ruf, Disziplin, Umfeld und Glück ab.

| Kategorie | Beispiele |
|---|---|
| Kabine | Streit mit dem Kapitän, Mobbing gegen den Neuen, Mannschaftsabend, Gehaltsneid, Cliquen |
| Trainer | Bankplatz, Disziplinforderung, Taktikstreit, Trainerwechsel |
| Privat | Beziehung, kranke Familie, Party vor dem Spiel, Führerschein, Haus, Schule/Ausbildung |
| Medien | Interview-Fettnäpfchen, Shitstorm, Sponsorenangebot, Gerüchte |
| Karriere | Vertragsverhandlung, Berater, Leihe, Transferangebote, Nationalmannschaft |
| Moral/Risiko | Wetten, Doping, Spielmanipulation, Steuertricks |
| Verletzung | Kreuzbandriss, Comeback früh oder geduldig |

## Länder und Ligadaten

Die Engine ist länderunabhängig: **Ein Land hinzufügen = eine Datendatei hinzufügen** (Ligen, Vereine mit Stärke 1–100, Stadt, Rivalen).
Alle 55 UEFA-Verbände sind in `src/data/countries.ts` angelegt; spielbar sind die Länder bis zur `AKTIVE_WELLE`.

- **Welle 1:** DE, AT, CH, EN, ES, IT, FR (mehrere Ligastufen)
- **Welle 2:** NL, PT, BE, TR, SC, GR, DK, NO, SE, PL, CZ, HR, RS, UA, RO, HU, IL (1. und teils 2. Liga)
- **Welle 3:** übrige Verbände (nur 1. Liga)

Vereinsstärken und Kader sind Näherungswerte und im Datensatz jederzeit anpassbar. Andere Spieler werden generiert,
echte Profis kommen höchstens als Randfiguren vor.

## Technik

- **Stack:** React 19, Vite, TypeScript, Zustand, React Router (HashRouter), vite-plugin-pwa, Vitest.
- **Struktur:** `src/engine` (reine Spiellogik, ohne UI, getestet), `src/data` (Inhalte), `src/storage` (Spielstände),
  `src/store` (Zustand), `src/screens` (UI).
- **Zufall:** Seed-basiert (`src/engine/rng.ts`), Zustand wird im Spielstand mitgespeichert.
- **Speichern:** localStorage hinter einem kleinen Interface (`src/storage/saves.ts`), versioniertes Format mit Migrationen,
  mehrere Spielstände, JSON-Export/-Import. Bei großen Weltdaten Wechsel auf IndexedDB möglich.
- **UI:** Mobile-first, Dark-Theme, Safe-Areas, offlinefähig.

## Meilensteine

1. **Fundament** ✅ Projekt, PWA, Charaktererstellung, Datenmodell, Speichern/Laden, Tests.
2. **Wochenschleife:** Training, simulierte Spiele mit Schlüsselszenen, Attributentwicklung, Alterung.
3. **Ereignisengine:** Bedingungen, Optionen, Folgen, Ketten, erste 30–50 Ereignisse.
4. **Vereine und Transfers:** Ligadaten Welle 1, Tabellen, Auf-/Abstieg, Angebote, Verträge, Berater.
5. **Risiko-Themen und Medien:** Wetten, Doping, Skandale, Sponsoren.
6. **Politur:** Statistiken, Karriereende, Balancing, weitere Länderwellen, Achievements.
