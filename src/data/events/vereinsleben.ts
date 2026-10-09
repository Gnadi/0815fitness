import { VEREINE } from '../clubs'
import { AKT, FELDSPIELER, FLAG, FOLGE, G, NEWS, S, STAERKE, T, VERL, alterVon, anteil, flag, gehalt, imAusland, inLand, jugend, landVerein, ov, profi, spieltag, staerkeVerein, trait } from './helpers'
import type { Career } from '../../engine/types'
import type { EreignisDef } from './types'

const fenster = (c: Career): 'sommer' | 'winter' | null => {
  const s = c.saison.kalender[c.uhr.woche - 1]
  return s?.t === 'F' ? (s.fenster ?? null) : null
}
const liga = (c: Career): boolean => profi(c) && !c.saison.jugend && spieltag(c) > 0
/** Anzahl abgeschlossener Saisons im aktuellen Land. */
const saisonenImLand = (c: Career): number => c.historie.filter((h) => VEREINE[h.vereinId]?.land === landVerein(c)).length

const SKI = ['AT', 'CH', 'SI', 'LI', 'AD']
const WARM = ['ES', 'PT', 'GR', 'CY', 'MT', 'IT']
const NORD = ['IS', 'NO', 'FI', 'SE', 'EE', 'FO', 'LV', 'LT']
const OST = ['RU', 'KZ', 'AZ', 'GE', 'AM', 'BY', 'UA']
const STEUER = ['CH', 'LU', 'CY', 'MT', 'AD', 'LI', 'BG']

/** Paket 4: Vereinsdramen, Reisen und Ereignisse mit Länderbezug. */
export const VEREINSLEBEN: EreignisDef[] = [
  // ---------------------------------------------------------------- Vereinsdramen
  {
    id: 'vd-investor', kategorie: 'Verein', gewicht: 1, abstand: 700, bedingung: (c) => profi(c) && staerkeVerein(c) < 85 && staerkeVerein(c) > 40,
    titel: 'Investor übernimmt den Klub', text: 'Ein Konsortium aus dem Ausland kauft 60 Prozent der Anteile an {verein}. Der Präsident präsentiert die neuen Eigentümer in Maßanzügen, Fans halten Schilder mit „Tradition statt Investor“ hoch. In der Kabine wird über Gehaltserhöhungen getuschelt.',
    optionen: [
      { label: 'Den Neuanfang begrüßen', erfolg: { text: 'Neue Trainingsplätze, neue Spieler, neue Hoffnung. Die Stimmung in der Kabine steigt.', effekte: [STAERKE(3), T({ moral: 5, kabine: 2, fanbeliebtheit: -2 }), NEWS('Investor übernimmt {verein}')] } },
      { label: 'Skeptisch bleiben und mit der Kurve sprechen', erfolg: { text: 'Du sagst: „Ich spiele für diesen Verein, nicht für den Investor.“ Die Kurve singt deinen Namen.', effekte: [STAERKE(2), T({ fanbeliebtheit: 6, ruf: 1, trainerBeziehung: -1 })] } },
      { label: 'Gehaltserhöhung verlangen', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['ruf'] }, erfolg: { text: 'Die neue Führung will Stars halten: Dein Vertrag wird aufgebessert.', effekte: [STAERKE(3), AKT('gehaltserhoehung'), T({ moral: 4 })] }, misserfolg: { text: 'Man weist dich ab: „Die Zeit der Extrawürste ist vorbei.“', effekte: [STAERKE(3), T({ moral: -3, trainerBeziehung: -2 })] } },
    ],
  },
  {
    id: 'vd-insolvenz', kategorie: 'Verein', gewicht: 0, abstand: 500,
    titel: 'Insolvenzantrag', text: 'Der Verein hat Insolvenz angemeldet! Schlagzeilen, Fernsehteams und besorgte Eltern vor dem Vereinsgelände. Der Insolvenzverwalter sagt: „Wir müssen sparen. Gehälter werden vorerst gekürzt.“',
    optionen: [
      { label: 'Gehalt kürzen lassen und kämpfen', erfolg: { text: 'Du hältst durch und gibst der Mannschaft Halt. Die Fans werden dich nie vergessen.', effekte: [STAERKE(-4), G((c) => -Math.round(gehalt(c) * 0.06)), T({ fanbeliebtheit: 9, kabine: 6, moral: -2, ruf: 2 }), NEWS('{name} bleibt trotz Insolvenz bei {verein}')] } },
      { label: 'Wechsel einfädeln', erfolg: { text: 'Dein Berater telefoniert in alle Richtungen. Du darfst den sinkenden Dampfer verlassen, wenn jemand zahlt.', effekte: [STAERKE(-4), AKT('wechselwunsch'), T({ fanbeliebtheit: -4, kabine: -3 })] } },
      { label: 'Abwarten und Sparen', erfolg: { text: 'Du drehst jeden Euro zweimal um. Nach acht Wochen ist der Verein gerettet, aber nicht saniert.', effekte: [STAERKE(-2), T({ moral: -2, professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'vd-praesident-weg', kategorie: 'Verein', gewicht: 1, abstand: 500, bedingung: (c) => profi(c) && trait(c, 'ruf') > 20,
    titel: 'Der Präsident tritt zurück', text: 'Nach monatelanger Kritik tritt der Präsident zurück. In der Kabine wird gejubelt und gegrübelt. Ein Nachfolger muss her. Der Aufsichtsrat bittet auch Spieler um ihre Meinung.',
    optionen: [
      { label: 'Für den altgedienten Vizepräsidenten werben', erfolg: { text: 'Der Vizepräsident wird gewählt. Er dankt dir mit einer persönlichen Nachricht.', effekte: [T({ kabine: 2, trainerBeziehung: 2, ruf: 1 })] } },
      { label: 'Für den frischen Quereinsteiger stimmen', hinweis: 'riskant', wurf: { basis: 0.55 }, erfolg: { text: 'Der Neue räumt auf, investiert in die Jugend, und der Verein blüht.', effekte: [STAERKE(2), T({ moral: 4, fanbeliebtheit: 2 })] }, misserfolg: { text: 'Der Neue entpuppt sich als Blender. Drei Monate später ist er bereits Geschichte.', effekte: [STAERKE(-2), T({ moral: -3, fanbeliebtheit: -2 })] } },
      { label: 'Neutral bleiben', erfolg: { text: 'Du konzentrierst dich auf deinen Job, das Drama lässt dich kalt.', effekte: [T({ professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'vd-stadion-neubau', kategorie: 'Verein', gewicht: 1, abstand: 600, bedingung: (c) => profi(c) && staerkeVerein(c) > 55,
    titel: 'Stadion-Neubau mit Namensrechten', text: 'Der Verein verkündet ein neues Stadion, finanziert durch Namensrechte eines Versicherungskonzerns. Die Fans sind gespalten: modernere Arena gegen Tradition. Du wirst zur Grundsteinlegung eingeladen.',
    optionen: [
      { label: 'Spaten ansetzen und strahlen', erfolg: { text: 'Das Foto geht durch alle Zeitungen. Die Verantwortlichen sind begeistert.', effekte: [STAERKE(1), T({ ruf: 1, fanbeliebtheit: -1, trainerBeziehung: 1 })] } },
      { label: 'Die Fans verstehen und sagen: „Tradition bleibt“', erfolg: { text: 'Du sagst: „Ein Stadion ist mehr als Beton.“ Die Kurve jubelt, die Vereinsführung knurrt.', effekte: [T({ fanbeliebtheit: 5, ruf: 1, trainerBeziehung: -2 })] } },
      { label: 'Fernbleiben', erfolg: { text: 'Du hast einen wichtigen Termin und ersparst dir das Theater.', effekte: [T({ fanbeliebtheit: -1 })] } },
    ],
  },
  {
    id: 'vd-fanproteste', kategorie: 'Verein', gewicht: 1.3, abstand: 250, bedingung: (c) => liga(c) && trait(c, 'fanbeliebtheit') < 70 && c.form < 55,
    titel: 'Fanproteste gegen die Führung', text: 'Beim Heimspiel fliegen Tennisbälle aufs Feld, das Spiel wird unterbrochen. Banner: „Präsident raus!“. Die Fans wollen, dass die Mannschaft sich positioniert. Alle schauen auf dich.',
    optionen: [
      { label: 'Nach dem Spiel zur Kurve gehen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['fanbeliebtheit', 'selbstvertrauen'] }, erfolg: { text: 'Du hörst zu, nickst und versprichst, intern darüber zu sprechen. Die Kurve respektiert das.', effekte: [T({ fanbeliebtheit: 6, ruf: 1, kabine: 2 })] }, misserfolg: { text: 'Ein Fan wirft einen Becher, die Stimmung kippt. Du verschwindest schnell im Spielertunnel.', effekte: [T({ fanbeliebtheit: -2, moral: -2 })] } },
      { label: 'Neutral bleiben', erfolg: { text: 'Du sagst, dass du dich um Sport kümmerst. Beide Lager sind enttäuscht.', effekte: [T({ fanbeliebtheit: -2, trainerBeziehung: 1 })] } },
      { label: 'Die Klubführung öffentlich kritisieren', hinweis: 'riskant', wurf: { basis: 0.3, traits: ['ruf'] }, erfolg: { text: 'Die Fans lieben dich, die Führung beißt auf die Lippen. Die Spannung bleibt.', effekte: [T({ fanbeliebtheit: 9, ruf: 2, trainerBeziehung: -4 })] }, misserfolg: { text: 'Der Verein sperrt dich für das nächste Spiel (intern) und verhängt eine Geldstrafe.', effekte: [G(anteil(0.02, 500)), T({ trainerBeziehung: -6, fanbeliebtheit: 3 }), AKT('skandal')] } },
    ],
  },
  {
    id: 'vd-pyro', kategorie: 'Verein', gewicht: 1.2, abstand: 250, bedingung: (c) => liga(c) && c.saison.tabelle[c.vereinId]?.[0] > 4,
    titel: 'Pyro-Strafe', text: 'Der Verband verhängt eine saftige Geldstrafe gegen den Verein wegen Pyrotechnik in der Kurve. Der Klub überlegt, die Strafe auf die Spieler umzulegen. Die Kabine ist gespalten.',
    optionen: [
      { label: 'Anteil von der Prämie abgeben', erfolg: { text: 'Du zeigst Teamgeist. Die Mannschaft folgt deinem Beispiel, und die Fans erfahren davon.', effekte: [G(-800), T({ kabine: 5, fanbeliebtheit: 3 })] } },
      { label: 'Dagegenhalten: „Das ist Sache des Vereins!“', erfolg: { text: 'Du verteidigst die Kollegen und protestierst. Die Verantwortlichen sind verärgert, die Kabine nickt.', effekte: [T({ kabine: 4, trainerBeziehung: -2 })] } },
      { label: 'Die Fans öffentlich zur Vernunft aufrufen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['fanbeliebtheit'] }, erfolg: { text: 'Die Aktion kommt gut an. Beim nächsten Spiel bleibt alles friedlich.', effekte: [T({ fanbeliebtheit: 3, professionalitaet: 2, ruf: 1 })] }, misserfolg: { text: 'Einige Ultras fühlen sich verraten und starten eine Beleidigungswelle gegen dich.', effekte: [T({ fanbeliebtheit: -5, moral: -2 })] } },
    ],
  },
  {
    id: 'vd-derby', kategorie: 'Verein', gewicht: 2, abstand: 70, bedingung: liga,
    titel: 'Derby-Woche', text: 'Das Derby gegen den Stadtrivalen steht an. Die Zeitungen titeln schon seit Montag, der Busfahrer trägt Vereinsfarben, und selbst dein Bäcker will „einen Sieg, sonst gibt’s kein Brötchen“. Beim Training liegt Spannung in der Luft.',
    optionen: [
      { label: 'Den Rivalen vorab provozieren', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['selbstvertrauen'] }, erfolg: { text: 'Dein frecher Spruch trifft ins Schwarze. Die Fans lieben es, die Gegner kochen.', effekte: [T({ fanbeliebtheit: 5, selbstvertrauen: 4, ruf: 1 })] }, misserfolg: { text: 'Der Spruch geht nach hinten los. Die Gegner geben die Antwort auf dem Platz, und die Kurve pfeift.', effekte: [T({ fanbeliebtheit: -3, selbstvertrauen: -3 })] } },
      { label: 'Respekt zeigen und ruhig bleiben', erfolg: { text: 'Du sagst: „Wir spielen Fußball, keinen Krieg.“ Ein Satz, den alle zitieren.', effekte: [T({ professionalitaet: 3, fanbeliebtheit: 1, ruf: 1 })] } },
      { label: 'Mit den Fans im Stadtteil feiern', erfolg: { text: 'Du gehst in die Fankneipe, erzählst Geschichten, trinkst Cola und verlässt die Kneipe als Held.', effekte: [T({ fanbeliebtheit: 7, kabine: 1, fitness: -1 })] } },
    ],
  },
  {
    id: 'vd-nummer', kategorie: 'Verein', positionen: FELDSPIELER, gewicht: 1.1, abstand: 500, bedingung: (c) => profi(c) && trait(c, 'ruf') > 30 && !flag(c, 'zehner'),
    titel: 'Die legendäre Nummer 10', text: 'Die Rückennummer 10 wird frei, getragen von einer Klublegende. Der Verein bietet sie dir an, aber der Druck wäre groß. Die Fans haben bereits „Wer wird der neue Zehner?“-Umfragen.',
    optionen: [
      { label: 'Die 10 übernehmen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['selbstvertrauen', 'ruf'] }, erfolg: { text: 'Du wächst an der Verantwortung. Die Trikotverkäufe explodieren, das Stadion singt.', effekte: [FLAG('zehner'), G(anteil(0.1, 3000)), T({ fanbeliebtheit: 5, selbstvertrauen: 4, ruf: 2 })] }, misserfolg: { text: 'Die Last der Nummer zerdrückt dich. Jeder Fehlpass wird mit „Zehner unwürdig“ kommentiert.', effekte: [FLAG('zehner'), T({ selbstvertrauen: -5, fanbeliebtheit: -2 })] } },
      { label: 'Bei deiner Nummer bleiben', erfolg: { text: 'Du sagst: „Eine Nummer macht keinen Spieler.“ Die Fans akzeptieren es, wenn auch mit Wehmut.', effekte: [FLAG('zehner'), T({ professionalitaet: 1, fanbeliebtheit: 1 })] } },
    ],
  },
  {
    id: 'vd-elfmeter', kategorie: 'Verein', positionen: FELDSPIELER, gewicht: 1.4, abstand: 400, bedingung: (c) => liga(c) && ov(c) > 58 && trait(c, 'selbstvertrauen') > 50 && !flag(c, 'elferschuetze'),
    titel: 'Wer schießt die Elfer?', text: 'Der Stammschütze ist verletzt, und {trainer} schaut in die Runde. „Wer übernimmt?“ Die Kabine schweigt. Dann deutet {kapitaen} auf dich: „Er hat Nerven.“',
    optionen: [
      { label: 'Ja, ich mach das', hinweis: 'riskant', wurf: { basis: 0.6, skills: ['schuss'], traits: ['selbstvertrauen'] }, erfolg: { text: 'Du verwandelst den ersten Strafstoß eiskalt. Ab sofort bist du der Mann für die Nerven.', effekte: [FLAG('elferschuetze'), T({ selbstvertrauen: 5, fanbeliebtheit: 3, trainerBeziehung: 2 }), FOLGE('vd-elfer-serie', 30, 0.8)] }, misserfolg: { text: 'Dein erster Elfer landet am Pfosten. Du schaust den Ball hinterher und spürst die Blicke im Rücken.', effekte: [FLAG('elferschuetze'), T({ selbstvertrauen: -4, fanbeliebtheit: -1 }), FOLGE('vd-elfer-serie', 30, 0.8)] } },
      { label: 'Lieber jemand anderes', erfolg: { text: 'Du überlässt es einem Kollegen. Kein Risiko, aber auch keine Chance auf Ruhm.', effekte: [FLAG('elferschuetze'), T({ kabine: 1 })] } },
    ],
  },
  {
    id: 'vd-elfer-serie', kategorie: 'Verein', positionen: FELDSPIELER, gewicht: 0, abstand: 100,
    titel: 'Elfmeter-Serie', text: 'Du stehst wieder am Punkt. Zuletzt ging es hin und her, mal drin, mal halbhoch dem Torwart in die Arme. Die Fans singen, die Gegner pfeifen, der Torwart wedelt mit den Armen.',
    optionen: [
      { label: 'Flach in die Ecke', hinweis: 'riskant', wurf: { basis: 0.65, skills: ['schuss'], traits: ['selbstvertrauen'] }, erfolg: { text: 'Drin! Du jubelst vor der Kurve. Das war genau, was die Mannschaft brauchte.', effekte: [T({ selbstvertrauen: 4, fanbeliebtheit: 3, kabine: 2 }), S({ schuss: 1 })] }, misserfolg: { text: 'Der Torwart ahnt die Ecke. Gehalten! Der Frust lässt dich minutenlang nicht los.', effekte: [T({ selbstvertrauen: -4, fanbeliebtheit: -2 })] } },
      { label: 'Wuchtig in die Mitte', hinweis: 'riskant', wurf: { basis: 0.6, skills: ['schuss'] }, erfolg: { text: 'Der Ball zischt unter die Latte. Spektakulär, aber mutig!', effekte: [T({ selbstvertrauen: 5, fanbeliebtheit: 4 })] }, misserfolg: { text: 'Der Ball fliegt in den dritten Rang. Das Stadion verstummt.', effekte: [T({ selbstvertrauen: -5, fanbeliebtheit: -3 })] } },
      { label: 'Dem Kapitän den Vortritt lassen', erfolg: { text: 'Du übergibst den Ball. Der Kapitän trifft, die Stimmung ist gerettet. Aber du fragst dich, ob du den Mut hättest.', effekte: [T({ kabine: 2, selbstvertrauen: -1 })] } },
    ],
  },
  {
    id: 'vd-sportdirektor-weg', kategorie: 'Verein', gewicht: 1, abstand: 500, bedingung: (c) => profi(c) && staerkeVerein(c) > 45 && trait(c, 'trainerBeziehung') > 20,
    titel: 'Neuer Sportdirektor', text: 'Der langjährige Sportdirektor hat einen Job bei einem Spitzenklub bekommen. Sein Nachfolger ist 38, frisch von der Uni und redet von „Datenmodellen“. Er will alle Spieler neu bewerten.',
    optionen: [
      { label: 'Zum Antrittsgespräch bitten', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['professionalitaet', 'ruf'] }, erfolg: { text: 'Deine Zahlen sind gut. Der Neue sieht in dir einen Baustein der Zukunft.', effekte: [T({ trainerBeziehung: 5, moral: 3, ruf: 1 })] }, misserfolg: { text: 'Seine Tabellen sagen: Du bist ersetzbar. Das Gespräch endet kühl.', effekte: [T({ trainerBeziehung: -3, moral: -3 })] } },
      { label: 'Leistung sprechen lassen', erfolg: { text: 'Du konzentrierst dich auf Training und Spiel. Zahlen lügen nicht, und deine sind gut.', effekte: [T({ professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'vd-legende-co', kategorie: 'Verein', gewicht: 1, abstand: 500, bedingung: (c) => profi(c) && alterVon(c) <= 27,
    titel: 'Klublegende als Co-Trainer', text: 'Die Klublegende, 20 Jahre lang Kapitän und Meistertorschütze, kehrt als Co-Trainer zurück. In seinem ersten Training schaut er sich vor allem die jungen Spieler an. Dich inklusive.',
    optionen: [
      { label: 'Um Extraeinheiten bitten', positionen: FELDSPIELER, kosten: 300, hinweis: 'kostet 300 €', erfolg: { text: 'Er zeigt dir seine Tricks vor dem Tor und im Zweikampf. Eine unbezahlbare Lektion.', effekte: [S({ positionsspiel: 2, schuss: 1 }), T({ trainerBeziehung: 3, professionalitaet: 2, fitness: -2 })] } },
      { label: 'Um Extraeinheiten bitten', positionen: ['TW'], kosten: 300, hinweis: 'kostet 300 €', erfolg: { text: 'Er zeigt dir seine Tricks im Strafraum, beim Herauslaufen und beim Stellungsspiel. Eine unbezahlbare Lektion.', effekte: [S({ positionsspiel: 2, defensive: 1 }), T({ trainerBeziehung: 3, professionalitaet: 2, fitness: -2 })] } },
      { label: 'Respektvoll Abstand halten', erfolg: { text: 'Er nickt dir freundlich zu, aber mehr passiert nicht.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },

  // ---------------------------------------------------------------- Reisen
  {
    id: 'vd-asien-tour', kategorie: 'Verein', gewicht: 1.5, abstand: 300, bedingung: (c) => profi(c) && fenster(c) === 'sommer' && staerkeVerein(c) >= 68,
    titel: 'Asien-Tour mit Sponsoren', text: 'Der Verein reist zur Sommertour nach Asien: zwölf Stunden Flug, Fan-Events, Sponsorentermine, drei Testspiele in schwüler Hitze. Ein Marketing-Mensch erklärt: „Wir müssen die Marke weltweit stärken.“',
    optionen: [
      { label: 'Alles mitmachen', hinweis: 'riskant', wurf: { basis: 0.6, traits: ['fitness', 'professionalitaet'] }, erfolg: { text: 'Du bist überall dabei, lächelst in Selfies und liefert auch auf dem Platz. Der Verein ist beeindruckt.', effekte: [T({ fanbeliebtheit: 5, ruf: 2, trainerBeziehung: 2, fitness: -4 }), G(anteil(0.04, 1000))] }, misserfolg: { text: 'Jetlag, Hitze und Termine zehren an dir. Ein Magen-Darm-Infekt setzt dich zwei Wochen außer Gefecht.', effekte: [VERL('Magen-Darm-Infekt', 2), T({ moral: -2, fanbeliebtheit: 2 })] } },
      { label: 'Sich schonen, nur das Nötigste tun', erfolg: { text: 'Du sagst Selfie-Termine ab und konzentrierst dich auf Training und Schlaf.', effekte: [T({ fitness: 3, fanbeliebtheit: -2, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'vd-dubai', kategorie: 'Verein', gewicht: 1.3, abstand: 250, bedingung: (c) => profi(c) && fenster(c) === 'winter' && staerkeVerein(c) >= 72,
    titel: 'Wintertrainingslager in Dubai', text: 'Ihr fliegt im Winter nach Dubai: 28 Grad, Sonne, Luxushotel und ein Fitnessstudio, das aussieht wie ein Raumschiff. Der Trainer warnt: „Wer hier Urlaub macht, fliegt raus.“',
    optionen: [
      { label: 'Knallhart durchziehen', erfolg: { text: 'Du kommst gebräunt und topfit zurück, bereit für die Rückrunde.', effekte: [S({ physis: 1, tempo: 1 }), T({ fitness: 7, professionalitaet: 3, trainerBeziehung: 2 })] } },
      { label: 'Die Zeit auch genießen', hinweis: 'riskant', wurf: { basis: 0.6, traits: ['disziplin'] }, erfolg: { text: 'Training und Pool im Gleichgewicht. Gute Mischung, gute Laune.', effekte: [T({ fitness: 4, moral: 5, kabine: 2 })] }, misserfolg: { text: 'Ein Abend an der Bar zieht sich in die Länge. Der Trainer erfährt es am nächsten Morgen.', effekte: [T({ disziplin: -3, trainerBeziehung: -4, fitness: -2 }), G(anteil(0.01, 200))] } },
    ],
  },

  // ---------------------------------------------------------------- Länderspezifisch
  {
    id: 'la-tuerkei-empfang', kategorie: 'Verein', gewicht: 2, abstand: 200, bedingung: (c) => inLand(c, 'TR') && profi(c),
    titel: 'Flughafenempfang mit Fackeln', text: 'Nach dem Auswärtssieg wartet am Flughafen eine Menge Fans mit Fackeln, Trommeln und Gesängen. Mitten in der Nacht. Jemand reicht dir einen Schal, ein anderer will ein Kind hochhalten, und der Busfahrer hupt im Takt.',
    optionen: [
      { label: 'In die Menge eintauchen', erfolg: { text: 'Du tanzt, singst mit und lässt dich feiern. Das Video geht in der ganzen Türkei viral.', effekte: [T({ fanbeliebtheit: 8, ruf: 2, fitness: -2 })] } },
      { label: 'Mit dem Bus winken und weiterfahren', erfolg: { text: 'Du hebst die Hand zum Gruß. Die Fans singen deinen Namen weiter.', effekte: [T({ fanbeliebtheit: 3 })] } },
    ],
  },
  {
    id: 'la-england-weihnachten', kategorie: 'Verein', gewicht: 2, abstand: 50, bedingung: (c) => inLand(c, 'EN') && liga(c),
    titel: 'Weihnachten ist Fußball-Zeit', text: 'In England gibt es keine Winterpause. Zwischen den Feiertagen spielt ihr alle 48 Stunden, der Boxing-Day-Anpfiff ist ein Muss. Der Physio sagt: „Ihr dürft nicht ausfallen!“ Dein Körper meldet sich zu Wort.',
    optionen: [
      { label: 'Durchbeißen und Rotation akzeptieren', erfolg: { text: 'Du bekommst Pausen, wenn du sie brauchst, und lieferst, wenn’s drauf ankommt.', effekte: [T({ professionalitaet: 3, fitness: -3, trainerBeziehung: 2 })] } },
      { label: 'Alles spielen wollen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['fitness', 'gesundheit'] }, erfolg: { text: 'Der Körper hält. Die Fans schreiben: „Eiserner Mann!“', effekte: [T({ fanbeliebtheit: 5, ruf: 1, fitness: -6 })] }, misserfolg: { text: 'Beim dritten Spiel in sechs Tagen zieht der Oberschenkel.', effekte: [VERL('Muskelfaserriss', 3), T({ moral: -3 })] } },
    ],
  },
  {
    id: 'la-italien-tifosi', kategorie: 'Verein', gewicht: 1.8, abstand: 200, bedingung: (c) => inLand(c, 'IT') && profi(c) && c.form < 55,
    titel: 'Die Tifosi am Trainingsplatz', text: 'Nach dem Heimspiel stehen die Tifosi auf der Tribüne des Trainingsplatzes, schreien und diskutieren. „Zeig uns, was du kannst!“ Ein Kapo mit Megafon kommentiert jeden Pass.',
    optionen: [
      { label: 'Mit den Tifosi reden', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['selbstvertrauen', 'fanbeliebtheit'] }, erfolg: { text: 'Du hörst zu, nickst und versprichst Einsatz. Die Tifosi klatschen: „Bravo, Ragazzo!“', effekte: [T({ fanbeliebtheit: 6, moral: 2 })] }, misserfolg: { text: 'Die Diskussion eskaliert. Es fliegen Schimpfwörter auf Italienisch und ein Schal.', effekte: [T({ fanbeliebtheit: -3, moral: -2 })] } },
      { label: 'Durchs Seitentor verschwinden', erfolg: { text: 'Ärger vermieden, Respekt auch. Die Tifosi merken sich so etwas.', effekte: [T({ fanbeliebtheit: -2 })] } },
    ],
  },
  {
    id: 'la-hitze', kategorie: 'Gesundheit', gewicht: 1.6, abstand: 100, bedingung: (c) => inLand(c, ...WARM) && profi(c),
    titel: '38 Grad im Schatten', text: 'Die Mittagssonne brennt, das Thermometer zeigt 38 Grad, und im Trainingsplan stehen zwei Einheiten. Der Platzwart hat den Rasen bereits dreimal gewässert, und trotzdem flimmert die Luft.',
    optionen: [
      { label: 'Viel trinken und Einheiten anpassen', erfolg: { text: 'Du hörst auf den Körper. Das Training bleibt effektiv, die Gesundheit auch.', effekte: [T({ fitness: 2, gesundheit: 2, professionalitaet: 2 })] } },
      { label: 'Wie ein Löwe durchziehen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['gesundheit', 'fitness'] }, erfolg: { text: 'Du läufst, schwitzt und gehst als Sieger vom Platz. Die Mitspieler schütteln den Kopf.', effekte: [S({ physis: 1 }), T({ fitness: -2, kabine: 2 })] }, misserfolg: { text: 'Kreislaufkollaps! Der Teamarzt rennt mit einer Trage über den Platz.', effekte: [VERL('Kreislaufkollaps', 1), T({ gesundheit: -4 })] } },
    ],
  },
  {
    id: 'la-norden-dunkel', kategorie: 'Privat', gewicht: 1.6, abstand: 200, bedingung: (c) => inLand(c, ...NORD) && profi(c),
    titel: 'Polarnacht', text: 'Wochenlang geht die Sonne kaum auf, bei minus zwölf Grad. Das Training findet in der Halle statt, und morgens ist es dunkel, abends auch. Im Kalender stehen Wellness-Tipps: „Lichttherapie, Vitamin D, Sauna.“',
    optionen: [
      { label: 'Sauna und Lichttherapie nutzen', kosten: 400, hinweis: 'kostet 400 €', erfolg: { text: 'Du gewöhnst dich an die Dunkelheit. Du bist erholt und mental stark.', effekte: [T({ moral: 4, fitness: 3, privatglueck: 3 })] } },
      { label: 'Ins Fitnessstudio flüchten', erfolg: { text: 'Du verbringst die Tage zwischen Gewichten und Laufband. Körperlich stärker, geistig etwas müde.', effekte: [S({ physis: 1 }), T({ privatglueck: -2, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'la-ost-reise', kategorie: 'Verein', gewicht: 1.6, abstand: 120, bedingung: (c) => inLand(c, ...OST) && liga(c),
    titel: 'Acht Stunden Auswärtsfahrt', text: 'Das nächste Auswärtsspiel ist 5.000 Kilometer entfernt. Charterflug, Zeitverschiebung, Hotelzimmer ohne Heizung. Der Mannschaftsarzt hat Tabletten gegen Jetlag und schlechte Laune.',
    optionen: [
      { label: 'Ruhe bewahren und im Flieger schlafen', erfolg: { text: 'Du kommst ausgeruht an und spielst solide.', effekte: [T({ fitness: 2, professionalitaet: 2 })] } },
      { label: 'Kartenspielen mit den Kollegen', erfolg: { text: 'Bei vier Stunden Poker wird gelacht, geflucht und ein Teamgeist geschmiedet.', effekte: [T({ kabine: 4, fitness: -3, moral: 2 })] } },
    ],
  },
  {
    id: 'la-de-fanbeteiligung', kategorie: 'Verein', gewicht: 1.4, abstand: 350, bedingung: (c) => inLand(c, 'DE') && profi(c) && trait(c, 'ruf') > 20,
    titel: 'Die 50+1-Debatte', text: 'Im Verein wird heiß diskutiert, ob ein Investor mehr Anteile erhalten darf. Die Mitglieder wollen abstimmen, die Ultras drohen mit Boykott. Der Vorstand fragt, ob ein bekannter Spieler eine Stellungnahme abgibt.',
    optionen: [
      { label: 'Sich für die Mitgliederrechte aussprechen', erfolg: { text: 'Du sagst: „Der Verein gehört den Fans.“ Applaus von der Kurve, Stirnrunzeln im Büro.', effekte: [T({ fanbeliebtheit: 6, ruf: 1, trainerBeziehung: -1 })] } },
      { label: 'Für die Investoren werben', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['ruf'] }, erfolg: { text: 'Die Argumente überzeugen. Der Klub erhält Geld, und die Kabine kassiert höhere Prämien.', effekte: [STAERKE(2), T({ trainerBeziehung: 2, fanbeliebtheit: -3 })] }, misserfolg: { text: 'Ein Transparent: „{name} verkauft den Verein.“ Deine Beliebtheit leidet.', effekte: [T({ fanbeliebtheit: -7, ruf: -1 })] } },
      { label: 'Keine Stellungnahme', erfolg: { text: 'Du hältst dich raus. Niemand ist wirklich zufrieden.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'la-fr-streik', kategorie: 'Privat', gewicht: 1.3, abstand: 250, bedingung: (c) => inLand(c, 'FR') && profi(c),
    titel: 'Generalstreik', text: 'Seit drei Tagen fährt kaum ein Zug, die Metro steht still, und am Stadion blockieren Demonstranten die Zufahrt. Der Klub fordert dich auf, rechtzeitig zum Training zu kommen. Wie?',
    optionen: [
      { label: 'Mit dem Fahrrad durch die Stadt', erfolg: { text: 'Du radelst 20 Kilometer, schwitzt wie ein Verrückter und kommst pünktlich an. Der Trainer nickt anerkennend.', effekte: [T({ trainerBeziehung: 3, fitness: 1, professionalitaet: 2 })] } },
      { label: 'Taxi für 200 Euro', kosten: 200, hinweis: 'kostet 200 €', erfolg: { text: 'Teuer, aber bequem. Du bist rechtzeitig und ausgeruht.', effekte: [T({ fitness: 2 })] } },
      { label: 'Zu Hause bleiben', hinweis: 'riskant', wurf: { basis: 0.4 }, erfolg: { text: 'Die Mannschaft zeigt Verständnis. Heute fällt das Training aus.', effekte: [T({ moral: 2 })] }, misserfolg: { text: 'Der Trainer ist wütend: „Alle anderen waren da!“ Eine Geldstrafe folgt.', effekte: [G(anteil(0.01, 200)), T({ trainerBeziehung: -4, disziplin: -2 })] } },
    ],
  },
  {
    id: 'la-ski', kategorie: 'Gesundheit', gewicht: 1.5, abstand: 250, bedingung: (c) => inLand(c, ...SKI) && profi(c),
    titel: 'Skiurlaub im Vertrag verboten', text: 'Die Pisten sind verschneit, die Kollegen planen einen Skitag. In deinem Vertrag steht allerdings Satz 14: „Risikosportarten sind untersagt.“ Die Skilifte locken.',
    optionen: [
      { label: 'Heimlich auf die Piste', hinweis: 'riskant', wurf: { basis: 0.7, traits: ['gesundheit'] }, erfolg: { text: 'Ein wunderbarer Tag im Schnee, ohne Sturz und ohne Zeugen.', effekte: [T({ privatglueck: 6, moral: 4 })] }, misserfolg: { text: 'Ein Sturz, ein Knacken. Das Knie schwillt an, die Vereinsführung erfährt alles.', effekte: [VERL('Kreuzbandriss', 24), T({ moral: -8, trainerBeziehung: -8, ruf: -1 }), G(anteil(0.03, 1000)), AKT('skandal')] } },
      { label: 'Langlaufen statt Abfahrt', erfolg: { text: 'Gleichmäßig, gesund, mit Blick auf die Berge. Der Physio gratuliert.', effekte: [T({ fitness: 3, privatglueck: 3 })] } },
      { label: 'Nicht mitgehen', erfolg: { text: 'Du bleibst im Tal. Die Gruppe schickt Fotos, du schickst Daumen hoch.', effekte: [T({ professionalitaet: 2, privatglueck: -1 })] } },
    ],
  },
  {
    id: 'la-steuerparadies', kategorie: 'Finanzen', gewicht: 1.2, abstand: 800, bedingung: (c) => inLand(c, ...STEUER) && profi(c) && gehalt(c) > 150_000 && !flag(c, 'steuerwohnsitz'),
    titel: 'Steuerfreundlicher Wohnsitz', text: 'Dein Steuerberater strahlt: „In diesem Kanton oder Land zahlt man deutlich weniger.“ Er will, dass du dort offiziell wohnst. „Das ist völlig legal, wenn du wirklich dort lebst.“',
    optionen: [
      { label: 'Wirklich dorthin ziehen', kosten: 15_000, hinweis: 'kostet 15.000 €', erfolg: { text: 'Neue Wohnung, neuer Steuersatz. Du sparst jedes Jahr einen erklecklichen Betrag.', effekte: [FLAG('steuerwohnsitz'), G(anteil(0.1, 6000)), T({ privatglueck: 2 })] } },
      { label: 'Nur auf dem Papier', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['professionalitaet'] }, erfolg: { text: 'Das Finanzamt kommt nicht dahinter. Dein Steuerberater klopft sich auf die Schulter.', effekte: [FLAG('steuerwohnsitz'), G(anteil(0.2, 8000))] }, misserfolg: { text: 'Eine Prüfung deckt den Schwindel auf: Nachzahlung, Strafe, Schlagzeilen.', effekte: [FLAG('steuerwohnsitz'), G((c) => -anteil(0.15, 20_000)(c)), T({ ruf: -3, fanbeliebtheit: -4 }), AKT('skandal'), NEWS('Steuer-Schummel: {name} im Visier der Fahnder')] } },
      { label: 'Ablehnen', erfolg: { text: 'Du bleibst, wo du bist. Ehrlich währt am längsten.', effekte: [T({ professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'la-sprache', kategorie: 'Privat', gewicht: 2.2, abstand: 300, bedingung: (c) => imAusland(c) && !flag(c, 'sprachkurs'),
    titel: 'Sprachbarriere', text: 'Beim Taktikgespräch verstehst du nur die Hälfte. Der Trainer redet schnell, die Kollegen noch schneller, und im Supermarkt zeigst du auf Dinge. Der Teammanager schlägt einen Sprachkurs vor.',
    optionen: [
      { label: 'Intensivkurs buchen', kosten: 1500, hinweis: 'kostet 1.500 €', erfolg: { text: 'Nach acht Wochen kannst du plaudern und Witze verstehen. Alle freuen sich darüber.', effekte: [FLAG('sprachkurs'), T({ trainerBeziehung: 5, kabine: 4, privatglueck: 3 })] } },
      { label: 'Mit Kollegen lernen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['professionalitaet'] }, erfolg: { text: 'Im Training schnappst du die wichtigsten Sätze auf. Du lernst durch Mutmachen und Lachen.', effekte: [FLAG('sprachkurs'), T({ kabine: 4, trainerBeziehung: 2 })] }, misserfolg: { text: 'Du verwechselst „Mutter“ und „Müller“ und sorgst für Gelächter. Die Sprache bleibt eine Baustelle.', effekte: [T({ kabine: 1, selbstvertrauen: -2 })] } },
      { label: 'Dolmetscher einstellen', kosten: 5000, hinweis: 'kostet 5.000 €', erfolg: { text: 'Der Dolmetscher läuft dir überall nach. Praktisch, aber du bleibst Fremder.', effekte: [FLAG('sprachkurs'), T({ trainerBeziehung: 2 })] } },
    ],
  },
  {
    id: 'la-heimweh', kategorie: 'Privat', gewicht: 1.8, abstand: 250, bedingung: (c) => imAusland(c),
    titel: 'Heimweh', text: 'Du siehst auf dem Handy ein Foto: Dein Heimatverein feiert einen Sieg, deine Freunde grillen im Garten deiner Eltern. Du sitzt allein in der Wohnung in einem fremden Land und isst Tiefkühlpizza.',
    optionen: [
      { label: 'Familie einfliegen lassen', kosten: 2500, hinweis: 'kostet 2.500 €', erfolg: { text: 'Mama bringt Kuchen, Papa den Heimatsender. Das Fremde wird ein bisschen vertrauter.', effekte: [T({ privatglueck: 10, moral: 5 })] } },
      { label: 'Videoanruf', erfolg: { text: 'Ihr redet zwei Stunden. Danach schläfst du ruhiger.', effekte: [T({ privatglueck: 4, moral: 2 })] } },
      { label: 'Ablenken und wegschieben', erfolg: { text: 'Du stürzt dich in Training und Videospiele. Das Gefühl bleibt im Hintergrund.', effekte: [T({ professionalitaet: 1, privatglueck: -3 })] } },
    ],
  },
  {
    id: 'la-behoerde', kategorie: 'Privat', gewicht: 1.4, abstand: 400, bedingung: (c) => imAusland(c),
    titel: 'Behördengang', text: 'Für die Aufenthaltsgenehmigung musst du sieben Formulare ausfüllen, zwei Stempel einholen und drei Fotos abgeben, jedes in einem anderen Amt. Der Vereinsmitarbeiter ist im Urlaub.',
    optionen: [
      { label: 'Selbst durch den Papierkrieg', erfolg: { text: 'Nach drei Tagen hast du alles. Du fühlst dich wie ein Held der Verwaltung.', effekte: [T({ professionalitaet: 2, privatglueck: -2 })] } },
      { label: 'Anwalt beauftragen', kosten: 900, hinweis: 'kostet 900 €', erfolg: { text: 'Der Anwalt regelt alles in einer Stunde. Teuer, aber stressfrei.', effekte: [T({ privatglueck: 2 })] } },
    ],
  },
  {
    id: 'la-zweite-heimat', kategorie: 'Karriere', gewicht: 1.2, abstand: 900, bedingung: (c) => imAusland(c) && saisonenImLand(c) >= 3 && !jugend(c) && !flag(c, 'zweitePass'),
    titel: 'Zweite Heimat', text: 'Du lebst seit Jahren hier. Die Fans nennen dich einen „Einheimischen“, der Verband bietet dir die Staatsbürgerschaft an. „Du könntest sogar für die Nationalmannschaft spielen“, sagt jemand beiläufig.',
    optionen: [
      { label: 'Pass annehmen', hinweis: 'riskant', wurf: { basis: 0.6, traits: ['ruf'] }, erfolg: { text: 'Neue Staatsbürgerschaft, neue Chancen. Die Fans feiern dich als einen der Ihren.', effekte: [FLAG('zweitePass'), T({ fanbeliebtheit: 7, ruf: 2, privatglueck: 3 })] }, misserfolg: { text: 'Die Heimat reagiert kühl: „Verrat!“ schreibt eine Zeitung. Die neue Heimat ist stolz, die alte beleidigt.', effekte: [FLAG('zweitePass'), T({ fanbeliebtheit: 3, ruf: -1, privatglueck: -2 })] } },
      { label: 'Dankend ablehnen', erfolg: { text: 'Du bleibst Gast, aber ein geschätzter. Deine Wurzeln bedeuten dir mehr.', effekte: [T({ privatglueck: 2, fanbeliebtheit: 1 })] } },
    ],
  },
  {
    id: 'la-nl-fahrrad', kategorie: 'Privat', gewicht: 1, abstand: 400, bedingung: (c) => inLand(c, 'NL', 'DK', 'BE') && profi(c),
    titel: 'Alle fahren Rad', text: 'In der Mannschaft fährt niemand Auto. Der Torwart nimmt das Rad, der Trainer auch, selbst die Spielerfrauen radeln mit Kindersitz. Du kommst mit deinem Sportwagen und wirst freundlich ausgelacht.',
    optionen: [
      { label: 'Aufs Rad umsteigen', erfolg: { text: 'Mit dem Fahrrad kommst du schneller zum Platz und durch die Stadt, und du fühlst dich als Teil der Gemeinschaft.', effekte: [T({ fitness: 2, kabine: 3, privatglueck: 2 })] } },
      { label: 'Beim Sportwagen bleiben', erfolg: { text: 'Du fährst weiter Auto, trotz Spott. Die Fans lieben Statussymbole.', effekte: [T({ ruf: 1, kabine: -1 })] } },
    ],
  },
]

