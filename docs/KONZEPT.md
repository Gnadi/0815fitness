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
Tab „Finanzen“ mit vier Bereichen: **Übersicht** (Kontostand, Gesamtvermögen, Vermögensverteilung, ETF-Sparplan mit 30 % des Wochenverdiensts),
**Geldanlagen**, **Immobilien** und **Start-ups**. Ältere Spielstände ohne neue Felder funktionieren weiter.

- **Geldanlagen (8 Klassen):** Tagesgeld (2,5 %), Staatsanleihen (3,5 %, ruhig), Dividenden-Aktien (6 %), Aktien-ETF (7 %), Immobilienfonds/REIT (5,5 %),
  Gold (4 %), Einzelaktien/Tech (9 %, sehr volatil) und Krypto (hochriskant). Ein- und Auszahlen in Prozentschritten, Kurse bewegen sich jede Woche.
- **Immobilien:** Alle 26 Wochen gibt es fünf Marktangebote (Studenten-Apartment, Eigentumswohnung, Mehrfamilienhaus, Gewerbeobjekt, Ferienhaus, Baugrundstück,
  Eigenheim, Luxusvilla) in einfacher, guter oder Top-Lage. Kauf bar oder mit Kredit (20 % Eigenkapital, 3,8 % Zinsen, 2 % Tilgung, Kreditrahmen aus Gehalt und Depot),
  6 % Kaufnebenkosten. Jede Woche laufen Miete (nach Auslastung), Nebenkosten, Zinsen und Tilgung in den Wocheneinkommen-Saldo ein;
  Wert schwankt je Objekt, dazu Reparaturen und Mietausfälle. Modernisieren (+9 % Wert/Miete, einmal pro Jahr), Kredit tilgen, Verkaufen (6 % Kosten).
  Eigenheim und Villa sind Wohnsitze (nur einer möglich): kein Mietaufwand, mehr Privatglück pro Woche, die Villa bringt zusätzlich Prestige.
- **Venture Capital:** Alle 13 Wochen gibt es Start-up-Deals (ab 5.000 € auf dem Konto). Der Einsatz ist bis zum Exit gebunden;
  wöchentlich gibt es Finanzierungsrunden, Down-Rounds, Pleiten (etwa jedes zweite Start-up) oder Exits/Börsengänge (Ø ca. 2× Einsatz bei hoher Streuung).
  Vorzeitiger Verkauf am Zweitmarkt mit 40 % Abschlag.
- Dazu eine Sportinvaliditätsversicherung und rund 24 Finanz-Ereignisse (Börsencrash/-boom, Krypto, Start-up, Anlagebetrug, Casino, Immobilienboom/-crash,
  Mietnomaden, Goldrausch, Zinswende, Dividenden, Tech-Hype …), die ins Depot und ins Immobilienportfolio eingreifen.

## Privatleben
Eigener Tab „Privat“ (🏡) mit vier Bereichen:

- **Übersicht:** Privatglück mit Einordnung (Rundum glücklich … Ausgebrannt), Beziehung, Kinder, Herkunft, bester Freund, Wohnsituation, Besitz und laufende Lebenshaltungskosten pro Jahr.
- **Aktivitäten:** einmalige Ausgaben mit direkter Wirkung und Wartezeit (Date-Abend, Geschenk, Paarberatung, Wochenend-Trip, Luxusurlaub, Familienbesuch,
  Familienfeier, Ausflug mit den Kindern, Freunde, Konzert, Spenden, Wellness, Sportpsychologe). Manche brauchen Partner oder Kinder.
- **Besitz:** dauerhafte Anschaffungen mit Wochenwirkung und teils laufenden Kosten: Hund, Gitarre, Gaming-Setup, Golfclub, Segelboot, Mentalcoach, Physio-Abo,
  Privatkoch, Kinderbetreuung, Haus für die Eltern, Autos (Kleinwagen/Sportwagen/Supersportwagen, ersetzen sich gegenseitig), Luxusuhr, Assistent, eigene Stiftung.
  Abos lassen sich kündigen.
- **Wohnen:** Mietwohnungen (schick, Penthouse) mit Kaution und Jahresmiete; sie ruhen, sobald man ein Eigenheim besitzt.
- Fünf neue Privat-Ereignisse (Hund vor der Tür, Dach der Eltern, Jahrestag, Reise mit den Jungs, neues Hobby).

## Ereignissystem
Ereignisse sind datengetriebene Karten (`src/data/events/*`, rund 270 Stück) mit Bedingungen, Gewichtung, Abständen, Optionen,
Würfen (Skills/Traits/feste Chance), Effekten und **Folgeereignissen** (verzögerte Ketten):

- **Jugend, Kabine, Trainer, Privat, Familie, Medien, Karriere, Verein, Gesundheit**
- **Risiko-Ketten:** Sportwetten → Sucht → Erpressung → Spielmanipulation → Ermittlungen; Doping-Angebot → Kontrolle;
  Steuertrick → Razzia; Fremdgehen → Erpressung; Bestechung. Jede Ketten-Stufe hat einen Erwischt-Wurf – man kann damit durchkommen.
- Folgen: Sperren, Ruf-/Fan-Verlust, Sponsor weg, Geldstrafen bis hin zum erzwungenen Karriereende.

### Ereignis-Pakete
Vier thematische Pakete erweitern die Grundkategorien (je eine Datei in `src/data/events/`):

- **Saison (`saison.ts`):** Trainerwechsel mit Trainer-Typ (Motivator, Taktiker, Diktator, Altmeister, Jugendförderer; Flag `trainerTyp`, gesetzt von der Aktion `trainer-wechsel`),
  Interimstrainer, Abstiegskampf (Krisensitzung, Kasernierung, Sechs-Punkte-Spiel, Fanforderung), Titelrennen (Endspurt, Meisterschaft in Reichweite) und Pokalblamage.
  Am Saisonende plant `beendeSaison` je nach Ergebnis Meisterkorso, verspielten Titel oder Rettung als Folgeereignis für die erste Woche der neuen Saison.
- **Lebensphasen (`lebensphasen.ts`):** Hochzeitsplanung und Flitterwochen (Folge des Heiratsantrags), Ehekrise, Scheidung samt Rosenkrieg und Unterhalt,
  Schlafentzug nach der Geburt, Kind kickt im Verein, Todesfall mit Trauerphase, Burnout, Lebensmitte-Krise und „Was kommt nach der Karriere?“.
- **Social Media (`social.ts`):** Follower in Tausend als Zähler (`flags.follower`, sichtbar im Privat-Tab). Viraler Clip, Werbedeals mit Schleichwerbung,
  Krypto-Werbung mit Sammelklage als Folge, alter Post, gekaufte Follower, Livestream-Patzer, Streaming-Kanal, Podcast, Autobiografie, Hackerangriff, Meme, Haltung, Hass-Nachrichten.
- **Vereinsleben (`vereinsleben.ts`):** Investor, Insolvenz (mögliche Folge der Finanzkrise), Präsidentenrücktritt, Stadion-Neubau, Fanproteste, Pyro-Strafe, Derby-Woche,
  Rückennummer 10, Elfmeterschütze mit Serie, neuer Sportdirektor, Asien-Tour und Dubai-Trainingslager sowie **länderspezifische Ereignisse** (`la-*`) für Türkei, England, Italien,
  warme und nordische Länder, Osteuropa, Deutschland, Frankreich, Alpenländer, Steueroasen und Niederlande/Dänemark/Belgien. Für Spieler im Ausland kommen Sprachbarriere,
  Heimweh, Behördengang und die zweite Staatsbürgerschaft dazu.
- **Transfer (`transfer.ts`):** Ausstiegsklausel, Kaufoption bei Leihe, Berater verhandelt hinter dem Rücken, Gerüchteküche, Deadline Day, Vertragspoker, Handgeld, Wiedersehen mit dem Ex-Klub, großer Abschied, Medizincheck.
- **Verletzung (`verletzung.ts`):** Zweitmeinung, Reha-Motivation, Schmerzmittel-Kette (Spritze → Abhängigkeit → Kontrolle), früheres Comeback, Comeback-Ereignis nach mindestens vier Reha-Wochen
  (`flags.rehaWochen`, geplant in `startWeek`), Angst im Zweikampf nach dem Kreuzbandriss, Liebe zur Physiotherapeutin.
- **Nationalteam (`nationalteam.ts`):** Streit mit dem Nationaltrainer, Verein gegen Verband, Hymne, Kapitänsbinde, Turnierkader, Teamhotel, Elfmeterschießen, Fans im Turnierland, Rücktritt aus der Nationalmannschaft.
- **Rivale (`rivale.ts`):** Kette über `flags.rivalitaet` (Duell → Fehde → Showdown → Versöhnung oder Eiszeit) plus Trainingswette, Foul und Wiedersehen als Mitspieler.
- **Skandale (`skandale.ts`):** Berater-Betrug mit Prozess, Stalker, Einbruch, Clan-Erpressung, falsche Schlagzeile, Autounfall, Zoll, Klage des Ex-Vereins, Doping-Gerücht.
- Neuer Effekt `vereinsstaerke`: verändert die Stärke des aktuellen Vereins (Investor, Insolvenz, Krisenbewältigung).

## Erfolge & Ruhm
50 Erfolge, Auszeichnungen (Weltfußballer, Spieler des Jahres), Ruhm-Punkte aus Titeln (gewichtet nach Einsatzzeit), Toren, Länderspielen,
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
Trainerkarriere nach dem Karriereende, weitere länderspezifische Ereignisse, Spielerrat-Streik als Kette, Transfers mit Kaufoption,
echter Verbandswechsel nach der zweiten Staatsbürgerschaft, Saisonziele des Vereins, Dynastie (Kind wird Profi), IndexedDB bei sehr großen Spielständen.
