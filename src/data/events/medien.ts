import { AKT, FLAG, G, NEWS, T, anteil, flag, gehalt, profi, trait } from './helpers'
import type { EreignisDef } from './types'

export const MEDIEN: EreignisDef[] = [
  {
    id: 'm-interview', kategorie: 'Medien', gewicht: 3, abstand: 70, bedingung: (c) => profi(c) && trait(c, 'ruf') > 12,
    titel: 'Interview nach dem Spiel', text: '{reporter} hält dir das Mikro hin: „Wie bewerten Sie die Leistung des Trainers?“ Du hast nur zehn Sekunden zum Überlegen und eine heiße Dusche im Kopf.',
    optionen: [
      { label: 'Diplomatisch antworten', erfolg: { text: 'Du sagst: „Wir arbeiten jeden Tag gemeinsam an uns.“ Langweilig, aber sicher.', effekte: [T({ professionalitaet: 1, trainerBeziehung: 1 })] } },
      { label: 'Offen und ehrlich sein', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['selbstvertrauen', 'professionalitaet'] }, erfolg: { text: 'Du formulierst klug und kritisch. Die Fans feiern deine Ehrlichkeit.', effekte: [T({ fanbeliebtheit: 4, ruf: 2, selbstvertrauen: 2 })] }, misserfolg: { text: 'Deine Worte werden verdreht. Die Schlagzeile: „{name} watscht {trainer} ab“.', effekte: [T({ trainerBeziehung: -5, fanbeliebtheit: -1, ruf: -1 }), NEWS('{name} watscht {trainer} ab')] } },
      { label: 'Einen Scherz machen', wurf: { basis: 0.55, traits: ['selbstvertrauen'] }, erfolg: { text: 'Dein Spruch geht viral. Alle lachen, auch der Trainer.', effekte: [T({ fanbeliebtheit: 3, kabine: 2 })] }, misserfolg: { text: 'Der Scherz kommt falsch an. Es wird als arrogant gedeutet.', effekte: [T({ fanbeliebtheit: -2, trainerBeziehung: -2 })] } },
    ],
  },
  {
    id: 'm-shitstorm', kategorie: 'Medien', gewicht: 2, abstand: 100, bedingung: (c) => profi(c) && c.form < 40 && trait(c, 'ruf') > 15,
    titel: 'Shitstorm nach dem Fehlpass', text: 'Dein Fehlpass führte zum entscheidenden Gegentor. Seit einer Stunde hagelt es Kommentare: „Fußballer? Nur im Pass.“ Dein Handy glüht.',
    optionen: [
      { label: 'Öffentlich entschuldigen', erfolg: { text: 'Dein Post wirkt ehrlich. Viele Fans verzeihen dir und feuern dich an.', effekte: [T({ fanbeliebtheit: 3, professionalitaet: 2, selbstvertrauen: -2 })] } },
      { label: 'Handy aus, nichts lesen', erfolg: { text: 'Du verbringst den Abend mit Pizza und Netflix. Am nächsten Morgen ist alles ein bisschen weniger schlimm.', effekte: [T({ moral: 3, selbstvertrauen: 1 })] } },
      { label: 'Kontern und Kritiker blockieren', hinweis: 'riskant', wurf: { basis: 0.35, traits: ['selbstvertrauen'] }, erfolg: { text: 'Du schlägst witzig zurück und die Stimmung dreht sich zu deinen Gunsten.', effekte: [T({ fanbeliebtheit: 3, selbstvertrauen: 4 })] }, misserfolg: { text: 'Aus einem Kommentar wird ein ausgewachsener Streit. Die Zeitungen greifen das Thema auf.', effekte: [T({ fanbeliebtheit: -4, ruf: -2, trainerBeziehung: -2 }), NEWS('Shitstorm: {name} schlägt wild um sich')] } },
    ],
  },
  {
    id: 'm-sponsor', kategorie: 'Medien', gewicht: 2.5, abstand: 200, bedingung: (c) => profi(c) && trait(c, 'ruf') > 25 && c.flags.sponsor !== true,
    titel: 'Ausrüster-Angebot', text: 'Ein Sportartikelhersteller will dich als Gesicht seiner neuen Schuhkollektion. Das Angebot: hohe Prämien, aber auch Shootings und ein Exklusivvertrag.',
    optionen: [
      { label: 'Unterschreiben', erfolg: { text: 'Du wirst Werbegesicht. Die Plakate hängen in jeder Fußgängerzone, und dein Konto freut sich.', effekte: [AKT('sponsor-neu'), G(anteil(0.35, 5000)), T({ ruf: 3, fanbeliebtheit: 3, privatglueck: -1 })] } },
      { label: 'Mehr Geld verlangen', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['ruf'] }, erfolg: { text: 'Die Marke gibt nach. Dein Berater darf sich auf die Schulter klopfen.', effekte: [AKT('sponsor-neu'), G(anteil(0.55, 8000)), T({ ruf: 3 })] }, misserfolg: { text: 'Die Marke zieht sich zurück. Sie nimmt stattdessen jemand anderen.', effekte: [T({ moral: -1 })] } },
      { label: 'Ablehnen', erfolg: { text: 'Du willst dich nicht verkaufen. Der Berater ist fassungslos.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'm-geruecht', kategorie: 'Medien', gewicht: 2.5, abstand: 80, bedingung: (c) => profi(c) && trait(c, 'ruf') > 20,
    titel: 'Transfergerücht', text: '{reporter} schreibt: „Real Madrid beobachtet {name}!“ Von deinem Berater hast du davon nichts gehört. Mitspieler grinsen und fragen, ob du schon Spanisch lernst.',
    optionen: [
      { label: 'Dementieren', erfolg: { text: 'Du sagst: „Ich fühle mich hier wohl.“ Fans und Verein sind erleichtert.', effekte: [T({ fanbeliebtheit: 3, trainerBeziehung: 2 })] } },
      { label: 'Nichts sagen, Rätsel lassen', erfolg: { text: 'Du schweigst vielsagend. Das Gerücht lebt, die Preise steigen.', effekte: [T({ ruf: 2, selbstvertrauen: 2, trainerBeziehung: -1 })] } },
      { label: 'Als Chance nutzen und Berater anrufen', erfolg: { text: 'Dein Berater hört sich um. Ein paar Klubs interessieren sich tatsächlich.', effekte: [AKT('wechselwunsch'), T({ ehrgeiz: 2 })] } },
    ],
  },
  {
    id: 'm-dokumentation', kategorie: 'Medien', gewicht: 1, abstand: 600, bedingung: (c) => profi(c) && trait(c, 'ruf') > 55 && !flag(c, 'doku'),
    titel: 'Dokumentation über dein Leben', text: 'Ein Streamingdienst will eine Dokumentation über dich drehen: „Der Weg des {name}“. Kameras in der Kabine, im Auto, im Schlafzimmer.',
    optionen: [
      { label: 'Zustimmen', wurf: { basis: 0.7, traits: ['professionalitaet'] }, erfolg: { text: 'Die Serie wird ein Hit. Du wirst zum Medienstar.', effekte: [FLAG('doku'), T({ ruf: 6, fanbeliebtheit: 6 }), G(anteil(0.5, 10000))] }, misserfolg: { text: 'Die Kameras fangen peinliche Momente ein. Die Serie wird zum Skandal.', effekte: [FLAG('doku'), T({ ruf: 2, fanbeliebtheit: -3, kabine: -3 }), G(anteil(0.3, 5000))] } },
      { label: 'Absagen', erfolg: { text: 'Du willst keine Kameras im Privatleben. Der Streamingdienst nimmt dann jemand anderen.', effekte: [T({ privatglueck: 2 })] } },
    ],
  },
  {
    id: 'm-fan-kind', kategorie: 'Medien', gewicht: 2, abstand: 150, bedingung: (c) => profi(c) && trait(c, 'fanbeliebtheit') > 20,
    titel: 'Ein kleiner Fan', text: 'Vor dem Stadion wartet ein kleiner Junge im Trikot mit deinem Namen. Er ist schwer krank und hat nur einen Wunsch, dich einmal zu treffen.',
    optionen: [
      { label: 'Mit ihm trainieren und Zeit nehmen', erfolg: { text: 'Ihr kickt eine Stunde im Hof. Er strahlt, und du ebenfalls. Die Presse erfährt davon und schreibt Herzzerreißendes.', effekte: [T({ fanbeliebtheit: 5, privatglueck: 4, moral: 5, ruf: 1 })] } },
      { label: 'Trikot signieren und weiter', erfolg: { text: 'Du gibst ihm ein signiertes Trikot. Das ist schön, aber etwas knapp.', effekte: [T({ fanbeliebtheit: 2 })] } },
    ],
  },
  {
    id: 'm-talkshow', kategorie: 'Medien', gewicht: 1.5, abstand: 300, bedingung: (c) => profi(c) && trait(c, 'ruf') > 40,
    titel: 'Einladung in die Talkshow', text: 'Die große Samstagabendshow lädt dich ein. Thema: „Fußball und Moral“. Der Moderator ist bekannt für spitze Fragen.',
    optionen: [
      { label: 'Zusagen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['selbstvertrauen', 'professionalitaet'] }, erfolg: { text: 'Du glänzt mit Charme und Witz. Dein Auftritt wird zitiert und gefeiert.', effekte: [T({ ruf: 4, fanbeliebtheit: 5 })] }, misserfolg: { text: 'Der Moderator bringt dich ins Schwitzen. Du stotterst und wirkst unvorbereitet.', effekte: [T({ ruf: -1, fanbeliebtheit: -2, selbstvertrauen: -3 })] } },
      { label: 'Absagen', erfolg: { text: 'Du bleibst lieber bei Interviews, die du kontrollierst.', effekte: [] } },
    ],
  },
  {
    id: 'm-ultras', kategorie: 'Medien', gewicht: 1.5, abstand: 200, bedingung: (c) => profi(c) && c.form < 45 && trait(c, 'fanbeliebtheit') < 30,
    titel: 'Ultras fordern ein Gespräch', text: 'Nach dem schwachen Spiel stehen 50 Ultras vor dem Mannschaftsbus. Sie wollen mit den Spielern reden, und einer ruft dein Name aus der Menge.',
    optionen: [
      { label: 'Aussteigen und reden', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['selbstvertrauen', 'kabine'] }, erfolg: { text: 'Du entschuldigst dich und erklärst, wie hart ihr arbeitet. Die Ultras klatschen verhalten.', effekte: [T({ fanbeliebtheit: 6, ruf: 1, moral: 3 })] }, misserfolg: { text: 'Das Gespräch eskaliert, Sprechchöre gegen dich. Der Busfahrer startet den Motor.', effekte: [T({ fanbeliebtheit: -4, moral: -4 })] } },
      { label: 'Im Bus bleiben', erfolg: { text: 'Du ziehst den Vorhang zu. Die Fans werden nicht vergessen, dass du nicht gekommen bist.', effekte: [T({ fanbeliebtheit: -3 })] } },
    ],
  },
  {
    id: 'm-charity', kategorie: 'Medien', gewicht: 1.5, abstand: 250, bedingung: (c) => profi(c) && trait(c, 'ruf') > 30,
    titel: 'Wohltätigkeitsspiel', text: 'Ein Kinderhospiz veranstaltet ein Benefizspiel mit Ex-Profis und Promis. Dein Berater sagt, das sei gute PR. Dein Körper sagt, du bist müde.',
    optionen: [
      { label: 'Mitspielen', erfolg: { text: 'Du spielst gegen Altstars, lachst viel und sammelst Spenden. Die Menschen lieben es.', effekte: [T({ fanbeliebtheit: 5, ruf: 2, moral: 4, fitness: -3 })] } },
      { label: 'Spenden statt spielen', kosten: anteil(0.02, 200), hinweis: 'kostet Geld', erfolg: { text: 'Du überweist eine großzügige Summe. Das kommt gut an, wenn auch weniger als ein persönlicher Auftritt.', effekte: [T({ fanbeliebtheit: 2, ruf: 1 })] } },
    ],
  },
  {
    id: 'm-fotoshooting', kategorie: 'Medien', gewicht: 1.5, abstand: 250, bedingung: (c) => profi(c) && trait(c, 'ruf') > 35 && gehalt(c) > 50_000,
    titel: 'Fotoshooting für ein Männermagazin', text: 'Ein Hochglanz-Magazin will dich fotografieren, mit Anzug, Mode und Make-up. Der Fotograf verspricht „sensible Bilder“.',
    optionen: [
      { label: 'Zusagen', erfolg: { text: 'Die Bilder sind stylisch, du siehst aus wie ein Model. Die Fans sind begeistert, deine Mitspieler necken dich.', effekte: [T({ fanbeliebtheit: 3, ruf: 2, kabine: -1 }), G(anteil(0.04, 600))] } },
      { label: 'Absagen', erfolg: { text: 'Du bleibst auf dem Platz, nicht auf dem Cover.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'm-gegner-spruch', kategorie: 'Medien', gewicht: 1.5, abstand: 100, bedingung: (c) => profi(c) && trait(c, 'ruf') > 25,
    titel: 'Spruch vom Gegner', text: 'Vor dem Derby sagt ein Gegenspieler in der Zeitung: „{name}? Der ist überschätzt. Den nehmen wir aus dem Spiel.“',
    optionen: [
      { label: 'Souverän ignorieren', erfolg: { text: 'Du lächelst und sagst: „Wir sehen uns auf dem Platz.“ Das Netz liebt es.', effekte: [T({ fanbeliebtheit: 2, professionalitaet: 2 })] } },
      { label: 'Zurückschießen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['selbstvertrauen'] }, erfolg: { text: 'Dein Spruch sitzt. Der Gegner verstummt und du bist mental im Tunnel.', effekte: [T({ selbstvertrauen: 5, fanbeliebtheit: 3 })] }, misserfolg: { text: 'Dein Spruch geht nach hinten los. Der Gegner lacht dich im Spiel aus.', effekte: [T({ selbstvertrauen: -3, fanbeliebtheit: -2 })] } },
    ],
  },
  {
    id: 'm-wahl-spieler', kategorie: 'Medien', gewicht: 1.5, abstand: 200, bedingung: (c) => profi(c) && c.saisonStats.spiele >= 12 && c.saisonStats.notenSumme / Math.max(1, c.saisonStats.spiele) > 6.8,
    titel: 'Spieler des Monats', text: 'Die Fans haben abgestimmt, und du hast mit 62 Prozent gewonnen. Beim Fotoshooting darfst du den Pokal in die Höhe halten.',
    optionen: [
      { label: 'Stolz präsentieren', erfolg: { text: 'Der Pokal steht fortan in deinem Wohnzimmer. Fans und Presse sind begeistert.', effekte: [T({ fanbeliebtheit: 4, ruf: 3, selbstvertrauen: 4 }), AKT('auszeichnung')] } },
      { label: 'Der Mannschaft widmen', erfolg: { text: 'Du sagst, ohne die Mannschaft wäre das nie möglich gewesen. Die Kabine liebt dich.', effekte: [T({ kabine: 4, fanbeliebtheit: 3, ruf: 2 })] } },
    ],
  },
  {
    id: 'm-follower', kategorie: 'Medien', gewicht: 1.5, abstand: 300, bedingung: (c) => flag(c, 'insta') && trait(c, 'fanbeliebtheit') > 35,
    titel: 'Eine Million Follower', text: 'Dein Social-Media-Kanal knackt die Millionengrenze. Die Agentur plant bereits eine eigene Merchandising-Linie: „{name}-Edition“.',
    optionen: [
      { label: 'Merchandising starten', wurf: { basis: 0.65 }, erfolg: { text: 'Die Hoodies sind ausverkauft. Dein Konto freut sich, die Fans auch.', effekte: [G(anteil(0.2, 3000)), T({ fanbeliebtheit: 3, ruf: 1 })] }, misserfolg: { text: 'Niemand will deine Hoodies. Lager voll, Kasse leer.', effekte: [G(-1500), T({ fanbeliebtheit: -1 })] } },
      { label: 'Lieber Fan-Nähe pflegen', erfolg: { text: 'Du machst Live-Videos und beantwortest Fragen. Die Fans lieben es.', effekte: [T({ fanbeliebtheit: 4 })] } },
    ],
  },
  {
    id: 'm-boulevard', kategorie: 'Medien', gewicht: 1.5, abstand: 200, bedingung: (c) => profi(c) && trait(c, 'ruf') > 30 && c.personen.partner !== null,
    titel: 'Der Boulevard schnüffelt', text: '{reporter} schreibt: „Neues Liebesglück bei {name}? Wer ist die Person an seiner Seite?“ Fotos vom Einkaufen, Kaffee und einem Kuss.',
    optionen: [
      { label: 'Offen dazu stehen', erfolg: { text: 'Du postest ein Foto und schreibst: „Ja, wir sind glücklich.“ Die Fans freuen sich.', effekte: [T({ fanbeliebtheit: 3, privatglueck: 3 })] } },
      { label: 'Kein Kommentar', erfolg: { text: 'Du schweigst. Die Gerüchte blühen, doch du bleibst entspannt.', effekte: [T({ professionalitaet: 1 })] } },
      { label: 'Anwalt einschalten', kosten: 600, hinweis: 'kostet 600 €', erfolg: { text: 'Die Zeitung muss sich entschuldigen. Es bleibt trotzdem ein Nachgeschmack.', effekte: [T({ privatglueck: 2, ruf: 1 })] } },
    ],
  },
]

