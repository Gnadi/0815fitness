import { AKT, FLAG, FOLGE, G, ZAEHLE, NEWS, T, anteil, fensterArt, flag, gehalt, ov, profi, staerkeVerein, trait, zahl } from './helpers'
import type { EreignisDef } from './types'

const fenster = (c: Parameters<typeof fensterArt>[0]): boolean => profi(c) && fensterArt(c) !== null
const vertragLaeuft = (c: Parameters<typeof gehalt>[0]): boolean => c.vertrag !== null && c.vertrag.endeSaison <= c.uhr.saison + 1 && c.vertrag.rolle !== 'Jugend'

/** Paket 5: Transfer-Dramen. */
export const TRANSFER: EreignisDef[] = [
  {
    id: 'tr-ausstiegsklausel', kategorie: 'Karriere', gewicht: 1.4, abstand: 500, bedingung: (c) => fenster(c) && ov(c) >= staerkeVerein(c) - 2 && trait(c, 'ruf') > 40 && !flag(c, 'klausel'),
    titel: 'Die Ausstiegsklausel', text: 'Dein Berater legt dir ein Papier hin: „In deinem Vertrag steht eine Ausstiegsklausel. Ein Klub aus der Spitzengruppe wäre bereit, sie zu ziehen.“ Der Verein weiß davon noch nichts.',
    optionen: [
      { label: 'Klausel ziehen lassen', hinweis: 'verändert deine Lage', erfolg: { text: 'Die Überweisung geht durch, der Verein tobt. Du wechselst mit einem Koffer voller Hoffnung und einem Rucksack voller Kritik.', effekte: [FLAG('klausel'), T({ fanbeliebtheit: -8, kabine: -4, ruf: 2, ehrgeiz: 3 }), AKT('verein-wechseln-erzwingen'), NEWS('{name} zieht die Ausstiegsklausel')] } },
      { label: 'Intern verhandeln und die Klausel als Druckmittel nutzen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['ruf', 'selbstvertrauen'] }, erfolg: { text: 'Der Verein bessert dein Gehalt deutlich auf, um dich zu halten.', effekte: [FLAG('klausel'), AKT('gehaltserhoehung'), T({ moral: 4, trainerBeziehung: 1 })] }, misserfolg: { text: 'Der Verein reagiert beleidigt: „Wer droht, spielt nicht.“ Die Stimmung ist vergiftet.', effekte: [FLAG('klausel'), T({ trainerBeziehung: -5, moral: -3 })] } },
      { label: 'Treu bleiben', erfolg: { text: 'Du zerreißt das Papier nicht, legst es aber in die Schublade. Die Fans erfahren davon und lieben dich dafür.', effekte: [FLAG('klausel'), T({ fanbeliebtheit: 6, ruf: 1, trainerBeziehung: 2 })] } },
    ],
  },
  {
    id: 'tr-kaufoption', kategorie: 'Karriere', gewicht: 2, abstand: 200, bedingung: (c) => c.leihe !== null && profi(c) && c.saisonStats.spiele >= 5,
    titel: 'Kaufoption', text: 'Dein Leihverein hat eine Kaufoption im Vertrag und überlegt, sie zu ziehen. Der Sportdirektor sagt: „Wir mögen dich. Aber wir müssen das Preisschild prüfen.“',
    optionen: [
      { label: 'Aktiv Werbung machen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['professionalitaet', 'trainerBeziehung'] }, erfolg: { text: 'Du gibst im Training alles, und die Verantwortlichen sind überzeugt. Die Option wird gezogen.', effekte: [AKT('verlaengerung-anbieten'), T({ moral: 6, trainerBeziehung: 3 })] }, misserfolg: { text: 'Man zögert, vergleicht Preis und Leistung. Du bleibst im Ungewissen.', effekte: [T({ moral: -3, selbstvertrauen: -2 })] } },
      { label: 'Abwarten und Leistung bringen', erfolg: { text: 'Du konzentrierst dich auf Spiele und Training. Was kommt, kommt.', effekte: [T({ professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'tr-berater-hinterruecks', kategorie: 'Karriere', gewicht: 1.2, abstand: 400, bedingung: (c) => profi(c) && trait(c, 'ruf') > 30,
    titel: 'Verhandlungen hinter deinem Rücken', text: 'Ein Kumpel aus einem anderen Verein ruft an: „Dein Berater hat uns schon dein Gehalt genannt. Wusstest du davon?“ Du wusstest es nicht.',
    optionen: [
      { label: '{berater} zur Rede stellen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['selbstvertrauen'] }, erfolg: { text: '{berater} windet sich, gibt aber alles zu. Ab jetzt läuft nichts mehr ohne dich.', effekte: [T({ professionalitaet: 2, selbstvertrauen: 3 })] }, misserfolg: { text: '{berater} verteidigt sich laut und beleidigt. Die Zusammenarbeit steht auf der Kippe.', effekte: [T({ moral: -3, selbstvertrauen: -2 })] } },
      { label: 'Berater wechseln', erfolg: { text: 'Du wirfst ihn raus. Ein neuer Berater übernimmt, mal sehen, ob er besser ist.', effekte: [AKT('berater-wechsel'), T({ moral: 1 })] } },
      { label: 'Die Gelegenheit nutzen', erfolg: { text: 'Du lässt ihn weitermachen, aber nur, weil das Angebot nach Gold klingt.', effekte: [T({ ehrgeiz: 2 }), AKT('wechselwunsch')] } },
    ],
  },
  {
    id: 'tr-gerucht', kategorie: 'Karriere', gewicht: 2, abstand: 100, bedingung: (c) => fenster(c) && trait(c, 'ruf') > 25,
    titel: 'Gerüchteküche', text: 'Die Zeitungen schreiben: „{name} vor Wechsel zu einem Topklub!“ Auf dem Trainingsgelände werden Blicke getauscht, und der Präsident ruft dich in sein Büro.',
    optionen: [
      { label: 'Dementieren', erfolg: { text: 'Du sagst: „Ich bin glücklich hier.“ Die Fans freuen sich, und die Gerüchte ebben ab.', effekte: [T({ fanbeliebtheit: 3, trainerBeziehung: 2 })] } },
      { label: 'Offen lassen', erfolg: { text: 'Du lächelst und sagst: „Mal sehen.“ Die Gerüchte brodeln weiter, die Spannung bleibt.', effekte: [T({ ruf: 1, fanbeliebtheit: -2, kabine: -1 })] } },
      { label: 'Nutzen: einen echten Wechsel anstoßen', erfolg: { text: 'Du gibst deinem Berater grünes Licht. Zwei Klubs melden sich noch am gleichen Tag.', effekte: [AKT('wechselwunsch'), T({ fanbeliebtheit: -3, trainerBeziehung: -2 })] } },
    ],
  },
  {
    id: 'tr-deadline-day', kategorie: 'Karriere', gewicht: 1.6, abstand: 200, bedingung: (c) => profi(c) && c.saison.kalender[c.uhr.woche - 1]?.t === 'F' && (c.saison.kalender[c.uhr.woche - 1] as { letzte?: boolean }).letzte === true && trait(c, 'ruf') > 25,
    titel: 'Deadline Day', text: 'Letzter Tag der Transferperiode: Dein Berater telefoniert im Zehnsekundentakt, Sky-Reporter stehen vor deiner Haustür, und ein Klub will dich um jeden Preis. Die Uhr tickt.',
    optionen: [
      { label: 'Unterschreiben, bevor die Frist abläuft', hinweis: 'verändert deine Lage', erfolg: { text: 'Fax, Medizincheck, Unterschrift: Um 23:58 Uhr geht alles klar. Du fällst erschöpft ins Bett.', effekte: [AKT('verein-wechseln-erzwingen'), FOLGE('tr-medizincheck', 1, 0.4), T({ ruf: 1, moral: 3, kabine: -2 })] } },
      { label: 'Ablehnen und bleiben', erfolg: { text: 'Du sagst nein. Um Mitternacht ist das Fenster zu. Du fühlst dich erleichtert.', effekte: [T({ fanbeliebtheit: 3, trainerBeziehung: 2, moral: 2 })] } },
      { label: 'Es auf die Spitze treiben', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['selbstvertrauen'] }, erfolg: { text: 'Beide Seiten bieten mehr. Du bleibst, aber mit einem satten Aufschlag.', effekte: [AKT('gehaltserhoehung'), T({ ruf: 1, selbstvertrauen: 3 })] }, misserfolg: { text: 'Zu pokern kostet dich beide Angebote. Du sitzt am nächsten Tag mit leeren Händen da.', effekte: [T({ moral: -5, ruf: -1, trainerBeziehung: -2 })] } },
    ],
  },
  {
    id: 'tr-vertragspoker', kategorie: 'Karriere', gewicht: 2, abstand: 200, bedingung: (c) => profi(c) && vertragLaeuft(c) && c.saisonStats.spiele >= 5,
    titel: 'Vertragspoker', text: 'Dein Vertrag läuft bald aus. Der Verein bietet eine Verlängerung an, aber zu schlechteren Konditionen. „Das ist der letzte Stand“, sagt der Sportdirektor. Dein Berater flüstert: „Wir haben noch Optionen.“',
    optionen: [
      { label: 'Hart bleiben und mehr fordern', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['ruf', 'selbstvertrauen'] }, erfolg: { text: 'Der Verein knickt ein. Nach zwei Wochen liegt ein besserer Vertrag auf dem Tisch.', effekte: [AKT('verlaengerung-anbieten'), AKT('gehaltserhoehung'), T({ moral: 5, ruf: 1 })] }, misserfolg: { text: 'Die Gespräche enden im Streit. Der Verein sucht bereits einen Nachfolger.', effekte: [T({ trainerBeziehung: -5, moral: -4 })] } },
      { label: 'Unterschreiben, um Ruhe zu haben', erfolg: { text: 'Du unterschreibst. Kein Pokerface, keine Spielchen, aber auch kein Stress.', effekte: [AKT('verlaengerung-anbieten'), T({ moral: 2, professionalitaet: 1 })] } },
      { label: 'Auslaufen lassen', erfolg: { text: 'Du wartest ab, was der Markt dir bietet. Ein riskantes Spiel mit offenem Ausgang.', effekte: [T({ ehrgeiz: 2, trainerBeziehung: -2 })] } },
    ],
  },
  {
    id: 'tr-handgeld', kategorie: 'Finanzen', gewicht: 1, abstand: 500, bedingung: (c) => fenster(c) && trait(c, 'ruf') > 40,
    titel: 'Das Handgeld', text: 'Ein Klub bietet dir ein Handgeld für deine Unterschrift. Offiziell steht da „Treueprämie“, inoffiziell gibt es den Umschlag extra. Dein Berater hat den Namen des Vermittlers schon auswendig gelernt.',
    optionen: [
      { label: 'Sauber über den Vertrag abrechnen lassen', erfolg: { text: 'Du verzichtest auf den Umschlag. Das Geld fließt offiziell, mit Steuern.', effekte: [G(anteil(0.08, 3000)), T({ professionalitaet: 2 })] } },
      { label: 'Den Umschlag nehmen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['professionalitaet'] }, erfolg: { text: 'Niemand bemerkt etwas. Das Geld ist bar auf dem Konto.', effekte: [G(anteil(0.15, 8000))] }, misserfolg: { text: 'Ein Whistleblower packt aus. Steuerfahndung, Verbandsermittlungen, Schlagzeilen.', effekte: [G((c) => -Math.round(Math.max(10_000, gehalt(c) * 0.2))), T({ ruf: -3, fanbeliebtheit: -4 }), AKT('skandal'), NEWS('Handgeld-Affäre: {name} unter Verdacht')] } },
    ],
  },
  {
    id: 'tr-ex-verein', kategorie: 'Karriere', gewicht: 1.4, abstand: 300, bedingung: (c) => profi(c) && c.laufbahn.transfers.length >= 1 && zahl(c, 'exVereinSpiele') < 3,
    titel: 'Wiedersehen mit dem Ex-Klub', text: 'Das Los spielt wieder zusammen, was zusammengehört: Du trittst gegen deinen alten Verein an. Dein alter Zeugwart hat dir eine Nachricht geschickt, und die Fans haben ein Transparent gemalt, du weißt nicht, ob es Liebe oder Hass bedeutet.',
    optionen: [
      { label: 'Respektvoll auftreten', erfolg: { text: 'Du bedankst dich nach dem Spiel bei den Fans. Sie klatschen, auch wenn du verlierst.', effekte: [ZAEHLE('exVereinSpiele', 1), T({ fanbeliebtheit: 3, professionalitaet: 2 })] } },
      { label: 'Es dem Ex-Verein zeigen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['ehrgeiz', 'selbstvertrauen'] }, erfolg: { text: 'Du läufst, kämpfst und hast eine Menge Spaß. Dein Auftritt macht deinen neuen Fans Freude.', effekte: [ZAEHLE('exVereinSpiele', 1), T({ selbstvertrauen: 4, fanbeliebtheit: 4, kabine: 2 })] }, misserfolg: { text: 'Du übertreibst und siehst Gelb. Die gegnerischen Fans pfeifen jeden Ballkontakt.', effekte: [ZAEHLE('exVereinSpiele', 1), T({ selbstvertrauen: -2, fanbeliebtheit: 1 })] } },
    ],
  },
  {
    id: 'tr-abschied', kategorie: 'Verein', gewicht: 0.9, abstand: 500, bedingung: (c) => profi(c) && c.laufbahn.transfers.length >= 1 && trait(c, 'fanbeliebtheit') > 60,
    titel: 'Der große Abschied', text: 'Die Fans wollen dich nicht gehen lassen: Ein Fanbus fährt zu deiner Haustür, ein Banner im Stadion lautet „Danke, {name}!“, und der Trainer hält eine Rede, bei der selbst der Zeugwart weint.',
    optionen: [
      { label: 'Ehrenrunde und Tränen', erfolg: { text: 'Du drehst eine Runde, schüttelst Hände, siehst feuchte Augen. Ein Abschied, der bleibt.', effekte: [T({ fanbeliebtheit: 6, moral: 4, ruf: 2 })] } },
      { label: 'Ohne Aufsehen verschwinden', erfolg: { text: 'Du packst still deine Sachen. Die Fans verstehen es, aber ein bisschen enttäuscht sind sie schon.', effekte: [T({ fanbeliebtheit: -2 })] } },
    ],
  },
  {
    id: 'tr-medizincheck', kategorie: 'Gesundheit', gewicht: 0, abstand: 100,
    titel: 'Medizincheck', text: 'Bei der Untersuchung vor dem Wechsel schaut der Arzt lange auf das Röntgenbild. „Da ist etwas im Knie“, murmelt er. Dein Berater wird bleich, der Verein wartet im Nebenzimmer.',
    optionen: [
      { label: 'Ehrlich sein', erfolg: { text: 'Du erzählst von der alten Verletzung. Der Verein verhandelt neu, der Wechsel geht trotzdem durch.', effekte: [T({ professionalitaet: 3 }), G(-1500)] } },
      { label: 'Herunterspielen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['gesundheit'] }, erfolg: { text: 'Der Arzt zuckt mit den Schultern: „Läuft alles normal.“ Du kommst durch.', effekte: [T({ selbstvertrauen: 2 })] }, misserfolg: { text: 'Das Knie macht sich nach zwei Wochen bemerkbar. Der Verein ist erbost.', effekte: [T({ trainerBeziehung: -4, ruf: -1 })] } },
    ],
  },
]

