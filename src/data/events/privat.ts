import { AKT, FLAG, FOLGE, ZAEHLE, G, LEBEN, NEWS, S, T, alterVon, anteil, flag, gehalt, hatPartner, jugend, profi, trait, verletzt, zahl } from './helpers'
import type { EreignisDef } from './types'

export const PRIVAT: EreignisDef[] = [
  {
    id: 'p-kennenlernen', kategorie: 'Privat', gewicht: 2, abstand: 200, bedingung: (c) => profi(c) && !hatPartner(c) && alterVon(c) >= 18,
    titel: 'Wer wartet da am Rande des Trainings?', text: 'Vor dem Vereinsgelände wartet jeden Tag dieselbe Person mit einem Kaffee und einem Lächeln. Heute spricht die Person dich an. {freund} grinst im Hintergrund und gibt dir den Daumen hoch.',
    optionen: [
      { label: 'Auf einen Kaffee gehen', erfolg: { text: 'Aus einem Kaffee wird ein Abendessen, aus einem Abendessen wird mehr. Zum ersten Mal seit Langem denkst du nicht nur an Fußball.', effekte: [AKT('partner-neu'), T({ privatglueck: 10, moral: 4 }), FOLGE('p-beziehung-krise', 45, 0.6)] } },
      { label: 'Höflich ablehnen', erfolg: { text: 'Du konzentrierst dich auf deine Karriere. Die Liebe läuft schon nicht weg.', effekte: [T({ professionalitaet: 2, ehrgeiz: 1 })] } },
    ],
  },
  {
    id: 'p-beziehung-krise', kategorie: 'Privat', gewicht: 0, abstand: 80, bedingung: hatPartner,
    titel: 'Beziehungskrise', text: '{partner} sagt: „Du hast nie Zeit. Immer Training, Spiele, Trainingslager. Wann bin ich dran?“ Du merkst, dass {sie} recht hat.',
    optionen: [
      { label: 'Einen freien Tag nehmen und gemeinsam verbringen', erfolg: { text: 'Ihr verbringt einen wunderschönen Tag am See. Ihr seid beide erleichtert.', effekte: [T({ privatglueck: 8, fitness: 2, ehrgeiz: -1 })] } },
      { label: 'Die Karriere verteidigen', hinweis: 'riskant', wurf: { basis: 0.35, traits: ['privatglueck'] }, erfolg: { text: '{partner} versteht dich und tritt einen Schritt zurück. Ihr bleibt zusammen.', effekte: [T({ privatglueck: 2 })] }, misserfolg: { text: '{partner} packt die Koffer. Es war eine schöne Zeit.', effekte: [AKT('partner-ende'), T({ privatglueck: -12, moral: -6 })] } },
      { label: 'Teure Blumen schicken lassen', kosten: 150, hinweis: 'kostet 150 €', erfolg: { text: 'Die Blumen helfen kurz. Das Problem bleibt.', effekte: [T({ privatglueck: 3 })] } },
    ],
  },
  {
    id: 'p-heiratsantrag', kategorie: 'Privat', gewicht: 1.5, abstand: 400, bedingung: (c) => hatPartner(c) && alterVon(c) >= 22 && trait(c, 'privatglueck') > 60 && !flag(c, 'verheiratet'),
    titel: 'Der große Schritt', text: 'Du und {partner} seid seit Jahren zusammen. Die Familie fragt schon, wann es endlich so weit ist. Dein Berater rät: „Mach es wie Ronaldo, groß und teuer.“',
    optionen: [
      { label: 'Antrag mit Riesenspektakel', kosten: anteil(0.08, 3000), hinweis: 'kostet viel Geld', erfolg: { text: 'Auf dem Mittelkreis, nach dem Spiel, vor 30.000 Zuschauern. {partner} sagt Ja. Die Zeitungen drucken das Foto.', effekte: [FLAG('verheiratet'), T({ privatglueck: 15, fanbeliebtheit: 5, moral: 8 }), LEBEN(4000), NEWS('Mittelkreis-Antrag: {name} heiratet')] } },
      { label: 'Intim und ruhig', erfolg: { text: 'Beim Abendessen, nur zu zweit. {Sie} sagt Ja. Es ist perfekt.', effekte: [FLAG('verheiratet'), T({ privatglueck: 12, moral: 6 }), LEBEN(2000)] } },
      { label: 'Noch nicht, die Karriere geht vor', erfolg: { text: '{partner} nickt enttäuscht. {Sie} wartet, aber wie lange?', effekte: [T({ privatglueck: -6 }), FOLGE('p-beziehung-krise', 25, 0.7)] } },
    ],
  },
  {
    id: 'p-baby', kategorie: 'Familie', gewicht: 1.5, abstand: 300, bedingung: (c) => hatPartner(c) && alterVon(c) >= 21 && trait(c, 'privatglueck') > 55 && zahl(c, 'kinder') < 3,
    titel: 'Wir werden Eltern!', text: (c) => c.personen.partnerGeschlecht === 'm'
      ? '{partner} zeigt dir einen Brief vom Jugendamt: Die Adoption wurde bewilligt. Dein Herz setzt aus, dann lachst du laut. Ein Kind!'
      : '{partner} hält dir einen Schwangerschaftstest unter die Nase. Dein Herz setzt aus, dann lachst du laut. Ein Baby!',
    optionen: [
      { label: 'Riesig freuen und Elternzeit nehmen', erfolg: { text: 'Du verbringst Wochen zwischen Windeln und Schlafmangel, aber du strahlst.', effekte: [T({ privatglueck: 14, moral: 6, fitness: -3, professionalitaet: 1 }), LEBEN(2500), ZAEHLE('kinder', 1)] } },
      { label: 'Freude zeigen, aber Training nicht schleifen lassen', erfolg: { text: 'Du organisierst alles clever. Das Training leidet kaum, das Familienglück schon ein wenig.', effekte: [T({ privatglueck: 10, ehrgeiz: 2 }), LEBEN(2500), ZAEHLE('kinder', 1)] } },
    ],
  },
  {
    id: 'p-haus', kategorie: 'Privat', gewicht: 2, abstand: 300, bedingung: (c) => profi(c) && gehalt(c) > 80_000 && !flag(c, 'haus'),
    titel: 'Traumhaus', text: 'Dein Berater hat ein Haus mit Garten, Pool und Heimkino gefunden. „Eine gute Anlage“, sagt er. „Und wir können sofort einziehen.“',
    optionen: [
      { label: 'Kaufen', kosten: anteil(0.6, 20_000), hinweis: 'kostet viel', erfolg: { text: 'Du zeigst Freunden stolz dein Haus. Sie fragen, ob sie bei dir einziehen dürfen.', effekte: [FLAG('haus'), LEBEN(6000), T({ privatglueck: 10, moral: 4 })] } },
      { label: 'Mieten und flexibel bleiben', erfolg: { text: 'Du gönnst dir eine schicke Mietwohnung. Wenn es mal schief läuft, bist du frei.', effekte: [T({ privatglueck: 3 }), LEBEN(1500)] } },
      { label: 'Bei den Eltern bleiben', erfolg: { text: 'Mamas Küche schlägt jede Villa. Du sparst, aber dein Privatleben wird nicht aufregender.', effekte: [T({ privatglueck: 1, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'p-auto', kategorie: 'Privat', gewicht: 2.5, abstand: 200, bedingung: (c) => profi(c) && gehalt(c) > 40_000 && !jugend(c),
    titel: 'Der Wagen vor dem Vereinsgelände', text: 'Die Mitspieler parken Sportwagen vor dem Trainingsgelände. Im Autohaus wartet ein Cabrio mit 600 PS auf dich. „Für Sie, zum Sonderpreis!“',
    optionen: [
      { label: 'Cabrio kaufen', kosten: anteil(0.4, 12_000), hinweis: 'kostet viel', wurf: { basis: 0.75, traits: ['disziplin'] }, erfolg: { text: 'Du rollst im Cabrio vor. Die Fans lieben es, der Verein auch, solange du nicht rast.', effekte: [T({ privatglueck: 6, fanbeliebtheit: 2, moral: 3 }), LEBEN(1500)] }, misserfolg: { text: 'Du bekommst gleich zwei Strafzettel in der ersten Woche. Die Presse erfährt es.', effekte: [T({ privatglueck: 4, fanbeliebtheit: -1 }), LEBEN(1500), NEWS('{name} rast im Cabrio: Strafzettel')] } },
      { label: 'Gebrauchten Kleinwagen kaufen', kosten: 8_000, hinweis: 'kostet 8.000 €', erfolg: { text: 'Dein Auto ist kein Hingucker, aber zuverlässig. Dein Berater findet das erstaunlich vernünftig.', effekte: [T({ professionalitaet: 2, privatglueck: 2 })] } },
      { label: 'Fahrrad nehmen', erfolg: { text: 'Du bist umweltbewusst und fit. Der Zeugwart schüttelt den Kopf.', effekte: [T({ fitness: 2, kabine: -1 })] } },
    ],
  },
  {
    id: 'p-urlaub', kategorie: 'Privat', gewicht: 2, abstand: 100, bedingung: (c) => profi(c) && c.saison.kalender[c.uhr.woche - 1]?.t === 'F',
    titel: 'Urlaub oder Trainingslager?', text: 'Die Sommerpause ist kurz. Dein Berater sagt, wer nur Strand und Cocktails sieht, wird im Herbst eingeholt. Deine Freunde sagen das Gegenteil.',
    optionen: [
      { label: 'Karibik, nur Sonne', kosten: anteil(0.05, 800), hinweis: 'kostet Geld', erfolg: { text: 'Die Sonne tut gut. Aber im ersten Training schnaufst du wie eine Dampflok.', effekte: [T({ privatglueck: 8, moral: 6, fitness: -8 })] } },
      { label: 'Individuelles Training in den Bergen', kosten: anteil(0.02, 300), hinweis: 'kostet Geld', erfolg: { text: 'Höhenluft, Laufbahn und viel Schlaf. Du kommst topfit zurück.', effekte: [T({ fitness: 6, professionalitaet: 2, privatglueck: 2 }), S({ physis: 1 })] } },
      { label: 'Zu Hause bleiben, ausspannen', erfolg: { text: 'Du triffst alte Freunde, schläfst lang und kickst auf dem Bolzplatz. Ein bisschen Normalität.', effekte: [T({ privatglueck: 5, moral: 3 })] } },
    ],
  },
  {
    id: 'p-familie-krank', kategorie: 'Familie', gewicht: 1.5, abstand: 250,     titel: 'Nachricht von zuhause', text: 'Dein Vater liegt im Krankenhaus. Es ist nichts Lebensbedrohliches, aber die Familie braucht Unterstützung. Der nächste Spieltag steht bevor.',
    optionen: [
      { label: 'Sofort heimfahren', erfolg: { text: 'Du sitzt am Krankenbett und redest die ganze Nacht. Am Tag danach schleppst du dich zum Training.', effekte: [T({ privatglueck: 5, moral: 2, fitness: -4, trainerBeziehung: -1 })] } },
      { label: 'Spielen und Geld schicken', erfolg: { text: 'Du konzentrierst dich auf das Spiel und überweist Geld. Das Gewissen nagt.', effekte: [G(-500), T({ privatglueck: -4, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'p-freund-kredit', kategorie: 'Privat', gewicht: 2, abstand: 200, bedingung: (c) => profi(c) && gehalt(c) > 50_000,
    titel: 'Ein Freund braucht Geld', text: '{freund}, dein alter Kumpel aus Kindertagen, ruft an. Sein Restaurant steht kurz vor der Pleite, er braucht 20.000 Euro. „Nur geliehen“, sagt er.',
    optionen: [
      { label: 'Geld geben', kosten: anteil(0.15, 5000), hinweis: 'kostet viel', wurf: { basis: 0.5 }, erfolg: { text: 'Das Restaurant überlebt. Bald gibt es eine Pizza mit deinem Namen.', effekte: [G(anteil(0.18, 6000)), T({ privatglueck: 4, moral: 3 })] }, misserfolg: { text: 'Das Restaurant macht trotzdem dicht. Das Geld ist weg und {freund} schämt sich.', effekte: [T({ privatglueck: -3, moral: -2 })] } },
      { label: 'Ablehnen, auch wenn es schmerzt', erfolg: { text: 'Du erklärst ihm, dass du nicht der Geldautomat bist. Die Freundschaft wird kühler.', effekte: [T({ privatglueck: -4, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'p-party', kategorie: 'Privat', gewicht: 3, abstand: 60, bedingung: (c) => profi(c) && !verletzt(c),
    titel: 'Party am Freitagabend', text: 'Samstag ist Spiel. Aber der Club, in dem sonst nur Stars feiern, hat dich auf die Gästeliste gesetzt. {freund} ist schon vor Ort und winkt dir.',
    optionen: [
      { label: 'Hingehen und feiern', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['disziplin'] }, erfolg: { text: 'Du gehst um Mitternacht und trinkst nur Wasser. Du hast Spaß und bleibst fit.', effekte: [T({ privatglueck: 4, moral: 3, fanbeliebtheit: 1 })] }, misserfolg: { text: 'Aus Mitternacht wird fünf Uhr. Am nächsten Tag spielst du wie ein Schatten deiner selbst.', effekte: [T({ fitness: -10, selbstvertrauen: -3, professionalitaet: -2, privatglueck: 3 }), FOLGE('r-handyvideo-leak', 2, 0.35)] } },
      { label: 'Zu Hause bleiben', erfolg: { text: 'Du schaust einen Film und gehst früh ins Bett. Dein Körper dankt es dir.', effekte: [T({ fitness: 3, professionalitaet: 2, privatglueck: -1 })] } },
    ],
  },
  {
    id: 'p-haustier', kategorie: 'Privat', gewicht: 1, abstand: 500, bedingung: (c) => profi(c) && !flag(c, 'hund'),
    titel: 'Ein neuer Mitbewohner', text: 'Aus dem Tierheim schaut dich ein Mischling an, als hätte er soeben dein Herz gestohlen. Er hat schon einen Namen: „Elfmeter“.',
    optionen: [
      { label: 'Adoptieren', erfolg: { text: 'Elfmeter bringt Leben in dein Haus. Und täglich zwei Stunden Gassi-Spaziergang.', effekte: [FLAG('hund'), T({ privatglueck: 6, moral: 3, fitness: 1 })] } },
      { label: 'Zu viel Aufwand', erfolg: { text: 'Du hast keine Zeit für ein Tier. Vielleicht später.', effekte: [] } },
    ],
  },
  {
    id: 'p-studium', kategorie: 'Privat', gewicht: 1.5, abstand: 500, bedingung: (c) => profi(c) && alterVon(c) >= 19 && !flag(c, 'studium'),
    titel: 'Fernstudium', text: 'Ein Studienberater erklärt dir, dass du neben dem Fußball BWL studieren kannst. Die Karriere endet irgendwann. Er sagt: „Der Plan B beginnt heute.“',
    optionen: [
      { label: 'Einschreiben', kosten: 1500, hinweis: 'kostet 1.500 €', erfolg: { text: 'Neben dem Training liest du Fachbücher. Dein Kopf wird klarer und dein Berater staunt.', effekte: [FLAG('studium'), T({ professionalitaet: 3, disziplin: 3, fitness: -2 })] } },
      { label: 'Später', erfolg: { text: 'Das Studium kann warten, jetzt sind die Beine dran.', effekte: [] } },
    ],
  },
  {
    id: 'p-21-geburtstag', kategorie: 'Privat', gewicht: 1, abstand: 1000, bedingung: (c) => alterVon(c) === 21 || alterVon(c) === 30,
    titel: 'Runder Geburtstag', text: 'Du wirst {vorname} {name}. Die Familie plant eine Feier. Dein Berater schlägt eine Mega-Party mit Prominenten vor.',
    optionen: [
      { label: 'Mega-Party', kosten: anteil(0.06, 1000), hinweis: 'kostet Geld', erfolg: { text: 'Der Abend wird legendär. Die Fotos gehen durch die Presse, und dein Konto weint.', effekte: [T({ privatglueck: 8, fanbeliebtheit: 2, disziplin: -2 })] } },
      { label: 'Im kleinen Kreis feiern', erfolg: { text: 'Familie, Freunde, selbstgemachter Kuchen. Mehr braucht es nicht.', effekte: [T({ privatglueck: 6, moral: 3 })] } },
    ],
  },
  {
    id: 'p-psyche', kategorie: 'Gesundheit', gewicht: 1.5, abstand: 300, bedingung: (c) => trait(c, 'moral') < 38 && trait(c, 'privatglueck') < 45,
    titel: 'Es läuft nicht rund', text: 'Seit Wochen fühlst du dich leer. Schlaf, Appetit, alles ist anders. Selbst Training macht keinen Spaß mehr. Dein Mitspieler {freund} fragt behutsam, ob alles okay ist.',
    optionen: [
      { label: 'Mit einer Sportpsychologin sprechen', kosten: 300, hinweis: 'kostet 300 €', erfolg: { text: 'Die Gespräche tun gut. Du lernst, dass Hilfe zu suchen keine Schwäche ist.', effekte: [T({ moral: 12, privatglueck: 8, selbstvertrauen: 5, professionalitaet: 2 })] } },
      { label: 'Mit {freund} reden', erfolg: { text: 'Ihr redet lange im Auto. Es hilft, auch wenn nicht alles gelöst ist.', effekte: [T({ moral: 6, privatglueck: 4 })] } },
      { label: 'Durchziehen, wird schon', wurf: { basis: 0.35 }, erfolg: { text: 'Nach ein paar Tagen wird es besser. Das war Glück.', effekte: [T({ moral: 3 })] }, misserfolg: { text: 'Es wird schlimmer. Die Leistung leidet und die Stimmung auch.', effekte: [T({ moral: -6, privatglueck: -4, selbstvertrauen: -4 })] } },
    ],
  },
  {
    id: 'p-influencer', kategorie: 'Privat', gewicht: 2, abstand: 300, bedingung: (c) => !jugend(c) && !flag(c, 'insta'),
    titel: 'Eigener Social-Media-Account', text: 'Ein Agenturmitarbeiter schlägt vor, deine Social-Media-Kanäle professionell zu betreuen. „Follower sind die neue Währung“, sagt er, „und Sponsoren zahlen dafür.“',
    optionen: [
      { label: 'Zusagen', erfolg: { text: 'Die Agentur postet Trainingsvideos und Selfies. Deine Reichweite steigt, aber dein Privatleben schrumpft.', effekte: [FLAG('insta'), T({ ruf: 2, fanbeliebtheit: 4, privatglueck: -2 }), G(500)] } },
      { label: 'Selbst machen, nur ab und zu', erfolg: { text: 'Du postest ab und zu ein Foto vom Training. Echt, aber wenig Reichweite.', effekte: [FLAG('insta'), T({ fanbeliebtheit: 1 })] } },
      { label: 'Nein, ist nichts für mich', erfolg: { text: 'Keine Likes, keine Shitstorms. Dein Stolz ist geschützt.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'p-vater-berater', kategorie: 'Familie', gewicht: 1.2, abstand: 300, bedingung: (c) => profi(c) && alterVon(c) >= 19 && Number(c.flags.beraterGuete ?? 1) <= 2,
    titel: 'Dein Vater will mitreden', text: 'Dein Vater sitzt neben dem Berater und mischt sich in jede Verhandlung ein. Der Berater verdreht die Augen. „Entweder er oder ich.“',
    optionen: [
      { label: 'Zum Vater halten', erfolg: { text: 'Der Berater geht, und dein Vater strahlt. Ob das klug war? Zeit wird es zeigen.', effekte: [AKT('berater-wechsel'), T({ privatglueck: 3 })] } },
      { label: 'Den Berater behalten, Vater bitten, sich rauszuhalten', erfolg: { text: 'Ein langes Gespräch, ein paar Tränen. Dein Vater versteht es irgendwann.', effekte: [T({ privatglueck: -3, professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'p-trauerfall', kategorie: 'Familie', gewicht: 0.6, abstand: 600, bedingung: (c) => alterVon(c) >= 22,
    titel: 'Abschied von Opa', text: 'Dein Opa, der dich damals zum ersten Mal zum Spiel mitgenommen hat, ist gestorben. Du bekommst die Nachricht kurz vor dem Training.',
    optionen: [
      { label: 'Zur Beerdigung fahren', erfolg: { text: 'Die ganze Familie ist da. Es ist ein trauriger, aber schöner Abschied.', effekte: [T({ privatglueck: 3, moral: -2, trainerBeziehung: 1 })] } },
      { label: 'Das Spiel ihm widmen', wurf: { basis: 0.55, traits: ['moral'] }, erfolg: { text: 'Du triffst und zeigst zum Himmel. Das ganze Stadion klatscht.', effekte: [T({ fanbeliebtheit: 4, ruf: 1, moral: 3 })] }, misserfolg: { text: 'Du kämpfst mit den Tränen und spielst schwach. Es ist verständlich.', effekte: [T({ moral: -4, fanbeliebtheit: 2 })] } },
    ],
  },
]

