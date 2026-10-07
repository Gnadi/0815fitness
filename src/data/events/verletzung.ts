import { FLAG, FOLGE, NEWS, REHA, S, T, VERL, anteil, flag, jugend, profi, trait, verletzt, zahl } from './helpers'
import type { EreignisDef } from './types'

const lang = (c: Parameters<typeof verletzt>[0]): boolean => (c.verletzung?.wochen ?? 0) >= 4

/** Paket 6: Verletzungs-Storylines, Reha und Comeback. */
export const VERLETZUNG: EreignisDef[] = [
  {
    id: 'vl-zweitmeinung', kategorie: 'Gesundheit', gewicht: 2, abstand: 100, bedingung: (c) => profi(c) && lang(c),
    titel: 'Eine Zweitmeinung', text: 'Die Diagnose des Vereinsarztes lässt dich nicht los. Ein Freund erzählt von einem Spezialisten im Ausland, der Sportler in Rekordzeit wieder fit macht. Teuer, aber die Erfolge sprechen für sich.',
    optionen: [
      { label: 'Zum Spezialisten reisen', kosten: anteil(0.04, 2500), hinweis: 'kostet Geld', wurf: { basis: 0.65, traits: ['gesundheit'] }, erfolg: { text: 'Die Behandlung schlägt an, du bist früher fit als gedacht.', effekte: [REHA(2), T({ moral: 4, gesundheit: 2 })] }, misserfolg: { text: 'Die Reise war umsonst. Der Spezialist sagt dasselbe wie der Vereinsarzt, nur teurer.', effekte: [T({ moral: -2 })] } },
      { label: 'Dem Vereinsarzt vertrauen', erfolg: { text: 'Du sagst: „Die Leute hier kennen meinen Körper.“ Der Arzt freut sich über das Vertrauen.', effekte: [T({ trainerBeziehung: 2, professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'vl-reha-motivation', kategorie: 'Gesundheit', gewicht: 2, abstand: 80, bedingung: (c) => profi(c) && lang(c) && trait(c, 'moral') < 55,
    titel: 'Die Reha zieht sich', text: 'Wochenlang das gleiche Programm: Fahrrad, Gummibänder, Balancebrett. Der Physio lobt dich, aber du fühlst dich wie in einem Film, der nie endet. Deine Mitspieler trainieren, du schaust zu.',
    optionen: [
      { label: 'Täglich Extraeinheiten', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['professionalitaet', 'ehrgeiz'] }, erfolg: { text: 'Die Disziplin zahlt sich aus. Dein Körper reagiert besser als erwartet.', effekte: [REHA(1), T({ professionalitaet: 3, disziplin: 3, fitness: 2 })] }, misserfolg: { text: 'Du übertreibst, das Gelenk meldet sich mit Schmerzen. Der Physio bremst dich.', effekte: [T({ moral: -3, fitness: -2 })] } },
      { label: 'Mit dem Team Kontakt halten', erfolg: { text: 'Du kommst zu jedem Training und jedem Spiel mit. Die Kabine hält dich im Kreis.', effekte: [T({ kabine: 4, moral: 3 })] } },
      { label: 'Eine Auszeit ohne Fußball nehmen', kosten: 1800, hinweis: 'kostet 1.800 €', erfolg: { text: 'Eine Woche Meer, ein Buch, kein Ball. Der Kopf wird wieder frei.', effekte: [T({ moral: 6, privatglueck: 4 })] } },
    ],
  },
  {
    id: 'vl-schmerzmittel', kategorie: 'Risiko', gewicht: 1.4, abstand: 300, bedingung: (c) => profi(c) && verletzt(c) && !flag(c, 'schmerzmittel'),
    titel: 'Die Spritze vor dem Spiel', text: 'Ein wichtiges Spiel steht an, und du bist noch nicht ganz fit. Der Mannschaftsarzt sagt vorsichtig: „Wir könnten dir etwas spritzen. Zwei, drei Stunden schmerzfrei. Das machen viele.“',
    optionen: [
      { label: 'Spritze nehmen und spielen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['gesundheit'] }, erfolg: { text: 'Du spielst fast schmerzfrei und überzeugst. Der Trainer ist begeistert, aber du merkst, wie leicht es war.', effekte: [FLAG('schmerzmittel'), T({ trainerBeziehung: 4, ruf: 1, gesundheit: -2 }), FOLGE('vl-abhaengig', 30, 0.5)] }, misserfolg: { text: 'Das Mittel überdeckt die Warnung des Körpers. Mitten im Spiel reißt die Verletzung schlimmer auf.', effekte: [FLAG('schmerzmittel'), VERL('Rückfall der Verletzung', 8), T({ moral: -5, gesundheit: -4 }), FOLGE('vl-abhaengig', 30, 0.5)] } },
      { label: 'Ablehnen und aussetzen', erfolg: { text: 'Du sagst: „Das ist mir das Risiko nicht wert.“ Der Trainer akzeptiert es.', effekte: [T({ professionalitaet: 3, gesundheit: 2, trainerBeziehung: 1 })] } },
    ],
  },
  {
    id: 'vl-abhaengig', kategorie: 'Risiko', gewicht: 0,
    titel: 'Ohne Tablette geht nichts', text: 'Seit der Verletzung brauchst du für jedes Training „etwas Kleines“. Dein Arzt verschreibt es, bei Bedarf besorgt es auch ein Betreuer. Du merkst, dass du ohne die Pillen nicht mehr durch den Tag kommst.',
    optionen: [
      { label: 'Zum Arzt gehen und alles beichten', kosten: 900, hinweis: 'kostet 900 €', erfolg: { text: 'Ein Entzug unter ärztlicher Aufsicht. Hart, aber du schaffst es.', effekte: [FLAG('schmerzmittel', false), T({ moral: 3, professionalitaet: 4, gesundheit: 4, disziplin: 3 })] } },
      { label: 'Weitermachen, es geht schon', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['disziplin'] }, erfolg: { text: 'Du kommst noch einmal davon, aber der Druck bleibt.', effekte: [T({ moral: -3, gesundheit: -3 })] }, misserfolg: { text: 'Bei einer Kontrolle fallen die Werte auf. Verband und Verein ermitteln.', effekte: [T({ ruf: -4, fanbeliebtheit: -4, gesundheit: -5 }), AKT_SKANDAL(), NEWS('Schmerzmittel-Affäre um {name}')] } },
    ],
  },
  {
    id: 'vl-comeback-druck', kategorie: 'Gesundheit', gewicht: 2, abstand: 60, bedingung: (c) => profi(c) && c.verletzung !== null && c.verletzung.wochen <= 2,
    titel: 'Früher zurück?', text: 'Der Trainer fragt vorsichtig: „Wie weit bist du? Wir brauchen dich am Wochenende.“ Der Physio schüttelt den Kopf: „Noch zwei Wochen.“ Aber du fühlst dich schon gut.',
    optionen: [
      { label: 'Nach dem Physio richten', erfolg: { text: 'Du wartest die zwei Wochen ab und kommst topfit zurück. Der Trainer nickt.', effekte: [T({ professionalitaet: 3, gesundheit: 2 })] } },
      { label: 'Früher zurückkommen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['gesundheit', 'fitness'] }, erfolg: { text: 'Du spielst früher und solide. Der Trainer lobt deinen Einsatz.', effekte: [REHA(2), T({ trainerBeziehung: 4, moral: 3, fitness: -2 })] }, misserfolg: { text: 'Beim zweiten Sprint ein Stich. Du musst ausgewechselt werden und fällst länger aus.', effekte: [VERL('Rückfall', 5), T({ moral: -5, trainerBeziehung: -2 })] } },
    ],
  },
  {
    id: 'vl-comeback', kategorie: 'Gesundheit', gewicht: 0,
    titel: 'Wieder da!', text: 'Nach Wochen Reha stehst du zum ersten Mal wieder im Kader. Die Fans haben ein Banner gemalt: „Willkommen zurück!“ Als du eingewechselt wirst, steht das ganze Stadion.',
    optionen: [
      { label: 'Zur Kurve laufen und danken', erfolg: { text: 'Du hebst die Faust, grüßt die Kurve und spielst mit neuer Energie.', effekte: [T({ moral: 8, fanbeliebtheit: 5, selbstvertrauen: 4 })] } },
      { label: 'Konzentriert bleiben', erfolg: { text: 'Du gibst dir Zeit, vorsichtig in den Rhythmus zu kommen. Der Physio ist zufrieden.', effekte: [T({ professionalitaet: 3, fitness: 2 })] } },
    ],
  },
  {
    id: 'vl-reha-liebe', kategorie: 'Privat', gewicht: 0.8, abstand: 600, bedingung: (c) => profi(c) && lang(c) && c.personen.partner === null,
    titel: 'Die Physiotherapeutin', text: 'Die neue Physiotherapeutin ist freundlich, witzig und hat einen messerscharfen Humor. Nach den Behandlungen bleibt ihr oft Zeit für ein Gespräch. Du merkst, dass du dich auf die Einheiten freust.',
    optionen: [
      { label: 'Sie auf einen Kaffee einladen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['selbstvertrauen', 'privatglueck'] }, erfolg: { text: 'Sie sagt Ja. Aus dem Kaffee wird ein Abendessen und dann mehr.', effekte: [{ t: 'aktion', name: 'partner-neu' }, T({ privatglueck: 10, moral: 5 })] }, misserfolg: { text: 'Sie lacht verlegen: „Ich behandle nur Patienten.“ Peinlich, aber die Behandlung bleibt professionell.', effekte: [T({ selbstvertrauen: -3, privatglueck: -1 })] } },
      { label: 'Professionell bleiben', erfolg: { text: 'Du konzentrierst dich auf die Reha. Das bringt dir Respekt.', effekte: [T({ professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'vl-kreuzband-rueckkehr', kategorie: 'Gesundheit', gewicht: 1.2, abstand: 300, bedingung: (c) => profi(c) && flag(c, 'comeback') && !flag(c, 'angstduell'),
    titel: 'Die Angst im Zweikampf', text: 'Nach dem Kreuzbandriss kehrst du zurück, aber im Zweikampf zögerst du. Dein Körper erinnert sich an den Moment, als das Knie nachgab. Ein Gegenspieler grätscht, du ziehst den Fuß weg.',
    optionen: [
      { label: 'Mit dem Sportpsychologen arbeiten', kosten: 900, hinweis: 'kostet 900 €', erfolg: { text: 'Du lernst, die Angst anzunehmen und trotzdem hineinzugehen.', effekte: [FLAG('angstduell'), T({ selbstvertrauen: 6, moral: 4, gesundheit: 2 }), S({ defensive: 1 })] } },
      { label: 'Es einfach tun', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['selbstvertrauen', 'moral'] }, erfolg: { text: 'Du gehst in den nächsten Zweikampf wie früher. Das Knie hält, die Angst weicht.', effekte: [FLAG('angstduell'), T({ selbstvertrauen: 5, moral: 3 })] }, misserfolg: { text: 'Du verlierst jeden Zweikampf und fühlst dich wie ein Anfänger.', effekte: [T({ selbstvertrauen: -4, moral: -3 })] } },
    ],
  },
  {
    id: 'vl-schwere', kategorie: 'Gesundheit', gewicht: 1, abstand: 400, bedingung: (c) => profi(c) && !jugend(c) && trait(c, 'fitness') < 45 && zahl(c, 'verletzungsserie') < 3,
    titel: 'Der Körper streikt', text: 'In den letzten Wochen zieht und zwickt es überall. Der Physio sagt: „Du musst auf die Warnsignale hören.“ Dein Kalender sagt etwas anderes: Pokal, Liga, Länderspiel.',
    optionen: [
      { label: 'Eine Woche pausieren', erfolg: { text: 'Du verpasst nichts Wichtiges und kommst frisch zurück.', effekte: [T({ fitness: 9, professionalitaet: 2, trainerBeziehung: -1 })] } },
      { label: 'Durchspielen', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['gesundheit'] }, erfolg: { text: 'Mit Ach und Krach kommst du durch die Woche. Der Körper hat noch einmal gehalten.', effekte: [T({ fitness: -4, trainerBeziehung: 2 })] }, misserfolg: { text: 'Beim zweiten Spiel meldet sich der Muskel mit einem Riss. Das war zu viel.', effekte: [VERL('Muskelfaserriss', 5), { t: 'zaehle', k: 'verletzungsserie', d: 1 }, T({ moral: -4 })] } },
    ],
  },
]

function AKT_SKANDAL() {
  return { t: 'aktion' as const, name: 'skandal' as const }
}
