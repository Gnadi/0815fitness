import { FLAG, G, NEWS, T, VERL, alterVon, flag, imAusland, nationalspieler, ov, profi, trait, turnierAktiv, zahl } from './helpers'
import type { EreignisDef } from './types'

const national = (c: Parameters<typeof nationalspieler>[0]): boolean => profi(c) && nationalspieler(c)

/** Paket 7: Nationalmannschaft und Turniere. */
export const NATIONALTEAM: EreignisDef[] = [
  {
    id: 'nt-bundestrainer', kategorie: 'Karriere', gewicht: 1.8, abstand: 250, bedingung: (c) => national(c) && c.vertrag?.rolle !== 'Stammspieler',
    titel: 'Streit mit dem Nationaltrainer', text: 'Beim Länderspiel sitzt du wieder nur auf der Bank. Der Nationaltrainer sagt auf der Pressekonferenz: „Wir haben Alternativen.“ Dein Name fällt nicht. Die Journalisten schauen dich an.',
    optionen: [
      { label: 'Öffentlich widersprechen', hinweis: 'riskant', wurf: { basis: 0.35, traits: ['selbstvertrauen', 'ruf'] }, erfolg: { text: 'Deine Kritik kommt an. Der Trainer ruft dich an und verspricht eine Chance.', effekte: [T({ fanbeliebtheit: 3, selbstvertrauen: 3, ruf: 1 })] }, misserfolg: { text: 'Der Trainer streicht dich aus dem nächsten Kader. „Vorläufig“, steht in der Mitteilung.', effekte: [T({ moral: -5, ruf: -1, trainerBeziehung: -2 })] } },
      { label: 'Im Klub überzeugen', erfolg: { text: 'Du konzentrierst dich auf deine Leistungen. Das spricht für sich.', effekte: [T({ professionalitaet: 3, ehrgeiz: 2 })] } },
    ],
  },
  {
    id: 'nt-absage-verein', kategorie: 'Karriere', gewicht: 1.4, abstand: 250, bedingung: (c) => national(c) && (c.verletzung !== null || trait(c, 'fitness') < 40),
    titel: 'Verein gegen Verband', text: 'Dein Verein will dich nicht zur Nationalmannschaft reisen lassen, weil du angeschlagen bist. Der Verband besteht auf der Nominierung. Der Mannschaftsarzt schüttelt den Kopf, der Verbandsarzt beruhigt.',
    optionen: [
      { label: 'Dem Verband zusagen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['gesundheit', 'fitness'] }, erfolg: { text: 'Du bist dabei und lieferst. Der Verband ist begeistert, dein Verein nicht sehr.', effekte: [T({ ruf: 2, fanbeliebtheit: 3, trainerBeziehung: -3, fitness: -4 })] }, misserfolg: { text: 'Du verschlimmerst die Verletzung. Dein Verein ist stinksauer, der Verband zuckt mit den Schultern.', effekte: [VERL('Muskelfaserriss', 4), T({ trainerBeziehung: -6, moral: -4 })] } },
      { label: 'Beim Verein bleiben', erfolg: { text: 'Du sagst ab. Der Verband murrt, dein Verein bedankt sich.', effekte: [T({ trainerBeziehung: 4, professionalitaet: 2, ruf: -1 })] } },
    ],
  },
  {
    id: 'nt-hymne', kategorie: 'Karriere', gewicht: 1.4, abstand: 250, bedingung: (c) => national(c) && zahl(c, 'hymne') < 1,
    titel: 'Die Hymne', text: 'Zum ersten Mal in deinem Leben stehst du in der Aufstellung, die Hymne ertönt, ein Meer aus Fahnen im Stadion. Du hast eine Gänsehaut, dein Herz hämmert, und die Mannschaftskollegen legen dir die Arme um die Schultern.',
    optionen: [
      { label: 'Laut mitsingen', erfolg: { text: 'Dein Gesang geht im Stadionlärm unter, aber er kommt von Herzen. Das Video geht viral.', effekte: [FLAG('hymne', 1), T({ fanbeliebtheit: 5, moral: 8, ruf: 1 })] } },
      { label: 'Den Moment still genießen', erfolg: { text: 'Du schließt die Augen und denkst an die Bolzplätze deiner Kindheit.', effekte: [FLAG('hymne', 1), T({ moral: 8, selbstvertrauen: 3 })] } },
    ],
  },
  {
    id: 'nt-kapitaen', kategorie: 'Karriere', gewicht: 1, abstand: 500, bedingung: (c) => national(c) && c.laufbahn.laenderspiele >= 30 && alterVon(c) >= 26 && trait(c, 'kabine') > 55 && !flag(c, 'nationalKapitaen'),
    titel: 'Kapitän der Nationalmannschaft', text: 'Der Nationaltrainer ruft dich zum Gespräch: „Der bisherige Kapitän hört auf. Ich möchte dich fragen, ob du die Binde übernimmst.“ Die Verantwortung wäre riesig, die Ehre auch.',
    optionen: [
      { label: 'Zusagen', hinweis: 'riskant', wurf: { basis: 0.65, traits: ['kabine', 'professionalitaet'] }, erfolg: { text: 'Du führst die Mannschaft mit Ruhe und Klarheit. Fans und Medien feiern dich.', effekte: [FLAG('nationalKapitaen'), T({ ruf: 4, fanbeliebtheit: 5, kabine: 4, moral: 6 })] }, misserfolg: { text: 'Die Rolle drückt schwer. Nach zwei schwachen Spielen wird über deine Eignung diskutiert.', effekte: [FLAG('nationalKapitaen'), T({ selbstvertrauen: -3, ruf: 1 })] } },
      { label: 'Ablehnen', erfolg: { text: 'Du sagst: „Ein anderer kann das besser.“ Der Trainer nickt respektvoll.', effekte: [FLAG('nationalKapitaen'), T({ professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'nt-turnierkader', kategorie: 'Karriere', gewicht: 4, abstand: 60, bedingung: (c) => national(c) && c.saison.kalender[c.uhr.woche - 1]?.t === 'T' && (c.saison.kalender[c.uhr.woche - 1] as { n?: number }).n === 1,
    titel: 'Turnierkader', text: 'Die Liste für das Turnier ist raus. Dein Telefon klingelt, dein Name steht drauf. Zwei Wochen später sitzt du mit der Mannschaft im Charterflug.',
    optionen: [
      { label: 'Das Turnier genießen und lernen', erfolg: { text: 'Du saugst jeden Moment auf. Die Erfahrung wird dich prägen.', effekte: [T({ moral: 6, ehrgeiz: 3, ruf: 2 })] } },
      { label: 'Sich für die Startelf aufdrängen', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['ehrgeiz', 'selbstvertrauen'] }, erfolg: { text: 'Mit starken Trainingseinheiten spielst du dich in den Fokus des Trainers.', effekte: [T({ trainerBeziehung: 3, selbstvertrauen: 4, ruf: 2 })] }, misserfolg: { text: 'Du übertreibst im Training, kassierst einen Rüffel und rutschst auf die Bank.', effekte: [T({ selbstvertrauen: -3, trainerBeziehung: -2 })] } },
    ],
  },
  {
    id: 'nt-turnier-quartier', kategorie: 'Karriere', gewicht: 2.2, abstand: 12, bedingung: (c) => national(c) && turnierAktiv(c),
    titel: 'Im Teamhotel', text: 'Zwei Wochen Quarantäne-Atmosphäre im Teamhotel: Tischtennis, Karten, eine verbotene Pizza und ein Mannschaftsarzt mit Fieberthermometer. {freund} will ein Zimmer mit dir teilen.',
    optionen: [
      { label: 'Zimmer mit {freund} teilen', erfolg: { text: 'Ihr schaut Serien, lacht und hört Musik. Der Teamgeist wächst.', effekte: [T({ kabine: 3, moral: 4 })] } },
      { label: 'Allein Ruhe suchen', erfolg: { text: 'Du nutzt die Zeit, um den Kopf freizubekommen und Videos zu schauen.', effekte: [T({ professionalitaet: 2, selbstvertrauen: 2 })] } },
      { label: 'Heimlich eine Pizza bestellen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['disziplin'] }, erfolg: { text: 'Der Pizzabote wird nicht entdeckt. Die ganze Mannschaft isst mit.', effekte: [T({ kabine: 5, moral: 3 })] }, misserfolg: { text: 'Der Teammanager erwischt euch. Strafe für den Rädelsführer, also dich.', effekte: [G(-300), T({ kabine: 1, trainerBeziehung: -3, disziplin: -2 })] } },
    ],
  },
  {
    id: 'nt-turnier-elfer', kategorie: 'Karriere', gewicht: 1.5, abstand: 12, bedingung: (c) => national(c) && turnierAktiv(c) && ov(c) > 62,
    titel: 'Elfmeterschießen im Turnier', text: 'Es steht 0:0 im Viertelfinale, die Verlängerung ist vorbei. Der Nationaltrainer fragt die Mannschaft: „Wer schießt?“ Die Hälfte der Kollegen schaut zu Boden. Du spürst die Hitze im Gesicht.',
    optionen: [
      { label: 'Ich schieße', hinweis: 'riskant', wurf: { basis: 0.6, skills: ['schuss'], traits: ['selbstvertrauen', 'moral'] }, erfolg: { text: 'Du schaust dem Torwart in die Augen und versenkst den Ball im Winkel. Das ganze Land jubelt.', effekte: [T({ ruf: 4, fanbeliebtheit: 6, selbstvertrauen: 6 }), NEWS('{name} trifft im Elfmeterschießen')] }, misserfolg: { text: 'Der Ball landet am Pfosten. Du siehst, wie die Kollegen den Kopf senken. Es wird Wochen dauern, bis du das verdaust.', effekte: [T({ selbstvertrauen: -8, moral: -8, fanbeliebtheit: -3 }), NEWS('{name} verschießt entscheidenden Elfmeter')] } },
      { label: 'Anderen den Vortritt lassen', erfolg: { text: 'Du hältst dich im Hintergrund und drückst die Daumen. Dein Ehrgeiz schmerzt.', effekte: [T({ selbstvertrauen: -2, kabine: 1 })] } },
    ],
  },
  {
    id: 'nt-fan-reise', kategorie: 'Karriere', gewicht: 1.2, abstand: 250, bedingung: (c) => national(c) && turnierAktiv(c),
    titel: 'Die Fans sind da', text: 'Mehrere Tausend Fans sind dem Team ins Turnierland gefolgt, mit Trommeln, Fahnen, Gesängen. Am Mannschaftshotel warten sie stundenlang auf Autogramme.',
    optionen: [
      { label: 'Zu den Fans gehen und Selfies machen', erfolg: { text: 'Du schreibst Autogramme, umarmst Kinder, tauschst Schals. Die Fans flippen aus.', effekte: [T({ fanbeliebtheit: 6, ruf: 2, fitness: -2 })] } },
      { label: 'Vom Balkon winken', erfolg: { text: 'Die Fans jubeln, du auch. Kurz, aber herzlich.', effekte: [T({ fanbeliebtheit: 2 })] } },
    ],
  },
  {
    id: 'nt-ruecktritt', kategorie: 'Karriere', gewicht: 1.2, abstand: 500, bedingung: (c) => national(c) && alterVon(c) >= 32 && c.laufbahn.laenderspiele >= 50,
    titel: 'Rücktritt aus der Nationalmannschaft?', text: 'Dein Körper braucht mehr Pausen, dein Verein will dich öfter einsetzen, und der Nationaltrainer setzt zunehmend auf Jüngere. Mit 32 stellt sich die Frage: noch eine Runde oder aufhören?',
    optionen: [
      { label: 'Zurücktreten', erfolg: { text: 'Du verkündest den Rücktritt mit einer ruhigen Rede. Fans und Verband danken dir mit Standing Ovations.', effekte: [FLAG('nationalspieler', false), FLAG('nationalRuecktritt'), T({ fanbeliebtheit: 5, ruf: 2, fitness: 4, moral: 2 }), NEWS('{name} tritt aus der Nationalmannschaft zurück')] } },
      { label: 'Noch ein Turnier', erfolg: { text: 'Du sagst: „Ich will noch einmal alles geben.“ Der Verband freut sich.', effekte: [T({ ehrgeiz: 3, ruf: 1, fitness: -3 })] } },
    ],
  },
  {
    id: 'nt-sperre-kritik', kategorie: 'Karriere', gewicht: 1, abstand: 300, bedingung: (c) => national(c) && imAusland(c) && trait(c, 'ruf') > 30,
    titel: 'Der Nationalspieler ohne Heimat?', text: 'Ein Journalist schreibt: „{name} spielt im Ausland und singt zu leise die Hymne!“ Der Artikel geht viral, Fans streiten, und ein Politiker schaltet sich ein.',
    optionen: [
      { label: 'Gelassen reagieren', erfolg: { text: 'Du sagst: „Ich singe mit dem Herzen, nicht mit der Lautstärke.“ Der Satz wird zitiert.', effekte: [T({ fanbeliebtheit: 3, ruf: 1, professionalitaet: 2 })] } },
      { label: 'Scharf zurückschießen', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['selbstvertrauen'] }, erfolg: { text: 'Deine klare Antwort trifft den Nerv. Viele Fans stehen hinter dir.', effekte: [T({ fanbeliebtheit: 5, selbstvertrauen: 3 })] }, misserfolg: { text: 'Deine Wut macht alles schlimmer. Ein Sponsor meldet sich besorgt.', effekte: [T({ fanbeliebtheit: -4, ruf: -2 })] } },
    ],
  },
]

