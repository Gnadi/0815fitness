import { AKT, FLAG, FOLGE, G, LEBEN, NEWS, S, T, VERL, ZAEHLE, alterVon, anteil, flag, gehalt, hatBesitz, hatPartner, profi, trait, zahl } from './helpers'
import type { EreignisDef } from './types'

/** Paket 2: Hochzeit, Scheidung, Elternschaft, Verluste und Karriere nach dem Fußball. */
export const LEBENSPHASEN: EreignisDef[] = [
  // ---------------------------------------------------------------- Hochzeit
  {
    id: 'l-hochzeit', kategorie: 'Privat', gewicht: 0,
    titel: 'Hochzeitsplanung', text: '{partner} und du heiraten! Plötzlich sprechen alle von Location, Gästeliste und Sitzordnung. Deine Mutter hat schon einen Schnellhefter angelegt, dein Berater fragt, ob eine Zeitschrift die Exklusivrechte bekommen soll.',
    optionen: [
      { label: 'Schloss, 200 Gäste und Live-Band', kosten: anteil(0.15, 8000), hinweis: 'kostet viel Geld', erfolg: { text: 'Es wird ein Traumtag. Die Gäste tanzen bis morgens, die Fotos gehen durch jede Zeitschrift.', effekte: [T({ privatglueck: 14, fanbeliebtheit: 4, ruf: 2, moral: 6 }), LEBEN(2500), NEWS('{name} und {partner}: Hochzeit des Jahres'), FOLGE('l-hochzeitsreise', 4)] } },
      { label: 'Standesamt, Familie und enge Freunde', kosten: 3500, hinweis: 'kostet 3.500 €', erfolg: { text: 'Klein, herzlich, privat. Dein Opa weint, dein bester Freund hält eine Rede, die nie jemand vergisst.', effekte: [T({ privatglueck: 12, moral: 5 }), LEBEN(1500), FOLGE('l-hochzeitsreise', 4)] } },
      { label: 'Exklusivrechte ans Magazin verkaufen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['ruf'] }, erfolg: { text: 'Das Magazin zahlt einen sechsstelligen Betrag. {partner} ist ein bisschen sauer, die Bilder sind aber wunderschön.', effekte: [G(anteil(0.25, 8000)), T({ privatglueck: 8, ruf: 3, fanbeliebtheit: 2 }), FOLGE('l-hochzeitsreise', 4)] }, misserfolg: { text: 'Die Fotografen stehen im Gebüsch, die Hochzeit verliert ihre Intimität. {partner} ist wütend.', effekte: [T({ privatglueck: -4, ruf: 1 }), G(anteil(0.05, 1000))] } },
    ],
  },
  {
    id: 'l-ehevertrag', kategorie: 'Privat', gewicht: 1, abstand: 500, bedingung: (c) => hatPartner(c) && !flag(c, 'ehevertrag') && !flag(c, 'verheiratet') && c.spieler.geld > 200_000 && trait(c, 'privatglueck') > 45,
    titel: 'Der Ehevertrag', text: 'Dein Berater legt dir einen Vertrag auf den Tisch: „Bevor ihr heiratet, müssen wir etwas absichern.“ Dein Vermögen ist stark gewachsen, und die Scheidungsrate in der Branche ist hoch. Aber sprichst du jetzt, bevor eine Frage der Liebe zur Frage des Geldes wird?',
    optionen: [
      { label: 'Ehevertrag ansprechen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['professionalitaet'] }, erfolg: { text: '{partner} versteht dich und sagt: „Besser jetzt als später.“ Ihr regelt alles in Ruhe.', effekte: [FLAG('ehevertrag'), T({ privatglueck: 2 })] }, misserfolg: { text: '{partner} fühlt sich nicht geliebt, sondern kalkuliert. Es gibt drei Tage Funkstille.', effekte: [T({ privatglueck: -7 })] } },
      { label: 'Vertrauen und kein Wort', erfolg: { text: 'Liebe schlägt Paragrafen. Dein Berater verdreht die Augen.', effekte: [T({ privatglueck: 3 })] } },
    ],
  },
  {
    id: 'l-hochzeitsreise', kategorie: 'Privat', gewicht: 0,
    titel: 'Flitterwochen', text: 'Die Hochzeit ist vorbei, der Alltag wartet noch. Der Verein gibt dir zwei Tage frei, ein Reisebüro bietet dir ein Paket an.',
    optionen: [
      { label: 'Luxus-Flitterwochen auf den Seychellen', kosten: 7500, hinweis: 'kostet 7.500 €', erfolg: { text: 'Strand, Cocktails, keine Termine. Du kommst gebräunt und entspannt zurück.', effekte: [T({ privatglueck: 10, fitness: 6, moral: 5 })] } },
      { label: 'Ein langes Wochenende am See', kosten: 800, hinweis: 'kostet 800 €', erfolg: { text: 'Kleines Hotel, große Ruhe. Mehr braucht ihr nicht.', effekte: [T({ privatglueck: 6, fitness: 3 })] } },
      { label: 'Nach dem Training zurück ins Training', erfolg: { text: '{partner} sagt nichts, aber ihr Lächeln wirkt etwas blasser.', effekte: [T({ privatglueck: -3, professionalitaet: 1 })] } },
    ],
  },

  // ---------------------------------------------------------------- Scheidung
  {
    id: 'l-ehekrise', kategorie: 'Privat', gewicht: 1.5, abstand: 200, bedingung: (c) => flag(c, 'verheiratet') && hatPartner(c) && trait(c, 'privatglueck') < 40,
    titel: 'Stille am Küchentisch', text: 'Zwischen {partner} und dir wird es leiser. Gespräche enden, bevor sie anfangen, und ihr schlaft auf getrennten Seiten des Betts. Ein Freund sagt: „Redet. Oder trennt euch.“',
    optionen: [
      { label: 'Eheberatung starten', kosten: 1200, hinweis: 'kostet 1.200 €', erfolg: { text: 'Die Beraterin bringt euch dazu, endlich zu sagen, was ihr denkt. Ein erster Schritt.', effekte: [T({ privatglueck: 8, moral: 3 })] } },
      { label: 'Gemeinsam in den Urlaub fahren', kosten: 3500, hinweis: 'kostet 3.500 €', erfolg: { text: 'Zwei Wochen ohne Handy. Ihr erinnert euch, warum ihr euch einmal gewählt habt.', effekte: [T({ privatglueck: 10, fitness: 3 })] } },
      { label: 'Abwarten, es wird schon', hinweis: 'riskant', wurf: { basis: 0.3, traits: ['privatglueck'] }, erfolg: { text: 'Es klärt sich von selbst. Vorerst.', effekte: [T({ privatglueck: 3 })] }, misserfolg: { text: 'Das Schweigen wird lauter. Am Ende sitzt ihr im Büro eines Scheidungsanwalts.', effekte: [FOLGE('l-scheidung', 4)] } },
    ],
  },
  {
    id: 'l-scheidung', kategorie: 'Privat', gewicht: 0.8, abstand: 600, bedingung: (c) => flag(c, 'verheiratet') && hatPartner(c) && trait(c, 'privatglueck') < 25,
    titel: 'Die Scheidung', text: '{partner} sagt es ruhig: „Ich kann nicht mehr.“ Zwei Wochen später sitzt ihr bei Anwälten. Die Boulevardpresse wittert Blut, und dein Berater fragt vorsichtig nach dem Ehevertrag.',
    optionen: [
      { label: 'Einvernehmlich trennen', kosten: anteil(0.06, 4000), hinweis: 'kostet Geld', erfolg: { text: 'Ihr einigt euch fair und trennt euch mit Anstand. Es tut weh, aber ohne Krieg.', effekte: [AKT('partner-ende'), FLAG('verheiratet', false), ZAEHLE('scheidungen', 1), T({ privatglueck: -6, moral: -4, professionalitaet: 1 }), NEWS('{name} und {partner} trennen sich')] } },
      { label: 'Rosenkrieg: um jeden Cent kämpfen', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['selbstvertrauen'] }, erfolg: { text: 'Du gewinnst vor Gericht. Dein Konto bleibt halbwegs voll, dein Herz weniger.', effekte: [AKT('partner-ende'), FLAG('verheiratet', false), ZAEHLE('scheidungen', 1), G(-4000), T({ privatglueck: -10, moral: -5, fanbeliebtheit: -2, ruf: -1 }), NEWS('Rosenkrieg: {name} streitet vor Gericht')] }, misserfolg: { text: 'Der Richter spricht {partner} einen großen Teil deines Vermögens zu. Die Zeitung druckt die Zahlen.', effekte: [AKT('partner-ende'), FLAG('verheiratet', false), ZAEHLE('scheidungen', 1), G(({ spieler }) => -Math.round(Math.max(20_000, spieler.geld * 0.25))), T({ privatglueck: -12, moral: -8, fanbeliebtheit: -3 }), LEBEN(2000), NEWS('Scheidungs-Drama: {name} zahlt Millionen')] } },
      { label: 'Es noch einmal versuchen', hinweis: 'riskant', wurf: { basis: 0.35, traits: ['privatglueck'] }, erfolg: { text: 'Ihr zieht die Papiere zurück. Es wird nicht leicht, aber ihr versucht es.', effekte: [T({ privatglueck: 12, moral: 6 })] }, misserfolg: { text: 'Der Versuch scheitert nach zwei Wochen. Jetzt wird es noch schmerzhafter.', effekte: [AKT('partner-ende'), FLAG('verheiratet', false), ZAEHLE('scheidungen', 1), T({ privatglueck: -12, moral: -6 }), G(-6000)] } },
    ],
  },
  {
    id: 'l-unterhalt', kategorie: 'Familie', gewicht: 0.8, abstand: 600, bedingung: (c) => !hatPartner(c) && zahl(c, 'scheidungen') > 0 && zahl(c, 'kinder') > 0 && !flag(c, 'unterhaltGeregelt'),
    titel: 'Unterhalt und Sorgerecht', text: 'Das Familiengericht hat entschieden: Du zahlst Unterhalt und darfst die Kinder jedes zweite Wochenende sehen. Es ist teuer, aber es geht um das, was dir am wichtigsten ist.',
    optionen: [
      { label: 'Zahlen und jede Minute mit den Kindern nutzen', erfolg: { text: 'Die Wochenenden sind kostbar. Du lernst, wieder Papa zu sein.', effekte: [FLAG('unterhaltGeregelt'), LEBEN(3000), T({ privatglueck: 5, moral: 3 })] } },
      { label: 'Freiwillig mehr zahlen', erfolg: { text: 'Du zeigst, dass du es ernst meinst. Die Beziehung zu deiner Ex wird entspannter.', effekte: [FLAG('unterhaltGeregelt'), LEBEN(5000), T({ privatglueck: 6, professionalitaet: 2 })] } },
    ],
  },

  // ---------------------------------------------------------------- Elternschaft
  {
    id: 'l-neugeborenes', kategorie: 'Familie', gewicht: 0,
    titel: 'Schlaflose Nächte', text: 'Das Baby schreit um drei, um fünf und um sieben. Du stehst morgens mit Augenringen auf dem Trainingsplatz, und der Fitnesstrainer starrt dich besorgt an. {partner} auch.',
    optionen: [
      { label: 'Nachts übernehmen, damit {partner} schläft', erfolg: { text: 'Du bist müde, aber glücklich. Der Familienzusammenhalt wächst.', effekte: [T({ fitness: -6, privatglueck: 6, moral: 3 })] } },
      { label: 'Nanny engagieren', kosten: 2500, hinweis: 'kostet 2.500 €', erfolg: { text: 'Die Nanny rettet eure Nerven. Du kommst ausgeschlafen zum Training.', effekte: [T({ fitness: 2, privatglueck: 4 })] } },
      { label: 'Im Gästezimmer schlafen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['privatglueck'] }, erfolg: { text: 'Du bist fit, aber {partner} nimmt es dir nicht übel. Man versteht sich.', effekte: [T({ fitness: 3, privatglueck: -1 })] }, misserfolg: { text: '{partner} ist verletzt: „Du hast dich aus der Verantwortung gezogen.“', effekte: [T({ fitness: 3, privatglueck: -8 })] } },
    ],
  },
  {
    id: 'l-kind-fussball', kategorie: 'Familie', gewicht: 1.2, abstand: 500, bedingung: (c) => zahl(c, 'kinder') >= 1 && alterVon(c) >= 28 && !flag(c, 'kindFussball'),
    titel: 'Der Nachwuchs kickt', text: 'Auf dem Bolzplatz zieht dein Kind mit dem Ball an der Fußspitze fünf Gegner aus. „Papa, ich will Fußballer werden!“ Der Trainer der Bambinis sagt vorsichtig: „Der hat was von dir.“',
    optionen: [
      { label: 'Selbst als Co-Trainer einsteigen', erfolg: { text: 'Jeden zweiten Sonntag kickst du mit den Kleinen. Zeit, die du nicht zurückbekommst, aber nie bereuen wirst.', effekte: [FLAG('kindFussball'), T({ privatglueck: 8, fanbeliebtheit: 2, moral: 4 })] } },
      { label: 'In die Nachwuchsakademie schicken', kosten: 3000, hinweis: 'kostet 3.000 €', erfolg: { text: 'Mit Profi-Training und Profi-Betreuern geht es schneller voran. Du hoffst, das Kind genießt es.', effekte: [FLAG('kindFussball'), T({ privatglueck: 4, ehrgeiz: 2 })] } },
      { label: 'Ihm Zeit lassen und nicht drängen', erfolg: { text: 'Du sagst: „Mach, was dir Spaß macht.“ Das Kind strahlt.', effekte: [FLAG('kindFussball'), T({ privatglueck: 6 })] } },
    ],
  },
  {
    id: 'l-elternabend', kategorie: 'Familie', gewicht: 1.2, abstand: 300, bedingung: (c) => zahl(c, 'kinder') >= 1 && profi(c) && alterVon(c) >= 26,
    titel: 'Elternabend vor dem Pokalspiel', text: 'Gleichzeitig mit dem wichtigsten Training der Woche findet der Elternabend im Kindergarten statt. Die Erzieherin fragt per Mail, ob „der berühmte Papa“ kommen könne, und die anderen Eltern warten gespannt.',
    optionen: [
      { label: 'Hingehen', erfolg: { text: 'Du sitzt zwischen Kleinstühlen und lächelst. Das Kind ist stolz. Der Trainer weniger.', effekte: [T({ privatglueck: 8, trainerBeziehung: -2, ruf: 1 })] } },
      { label: 'Die Einheit nicht verpassen', erfolg: { text: 'Du erklärst deinem Kind, dass Papa arbeiten muss. Es nickt traurig.', effekte: [T({ privatglueck: -5, professionalitaet: 2, trainerBeziehung: 2 })] } },
      { label: '{partner} schickt eine Videobotschaft', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['privatglueck'] }, erfolg: { text: 'Die Videobotschaft kommt gut an. Alle sind versöhnt.', effekte: [T({ privatglueck: 3, professionalitaet: 1 })] }, misserfolg: { text: '{partner}: „Du hast immer Ausreden.“ Der Haussegen hängt schief.', effekte: [T({ privatglueck: -6 })] } },
    ],
  },
  {
    id: 'l-kind-krank', kategorie: 'Familie', gewicht: 1, abstand: 300, bedingung: (c) => zahl(c, 'kinder') >= 1 && profi(c),
    titel: 'Das Kind ist krank', text: 'Nachts um zwei ruft {partner}: „Das Kind hat hohes Fieber!“ Am Morgen ist ein Länderspiel, ein Pokalspiel oder das Derby, und du hast die ganze Nacht nicht geschlafen.',
    optionen: [
      { label: 'Zu Hause bleiben und die Nacht begleiten', erfolg: { text: 'Das Fieber sinkt am Morgen. Du fehlst im Training, der Trainer zeigt Verständnis.', effekte: [T({ privatglueck: 7, trainerBeziehung: -1, fitness: -3, professionalitaet: -1 })] } },
      { label: 'Nach dem Arzt zum Spiel fahren', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['professionalitaet'] }, erfolg: { text: 'Es war nur ein Infekt. Du spielst trotz Müdigkeit überzeugend.', effekte: [T({ professionalitaet: 2, moral: 2, fitness: -3 })] }, misserfolg: { text: 'Du denkst nur an zu Hause, spielst fahrig und verlierst zwei Zweikämpfe zu viel.', effekte: [T({ moral: -3, selbstvertrauen: -3, privatglueck: -2 })] } },
    ],
  },

  // ---------------------------------------------------------------- Verlust & Gesundheit
  {
    id: 'l-tod-elternteil', kategorie: 'Familie', gewicht: 0.45, abstand: 900, bedingung: (c) => alterVon(c) >= 27 && !flag(c, 'elternteilVerloren'),
    titel: 'Der Anruf, den man nie bekommen will', text: 'Dein Handy klingelt mitten im Training. Es ist deine Schwester. Dein Vater ist tot, ein Herzinfarkt, ganz plötzlich. Du hörst nichts mehr außer dem Rauschen in deinen Ohren.',
    optionen: [
      { label: 'Sofort nach Hause fahren', erfolg: { text: 'Der Verein stellt dich frei. Die Familie hält zusammen. Du schaust in dein altes Kinderzimmer und schweigst lange.', effekte: [FLAG('elternteilVerloren'), T({ privatglueck: -6, moral: -8, trainerBeziehung: 2 }), FOLGE('l-trauer', 4)] } },
      { label: 'Das Training zu Ende bringen', erfolg: { text: 'Du läufst mechanisch weiter, bis die Beine nachgeben. Der Trainer schickt dich nach Hause.', effekte: [FLAG('elternteilVerloren'), T({ moral: -10, professionalitaet: -1, fitness: -3 }), FOLGE('l-trauer', 4)] } },
    ],
  },
  {
    id: 'l-trauer', kategorie: 'Familie', gewicht: 0,
    titel: 'Trauer', text: 'Wochen später hat der Alltag dich wieder, aber nichts fühlt sich normal an. Auf dem Platz fehlt dir die Leichtigkeit. Dein Vater hat jedes Spiel gesehen und jedes Mal danach kommentiert, auch die schlechten.',
    optionen: [
      { label: 'Mit einem Therapeuten sprechen', kosten: 600, hinweis: 'kostet 600 €', erfolg: { text: 'Es tut gut, offen über den Verlust zu reden. Der Schmerz bleibt, doch du kannst wieder atmen.', effekte: [T({ moral: 10, privatglueck: 6, gesundheit: 2 })] } },
      { label: 'Das nächste Tor deinem Vater widmen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['moral'] }, erfolg: { text: 'Du triffst, zeigst zum Himmel, und das ganze Stadion klatscht. Du weinst und lachst gleichzeitig.', effekte: [T({ moral: 9, fanbeliebtheit: 5, selbstvertrauen: 3 })] }, misserfolg: { text: 'Der Druck lähmt dich. Du hast zu viel gewollt und trotzdem nicht getroffen.', effekte: [T({ moral: -4, selbstvertrauen: -2 })] } },
      { label: 'Alles in dich hineinfressen', erfolg: { text: 'Du machst weiter wie immer. Nach außen. Innerlich bröckelt es.', effekte: [T({ moral: -5, privatglueck: -4, gesundheit: -2 })] } },
    ],
  },
  {
    id: 'l-burnout', kategorie: 'Gesundheit', gewicht: 1.2, abstand: 400, bedingung: (c) => profi(c) && trait(c, 'moral') < 28 && trait(c, 'privatglueck') < 35,
    titel: 'Ausgebrannt', text: 'Du stehst morgens auf und merkst: Nichts geht mehr. Das Trikot fühlt sich schwer an, der Ball auch. Die Kabine ist dir egal, die Fans auch. Dein Berater sagt: „Du brauchst Hilfe.“',
    optionen: [
      { label: 'Eine Auszeit nehmen', erfolg: { text: 'Der Verein stimmt zu. Drei Wochen Pause, Therapie, Spaziergänge. Langsam kehrt die Freude zurück.', effekte: [VERL('Erschöpfung', 3), T({ moral: 14, privatglueck: 12, gesundheit: 4, fitness: 6 })] } },
      { label: 'Durchziehen, bis es besser wird', hinweis: 'riskant', wurf: { basis: 0.3, traits: ['moral', 'gesundheit'] }, erfolg: { text: 'Mit viel Disziplin kommst du über den Berg. Du fühlst dich leer, aber dein Spiel bleibt solide.', effekte: [T({ moral: 5, professionalitaet: 3 })] }, misserfolg: { text: 'Du brichst im Training zusammen. Die Ärzte verordnen sechs Wochen Zwangspause.', effekte: [VERL('Burnout', 6), T({ moral: -3, gesundheit: -3 })] } },
      { label: 'Eine Woche Urlaub und dann weiter', kosten: 3500, hinweis: 'kostet 3.500 €', erfolg: { text: 'Strand, Sonne, ein Buch. Der Akku lädt etwas, die Ursache aber nicht.', effekte: [T({ moral: 7, privatglueck: 6, fitness: 4 })] } },
    ],
  },

  // ---------------------------------------------------------------- Lebensmitte & Karriere danach
  {
    id: 'l-midlife', kategorie: 'Privat', gewicht: 1.3, abstand: 500, bedingung: (c) => profi(c) && alterVon(c) >= 32 && !flag(c, 'midlife'),
    titel: 'Krise mit Mitte 30', text: 'Du stellst fest: Die meisten Mitspieler könnten deine Söhne sein. Morgens zwickt der Rücken, abends fragst du dich, was nach dem Fußball kommt. Im Autohaus stehst du plötzlich vor einem Cabrio.',
    optionen: [
      { label: 'Cabrio kaufen', kosten: 80_000, hinweis: 'kostet 80.000 €', erfolg: { text: 'Fahrtwind, laute Musik, für einen Nachmittag bist du wieder 20.', effekte: [FLAG('midlife'), T({ moral: 6, privatglueck: 3, ruf: 1 })] } },
      { label: 'Mit einem Coach über die Zukunft reden', kosten: 1200, hinweis: 'kostet 1.200 €', erfolg: { text: 'Ihr sprecht über Stärken, Ängste und Pläne. Du gehst mit einer Liste aus dem Büro.', effekte: [FLAG('midlife'), FLAG('nachKarriere'), T({ professionalitaet: 3, moral: 4, privatglueck: 2 })] } },
      { label: 'Weitermachen wie bisher', erfolg: { text: 'Du verdrängst das Thema. Es meldet sich später wieder.', effekte: [FLAG('midlife')] } },
    ],
  },
  {
    id: 'l-nach-karriere', kategorie: 'Karriere', gewicht: 1.3, abstand: 400, bedingung: (c) => profi(c) && alterVon(c) >= 30 && !flag(c, 'nachKarriere'),
    titel: 'Was kommt danach?', text: 'Ein Kollege hat gerade seine Karriere beendet und sitzt jetzt „zu Hause rum“. Du fragst dich: Was ist dein Plan B? Trainer, Funktionär, Experte im TV, Unternehmer?',
    optionen: [
      { label: 'Trainerschein anpeilen', erfolg: { text: 'Du meldest dich zum Lehrgang an und nimmst gleich die Taktik-Mappen mit in den Urlaub.', effekte: [FLAG('nachKarriere'), FLAG('trainerlizenz'), T({ professionalitaet: 3, ehrgeiz: 1 }), S({ positionsspiel: 1 })] } },
      { label: 'Ein Fernstudium (BWL) beginnen', kosten: 3500, hinweis: 'kostet 3.500 €', erfolg: { text: 'Neben dem Training pauken: Bilanzen, Marketing, Personalführung. Anstrengend, aber sinnvoll.', effekte: [FLAG('nachKarriere'), FLAG('studium'), T({ professionalitaet: 3, fitness: -2, disziplin: 2 })] } },
      { label: 'In ein Café investieren', kosten: 40_000, hinweis: 'kostet 40.000 €', wurf: { basis: 0.55, traits: ['professionalitaet'] }, erfolg: { text: 'Dein Café wird zum Treffpunkt des Viertels. Die Einnahmen sind bescheiden, aber ein Anfang.', effekte: [FLAG('nachKarriere'), G(60_000), T({ privatglueck: 3, ruf: 1 })] }, misserfolg: { text: 'Die Miete ist zu hoch, der Kaffee zu teuer, die Gäste bleiben aus. Du schließt nach einem Jahr.', effekte: [FLAG('nachKarriere'), T({ moral: -3 })] } },
      { label: 'Gar nichts planen', erfolg: { text: 'Du konzentrierst dich auf das Hier und Jetzt. Die Zukunft kommt von selbst.', effekte: [T({ moral: 1 })] } },
    ],
  },
  {
    id: 'l-abschiedsspiel', kategorie: 'Karriere', gewicht: 0.9, abstand: 900, bedingung: (c) => profi(c) && alterVon(c) >= 34 && c.saisonStats.spiele >= 3 && !flag(c, 'abschiedsspiel'),
    titel: 'Ein Abschiedsspiel für einen Freund', text: 'Dein alter Mitspieler {freund} beendet seine Karriere und lädt dich zum Abschiedsspiel ein. Eine Halbzeit Legenden, dann eine Gala. Du bekommst eine Gänsehaut allein bei dem Gedanken.',
    optionen: [
      { label: 'Natürlich hinfahren', erfolg: { text: 'Das Stadion tobt, ihr dreht gemeinsam eine Ehrenrunde, und du merkst: Fußball verbindet.', effekte: [FLAG('abschiedsspiel'), T({ privatglueck: 8, moral: 6, fanbeliebtheit: 3, fitness: -2 })] } },
      { label: 'Absagen, du musst dich schonen', erfolg: { text: '{freund} sagt, er verstehe das. Aber so ganz glaubt er es nicht.', effekte: [FLAG('abschiedsspiel'), T({ privatglueck: -4, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'l-silberhochzeit', kategorie: 'Privat', gewicht: 0.8, abstand: 800, bedingung: (c) => flag(c, 'verheiratet') && hatPartner(c) && trait(c, 'privatglueck') > 60 && alterVon(c) >= 30,
    titel: 'Hochzeitstag', text: 'Ein großer Hochzeitstag steht an. {partner} sagt, sie brauche gar nichts, und meint damit natürlich das Gegenteil.',
    optionen: [
      { label: 'Romantisches Wochenende planen', kosten: 2500, hinweis: 'kostet 2.500 €', erfolg: { text: 'Kerzenlicht, Meer, Tanzschritte. {partner} strahlt.', effekte: [T({ privatglueck: 10, moral: 4 })] } },
      { label: 'Erneuerung des Eheversprechens', kosten: 6000, hinweis: 'kostet 6.000 €', erfolg: { text: 'Vor Familie und Freunden sagt ihr noch einmal Ja. Die Tränen fließen.', effekte: [T({ privatglueck: 13, moral: 5, fanbeliebtheit: 2 })] } },
      { label: 'Vergessen', hinweis: 'riskant', wurf: { basis: 0.2 }, erfolg: { text: '{partner} hat selbst nicht dran gedacht. Glück gehabt!', effekte: [T({ privatglueck: 1 })] }, misserfolg: { text: 'Du hast den Tag vergessen. {partner} sagt nichts. Genau das ist das Problem.', effekte: [T({ privatglueck: -10, moral: -3 })] } },
    ],
  },
  {
    id: 'l-haus-nachbar', kategorie: 'Privat', gewicht: 0.9, abstand: 500, bedingung: (c) => profi(c) && (flag(c, 'haus') || hatBesitz(c, 'eltern-haus')) && gehalt(c) > 100_000,
    titel: 'Ärger mit dem Nachbarn', text: 'Dein Nachbar beschwert sich über den Lärm, deine Lichter, dein Auto in der Einfahrt und die Selfies vor dem Gartenzaun. Er hat sogar einen Anwalt eingeschaltet.',
    optionen: [
      { label: 'Persönlich klingeln und reden', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['professionalitaet'] }, erfolg: { text: 'Ihr trinkt Kaffee und klärt alles. Er will am Ende ein Trikot für seinen Enkel.', effekte: [T({ privatglueck: 3, fanbeliebtheit: 1 })] }, misserfolg: { text: 'Der Nachbar wird laut, filmt alles und stellt es ins Netz.', effekte: [T({ fanbeliebtheit: -2, privatglueck: -3 }), NEWS('Nachbarschaftsstreit: {name} im Visier')] } },
      { label: 'Schallschutz und Hecke einbauen', kosten: 8000, hinweis: 'kostet 8.000 €', erfolg: { text: 'Ruhe kehrt ein. Teuer, aber nachhaltig.', effekte: [T({ privatglueck: 4 })] } },
    ],
  },
  {
    id: 'l-jugendfreund-besuch', kategorie: 'Privat', gewicht: 1.2, abstand: 400, bedingung: (c) => profi(c) && trait(c, 'ruf') > 35 && alterVon(c) >= 24,
    titel: 'Ein alter Freund meldet sich', text: 'Ein Kumpel aus der Jugend ruft an, ihr hattet fast fünf Jahre keinen Kontakt. „Ich bin in der Stadt. Hast du Zeit?“ Du hast im Prinzip keine, aber du erinnerst dich noch an die alten Bolzplatz-Zeiten.',
    optionen: [
      { label: 'Treffen und ehrlich quatschen', erfolg: { text: 'Ihr sitzt drei Stunden zusammen, lacht über früher und schweigt über die Gegenwart. Es tut gut.', effekte: [T({ privatglueck: 7, moral: 4 })] } },
      { label: 'Zeit haben, aber ihm Geld leihen', kosten: 5000, hinweis: 'kostet 5.000 €', erfolg: { text: 'Er braucht Hilfe, du hilfst. Er sagt: „Ich zahle es zurück.“ Du bist dir nicht sicher.', effekte: [T({ privatglueck: 3, ruf: 1 })] } },
      { label: 'Höflich absagen', erfolg: { text: 'Du hast keine Zeit. Er schreibt nicht zurück.', effekte: [T({ privatglueck: -3 })] } },
    ],
  },
]
