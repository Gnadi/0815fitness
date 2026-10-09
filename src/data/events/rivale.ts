import { AKT, FELDSPIELER, FLAG, FOLGE, G, NEWS, S, T, flag, jugend, ov, profi, zahl } from './helpers'
import type { EreignisDef } from './types'

const stufe = (c: Parameters<typeof zahl>[0]): number => zahl(c, 'rivalitaet')
const aktiv = (c: Parameters<typeof zahl>[0]): boolean => profi(c) && !jugend(c)

/** Paket 8: Die Rivalen-Storyline (Konkurrent {rivale}): Duell, Eskalation, Showdown, Ausgang. */
export const RIVALE: EreignisDef[] = [
  {
    id: 'rv-start', kategorie: 'Kabine', gewicht: 2, abstand: 400, bedingung: (c) => aktiv(c) && stufe(c) === 0 && c.vertrag?.rolle !== 'Jugend' && ov(c) > 45,
    titel: '{rivale} sucht das Duell', text: 'Im Trainingsspiel grätscht {rivale} dich zum dritten Mal in Folge um und grinst dabei. „Nur Training“, sagt er. Seine Augen sagen etwas anderes. Du hast das Gefühl, dass es nicht bei einem Duell bleibt.',
    optionen: [
      { label: 'Aufstehen und Gas geben', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['selbstvertrauen', 'fitness'] }, erfolg: { text: 'Du gewinnst die nächsten Zweikämpfe. {rivale} sagt nichts, aber sein Blick wird härter.', effekte: [FLAG('rivalitaet', 1), T({ selbstvertrauen: 4, kabine: 1 }), FOLGE('rv-eskalation', 30, 0.9)] }, misserfolg: { text: '{rivale} gewinnt die Duelle klar, und die Kollegen lachen. Es nagt an dir.', effekte: [FLAG('rivalitaet', 1), T({ selbstvertrauen: -3, kabine: -1 }), FOLGE('rv-eskalation', 30, 0.9)] } },
      { label: 'Ruhig bleiben und Abstand halten', erfolg: { text: 'Du gehst nicht auf die Provokation ein. {rivale} wirkt für einen Moment ratlos.', effekte: [FLAG('rivalitaet', 1), T({ professionalitaet: 2 }), FOLGE('rv-eskalation', 40, 0.7)] } },
      { label: 'Das Gespräch suchen', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['kabine', 'professionalitaet'] }, erfolg: { text: 'Ihr sprecht euch aus. {rivale} gibt zu, dass er Angst um seinen Platz hat.', effekte: [FLAG('rivalitaet', 3), T({ kabine: 4, professionalitaet: 2 })] }, misserfolg: { text: '{rivale} lacht dich aus: „Du hast Angst vor mir.“ Das Gespräch geht schief.', effekte: [FLAG('rivalitaet', 1), T({ kabine: -2, selbstvertrauen: -2 }), FOLGE('rv-eskalation', 30, 0.9)] } },
    ],
  },
  {
    id: 'rv-eskalation', kategorie: 'Kabine', gewicht: 0, abstand: 100, bedingung: (c) => aktiv(c) && stufe(c) === 1,
    titel: 'Die Fehde wird öffentlich', text: '{rivale} gibt der Presse ein Interview: „Manche Spieler wollen die Nummer eins sein, aber sie haben die Qualität nicht.“ Alle wissen, wen er meint. Auf dem Trainingsplatz knistert es.',
    optionen: [
      { label: 'Öffentlich zurückschießen', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['selbstvertrauen', 'ruf'] }, erfolg: { text: 'Dein Konter sitzt: witzig und scharf. Die Fans lachen auf deiner Seite.', effekte: [FLAG('rivalitaet', 2), T({ fanbeliebtheit: 4, selbstvertrauen: 3, trainerBeziehung: -1 }), FOLGE('rv-showdown', 40, 0.9)] }, misserfolg: { text: 'Deine Antwort wirkt verbittert. Die Zeitung titelt: „Streit in der Kabine“.', effekte: [FLAG('rivalitaet', 2), T({ fanbeliebtheit: -2, trainerBeziehung: -3, kabine: -3 }), NEWS('Kabinenstreit: {name} gegen {rivale}'), FOLGE('rv-showdown', 40, 0.9)] } },
      { label: 'Auf dem Platz antworten', erfolg: { text: 'Du sagst nichts, aber im nächsten Spiel zeigst du ihm, wer hier spielt.', effekte: [FLAG('rivalitaet', 2), T({ ehrgeiz: 3, professionalitaet: 2, fitness: -2 }), FOLGE('rv-showdown', 40, 0.9)] } },
      { label: 'Den Trainer einschalten', erfolg: { text: '{trainer} bestellt euch beide ins Büro und diktiert eine Waffenruhe. Sie hält ungefähr eine Woche.', effekte: [FLAG('rivalitaet', 2), T({ trainerBeziehung: 2, kabine: 1 }), FOLGE('rv-showdown', 50, 0.8)] } },
    ],
  },
  {
    id: 'rv-showdown', kategorie: 'Kabine', gewicht: 0, abstand: 100, bedingung: (c) => aktiv(c) && stufe(c) === 2,
    titel: 'Showdown mit {rivale}', text: 'Nach einem harten Foul im Training eskaliert es: {rivale} schubst dich, du schubst zurück, die Kollegen gehen dazwischen. {trainer} brüllt und schickt euch zur Kabine. Gleich kommt der Sportdirektor.',
    optionen: [
      { label: 'Entschuldigen und Frieden anbieten', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['professionalitaet', 'kabine'] }, erfolg: { text: 'Du reichst {rivale} die Hand. Nach kurzem Zögern schlägt er ein. Aus Feinden werden Verbündete.', effekte: [FLAG('rivalitaet', 3), FLAG('rivaleFreund'), T({ kabine: 6, professionalitaet: 3, moral: 4 })] }, misserfolg: { text: '{rivale} schlägt deine Hand weg: „Zu spät.“ Es bleibt feindselig.', effekte: [FLAG('rivalitaet', 3), T({ kabine: -3, moral: -3 })] } },
      { label: 'Nicht nachgeben', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['selbstvertrauen'] }, erfolg: { text: 'Du hältst dagegen. {rivale} ist erstaunt, weil du dich nicht einschüchtern lässt, und lenkt am Ende ein.', effekte: [FLAG('rivalitaet', 3), T({ selbstvertrauen: 5, kabine: 2 })] }, misserfolg: { text: 'Beide bekommen Strafen: Geldstrafe, Training mit der U23, ein Rüffel vom Präsidenten.', effekte: [FLAG('rivalitaet', 3), G(-1000), T({ trainerBeziehung: -5, kabine: -4 }), AKT('skandal')] } },
      { label: 'Nach einem Wechsel fragen', erfolg: { text: 'Du hast genug von dem Theater. Dein Berater hört sich um.', effekte: [FLAG('rivalitaet', 3), AKT('wechselwunsch'), T({ moral: -2, kabine: -2 })] } },
    ],
  },
  {
    id: 'rv-spaeter', kategorie: 'Kabine', gewicht: 2, abstand: 500, bedingung: (c) => aktiv(c) && stufe(c) >= 3 && !flag(c, 'rivaleEpilog'),
    titel: 'Was wurde aus {rivale}?', text: (c) => flag(c, 'rivaleFreund')
      ? 'Du triffst {rivale} beim Mannschaftsabend. Er prostet dir zu: „Ohne den Streit damals hätten wir uns nie so gut verstanden.“ Ihr lacht beide.'
      : 'Du siehst {rivale} im Flur. Er nickt dir kühl zu, ihr redet kaum noch. Vielleicht wird es nie wieder wie früher.',
    optionen: [
      { label: 'Auf ihn zugehen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['kabine', 'professionalitaet'] }, erfolg: { text: 'Ihr trinkt gemeinsam einen Kaffee und redet über früher. Das Eis ist gebrochen.', effekte: [FLAG('rivaleEpilog'), FLAG('rivaleFreund'), T({ kabine: 4, moral: 4 })] }, misserfolg: { text: 'Er murmelt etwas und geht weiter. Vielleicht später.', effekte: [FLAG('rivaleEpilog'), T({ moral: -1 })] } },
      { label: 'Es gut sein lassen', erfolg: { text: 'Du lässt die Vergangenheit ruhen. Jeder macht seine Arbeit.', effekte: [FLAG('rivaleEpilog'), T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'rv-gleicher-verein', kategorie: 'Kabine', gewicht: 1, abstand: 600, bedingung: (c) => aktiv(c) && stufe(c) >= 3 && !flag(c, 'rivaleFreund') && c.laufbahn.transfers.length >= 1,
    titel: 'Der Ex-Rivale als neuer Mitspieler', text: 'Dein alter Kontrahent {rivale} wechselt zu deinem Verein, die Presse schreibt vom „Duell der Erzfeinde“. Der Präsident verspricht „Harmonie“, der Trainer murmelt „Hoffentlich“.',
    optionen: [
      { label: 'Einen Neuanfang vorschlagen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['professionalitaet', 'kabine'] }, erfolg: { text: 'Ihr einigt euch auf Waffenstillstand. Auf dem Platz funktioniert ihr überraschend gut zusammen.', effekte: [T({ kabine: 5, trainerBeziehung: 3, moral: 3 })] }, misserfolg: { text: 'Die Fehde lodert sofort wieder auf. {trainer} verliert die Geduld.', effekte: [T({ kabine: -4, trainerBeziehung: -3 })] } },
      { label: 'Ignorieren', erfolg: { text: 'Ihr geht euch aus dem Weg. Das klappt erstaunlich lange.', effekte: [T({ professionalitaet: 1, kabine: -1 })] } },
    ],
  },
  {
    id: 'rv-training-wette', kategorie: 'Kabine', positionen: FELDSPIELER, gewicht: 1.2, abstand: 200, bedingung: (c) => aktiv(c) && stufe(c) >= 1 && stufe(c) < 3,
    titel: 'Die Wette im Training', text: '{rivale} schlägt vor: „Wer von uns beiden bei der Freistoßübung öfter trifft, bekommt von dem anderen ein Essen.“ Die Kollegen bilden einen Kreis und fangen an zu johlen.',
    optionen: [
      { label: 'Annehmen', hinweis: 'riskant', wurf: { basis: 0.5, skills: ['schuss'], traits: ['selbstvertrauen'] }, erfolg: { text: 'Du triffst vier von fünf und lässt dir von {rivale} ein Menü spendieren. Die Kabine jubelt.', effekte: [T({ selbstvertrauen: 4, kabine: 3 }), S({ schuss: 1 })] }, misserfolg: { text: 'Du verziehst dreimal. {rivale} grinst, du zahlst die Rechnung.', effekte: [G(-250), T({ selbstvertrauen: -2, kabine: 1 })] } },
      { label: 'Ablehnen', erfolg: { text: 'Du hast keine Lust auf Spielchen. {rivale} zuckt mit den Schultern.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'rv-verletzung', kategorie: 'Kabine', gewicht: 1, abstand: 400, bedingung: (c) => aktiv(c) && stufe(c) >= 1 && stufe(c) < 3,
    titel: 'Foul an {rivale}', text: 'Im Training kommst du etwas zu spät und triffst {rivale} am Knöchel. Er schreit auf und liegt am Boden. Alle starren dich an. War das Absicht? Du weißt es selbst nicht genau.',
    optionen: [
      { label: 'Sofort helfen und entschuldigen', erfolg: { text: 'Du kümmerst dich um ihn, rufst den Physio und bleibst bei ihm. {rivale} nickt schwach: „Danke.“', effekte: [FLAG('rivalitaet', 3), FLAG('rivaleFreund'), T({ kabine: 5, professionalitaet: 3, moral: 2 })] } },
      { label: 'Weiter trainieren', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['kabine'] }, erfolg: { text: '{rivale} wird von den Kollegen weggebracht. Du schaust weg, aber niemand sagt etwas.', effekte: [T({ moral: -2, kabine: -1 })] }, misserfolg: { text: 'Die Kabine wirft dir Gefühlskälte vor. Der Trainer schaut dich lange an.', effekte: [T({ kabine: -5, trainerBeziehung: -3, moral: -3 })] } },
    ],
  },
]

