import { ABHEBEN, DEPOT, FLAG, FOLGE, G, INVEST, NEWS, T, VC_AUFSTOCKEN, VC_EINSTIEG, VC_EXIT, VC_PLEITE, VC_RUNDE, VC_WERT, ZAEHLE, alterVon, anlageWert, anteil, depotWert, flag, gehalt, hatVcZiel, profi, vcAktivAnzahl, zahl } from './helpers'
import { vcZiel } from '../../engine/finanzen'
import type { EreignisDef } from './types'

const hatGeld = (c: { spieler: { geld: number } }): boolean => c.spieler.geld >= 2_000

export const FINANZEN: EreignisDef[] = [
  {
    id: 'f-erste-schritte', kategorie: 'Finanzen', gewicht: 0, pflicht: true, bedingung: (c) => hatGeld(c) && !flag(c, 'depotErklaert'),
    titel: 'Dein Geld soll arbeiten', text: 'Auf deinem Konto liegt inzwischen ein hübsches Sümmchen. {berater} erklärt dir bei einem Kaffee: „Geld auf dem Girokonto bringt nichts. Du solltest dir ein Depot anlegen.“ Im Tab „Finanzen“ kannst du Geld in Tagesgeld, Aktien-ETF und Krypto stecken.',
    optionen: [
      { label: '20 % ins Tagesgeld legen', hinweis: 'sicher', erfolg: { text: 'Sicher ist sicher: Das Tagesgeld bringt kleine, aber verlässliche Zinsen.', effekte: [FLAG('depotErklaert'), INVEST('tagesgeld', 0.2), T({ professionalitaet: 1 })] } },
      { label: '20 % in einen Aktien-ETF stecken', hinweis: 'mittel', erfolg: { text: 'Langfristig der Klassiker. Kurzfristig schwankt er aber ordentlich.', effekte: [FLAG('depotErklaert'), INVEST('etf', 0.2), T({ professionalitaet: 2 })] } },
      { label: 'Erst mal alles auf dem Konto lassen', erfolg: { text: 'Du schaust dir das später an. Den Tab „Finanzen“ findest du jederzeit unten in der Leiste.', effekte: [FLAG('depotErklaert')] } },
    ],
  },
  {
    id: 'f-finanzberater', kategorie: 'Finanzen', gewicht: 2, abstand: 300, bedingung: (c) => profi(c) && c.spieler.geld > 20_000 && !flag(c, 'sparplan'),
    titel: 'Der Finanzberater der Bank', text: 'Ein Berater deiner Bank schlägt einen Sparplan vor: Jede Woche wandert ein Teil deines Verdienstes automatisch in einen Aktien-ETF. „Für Sie ist das Wichtigste, dass Sie nach der Karriere nicht bei null anfangen.“',
    optionen: [
      { label: 'Sparplan einrichten (30 % des Wochenverdiensts)', erfolg: { text: 'Ab jetzt wächst dein Depot von allein. Die Einstellung findest du im Tab „Finanzen“.', effekte: [FLAG('sparplan'), T({ professionalitaet: 3 })] } },
      { label: 'Einmal 25 % des Kontos in den ETF stecken', erfolg: { text: 'Ein Startpaket, aber kein Dauerauftrag. Du behältst die Kontrolle.', effekte: [INVEST('etf', 0.25), T({ professionalitaet: 1 })] } },
      { label: 'Nein danke, Geld will ich anfassen können', erfolg: { text: 'Der Berater lächelt höflich und hinterlässt eine Visitenkarte.', effekte: [] } },
    ],
  },
  {
    id: 'f-krypto-hype', kategorie: 'Finanzen', gewicht: 2, abstand: 200, bedingung: (c) => profi(c) && c.spieler.geld > 5_000,
    titel: 'Der Coin, der alles verändert', text: '{freund} schwärmt in der Kabine: „Der Coin hat sich in drei Wochen verdreifacht. Wer jetzt nicht einsteigt, ist selber schuld.“ Fünf Mitspieler zeigen stolz ihre Handy-Apps.',
    optionen: [
      { label: '10 % des Kontos in Krypto stecken', hinweis: 'sehr riskant', wurf: { basis: 0.45 }, erfolg: { text: 'Der Kurs steigt weiter. Auf dem Papier bist du plötzlich reicher, die Kabine feiert dich als Finanzgenie.', effekte: [INVEST('krypto', 0.1), DEPOT('krypto', 1.8), T({ kabine: 2, selbstvertrauen: 2 }), FOLGE('f-krypto-absturz', 8, 0.6)] }, misserfolg: { text: 'Kaum investiert, bricht der Kurs ein. Die Kabine schweigt höflich über das Thema.', effekte: [INVEST('krypto', 0.1), DEPOT('krypto', 0.4), T({ moral: -2 })] } },
      { label: 'Nur ein kleiner Betrag (2 % des Kontos)', hinweis: 'riskant', erfolg: { text: 'Du steigst mit Spielgeld ein. Falls es steigt, freust du dich, falls nicht, verkraftest du es.', effekte: [INVEST('krypto', 0.02)] } },
      { label: 'Finger weg', erfolg: { text: 'Du hältst dich raus. Die Kollegen nennen dich einen Spielverderber, aber du schläfst ruhig.', effekte: [T({ professionalitaet: 1, disziplin: 1 })] } },
    ],
  },
  {
    id: 'f-krypto-absturz', kategorie: 'Finanzen', gewicht: 0, bedingung: (c) => anlageWert(c, 'krypto') > 0,
    titel: 'Der Coin stürzt ab', text: 'Heute Morgen hat dein Krypto-Wert über die Hälfte verloren. Das Netz ist voll mit Weltuntergangsmemes, und {freund} reagiert nicht mehr auf Nachrichten.',
    optionen: [
      { label: 'Alles verkaufen, bevor es noch schlimmer wird', erfolg: { text: 'Der Verlust ist bitter, aber real. Immerhin ist der Rest gerettet.', effekte: [DEPOT('krypto', 0.45), ABHEBEN('krypto', 1), T({ moral: -2, professionalitaet: 1 })] } },
      { label: 'Aussitzen und hoffen', hinweis: 'riskant', wurf: { basis: 0.4 }, erfolg: { text: 'Wie durch ein Wunder erholt sich der Kurs. Du hast Nerven aus Stahl, oder einfach Glück.', effekte: [DEPOT('krypto', 1.1), T({ selbstvertrauen: 3 })] }, misserfolg: { text: 'Der Kurs sinkt weiter. Dein Einsatz ist fast weg.', effekte: [DEPOT('krypto', 0.35), T({ moral: -4 })] } },
    ],
  },
  {
    id: 'f-boersencrash', kategorie: 'Finanzen', gewicht: 1.2, abstand: 400, bedingung: (c) => depotWert(c) > 3_000,
    titel: 'Börsencrash', text: 'In den Nachrichten läuft das Wort „Crash“ in Dauerschleife. Die Aktienkurse stürzen ab, und dein Depot hat über Nacht ordentlich verloren.',
    optionen: [
      { label: 'Ruhe bewahren und liegen lassen', hinweis: 'sicher', wurf: { basis: 0.7 }, erfolg: { text: 'Langfristig denkst du richtig: Die Kurse erholen sich in den nächsten Monaten und du bist wieder im Plus.', effekte: [DEPOT('etf', 0.82), FOLGE('f-boersenerholung', 14)] }, misserfolg: { text: 'Die Erholung dauert deutlich länger als gedacht. Du hältst durch, aber es kostet Nerven.', effekte: [DEPOT('etf', 0.75), DEPOT('krypto', 0.55), T({ moral: -2 })] } },
      { label: 'Panikverkauf: alles raus', erfolg: { text: 'Du verkaufst mitten im Tief. Der Verlust ist jetzt endgültig.', effekte: [DEPOT('etf', 0.8), DEPOT('krypto', 0.5), ABHEBEN('etf', 1), ABHEBEN('krypto', 1), T({ professionalitaet: -1, moral: -2 })] } },
      { label: 'Günstig nachkaufen (25 % des Kontos)', hinweis: 'mutig', wurf: { basis: 0.55 }, erfolg: { text: 'Du kaufst, wenn andere zittern. Als die Kurse später anziehen, lächelst du still.', effekte: [DEPOT('etf', 0.82), INVEST('etf', 0.25), FOLGE('f-boersenerholung', 12), T({ selbstvertrauen: 3 })] }, misserfolg: { text: 'Die Kurse fallen weiter. Dein Nachkauf war zu früh.', effekte: [DEPOT('etf', 0.8), INVEST('etf', 0.25), DEPOT('etf', 0.85), T({ moral: -3 })] } },
    ],
  },
  {
    id: 'f-boersenerholung', kategorie: 'Finanzen', gewicht: 0,
    titel: 'Die Märkte erholen sich', text: 'Die Kurse klettern wieder, und die Nachrichten sprechen schon von einer „Rekordjagd“. Dein Depot freut sich.',
    optionen: [
      { label: 'Gewinne mitnehmen (50 % auszahlen)', erfolg: { text: 'Du sicherst dir die Hälfte. Wer weiß, was morgen passiert.', effekte: [DEPOT('etf', 1.22), DEPOT('krypto', 1.3), ABHEBEN('etf', 0.5), ABHEBEN('krypto', 0.5)] } },
      { label: 'Alles drin lassen', erfolg: { text: 'Du bleibst investiert. Langfristig wird es sich auszahlen, hoffentlich.', effekte: [DEPOT('etf', 1.22), DEPOT('krypto', 1.3), T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'f-boersenboom', kategorie: 'Finanzen', gewicht: 1.2, abstand: 300, bedingung: (c) => depotWert(c) > 3_000,
    titel: 'Rekordstimmung an der Börse', text: 'Die Aktienmärkte jagen von Rekord zu Rekord. Sogar dein Zahnarzt gibt dir Tipps. Dein Depot ist deutlich im Plus.',
    optionen: [
      { label: 'Einen Teil auszahlen und feiern', erfolg: { text: 'Du löst ein Drittel auf und gönnst dir etwas. Der Rest arbeitet weiter.', effekte: [DEPOT('etf', 1.15), DEPOT('krypto', 1.4), ABHEBEN('alle', 0.33)] } },
      { label: 'Weiter investieren (10 % des Kontos)', hinweis: 'riskant', wurf: { basis: 0.55 }, erfolg: { text: 'Die Party geht weiter, deine Anteile steigen zusätzlich.', effekte: [DEPOT('etf', 1.12), INVEST('etf', 0.1), DEPOT('etf', 1.08)] }, misserfolg: { text: 'Kaum eingestiegen, korrigiert der Markt. So ist das eben.', effekte: [DEPOT('etf', 1.1), INVEST('etf', 0.1), DEPOT('etf', 0.9)] } },
      { label: 'Nichts tun', erfolg: { text: 'Du schaust nur ab und zu aufs Depot und freust dich.', effekte: [DEPOT('etf', 1.15), DEPOT('krypto', 1.4)] } },
    ],
  },
  {
    id: 'f-wohnung', kategorie: 'Finanzen', gewicht: 1.5, abstand: 400, bedingung: (c) => profi(c) && c.spieler.geld > 100_000 && zahl(c, 'mieteinnahmen') < 60_000,
    titel: 'Eine Wohnung als Kapitalanlage', text: 'Ein Makler bietet dir Eigentumswohnungen an: „Vermieten und entspannt zurücklehnen. Die Miete zahlt sich quasi von selbst.“ Dein Berater hält das für grundsolide.',
    optionen: [
      { label: 'Kleine Wohnung kaufen (120.000 €)', kosten: 120_000, hinweis: 'ca. 6.000 € Miete pro Jahr', erfolg: { text: 'Du wirst Vermieter. Ab jetzt kommt jede Woche etwas Miete herein, und gelegentlich ruft ein Mieter wegen einer Heizung an.', effekte: [ZAEHLE('mieteinnahmen', 6_000), T({ professionalitaet: 2, privatglueck: 1 })] } },
      { label: 'Mehrfamilienhaus kaufen (600.000 €)', kosten: 600_000, hinweis: 'ca. 30.000 € Miete pro Jahr', wurf: { basis: 0.8 }, erfolg: { text: 'Das Haus ist voll vermietet, und die Rendite stimmt. Dein Berater strahlt.', effekte: [ZAEHLE('mieteinnahmen', 30_000), T({ professionalitaet: 3, ruf: 1 })] }, misserfolg: { text: 'Das Dach muss saniert werden und zwei Wohnungen stehen leer. Das wird ein langer Weg.', effekte: [ZAEHLE('mieteinnahmen', 18_000), G(-40_000), T({ moral: -2 })] } },
      { label: 'Kein Interesse', erfolg: { text: 'Du hast keine Lust, dich mit Mietern zu beschäftigen.', effekte: [] } },
    ],
  },
  {
    id: 'f-startup', kategorie: 'Finanzen', gewicht: 1.2, abstand: 300, bedingung: (c) => profi(c) && c.spieler.geld > 20_000,
    titel: 'Ein Kumpel gründet ein Start-up', text: '{freund} hat eine App-Idee, die „die Welt verändern“ soll. Er sucht Investoren und schaut dich mit großen Augen an. „Mit dir als Gesicht wäre das ein Selbstläufer.“',
    optionen: [
      { label: 'Einen größeren Betrag investieren', hinweis: 'sehr riskant', kosten: anteil(0.04, 3000), wurf: { basis: 0.22 }, erfolg: { text: 'Das Start-up wird tatsächlich aufgekauft. Dein Einsatz vervielfacht sich, {freund} lädt dich zum Essen ein.', effekte: [G(anteil(0.4, 15_000)), T({ ruf: 1, privatglueck: 3, selbstvertrauen: 3 }), NEWS('Start-up-Coup: {name} verdient prächtig')] }, misserfolg: { text: 'Das Start-up geht nach acht Monaten pleite. Die App wurde nie fertig.', effekte: [T({ moral: -2, privatglueck: -1 })] } },
      { label: 'Nur gut zureden, kein Geld', erfolg: { text: 'Du wünschst ihm Glück und bleibst bei Fußball. Er versteht es.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'f-vc-pitch', kategorie: 'Finanzen', gewicht: 1.5, abstand: 250, bedingung: (c) => profi(c) && c.spieler.geld > 10_000 && c.spieler.traits.ruf > 15,
    titel: 'Business Angel gesucht', text: 'Eine Gründerin stellt dir ihr junges Unternehmen vor: Zehn Folien, drei Mitarbeiter, ein Pitch mit Leidenschaft. „Mit dir als Investor öffnen sich Türen. Und wenn es klappt, wird es groß.“ {berater} flüstert: „Neun von zehn Start-ups gehen kaputt.“',
    optionen: [
      { label: 'Kleines Ticket (5 % des Kontos)', hinweis: 'riskant', erfolg: { text: 'Du steigst als Business Angel ein. Die Gründerin schickt dir ab jetzt Newsletter voller Zuversicht.', effekte: [VC_EINSTIEG(0.05), T({ professionalitaet: 1, ruf: 0.5 })] } },
      { label: 'Großes Ticket (15 % des Kontos)', hinweis: 'sehr riskant', erfolg: { text: 'Du gehst richtig rein. Entweder Einhorn oder Totalverlust.', effekte: [VC_EINSTIEG(0.15), T({ ehrgeiz: 1, selbstvertrauen: 1 })] } },
      { label: 'Erst eine Prüfung beauftragen (kleine Gebühr)', kosten: anteil(0.005, 300), hinweis: 'kostet Geld', erfolg: { text: 'Ein Gutachter nimmt Zahlen und Team unter die Lupe. Du steigst nur ein, weil die Zahlen überzeugen.', effekte: [VC_EINSTIEG(0.08, true), T({ professionalitaet: 2 })] } },
      { label: 'Ablehnen', erfolg: { text: 'Du bleibst bei Fußball. Die Gründerin lächelt tapfer und sucht den Nächsten.', effekte: [] } },
    ],
  },
  {
    id: 'f-vc-fonds', kategorie: 'Finanzen', gewicht: 1, abstand: 400, bedingung: (c) => profi(c) && c.spieler.geld > 50_000,
    titel: 'Der Venture-Fonds', text: 'Ein Fondsmanager lädt dich zum Essen ein: „Nicht alles auf ein Pferd setzen. Unser Fonds streut dein Geld auf mehrere junge Unternehmen.“ Die Mindestanlage ist hoch, die Hoffnung auch.',
    optionen: [
      { label: 'Breit streuen: vier Start-ups mit gut 20 % des Kontos', hinweis: 'riskant', erfolg: { text: 'Dein Geld verteilt sich auf vier Beteiligungen. Wahrscheinlich gehen zwei baden, vielleicht trägt eine das Ganze.', effekte: [VC_EINSTIEG(0.06), VC_EINSTIEG(0.065), VC_EINSTIEG(0.07), VC_EINSTIEG(0.075), T({ professionalitaet: 2 })] } },
      { label: 'Ein einzelnes Start-up (10 %)', hinweis: 'sehr riskant', erfolg: { text: 'Du suchst dir das Start-up mit dem besten Gefühl aus.', effekte: [VC_EINSTIEG(0.1)] } },
      { label: 'Nein, zu risikoreich', erfolg: { text: 'Du bleibst bei ETF und Tagesgeld. Langweilig, aber stabil.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'f-vc-nachschuss', kategorie: 'Finanzen', gewicht: 1.5, abstand: 200, bedingung: (c) => vcAktivAnzahl(c) > 0 && c.spieler.geld > 5_000,
    titel: 'Dein Start-up braucht frisches Geld', text: 'Die Gründerin ruft an, mit gedämpfter Stimme: „Die nächste Finanzierungsrunde zieht sich. Wir könnten Geld von den Bestandsinvestoren gut gebrauchen.“ {berater} schüttelt den Kopf: „Schlechtem Geld wirft man kein gutes hinterher.“',
    optionen: [
      { label: 'Nachlegen (10 % des Kontos)', hinweis: 'riskant', wurf: { basis: 0.5 }, erfolg: { text: 'Mit deiner Hilfe schafft das Team die nächste Runde. Dein Anteil ist mehr wert als je zuvor.', effekte: [VC_AUFSTOCKEN(0.1), T({ selbstvertrauen: 2 })] }, misserfolg: { text: 'Das Geld ist schnell verbrannt, und die nächste Runde platzt. Du hast mehr Einsatz im Risiko.', effekte: [VC_AUFSTOCKEN(0.1), T({ moral: -2 })] } },
      { label: 'Nein, ich bleibe bei meinem Einsatz', erfolg: { text: 'Du sagst höflich ab. Die Gründerin versteht es, wirkt aber enttäuscht.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  // Entscheidungen als Investor: betreffen jeweils eines deiner Start-ups ({startup}, {runde}).
  {
    id: 'f-vc-bridge', kategorie: 'Finanzen', gewicht: 1.2, abstand: 180, bedingung: hatVcZiel,
    titel: '{startup} geht das Geld aus', text: 'Das Gründerteam von {startup} ({runde}) hat nur noch Geld für zwei Monate. Am Telefon klingt es verzweifelt: „Wir brauchen eine Brücke, sonst ist Schluss.“ Alle Blicke gehen zu dir, dem größten Geldgeber im Raum.',
    optionen: [
      { label: 'Überbrückungsdarlehen geben (10 % des Kontos)', hinweis: 'riskant', bedingung: (c) => c.spieler.geld > 2_000, wurf: { basis: 0.6 }, erfolg: { text: 'Mit deinem Geld überlebt {startup} den Winter und gewinnt einen Großkunden. Die Bewertung zieht an.', effekte: [VC_AUFSTOCKEN(0.1), VC_WERT(1.25), T({ selbstvertrauen: 2 })] }, misserfolg: { text: 'Das Geld ist nach drei Monaten verbrannt. {startup} meldet Insolvenz an. Dein Einsatz und die Brücke sind weg.', effekte: [VC_AUFSTOCKEN(0.1), VC_PLEITE, T({ moral: -3 })] } },
      { label: 'Ablehnen, das Team soll andere Geldgeber finden', hinweis: 'riskant', wurf: { basis: 0.65 }, erfolg: { text: 'Ein anderer Investor springt ein. Deine Anteile werden etwas verwässert, aber {startup} lebt.', effekte: [VC_WERT(0.9)] }, misserfolg: { text: 'Niemand springt ein. {startup} wird abgewickelt, und du schaust zu.', effekte: [VC_PLEITE, T({ moral: -2 })] } },
      { label: 'Auf einen Notverkauf drängen', erfolg: { text: 'Ein Konkurrent kauft die Reste. Du bekommst die Hälfte des Buchwerts zurück und sparst dir die Nerven.', effekte: [VC_EXIT(0.5), T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'f-vc-uebernahme', kategorie: 'Finanzen', gewicht: 1.2, abstand: 220, bedingung: hatVcZiel,
    titel: 'Übernahmeangebot für {startup}', text: 'Ein Branchenriese will {startup} kaufen. Die Gründer zögern und schauen auf dich: „Du hast den größten Anteil. Was sagst du?“ {berater} flüstert: „Ein Spatz in der Hand …“',
    optionen: [
      { label: 'Angebot annehmen', erfolg: { text: 'Der Deal geht durch. Du bekommst das 1,4-Fache des Buchwerts und prostest mit den Gründern an.', effekte: [VC_EXIT(1.4), T({ professionalitaet: 1, selbstvertrauen: 1 })] } },
      { label: 'Ablehnen und auf eine höhere Runde hoffen', hinweis: 'riskant', wurf: { basis: 0.5 }, erfolg: { text: 'Neue Investoren bieten mehr. Die Bewertung von {startup} springt nach oben.', effekte: [VC_RUNDE(1.8), T({ ehrgeiz: 1 })] }, misserfolg: { text: 'Der Riese kauft stattdessen einen Konkurrenten. Die Runde platzt, die Bewertung sinkt.', effekte: [VC_WERT(0.7), T({ moral: -2 })] } },
      { label: 'Nachverhandeln', hinweis: 'sehr riskant', wurf: { basis: 0.35, traits: ['ruf'] }, erfolg: { text: 'Du pokerst gut: Der Käufer legt noch einmal kräftig drauf. Du verkaufst zum 1,9-Fachen.', effekte: [VC_EXIT(1.9), T({ selbstvertrauen: 2 })] }, misserfolg: { text: 'Der Käufer zieht sich beleidigt zurück. Das Angebot ist weg, und {startup} verliert an Wert.', effekte: [VC_WERT(0.85), T({ selbstvertrauen: -1 })] } },
    ],
  },
  {
    id: 'f-vc-pivot', kategorie: 'Finanzen', gewicht: 1.2, abstand: 200, bedingung: hatVcZiel,
    titel: 'Die Gründer wollen den Kurs ändern', text: 'Die Gründer von {startup} haben eine neue Idee: „Wir machen etwas komplett anderes. Das Produkt läuft schleppend, aber wir haben eine Marktlücke gefunden!“ Als Investor hast du ein Wort mitzureden.',
    optionen: [
      { label: 'Den Strategiewechsel unterstützen', hinweis: 'riskant', wurf: { basis: 0.5 }, erfolg: { text: 'Der Pivot trifft einen Nerv. {startup} wächst plötzlich dreimal so schnell wie vorher.', effekte: [VC_WERT(1.4), T({ ehrgeiz: 1 })] }, misserfolg: { text: 'Kunden und Mitarbeiter laufen davon. Der Pivot war ein Reinfall.', effekte: [VC_WERT(0.65)] } },
      { label: 'Beim bisherigen Plan bleiben', erfolg: { text: 'Du bestehst auf Disziplin. {startup} macht langsam, aber stetig weiter.', effekte: [VC_WERT(1.05), T({ professionalitaet: 1 })] } },
      { label: 'Einen Wechsel an der Spitze fordern', hinweis: 'sehr riskant', wurf: { basis: 0.4 }, erfolg: { text: 'Ein erfahrener Geschäftsführer übernimmt, und das Unternehmen kommt auf Kurs.', effekte: [VC_WERT(1.6), T({ selbstvertrauen: 1 })] }, misserfolg: { text: 'Die Gründer gehen im Streit, und mit ihnen das halbe Team. {startup} taumelt.', effekte: [VC_WERT(0.5), T({ moral: -2 })] } },
    ],
  },
  {
    id: 'f-vc-runde', kategorie: 'Finanzen', gewicht: 1.2, abstand: 220, bedingung: (c) => (vcZiel(c)?.phase ?? 'Serie C') !== 'Serie C' && c.spieler.geld > 5_000,
    titel: 'Neue Finanzierungsrunde bei {startup}', text: 'Für {startup} ({runde}) steht die nächste Runde an. Neue Geldgeber stehen Schlange, aber die Konditionen sind hart. Du darfst als Bestandsinvestor mitgehen, oder zuschauen und verwässert werden.',
    optionen: [
      { label: 'Mitgehen (15 % des Kontos)', hinweis: 'riskant', wurf: { basis: 0.6 }, erfolg: { text: 'Die Runde wird überzeichnet. Die Bewertung steigt kräftig, und du bleibst mit deinem Anteil vorn dabei.', effekte: [VC_RUNDE(1.6), VC_AUFSTOCKEN(0.15), T({ selbstvertrauen: 1 })] }, misserfolg: { text: 'Die Runde platzt knapp, am Ende gibt es nur eine Down-Round. Dein frisches Geld verliert sofort an Wert.', effekte: [VC_AUFSTOCKEN(0.15), VC_WERT(0.7), T({ moral: -2 })] } },
      { label: 'Nicht mitgehen und verwässern lassen', erfolg: { text: 'Die Runde klappt auch ohne dich. Dein Anteil wird kleiner, aber {startup} ist eine Stufe weiter.', effekte: [VC_RUNDE(1.3)] } },
    ],
  },
  {
    id: 'f-vc-skandal', kategorie: 'Finanzen', gewicht: 0.9, abstand: 300, bedingung: hatVcZiel,
    titel: 'Skandal bei {startup}', text: '{reporter} hat Dokumente aufgetan: Das Gründerteam von {startup} soll bei den Spesen getrickst haben. Jetzt will die Zeitung von dir wissen, ob du weiter hinter dem Unternehmen stehst.',
    optionen: [
      { label: 'Zu den Gründern stehen', hinweis: 'riskant', wurf: { basis: 0.5 }, erfolg: { text: 'Die Vorwürfe zerfallen, und die Gründer danken dir mit Loyalität. {startup} wird eher stärker.', effekte: [VC_WERT(1.15), T({ ruf: 1 })] }, misserfolg: { text: 'Es kommt noch mehr heraus, und du stehst mit im Feuer. Die Bewertung bricht ein.', effekte: [VC_WERT(0.55), T({ ruf: -2, fanbeliebtheit: -3 })] } },
      { label: 'Eine unabhängige Prüfung fordern', kosten: anteil(0.01, 500), hinweis: 'kostet Geld', wurf: { basis: 0.65 }, erfolg: { text: 'Die Prüfer finden nur Kleinigkeiten. Das schafft Vertrauen bei allen Beteiligten.', effekte: [VC_WERT(1.1), T({ professionalitaet: 1 })] }, misserfolg: { text: 'Die Prüfer finden doch einige Ungereimtheiten. Der Ruf von {startup} leidet.', effekte: [VC_WERT(0.8)] } },
      { label: 'Anteile am Zweitmarkt verkaufen', erfolg: { text: 'Du gehst auf Abstand und verkaufst mit Abschlag. Dein Name bleibt sauber.', effekte: [VC_EXIT(0.6)] } },
    ],
  },
  {
    id: 'f-vc-beirat', kategorie: 'Finanzen', gewicht: 1, abstand: 300, bedingung: (c) => hatVcZiel(c) && c.spieler.traits.ruf > 20,
    titel: 'Ein Sitz im Beirat', text: 'Die Gründer von {startup} bieten dir einen Sitz im Beirat an. „Dein Name öffnet uns Türen. Und du hast ein gutes Gespür.“ Das heißt aber Quartalssitzungen, Zahlenberge und weniger Zeit für dich.',
    optionen: [
      { label: 'Den Sitz annehmen', hinweis: 'kostet Zeit', wurf: { basis: 0.55, traits: ['professionalitaet'] }, erfolg: { text: 'Du bringst dein Netzwerk ein und lenkst das Unternehmen klug. Die Bewertung steigt.', effekte: [VC_WERT(1.2), T({ professionalitaet: 1, ruf: 1 })] }, misserfolg: { text: 'Die Sitzungen fressen deine Regeneration, und die Wirkung bleibt gering.', effekte: [VC_WERT(0.95), T({ fitness: -1, moral: -2 })] } },
      { label: 'Ablehnen, Fußball geht vor', erfolg: { text: 'Du bleibst bei deinem Handwerk und überlässt anderen das Steuern.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'f-verwalter', kategorie: 'Finanzen', gewicht: 0.5, abstand: 800, bedingung: (c) => depotWert(c) > 50_000 && c.spieler.geld > 50_000,
    titel: 'Der Vermögensverwalter ist untergetaucht', text: 'Ein befreundeter Vermögensverwalter hatte dir fantastische Renditen versprochen. Heute steht die Polizei vor deinem Büro: Er ist mit dem Geld mehrerer Fußballer verschwunden. Dein Berater wird blass.',
    optionen: [
      { label: 'Anwalt einschalten und kämpfen', kosten: anteil(0.02, 1000), hinweis: 'kostet Geld', wurf: { basis: 0.35 }, erfolg: { text: 'Ein Teil des Geldes lässt sich sichern. Du bekommst die Hälfte zurück, den Rest schreibst du ab.', effekte: [DEPOT('alle', 0.8), T({ professionalitaet: 2 }), NEWS('Anlagebetrug: {name} unter den Geschädigten')] }, misserfolg: { text: 'Der Verwalter ist weg und das Geld auch. Du hast einen kleinen Teil deines Vermögens verloren.', effekte: [DEPOT('alle', 0.6), T({ moral: -4 }), NEWS('Anlagebetrug: {name} unter den Geschädigten')] } },
      { label: 'Abhaken und weitermachen', erfolg: { text: 'Du zuckst mit den Schultern, es ist nur Geld. Aber schlafen kannst du schlecht.', effekte: [DEPOT('alle', 0.65), T({ moral: -3, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'f-inflation', kategorie: 'Finanzen', gewicht: 1.2, abstand: 500, bedingung: (c) => c.spieler.geld > 5_000,
    titel: 'Alles wird teurer', text: 'Die Inflation knabbert an deinem Geld: Das Brötchen kostet das Doppelte und {berater} rechnet dir vor, wie viel dein Konto in einem Jahr an Kaufkraft verliert.',
    optionen: [
      { label: '30 % des Kontos in einen ETF stecken', erfolg: { text: 'Aktien halten langfristig mit der Inflation mit. Du fühlst dich schlau.', effekte: [INVEST('etf', 0.3), T({ professionalitaet: 1 })] } },
      { label: '30 % ins Tagesgeld legen', erfolg: { text: 'Zinsen sind besser als nichts. Du gleichst einen Teil der Inflation aus.', effekte: [INVEST('tagesgeld', 0.3)] } },
      { label: 'Egal, ich zahle mit Karte', erfolg: { text: 'Das Konto schrumpft leise, aber du merkst es kaum.', effekte: [G(({ spieler }) => -Math.round(Math.max(0, spieler.geld) * 0.02))] } },
    ],
  },
  {
    id: 'f-casino', kategorie: 'Finanzen', gewicht: 1.2, abstand: 200, bedingung: (c) => profi(c) && c.spieler.geld > 3_000 && alterVon(c) >= 18,
    titel: 'Casino-Ausflug', text: 'Nach einem Auswärtsspiel schlägt {kapitaen} einen Abstecher ins Casino vor. „Nur kurz, nur zum Spaß.“ Der Croupier lächelt, als ihr hereinkommt.',
    optionen: [
      { label: 'Auf Rot setzen', hinweis: 'riskant', kosten: anteil(0.02, 200), wurf: { basis: 0.47 }, erfolg: { text: 'Rot! Die Kugel fällt richtig, die Mitspieler jubeln, und du verdoppelst deinen Einsatz.', effekte: [G(anteil(0.04, 400)), T({ kabine: 3 })] }, misserfolg: { text: 'Schwarz. Der Einsatz ist weg, aber die Stimmung ist trotzdem gut.', effekte: [T({ kabine: 2, disziplin: -1 })] } },
      { label: 'Nur Cola und zuschauen', erfolg: { text: 'Du schaust den anderen zu, wie sie Fehler machen. Das war unterhaltsam.', effekte: [T({ disziplin: 2, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'f-spende', kategorie: 'Finanzen', gewicht: 1.2, abstand: 250, bedingung: (c) => c.spieler.geld > 10_000 && c.spieler.traits.ruf > 20,
    titel: 'Spendenaufruf', text: 'Dein alter Heimatverein sammelt Geld für einen neuen Kunstrasen. Der Jugendtrainer ruft an: „Wenn du uns hilfst, hängen wir dein Trikot ins Vereinsheim.“',
    optionen: [
      { label: 'Großzügig spenden', kosten: anteil(0.05, 2000), hinweis: 'kostet Geld', erfolg: { text: 'Der Kunstrasen kommt, und dein Trikot hängt bald im Vereinsheim. Die Fans loben dich.', effekte: [T({ fanbeliebtheit: 4, ruf: 1, privatglueck: 3, moral: 3 })] } },
      { label: 'Kleiner Betrag', kosten: 500, hinweis: 'kostet 500 €', erfolg: { text: 'Du hilfst ein bisschen. Der Trainer bedankt sich.', effekte: [T({ fanbeliebtheit: 1, privatglueck: 1 })] } },
      { label: 'Absagen', erfolg: { text: 'Du hast gerade andere Pläne mit dem Geld.', effekte: [T({ privatglueck: -1 })] } },
    ],
  },
  {
    id: 'f-erbe', kategorie: 'Finanzen', gewicht: 0.6, abstand: 1000, bedingung: (c) => alterVon(c) >= 22,
    titel: 'Die Tante aus Kanada', text: 'Ein Notar meldet sich: Deine entfernte Tante aus Kanada hat dir eine kleine Erbschaft hinterlassen. Du hast sie zweimal in deinem Leben gesehen.',
    optionen: [
      { label: 'Annehmen und der Tante dankbar sein', erfolg: { text: 'Ein warmer Geldregen. Du zündest eine Kerze für die Tante an.', effekte: [G(({ vertrag }) => Math.max(3_000, Math.round(((vertrag?.gehalt ?? 20_000) * 0.15) / 100) * 100)), T({ moral: 3, privatglueck: 2 })] } },
      { label: 'Das Erbe sofort anlegen (Tagesgeld)', erfolg: { text: 'Du gibst das Geld gar nicht erst aus: Es wandert direkt ins Tagesgeld. Die Tante wäre stolz.', effekte: [G(({ vertrag }) => Math.max(3_000, Math.round(((vertrag?.gehalt ?? 20_000) * 0.15) / 100) * 100)), INVEST('tagesgeld', 0.3), T({ professionalitaet: 2, privatglueck: 2 })] } },
    ],
  },
  {
    id: 'f-versicherung', kategorie: 'Finanzen', gewicht: 1.5, abstand: 500, bedingung: (c) => profi(c) && c.spieler.geld > 5_000 && !flag(c, 'versicherung') && gehalt(c) > 30_000,
    titel: 'Sportinvaliditätsversicherung', text: 'Ein Versicherungsvertreter erklärt dir, was bei einer schweren Verletzung passiert: „Wenn Sie sich das Kreuzband reißen und lange ausfallen, stehen Sie ohne Einkommen da. Mit uns nicht.“',
    optionen: [
      { label: 'Versicherung abschließen', kosten: anteil(0.02, 1000), hinweis: 'kostet Geld', erfolg: { text: 'Das beruhigt. Im Fall der Fälle bekommst du eine schöne Summe.', effekte: [FLAG('versicherung'), T({ professionalitaet: 2, moral: 1 })] } },
      { label: 'Darauf vertraue ich', erfolg: { text: 'Du verlässt dich auf deine Gesundheit. Hoffentlich geht das gut.', effekte: [] } },
    ],
  },
]
