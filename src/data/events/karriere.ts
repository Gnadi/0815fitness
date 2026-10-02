import { AKT, FLAG, NEWS, T, alterVon, flag, ov, profi, staerkeVerein, trait } from './helpers'
import { LAENDER } from '../clubs'
import type { EreignisDef } from './types'

export const KARRIERE: EreignisDef[] = [
  {
    id: 'ka-vertragsende', kategorie: 'Karriere', gewicht: 0, pflicht: true, abstand: 100,
    bedingung: (c) => profi(c) && c.vertrag !== null && c.vertrag.endeSaison === c.uhr.saison && c.saison.kalender[c.uhr.woche - 1]?.t === 'L' && (c.saison.kalender[c.uhr.woche - 1] as { n: number }).n >= Math.floor(c.saison.spielplan.length * 0.55) && !c.leihe && c.fenster === null,
    titel: 'Dein Vertrag läuft aus', text: 'Dein Vertrag bei {verein} endet am Saisonende. {berater} drängt: „Wir sollten verlängern oder den Markt sondieren.“ Der Sportdirektor will in den nächsten Wochen mit dir reden.',
    optionen: [
      { label: 'Gesprächsbereitschaft signalisieren', erfolg: { text: 'Der Verein legt dir ein Angebot vor. Du findest es in deinem Vertrags-Menü.', effekte: [AKT('verlaengerung-anbieten')] } },
      { label: 'Nicht verlängern, Optionen prüfen', erfolg: { text: 'Du lässt den Vertrag auslaufen und hoffst auf bessere Angebote im Sommer.', effekte: [T({ ehrgeiz: 2, trainerBeziehung: -2 })] } },
    ],
  },
  {
    id: 'ka-nationalmannschaft', kategorie: 'Karriere', gewicht: 3, abstand: 80, bedingung: (c) => profi(c) && alterVon(c) >= 18 && !flag(c, 'nationalspieler') && ov(c) >= LAENDER[c.spieler.nationalitaet].national - 14 && trait(c, 'ruf') > 20,
    titel: 'Erste Nominierung für die Nationalmannschaft', text: 'Der Bundestrainer ruft an: „{name}, ich nominiere dich für die kommenden Länderspiele.“ Du brauchst einen Moment, bis du den Satz verstanden hast.',
    optionen: [
      { label: 'Zusagen, natürlich!', erfolg: { text: 'Beim ersten Länderspiel stehst du bei der Hymne mit Gänsehaut da. Dein Name steht auf dem Trikot der Nation.', effekte: [AKT('nationalspieler'), AKT('laenderspiel'), T({ ruf: 8, fanbeliebtheit: 5, selbstvertrauen: 6, moral: 6 }), NEWS('{name} feiert Länderspiel-Debüt')] } },
      { label: 'Wegen Müdigkeit absagen', erfolg: { text: 'Der Verband ist enttäuscht. So eine Chance kommt vielleicht nie wieder.', effekte: [T({ ruf: -1, fitness: 3 })] } },
    ],
  },
  {
    id: 'ka-laenderspiel', kategorie: 'Karriere', gewicht: 4, abstand: 25, bedingung: (c) => profi(c) && flag(c, 'nationalspieler') && !c.verletzung,
    titel: 'Länderspielpause', text: 'Nach dem Spieltag nimmst du den Flieger zur Nationalmannschaft. Der Verein hat nur wenig Verständnis, falls du verletzt zurückkommst.',
    optionen: [
      { label: 'Anreisen und spielen', hinweis: 'Verletzungsrisiko', wurf: { basis: 0.9, traits: ['gesundheit'] }, erfolg: { text: 'Du bekommst Einsatzzeit und ein starkes Spiel. Die Nation freut sich über dich.', effekte: [AKT('laenderspiel'), T({ ruf: 2, fanbeliebtheit: 1, fitness: -4 })] }, misserfolg: { text: 'Ein Tritt gegen den Knöchel. Du reist mit dem Eisbeutel zurück zum Verein.', effekte: [AKT('laenderspiel'), { t: 'verletzung', name: 'Bänderdehnung im Sprunggelenk', wochen: 4 }, T({ trainerBeziehung: -2 })] } },
      { label: 'Wegen Erschöpfung absagen', erfolg: { text: 'Du schonst deinen Körper. Der Verband ist nicht begeistert, der Verein schon.', effekte: [T({ fitness: 4, ruf: -1, trainerBeziehung: 1 })] } },
    ],
  },
  {
    id: 'ka-grossclub', kategorie: 'Karriere', gewicht: 2, abstand: 120, bedingung: (c) => profi(c) && trait(c, 'ruf') > 45 && staerkeVerein(c) < 75,
    titel: 'Ein Großklub klopft an', text: 'Dein Berater ruft an: „Ein Spitzenverein will dich. Noch inoffiziell, aber ernst.“ Dein Herz springt, dein Vertrag hält.',
    optionen: [
      { label: 'Sofort Wechselwunsch äußern', erfolg: { text: 'Dein Wunsch wird bekannt. Verein und Fans reagieren verstimmt, die Gespräche beginnen.', effekte: [AKT('wechselwunsch'), T({ fanbeliebtheit: -4, trainerBeziehung: -4, ruf: 1 })] } },
      { label: 'Ruhe bewahren und liefern', erfolg: { text: 'Du konzentrierst dich auf gute Leistungen. Wenn das Angebot echt ist, kommt es von allein.', effekte: [T({ professionalitaet: 3, ehrgeiz: 2 })] } },
      { label: 'Dem Trainer die Wahrheit sagen', erfolg: { text: '{trainer} schätzt deine Offenheit, auch wenn es ihm nicht gefällt.', effekte: [T({ trainerBeziehung: 2 })] } },
    ],
  },
  {
    id: 'ka-gehaltserhoehung', kategorie: 'Karriere', gewicht: 2, abstand: 130, bedingung: (c) => profi(c) && c.vertrag !== null && c.vertrag.endeSaison > c.uhr.saison && c.form > 55,
    titel: 'Mehr Geld?', text: 'Du spielst stark, dein Gehalt ist es nicht. Dein Berater sagt: „Wir haben ein gutes Argument. Frag nach einer Erhöhung.“',
    optionen: [
      { label: 'Um Gehaltserhöhung bitten', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['ruf', 'trainerBeziehung'] }, erfolg: { text: 'Der Verein stimmt zu. Dein Gehalt steigt um 20 Prozent.', effekte: [AKT('gehaltserhoehung'), T({ moral: 4, selbstvertrauen: 3 })] }, misserfolg: { text: 'Der Sportdirektor blockt ab: „Wir sind nicht die Bank.“ Das Verhältnis wird kühler.', effekte: [T({ trainerBeziehung: -3, moral: -3 })] } },
      { label: 'Abwarten', erfolg: { text: 'Du lässt es laufen und konzentrierst dich auf den Platz.', effekte: [] } },
    ],
  },
  {
    id: 'ka-leihe-bank', kategorie: 'Karriere', gewicht: 2, abstand: 100, bedingung: (c) => profi(c) && c.spielpraxis < 0.25 && alterVon(c) <= 24 && c.saisonStats.spiele >= 3 && !c.leihe,
    titel: 'Spielpraxis fehlt', text: 'Dein Berater schlägt vor: „Zwei Jahre auf der Bank bringen dich nirgendwo hin. Lass dich ausleihen, spiele und komm stärker zurück.“ Im Vertrags-Menü kannst du Leihangebote anfragen, sobald das Transferfenster öffnet.',
    optionen: [
      { label: 'Gute Idee, Leihe suchen', erfolg: { text: 'Du suchst aktiv nach einem Klub, bei dem du spielen kannst. Im nächsten Fenster fragst du Angebote an.', effekte: [FLAG('leiheWunsch'), T({ ehrgeiz: 2, moral: 2 })] } },
      { label: 'Beim Verein durchbeißen', erfolg: { text: 'Du bleibst, trainierst und wartest auf deine Chance.', effekte: [T({ professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'ka-berater-wechsel', kategorie: 'Karriere', gewicht: 1.5, abstand: 300, bedingung: (c) => profi(c) && trait(c, 'ruf') > 25,
    titel: 'Ein Superberater klopft an', text: 'Ein bekannter Spielervermittler lädt dich zum Essen ein: „Ich hole dich zu einem Topklub. Mein Netzwerk ist riesig.“ Dein jetziger Berater ist ein guter Kerl, aber eher klein.',
    optionen: [
      { label: 'Wechseln', erfolg: { text: 'Dein neuer Berater schwört dir die Welt. Deine Verträge werden besser, der Ton rauer.', effekte: [AKT('berater-wechsel'), AKT('berater-upgrade'), T({ ehrgeiz: 2, privatglueck: -1 })] } },
      { label: 'Loyal bleiben', erfolg: { text: 'Dein Berater ist gerührt. Er arbeitet künftig noch härter für dich.', effekte: [AKT('berater-upgrade'), T({ privatglueck: 2 })] } },
    ],
  },
  {
    id: 'ka-trainerlehrgang', kategorie: 'Karriere', gewicht: 1, abstand: 500, bedingung: (c) => profi(c) && alterVon(c) >= 28 && !flag(c, 'trainerlizenz'),
    titel: 'Trainerlizenz', text: 'Die Verbandsakademie bietet einen Trainerlehrgang an. Die Karriere endet irgendwann und danach muss es weitergehen. Du kannst mit 30 loslegen oder mit 40 bereuen.',
    optionen: [
      { label: 'Lehrgang beginnen', kosten: 2000, hinweis: 'kostet 2.000 €', erfolg: { text: 'Du paukst Taktik und Psychologie. Dein Blick auf das Spiel verändert sich.', effekte: [FLAG('trainerlizenz'), T({ professionalitaet: 4, ehrgeiz: -1, fitness: -2 })] } },
      { label: 'Später', erfolg: { text: 'Das Thema schiebst du vor dir her.', effekte: [] } },
    ],
  },
  {
    id: 'ka-konkurrent-weg', kategorie: 'Karriere', gewicht: 1.5, abstand: 200, bedingung: (c) => profi(c) && c.vertrag?.rolle !== 'Stammspieler' && ov(c) > staerkeVerein(c) - 6,
    titel: 'Konkurrent verletzt', text: 'Der Stammspieler auf deiner Position hat sich das Kreuzband gerissen. Der Trainer sieht dich nach dem Training an: „Deine Chance, {name}.“',
    optionen: [
      { label: 'Die Chance nutzen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['selbstvertrauen', 'professionalitaet'] }, erfolg: { text: 'Du füllst die Lücke exzellent aus. Der Trainer will dich nicht mehr hergeben.', effekte: [T({ trainerBeziehung: 5, selbstvertrauen: 5, ruf: 2 }), { t: 'flag', k: 'chanceGenutzt', v: true }] }, misserfolg: { text: 'Du wirkst nervös und fehlerhaft. Die Chance rinnt dir durch die Finger.', effekte: [T({ selbstvertrauen: -4, trainerBeziehung: -2 })] } },
      { label: 'Bescheiden bleiben', erfolg: { text: 'Du sagst dem Trainer, dass du für die Mannschaft bereitstehst.', effekte: [T({ trainerBeziehung: 2 })] } },
    ],
  },
  {
    id: 'ka-fuehrungsspieler', kategorie: 'Karriere', gewicht: 1, abstand: 400, bedingung: (c) => profi(c) && alterVon(c) >= 30 && c.laufbahn.laenderspiele >= 30,
    titel: 'Abschied von der Nationalmannschaft?', text: 'Der Verband bittet dich zu überlegen, ob du den Rückzug aus der Nationalmannschaft planst. „Wir müssen den Generationenwechsel einleiten.“',
    optionen: [
      { label: 'Weitermachen, solange du fit bist', erfolg: { text: 'Du sagst, dass du noch Lust hast. Der Verband nickt, ohne Begeisterung.', effekte: [T({ ehrgeiz: 2, ruf: 1 })] } },
      { label: 'Zurücktreten', erfolg: { text: 'Du gibst den Rücktritt bekannt. Die Fans applaudieren und die Verbandsspitze klatscht Beifall.', effekte: [T({ fanbeliebtheit: 3, fitness: 3 }), { t: 'flag', k: 'nationalspieler', v: false }] } },
    ],
  },
  {
    id: 'ka-umzug-ausland', kategorie: 'Karriere', gewicht: 1, abstand: 300, bedingung: (c) => profi(c) && trait(c, 'ruf') > 30,
    titel: 'Sprachkurs', text: 'Wenn du irgendwann ins Ausland willst, solltest du die Sprache können. Dein Berater hat einen Sprachlehrer für dich organisiert.',
    optionen: [
      { label: 'Teilnehmen', kosten: 400, hinweis: 'kostet 400 €', erfolg: { text: 'Nach ein paar Wochen kannst du Kaffee bestellen und die Pressekonferenz überleben.', effekte: [T({ professionalitaet: 2, ruf: 1 })] } },
      { label: 'Wird schon', erfolg: { text: 'Die Beine reden für sich. Hoffentlich.', effekte: [] } },
    ],
  },
]

