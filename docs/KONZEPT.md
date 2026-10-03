# Karriere-Simulator – Konzept & Architektur

Privates, rein textbasiertes Fußball-Karriere-Spiel. Man schlüpft mit 16 in die Rolle eines Spielers und
trifft bis zum Karriereende Entscheidungen: Vereinswechsel, Privatleben, Kabine, Medien, Moral.
Läuft nur im Browser (mobile-first, PWA), alle Daten liegen lokal.

## Festlegungen

| Thema | Entscheidung |
|---|---|
| Vereine/Ligen | Echte Vereine, kein Lizenzthema (privates Spiel); Stärken sind Näherungswerte |
| Ton | Mix aus ernst und Boulevard, darf unterhaltsam und überzogen sein |
| Darstellung | Rein textbasiert, kein Match-Visual, kein Avatar |
| Spiele | Ergebnis + Schlüsselszenen, keine Minuten-Simulation |
| Moral/Risiko | Doping, Wetten, Manipulation, Steuertricks – mit Konsequenzen, aber man kann damit durchkommen |
| Sprache/Plattform | Nur Deutsch, nur mobil, als PWA |
| Länder | Alle 55 UEFA-Verbände (937 Vereine in 68 Ligen) |
| Speicherung | Nur Browser (localStorage), Export/Import als JSON |

## Spielablauf

Der Kalender einer Saison besteht aus Wochen: Ligaspieltage, eingestreute Pokal- und Europapokalwochen,
Winterpause (Transferfenster), ggf. ein Turnier (EM/WM) und die Sommerpause (Transferfenster).
Pro Woche: **Trainingsfokus wählen → Spiel (Ergebnis + Schlüsselszenen) → ggf. Ereignis mit Entscheidung.**
Mit „⏩ Wochen simulieren“ lassen sich mehrere Wochen am Stück spielen (hält bei Ereignissen, Angeboten, Verletzungen).

### Karrierephasen
- **Jugend (16–17):** U19 eines selbst gewählten Vereins (Stärke des Vereins −12), Jugendliga ohne Auf-/Abstieg.
  Am Ende der zweiten Jugendsaison: Profivertrag (Angebote des Heimatvereins und anderer Klubs).
- **Profi (ab 18):** Liga, nationaler Pokal, Europapokal (Champions/Europa/Conference League), Nationalmannschaft.
- **Spätphase:** Alterung ab 29, Karriereende freiwillig ab 30, spätestens mit 40.
- **Ende:** Ruhm-Punkte, Klassifizierung (Randnotiz … Jahrhundertspieler), Titel, Statistiken, Erfolge.

### Charaktererstellung
Heimatland, Name, Jugendverein, Position, starker Fuß, **Herkunft** (Arbeiterfamilie / Fußballer-Familie / Akademiker)
und **Spielertyp** (Straßenfußballer / Akademie-Talent / Spätzünder). Das Potenzial bleibt verdeckt (nur eine unscharfe Sternewertung der Scouts).

## Spielermodell
- **Skills (1–100):** Tempo, Schuss, Pass, Dribbling, Defensive, Physis, Technik, Positionsspiel → positionsgewichtete Gesamtstärke.
- **Traits (0–100):** Moral, Selbstvertrauen, Disziplin, Professionalität, Ehrgeiz, Ruf, Fans, Trainer-Beziehung, Kabine, Fitness, Gesundheit, Privatglück.
- **Sonstiges:** Geld, Marktwert, Form, Spielpraxis, Verletzungen, Sperren, Berater-Güte, Lebensstil, Partner/Kinder.

## Wochenschleife
- **Training:** 7 Fokus-Optionen. Zuwachs hängt von Alter, Potenzial, Professionalität, Fitness, Spielpraxis und Positionsrelevanz ab.
  Fitness wird durch Training und Spiele verbraucht und regeneriert sich teilweise; Müdigkeit senkt Leistung und erhöht das Verletzungsrisiko.
- **Einsatz:** Startelf, Einwechslung oder nicht im Spiel, abhängig von Stärke vs. Mannschaft, Vertragsrolle, Trainer-Beziehung und Form.
- **Spiel:** Basisergebnis (Poisson aus Teamstärken) + 0–2 Schlüsselszenen (12 Szenen, positionsabhängig) mit Risikostufen.
  Szenen beeinflussen Tore, Vorlagen, Karten, Verletzungen und die Note. K.-o.-Spiele kennen Elfmeterschießen.

## Welt
- **Ligen:** Jede Liga hat einen Doppel-/Mehrfachrundenspielplan. Nur die Liga des Spielers wird wöchentlich simuliert, alle anderen am Saisonende.
- **Auf-/Abstieg** für alle Länder mit mehreren Ligastufen, Vereinsstärken entwickeln sich (Rückkehr zum Ankerwert + Zufall + Platzierung).
- **Pokale:** nationaler K.-o.-Pokal; **Europa:** Ligaphase mit 8 Spielen (Punkteschwellen), dann K.-o.-Runden; Teilnehmer aus den Abschlusstabellen.
- **Nationalmannschaft:** Nominierung per Ereignis, Länderspiele, EM/WM alle zwei Jahre (Gruppenphase + K.-o.).
- **Wirtschaft:** Marktwert (Stärke, Alter, Potenzial, Ruf), Gehälter je Land/Liga/Vereinsstärke, Netto-Wocheneinkommen, Lebensstil-Kosten.

## Verträge & Transfers
- Transferfenster im Winter und Sommer erzeugen Angebote (Transfer, Leihe, Profivertrag, vereinslos).
- Angebote lassen sich annehmen, ablehnen oder nachverhandeln (Gehalt/Rolle/Laufzeit, Absage-Risiko). Wechselwunsch erhöht die Angebotszahl, belastet aber Trainer und Kabine.
- Vertragsende → vereinslos; zum Fensterende wird automatisch das beste Angebot gewählt.
- Winterwechsel in andere Ligen: die neue Liga wird bis zum aktuellen Spieltag nachsimuliert.

## Finanzen
Kleines, einfaches Finanzsystem (Tab „Finanzen“): Kontostand, Wochenverdienst und ein Depot mit drei Anlagen
(Tagesgeld ca. 2,5 % p. a., Aktien-ETF Ø 7 % mit spürbarer Schwankung, Krypto hochriskant). Ein- und Auszahlen geht in Prozentschritten,
die Kurse bewegen sich jede Woche. Optional: ETF-Sparplan (30 % des Wochenverdiensts). Dazu Immobilien (Mieteinnahmen) und
eine Sportinvaliditätsversicherung. **Venture Capital:** Alle 13 Wochen gibt es Start-up-Deals (ab 5.000 € auf dem Konto). Der Einsatz ist bis zum Exit gebunden;
wöchentlich gibt es Finanzierungsrunden, Down-Rounds, Pleiten (etwa jedes zweite Start-up) oder Exits/Börsengänge (Ø ca. 2× Einsatz bei hoher Streuung).
Vorzeitiger Verkauf am Zweitmarkt mit 40 % Abschlag. 17 Finanz-Ereignisse (Börsencrash/-boom, Krypto-Hype und -Absturz, Start-up, Anlagebetrug, Casino, Spenden …)
greifen ins Depot ein. Ältere Spielstände ohne Depot funktionieren weiter.

## Ereignissystem
Ereignisse sind datengetriebene Karten (`src/data/events/*`, 133 Stück) mit Bedingungen, Gewichtung, Abständen, Optionen,
Würfen (Skills/Traits/feste Chance), Effekten und **Folgeereignissen** (verzögerte Ketten):

- **Jugend, Kabine, Trainer, Privat, Familie, Medien, Karriere, Verein, Gesundheit**
- **Risiko-Ketten:** Sportwetten → Sucht → Erpressung → Spielmanipulation → Ermittlungen; Doping-Angebot → Kontrolle;
  Steuertrick → Razzia; Fremdgehen → Erpressung; Bestechung. Jede Ketten-Stufe hat einen Erwischt-Wurf – man kann damit durchkommen.
- Folgen: Sperren, Ruf-/Fan-Verlust, Sponsor weg, Geldstrafen bis hin zum erzwungenen Karriereende.

## Erfolge & Ruhm
38 Erfolge, Auszeichnungen (Weltfußballer, Spieler des Jahres), Ruhm-Punkte aus Titeln (gewichtet nach Einsatzzeit), Toren, Länderspielen,
Spitzenstärke, Erfolgen, abzüglich Skandalen.

## Technik
- **Stack:** React 19, Vite, TypeScript, Zustand, React Router (HashRouter), vite-plugin-pwa, Vitest.
- **Struktur:** `src/engine` (reine Spiellogik, getestet), `src/data` (Vereine, Namen, Szenen, Ereignisse), `src/storage` (Spielstände),
  `src/store` (Zustand), `src/screens` (UI).
- **Zufall:** Seed-basiert, Zustand liegt im Spielstand. Alle Spieleraktionen sind reine Funktionen (`src/engine/aktionen.ts`).
- **Speichern:** localStorage hinter einem Interface, versioniertes Format (ältere Stände werden abgelehnt), Export/Import.
- **Design:** Acht Themes über CSS-Variablen (Grün, Blau, Orange, Violett, Grau, Schwarz-Weiß, Hell) plus „Vereinsfarben“: Die Farben des aktuellen Vereins (`src/data/vereinsfarben.ts`, unbekannte Vereine bekommen eine stabile Farbe aus dem Namen) bilden Akzent und getönte Hintergründe und wechseln bei Transfers mit.
- **Tests:** Daten-Integrität, Spielplan-/Welt-Invarianten, Karriere-Läufe für alle 55 Länder, Fuzzing mit zufälligen Entscheidungen.
- **Bot/Simulation:** `src/engine/sim.ts` spielt Karrieren automatisch (Tests, Balancing).

## Ideen für später
Trainerkarriere nach dem Karriereende, mehr Ereignisse (je Land), Spielerrat-Streik als Kette, Lebensstil-Käufe, Transfers mit Kaufoption,
zweite Nationalität, IndexedDB bei sehr großen Spielständen.
