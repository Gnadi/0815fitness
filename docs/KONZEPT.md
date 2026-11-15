# Die Radlbäckerin · Linz – Konzept & Business Plan

> Stand: November 2026 · Arbeitsentwurf. Alle Zahlen sind **Planannahmen**, keine Marktdaten,
> und in einem Probelauf zu überprüfen (siehe [Offene Punkte](#8-offene-punkte--vor-dem-start-zu-klären)).

## 1. Idee in einem Satz

Wir backen **bei uns zuhause** Sonntagsgebäck, das die Nachbarschaft **bis Freitag online vorbestellt**,
und bringen es **Sonntag früh zwischen 7 und 10 Uhr mit dem Lastenrad** an die Tür – nur in unserem Grätzl,
nur so viel, wie bestellt wurde.

## 2. Leitlinien

- **Sehr lokal:** Liefergebiet rund **1,5 km um unser Zuhause** – alles, was in einer Sonntagsrunde mit dem Rad
  bequem erreichbar ist. Lieber eine Gasse mehr Stammkundschaft als ein Stadtteil mehr Fläche.
- **Klein und machbar:** Ein Haushalt, ein Ofen, ein Lastenrad. Wachstum nur bis zur Grenze dessen,
  was wir selbst an einem Sonntagmorgen schaffen.
- **Kein Abfall:** Gebacken wird nur, was bis Freitag 20:00 bestellt ist.
- **Persönlich:** Man kennt die Bäckerin. Das ist das Verkaufsargument, nicht der Preis.

## 3. Zielgruppe

Die **direkte Nachbarschaft**: Familien, Paare und ältere Menschen in den umliegenden Gassen, die sich
ein frisches Sonntagsfrühstück wünschen, ohne früh aufzustehen. Erreichbar über Flyer im Postkasten,
den Aushang im Stiegenhaus und Mundpropaganda.

Realistische Größe: Im Umkreis von 1,5 km wohnen in Linz grob 1.000–3.000 Haushalte.
Das Ziel von **30–45 Bestellungen pro Sonntag** entspricht nur wenigen Prozent davon.

## 4. Angebot

### Sortiment
Im Mockup (`src/data/produkte.ts`) stehen 12 Produkte. Für den Heimbetrieb wird das **auf 6–8 Produkte gekürzt**,
die sich im eigenen Ofen gut in Serie backen lassen, zum Beispiel:

- Kaisersemmel, Dinkelweckerl, Laugenbrezel
- Bauernbrot (Sauerteig, kann am Samstag vorgebacken werden)
- Sonntagszopf
- Linzer Schnitte, Zimtschnecke (am Samstag vorbereitet)

Croissants nur, wenn der Aufwand fürs Laminieren sich im Probelauf als machbar erweist.
Einmal im Monat ein Saisonprodukt (Krampus, Osterpinze, Marillenkuchen) als Anlass, die Nachbarschaft zu erinnern.

### Preise & Konditionen
- Preisniveau Handwerksbäckerei (Semmel 0,60 €, Bauernbrot 4,90 €, Linzer Schnitte 2,90 €)
- Zustellung **2,50 €**, **gratis ab 20 €** – vorerst wie im Mockup, im Probelauf testen, ob eine kleinere Pauschale besser ankommt
- **Sonntags-Abo:** gleicher Korb jede Woche, bis Freitag pausierbar. Das macht die Planung leichter.
- **Höchstmenge pro Sonntag:** Ist der Ofen voll, ist die Bestellung für diesen Sonntag geschlossen („ausverkauft“).

## 5. Ablauf

```
Mo–Fr 20:00   Bestellungen über die Webseite
Fr 20:00      Bestellschluss → Einkaufs- und Backliste, Reihenfolge der Lieferrunde
Sa            Einkauf, Sauerteig, Vorteige, Brot und Süßes vorbacken (ca. 3 h)
So 04:00      Gebäck backen (ca. 3 h)
So 06:45      Packen: ein Papiersackerl pro Bestellung, Etikett mit Name + Zeitfenster
So 07:00–10:00 Lieferrunde mit dem Lastenrad
```

- **Kapazität:** Eine Person liefert in diesem kleinen Gebiet rund 10–12 Stopps pro Stunde, also etwa 30–35
  in drei Stunden. Ab ca. 35 Bestellungen braucht es eine zweite Person (Familie) oder eine zweite Runde.
- **Ofen:** Ein normaler Haushaltsbackofen reicht für einen Probelauf mit ca. 15 Bestellungen. Für 30–45
  Bestellungen braucht es einen kleinen **Heißluft-Profiofen** mit mehreren Blechen.
- **Zustellung:** Sackerl an die Tür und kurze Nachricht „Dein Gebäck ist da“ – oder persönlich bei Barzahlung.

## 6. Marketing (fast ohne Budget)

| Maßnahme | Aufwand |
|---|---|
| Flyer in die Postkästen im Liefergebiet, mit Gratis-Linzer-Schnitte bei der ersten Bestellung | ca. 300 € |
| Aushang in Stiegenhäusern, beim Greißler, im Kindergarten | gratis |
| Das gebrandete Lastenrad – jede Runde ist Werbung | einmalig |
| WhatsApp- oder Signal-Gruppe bzw. Newsletter: Donnerstag-Erinnerung „Morgen ist Bestellschluss“ | gratis |
| „Nachbar:innen-Bonus“: Wer jemanden aus dem Haus mitbringt, bekommt eine Semmel geschenkt | geringe Warenkosten |

## 7. Business Plan

### 7.1 Annahmen

| Kennzahl | Wert | Kommentar |
|---|---|---|
| Ø Bon inkl. Zustellung | 16,50 € | |
| Umsatzsteuer | keine | **Kleinunternehmerregelung** (Umsatz unter der Grenze, derzeit 55.000 € brutto pro Jahr – prüfen) |
| Zutaten | 28 % vom Bon = 4,62 € | |
| Verpackung (Papiersackerl, Etikett) | 0,45 € | |
| Zahlungsgebühren | 0,20 € | Viele zahlen bar oder per Überweisung |
| **Variable Kosten pro Bestellung** | **5,27 €** | |
| **Deckungsbeitrag pro Bestellung** | **11,23 €** | Die Zustellung machen wir selbst, daher keine Lohnkosten |
| Liefersonntage pro Jahr | 50 | 2 Wochen Pause |

### 7.2 Mengen

| | Probelauf (8 Sonntage) | Jahr 1 | Jahr 2 |
|---|---:|---:|---:|
| Ø Bestellungen pro Sonntag | 15 | 30 | 45 (Obergrenze) |
| Bestellungen gesamt | 120 | 1.500 | 2.250 |
| Ofen | Haushaltsofen | Heißluft-Profiofen | Heißluft-Profiofen |
| Personen am Sonntag | 1 | 1 | 2 (Familie) |

### 7.3 Plan-Rechnung pro Jahr (in €)

| | Jahr 1 | Jahr 2 |
|---|---:|---:|
| **Umsatz** | **24.750** | **37.125** |
| Zutaten, Verpackung, Zahlung | −7.905 | −11.858 |
| Mehrverbrauch Strom (Ofen) | −800 | −1.100 |
| Versicherung (Betriebshaftpflicht, Rad) | −600 | −600 |
| Webseite: Domain, Hosting | −100 | −100 |
| Steuerberatung bzw. Buchhaltung | −800 | −800 |
| Kammer- und Gewerbegebühren | −300 | −300 |
| Marketing (Flyer, Probierware) | −500 | −300 |
| Sonstiges (Kleingeräte, Reparaturen) | −400 | −500 |
| Abschreibung Lastenrad und Ofen (5 Jahre) | −1.600 | −1.600 |
| **Überschuss vor Steuer und Sozialversicherung** | **11.745** | **19.867** |
| Arbeitszeit pro Jahr (geschätzt) | 600 h | 750 h |
| **Überschuss pro Arbeitsstunde** | **≈ 19,60 €** | **≈ 26,50 €** |

Arbeitszeit: Samstag 3 h, Sonntag 6–7 h, Bestellungen, Einkauf und Buchhaltung 2–3 h pro Woche.
Davon gehen noch **Einkommensteuer und Sozialversicherung (SVS)** ab – diese hängen vom übrigen Einkommen ab.

### 7.4 Einordnung

- **Break-even:** Die jährlichen Fixkosten (ohne Zutaten) liegen bei rund 5.000 €. Bei 11,23 € Deckungsbeitrag
  reichen **etwa 9 Bestellungen pro Sonntag**, um sie zu decken. Alles darüber bezahlt unsere Arbeitszeit.
- Als **Nebenerwerb** ist das solide: ein ordentlicher Stundenlohn, geringes Risiko, kleine Investition.
- Ein **Vollerwerb** ist in diesem Rahmen nicht das Ziel. Die Obergrenze setzen Ofen und Sonntagmorgen,
  nicht die Nachfrage.
- **Hebel ohne mehr Fläche:** höherer Bon durch Brunch-Pakete (Gebäck + Marmelade + Aufstrich, Ziel Ø 20 €)
  und ein hoher Abo-Anteil, damit jeder Sonntag gut planbar ist.

### 7.5 Startinvestition

| Posten | € |
|---|---:|
| E-Lastenrad (gebraucht oder gefördert; Förderung von Land OÖ bzw. Stadt Linz prüfen) | 5.000 |
| Kleiner Heißluft-Profiofen (erst nach dem Probelauf) | 3.000 |
| Bleche, Gärkörbe, Waage, Transportkisten | 800 |
| Erster Vorrat Sackerl und Etiketten | 200 |
| Gewerbeanmeldung, Registrierung, Hygieneschulung | 500 |
| Flyer und Probierware zum Start | 500 |
| **Summe** | **10.000** |

Die Webseite basiert auf dem vorhandenen Mockup und verursacht nur Hosting-Kosten.
Finanzierung aus Ersparnissen. Der Ofen wird erst gekauft, wenn der Probelauf zeigt, dass die Nachfrage da ist.

## 8. Offene Punkte – vor dem Start zu klären

- **Gewerberecht:** Bäcker ist in Österreich ein reglementiertes Gewerbe. Bei der Wirtschaftskammer OÖ klären,
  welche Gewerbeberechtigung für den Verkauf selbst gebackener Ware von zuhause nötig ist und welche Ausnahmen es gibt.
- **Lebensmittelrecht:** Auch eine Heimküche, aus der verkauft wird, muss bei der Lebensmittelaufsicht registriert
  werden und Hygienevorgaben erfüllen (u. a. Schulung, Trennung privat/gewerblich, Allergenkennzeichnung im Shop).
- **Wohnung bzw. Haus:** Mietvertrag, Hausordnung oder Widmung können gewerbliche Nutzung einschränken.
  Ofen und Geräusche um 4 Uhr früh mit den Nachbar:innen abstimmen.
- **Steuer und Versicherung:** Kleinunternehmerregelung, SVS-Pflicht und Betriebshaftpflicht mit Steuerberatung klären.
- **Probelauf:** 8 Sonntage mit Freund:innen und den nächsten Nachbar:innen, um Bon, Zeitbedarf und Nachfrage zu messen.

## 9. Roadmap

| Phase | Zeitraum | Ziel |
|---|---|---|
| **0 · Mockup** | jetzt | Klick-Mockup (dieses Repo) zum Zeigen und Abstimmen. |
| **1 · Klären** | 1–2 Monate | Gewerbe, Registrierung, Versicherung, Abstimmung mit dem Haus. |
| **2 · Probelauf** | 8 Sonntage | Haushaltsofen, ca. 15 Bestellungen, Freund:innen und Nachbarschaft. |
| **3 · Start** | danach | Profiofen, Flyer im ganzen Liefergebiet, Ziel 30 Bestellungen pro Sonntag. |

### Vom Mockup zur echten Webseite

Für den Betrieb braucht die Webseite (React + Vite + PWA) nur wenig zusätzlich:
1. Bestellungen speichern und per E-Mail an uns schicken (z. B. Formular-Dienst oder kleine Serverless-Funktion)
2. **Back- und Packliste** für Freitagabend: Summe pro Produkt, ein Zettel pro Sackerl
3. **Höchstmenge pro Sonntag** und pro Zeitfenster, danach „ausverkauft“
4. Liefergebiet als Liste der Straßen bzw. Adressprüfung statt Postleitzahlen
5. Optional: Online-Zahlung, Abo-Verwaltung, Erinnerung am Donnerstag
