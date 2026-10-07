import { AKT, FLAG, G, LEBEN, NEWS, S, T, alterVon, anteil, flag, hatPartner, imPausenjahr, ov, trait, zahl } from './helpers'
import type { EreignisDef } from './types'

const pause = imPausenjahr
const zeit = (c: Parameters<typeof imPausenjahr>[0]): boolean => c.saison.kalender[c.uhr.woche - 1] !== undefined

/** Paket 10: Ein Jahr ohne Verein (Pausenjahr). Alle Ereignisse setzen voraus, dass der Spieler vereinslos ist. */
export const PAUSENJAHR: EreignisDef[] = [
  {
    id: 'pj-start', kategorie: 'Karriere', gewicht: 0, abstand: 300, bedingung: pause,
    titel: 'Plötzlich ohne Verein', text: 'Das Trainingsgelände ist ab sofort für dich gesperrt. Kein Spind, kein Physio, kein Mannschaftsbus. Am ersten Morgen wachst du auf und weißt nicht, was du tun sollst. Dein Berater sagt: „Ein Jahr kann lang oder kurz sein. Was machen wir daraus?“',
    optionen: [
      { label: 'Fit bleiben: Eigenen Trainingsplan aufstellen', erfolg: { text: 'Du läufst jeden Morgen um sieben, machst Kraftübungen im Park und baust dir ein kleines Programm. Disziplin ist jetzt alles.', effekte: [FLAG('pjPlan', 'fit'), T({ disziplin: 4, professionalitaet: 3, fitness: 4, moral: 2 })] } },
      { label: 'Netzwerken: Kontakte pflegen und Präsenz zeigen', erfolg: { text: 'Du besuchst Spiele, triffst Trainer und Manager und erinnerst alle daran, dass es dich noch gibt.', effekte: [FLAG('pjPlan', 'netz'), T({ ruf: 1, moral: 1, privatglueck: 2 })] } },
      { label: 'Durchatmen: Erst einmal Abstand gewinnen', erfolg: { text: 'Du brauchst Ruhe. Wochenlang kein Ball, keine Zeitung. Das tut gut, aber Fitness und Spielpraxis fallen ab.', effekte: [FLAG('pjPlan', 'chill'), T({ privatglueck: 6, moral: 4, fitness: -4, professionalitaet: -1 })] } },
    ],
  },
  {
    id: 'pj-probetraining', kategorie: 'Karriere', gewicht: 2.6, abstand: 25, bedingung: (c) => pause(c) && zeit(c) && ov(c) > 30,
    titel: 'Probetraining beim Amateurklub', text: 'Ein Regionalligist aus der Nähe lädt dich zum Probetraining ein. Der Trainer: „Wir können dir nicht viel zahlen, aber du wärst unser Königstransfer.“ Die Spieler schauen skeptisch, weil du aus einer ganz anderen Liga kommst.',
    optionen: [
      { label: 'Hingehen und alles geben', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['fitness', 'professionalitaet'], skills: ['technik'] }, erfolg: { text: 'Du zeigst im Trainingsspiel, was du kannst, und gewinnst die Herzen. Der Trainer zögert keine Sekunde mit dem Vertragsangebot.', effekte: [AKT('probetraining-vertrag'), T({ moral: 6, selbstvertrauen: 4 }), NEWS('{name} unterschreibt nach Pause bei einem Amateurklub')] }, misserfolg: { text: 'Dir fehlt der Spielrhythmus. Nach 40 Minuten pfeifst du auf dem Zahnfleisch, der Trainer verabschiedet dich freundlich.', effekte: [T({ moral: -4, selbstvertrauen: -4, fitness: -2 })] } },
      { label: 'Ablehnen, das ist unter deinem Niveau', erfolg: { text: 'Du sagst höflich ab. Die Tür bleibt offen, aber die Geduld nicht ewig.', effekte: [T({ moral: -1, ehrgeiz: 1 })] } },
    ],
  },
  {
    id: 'pj-showcase', kategorie: 'Karriere', gewicht: 1.4, abstand: 70, bedingung: (c) => pause(c) && zeit(c) && ov(c) > 40 && c.spieler.geld > 5000,
    titel: 'Showcase-Camp für vereinslose Profis', text: 'In einem Trainingszentrum an der Küste treffen sich 40 vereinslose Profis, um sich Scouts zu präsentieren. Teilnahmegebühr, Unterkunft inklusive. „Hier haben schon viele einen Vertrag bekommen“, sagt der Veranstalter. Man sieht dir an, dass du dir nicht sicher bist.',
    optionen: [
      { label: 'Teilnehmen', kosten: 1500, hinweis: 'kostet 1.500 €', wurf: { basis: 0.5, traits: ['fitness', 'ruf'], skills: ['technik', 'pass'] }, erfolg: { text: 'Ein Scout beobachtet dich zwei Tage lang. Am Sonntag liegt ein Vertragsangebot auf dem Tisch.', effekte: [AKT('showcase-vertrag'), T({ moral: 5, selbstvertrauen: 3 })] }, misserfolg: { text: 'Die Konkurrenz ist riesig, die Scouts verteilen Visitenkarten, keine Verträge. Du reist enttäuscht ab.', effekte: [T({ moral: -3, selbstvertrauen: -2, fitness: -2 })] } },
      { label: 'Zuhause trainieren', erfolg: { text: 'Du verzichtest auf die Show. Deine Einheiten im Park fühlen sich ehrlicher an.', effekte: [T({ professionalitaet: 1, fitness: 2 })] } },
    ],
  },
  {
    id: 'pj-privattraining', kategorie: 'Gesundheit', gewicht: 2, abstand: 50, bedingung: (c) => pause(c) && zeit(c),
    titel: 'Individuelles Training', text: 'Ein befreundeter Athletiktrainer bietet dir an, mit dir zu arbeiten: Fünf Einheiten pro Woche, Sprints, Kraft, Technik. „Wenn du in einem Jahr noch mithalten willst, musst du jetzt investieren“, sagt er.',
    optionen: [
      { label: 'Volles Programm buchen', kosten: anteil(0.03, 1500), hinweis: 'kostet Geld', erfolg: { text: 'Du schindest dich, schwitzt und kommst in Topform. Der Trainer bescheinigt dir exzellente Werte.', effekte: [S({ tempo: 1, physis: 1, technik: 1 }), T({ fitness: 8, professionalitaet: 3, selbstvertrauen: 3 })] } },
      { label: 'Selbst trainieren', erfolg: { text: 'Du hältst dich fit, so gut es geht. Ohne Anleitung schleichen sich Fehler ein.', effekte: [T({ fitness: 3, disziplin: 1 })] } },
    ],
  },
  {
    id: 'pj-geldsorgen', kategorie: 'Finanzen', gewicht: 2.5, abstand: 60, bedingung: (c) => pause(c) && zeit(c) && c.spieler.geld < 25_000,
    titel: 'Das Konto schmilzt', text: 'Ohne Gehalt laufen Miete, Versicherungen und der Lebensstil weiter. Der Blick auf den Kontostand wird zur täglichen Mutprobe. „So kann das nicht weitergehen“, sagt dein Steuerberater.',
    optionen: [
      { label: 'Lebensstil drastisch zusammenstreichen', erfolg: { text: 'Du kündigst Abos, verkaufst das zweite Auto und isst öfter zu Hause. Der Verzicht tut weh, aber das Konto atmet auf.', effekte: [LEBEN(-3000), T({ privatglueck: -4, professionalitaet: 2, disziplin: 2 })] } },
      { label: 'Familie um Hilfe bitten', hinweis: 'riskant', wurf: { basis: 0.6, traits: ['privatglueck'] }, erfolg: { text: 'Deine Eltern helfen ohne zu zögern. Die Scham bleibt, die Dankbarkeit auch.', effekte: [G(8000), T({ moral: -2, privatglueck: 3 })] }, misserfolg: { text: 'Das Gespräch endet mit Vorwürfen: „Wir haben dir doch gesagt, du sollst vorsorgen.“ Geld gibt es keins.', effekte: [T({ moral: -4, privatglueck: -4 })] } },
      { label: 'Nebenbei einen Job annehmen', erfolg: { text: 'Du hilfst in der Firma eines alten Bekannten aus. Nicht glamourös, aber ehrlich.', effekte: [G(6000), T({ professionalitaet: 2, fitness: -2, fanbeliebtheit: -1 })] } },
    ],
  },
  {
    id: 'pj-nebenjob', kategorie: 'Karriere', gewicht: 1.5, abstand: 120, bedingung: (c) => pause(c) && zeit(c),
    titel: 'Ein Job für zwischendurch', text: '{freund} bietet dir einen Aushilfsjob in seinem Fitnessstudio an: Kunden beraten, ab und zu Kinder trainieren. „Du bist doch ein bekannter Name“, sagt er, „das zieht Leute an.“',
    optionen: [
      { label: 'Zusagen', erfolg: { text: 'Die Mitglieder lieben deine Anekdoten. Das Training mit den Kindern wird zu deinem Highlight der Woche.', effekte: [G(4500), T({ privatglueck: 5, fanbeliebtheit: 3, moral: 3, fitness: 1 })] } },
      { label: 'Dankend ablehnen', erfolg: { text: 'Du willst dich auf deine Rückkehr konzentrieren. {freund} nickt, aber ein bisschen enttäuscht.', effekte: [T({ professionalitaet: 1, privatglueck: -1 })] } },
    ],
  },
  {
    id: 'pj-tv-experte', kategorie: 'Medien', gewicht: 1.4, abstand: 180, bedingung: (c) => pause(c) && zeit(c) && trait(c, 'ruf') > 25,
    titel: 'Experte im Fernsehen', text: 'Ein Sender fragt dich an, ob du bei den Live-Übertragungen als Co-Kommentator einsteigst: „Wir suchen jemand Authentisches, der auch weiß, wie sich ein Platzverweis anfühlt.“ Die Bezahlung ist solide.',
    optionen: [
      { label: 'Zusagen', hinweis: 'riskant', wurf: { basis: 0.6, traits: ['selbstvertrauen', 'professionalitaet'] }, erfolg: { text: 'Du erklärst klug und mit Witz. Zuschauer und Kollegen sind begeistert, dein Name ist wieder präsent.', effekte: [G(anteil(0.15, 6000)), T({ ruf: 3, fanbeliebtheit: 3, selbstvertrauen: 3 })] }, misserfolg: { text: 'Du verhaspelst dich, kritisierst einen früheren Mitspieler und erntest einen Shitstorm.', effekte: [G(2500), T({ fanbeliebtheit: -3, kabine: -2, ruf: -1 })] } },
      { label: 'Ablehnen, du willst spielen', erfolg: { text: 'Du sagst, du fühlst dich noch nicht bereit für das Studio. Der Sender nimmt jemand anderen.', effekte: [T({ ehrgeiz: 2 })] } },
    ],
  },
  {
    id: 'pj-fans-vergessen', kategorie: 'Medien', gewicht: 1.8, abstand: 120, bedingung: (c) => pause(c) && zeit(c),
    titel: 'Aus den Augen, aus dem Sinn', text: 'Du scrollst durch dein Netzwerk und merkst: Die Fans reden schon über andere. Ein Neuer hat deine alte Nummer. Auf der Straße fragt dich ein Junge: „Spielen Sie noch Fußball?“',
    optionen: [
      { label: 'Ein Charity-Spiel organisieren', kosten: 800, hinweis: 'kostet 800 €', erfolg: { text: 'Mehr als 2.000 Zuschauer kommen. Alte Weggefährten stehen für dich auf dem Platz, die Erlöse gehen an ein Kinderhaus.', effekte: [T({ fanbeliebtheit: 6, ruf: 2, moral: 5, privatglueck: 3 }), NEWS('{name} organisiert Benefizspiel')] } },
      { label: 'Mit Beiträgen im Netz präsent bleiben', erfolg: { text: 'Du postest Trainingsvideos und Rückblicke. Die Reichweite bleibt stabil, mehr nicht.', effekte: [T({ fanbeliebtheit: 2, ruf: 1 })] } },
      { label: 'Akzeptieren, dass es so ist', erfolg: { text: 'Fußball ist ein schnelles Geschäft. Du richtest den Blick nach vorn.', effekte: [T({ fanbeliebtheit: -3, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'pj-weltreise', kategorie: 'Privat', gewicht: 1.4, abstand: 200, bedingung: (c) => pause(c) && zeit(c) && c.spieler.geld > 12_000,
    titel: 'Einmal um die Welt', text: 'Das Jahr ohne Verein ist die einzige Gelegenheit, mal wirklich zu reisen: Japan, Neuseeland, Argentinien. Dein Reisebüro hat schon einen Plan in der Schublade. „So eine Chance kommt nicht wieder“, sagt {freund} und sendet drei Flaggen-Emojis.',
    optionen: [
      { label: 'Große Reise antreten', kosten: 9000, hinweis: 'kostet 9.000 €', erfolg: { text: 'Du kickst am Strand, isst in Garküchen und lernst Menschen kennen, die nichts von Fußball wissen. Dein Kopf wird frei, die Beine allerdings träge.', effekte: [T({ privatglueck: 14, moral: 8, fitness: -6, professionalitaet: -2 })] } },
      { label: 'Eine kurze Auszeit nehmen', kosten: 2000, hinweis: 'kostet 2.000 €', erfolg: { text: 'Zehn Tage am Meer: Sonne, Kopf frei, dann wieder an die Arbeit.', effekte: [T({ privatglueck: 6, moral: 4, fitness: -1 })] } },
      { label: 'Zuhause bleiben und trainieren', erfolg: { text: 'Du verzichtest und bleibst im Rhythmus. Etwas Wehmut bleibt.', effekte: [T({ professionalitaet: 2, fitness: 2, privatglueck: -2 })] } },
    ],
  },
  {
    id: 'pj-berater-ultimatum', kategorie: 'Karriere', gewicht: 1.6, abstand: 90, bedingung: (c) => pause(c) && zeit(c) && ov(c) > 35,
    titel: 'Das letzte Angebot', text: '{berater} ruft an: „Ein Verein würde dich kurzfristig und ohne Probetraining nehmen. Das Angebot ist okay, nicht mehr. Wenn du jetzt Nein sagst, melden sich vielleicht im Sommer andere, vielleicht auch nicht.“',
    optionen: [
      { label: 'Annehmen und wieder spielen', erfolg: { text: 'Du unterschreibst und bist nach Wochen wieder Teil einer Mannschaft. Auch ein kleiner Verein ist ein Anfang.', effekte: [AKT('showcase-vertrag'), T({ moral: 6, ehrgeiz: 1 })] } },
      { label: 'Auf bessere Angebote warten', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['ruf'] }, erfolg: { text: 'Dein Pokern zahlt sich aus: Im Netz kursieren Gerüchte über ein Interesse höherklassiger Vereine.', effekte: [T({ ruf: 1, selbstvertrauen: 3 })] }, misserfolg: { text: 'Das Angebot verfällt, kein weiteres folgt. {berater} schaut dich lange an.', effekte: [T({ moral: -4, selbstvertrauen: -2 })] } },
    ],
  },
  {
    id: 'pj-familienzeit', kategorie: 'Familie', gewicht: 1.6, abstand: 100, bedingung: (c) => pause(c) && zeit(c) && (hatPartner(c) || zahl(c, 'kinder') > 0),
    titel: 'Endlich Zeit füreinander', text: (c) => zahl(c, 'kinder') > 0
      ? 'Zum ersten Mal erlebst du die Kinder frühmorgens, bringst sie in die Schule, holst sie ab, bist bei jedem Abendessen dabei. „Das ist schön“, sagt {partner}, „aber ich merke, wie du manchmal aus dem Fenster schaust.“'
      : 'Ohne Auswärtsfahrten und Trainingslager habt {partner} und du plötzlich jedes Wochenende frei. Am Anfang ist das ungewohnt, dann wunderbar. Aber manchmal ertappst du dich beim Blick auf die Tabelle.',
    optionen: [
      { label: 'Die Zeit voll auskosten', erfolg: { text: 'Ihr verreist spontan, kocht gemeinsam, redet stundenlang. Die Bindung wächst.', effekte: [T({ privatglueck: 10, moral: 4 })] } },
      { label: 'Ehrlich über deine Unsicherheit sprechen', erfolg: { text: 'Du erzählst von deinen Zweifeln. {partner} hört zu und nimmt dich in den Arm. Das war überfällig.', effekte: [T({ privatglueck: 6, moral: 5, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'pj-sinnkrise', kategorie: 'Karriere', gewicht: 1.2, abstand: 200, bedingung: (c) => pause(c) && zeit(c) && alterVon(c) >= 28 && trait(c, 'moral') < 55,
    titel: 'Ist das das Ende?', text: 'Seit Monaten kein Spiel, kein Anruf, kein Plan. Du fragst dich, ob du dir das noch antun willst. Dein Körper gehorcht noch, aber dein Kopf zweifelt. Auf dem Küchentisch liegt ein Brief: Eine Unternehmerin sucht Gesellschafter für ihr Sportartikel-Start-up.',
    optionen: [
      { label: 'Weitermachen und kämpfen', erfolg: { text: 'Du erinnerst dich, warum du angefangen hast. Du stehst früh auf und trainierst härter als zuvor.', effekte: [T({ moral: 6, ehrgeiz: 4, professionalitaet: 2, fitness: 3 })] } },
      { label: 'Die Karriere beenden', hinweis: 'endgültig', erfolg: { text: 'Du verkündest deinen Rücktritt in einem ruhigen Post. Die Rückmeldungen sind überwältigend. Dein Fußballerleben ist vorbei.', effekte: [T({ fanbeliebtheit: 4, ruf: 1, moral: 5 }), AKT('karriereende'), NEWS('{name} beendet die Karriere')] } },
      { label: 'Einen Teil des Geldes ins Start-up stecken', kosten: 10_000, hinweis: 'kostet 10.000 €', wurf: { basis: 0.45 }, erfolg: { text: 'Das Start-up wächst, du hast einen Plan B und mehr Ruhe im Kopf.', effekte: [T({ moral: 5, privatglueck: 3 }), G(24_000)] }, misserfolg: { text: 'Die Gründerin überhebt sich, die Finanzierungsrunde scheitert. Dein Geld ist weg, die Lektion bleibt.', effekte: [T({ moral: -2, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'pj-gewerkschaft', kategorie: 'Karriere', gewicht: 1.4, abstand: 100, bedingung: (c) => pause(c) && zeit(c) && !flag(c, 'pjGewerkschaft'),
    titel: 'Trainingsgruppe der Spielergewerkschaft', text: 'Die Spielergewerkschaft organisiert für vereinslose Profis eine gemeinsame Trainingsgruppe: Platz, Physios, Videoanalyse, Testspiele gegen Amateurmannschaften. Jeden Dienstag und Donnerstag, kostenlos für Mitglieder.',
    optionen: [
      { label: 'Mitmachen', erfolg: { text: 'Du triffst alte Bekannte, spielst gegen echte Gegner und hast wieder einen Wochenrhythmus. Auch für Scouts bist du so sichtbarer.', effekte: [FLAG('pjGewerkschaft'), T({ fitness: 6, kabine: 2, moral: 4, professionalitaet: 2 }), S({ pass: 1, defensive: 1 })] } },
      { label: 'Lieber allein trainieren', erfolg: { text: 'Du brauchst keine Gruppe, um dich zu motivieren. Zumindest redest du dir das ein.', effekte: [FLAG('pjGewerkschaft'), T({ disziplin: 1 })] } },
    ],
  },
  {
    id: 'pj-rueckblick', kategorie: 'Karriere', gewicht: 1.5, abstand: 200, bedingung: (c) => pause(c) && (c.saison.kalender[c.uhr.woche - 1] as { n?: number } | undefined)?.n !== undefined && ((c.saison.kalender[c.uhr.woche - 1] as { n: number }).n >= Math.floor(c.saison.spielplan.length * 0.7)),
    titel: 'Das Jahr neigt sich dem Ende zu', text: 'Der Sommer rückt näher, und dein Berater beginnt, den Markt zu sondieren. Du hast ein Jahr lang auf der Tribüne und im Park gestanden. Zeit, Bilanz zu ziehen: Was nimmst du aus dem Jahr mit?',
    optionen: [
      { label: 'Mit frischem Elan in den Sommer', erfolg: { text: 'Du fühlst dich erholt, hungrig und bereit. Der Berater lächelt: „So klingt ein Spieler, den Vereine wollen.“', effekte: [T({ moral: 6, ehrgeiz: 3, selbstvertrauen: 3 })] } },
      { label: 'Nach einem Probetraining im Ausland fragen', kosten: 1200, hinweis: 'kostet 1.200 €', wurf: { basis: 0.45, traits: ['fitness', 'ruf'] }, erfolg: { text: 'Ein Verein im Ausland lädt dich ein, du überzeugst und bekommst ein erstes Angebot.', effekte: [AKT('showcase-vertrag'), T({ moral: 5 })] }, misserfolg: { text: 'Man schätzt deine Technik, aber der Trainer will Spieler mit mehr Spielpraxis.', effekte: [T({ moral: -2, selbstvertrauen: -1 })] } },
    ],
  },
]

