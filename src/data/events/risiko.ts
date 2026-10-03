import { AKT, FLAG, FOLGE, G, NEWS, S, SPERRE, T, alterVon, anteil, flag, gehalt, hatPartner, jugend, ov, profi, trait, ZAEHLE } from './helpers'
import type { EreignisDef } from './types'

export const RISIKO: EreignisDef[] = [
  // ---------------------------------------------------------------- Sportwetten
  {
    id: 'r-wetten-start', kategorie: 'Risiko', gewicht: 1.8, abstand: 300, bedingung: (c) => profi(c) && alterVon(c) >= 18 && !flag(c, 'wetten'),
    titel: 'Ein Tipp von {freund}', text: '{freund} zeigt dir auf dem Handy eine Wett-App. „Du kennst dich doch aus. Fußball, Quoten, das ist dein Ding.“ Er reibt Daumen und Zeigefinger aneinander.',
    optionen: [
      { label: 'Mal eine kleine Wette platzieren', kosten: 100, hinweis: 'kostet 100 €', wurf: { basis: 0.5 }, erfolg: { text: 'Treffer! Aus 100 werden 350 Euro. Das fühlt sich verdammt gut an. Zu gut.', effekte: [G(350), FLAG('wetten'), ZAEHLE('wettlevel', 1), FOLGE('r-wetten-sucht', 18, 0.65)] }, misserfolg: { text: 'Verloren. Dann wirst du es eben beim nächsten Mal wiedergutmachen.', effekte: [FLAG('wetten'), ZAEHLE('wettlevel', 1), FOLGE('r-wetten-sucht', 18, 0.5)] } },
      { label: 'Ablehnen: „Nicht mein Ding“', erfolg: { text: 'Du steckst das Handy weg. {freund} zuckt mit den Schultern.', effekte: [T({ professionalitaet: 2, disziplin: 2 })] } },
    ],
  },
  {
    id: 'r-wetten-sucht', kategorie: 'Risiko', gewicht: 0,
    titel: 'Der Reiz der Quote', text: 'Seit Wochen sitzt du nach dem Training vor dem Handy. Der Kontostand schwankt wie dein Puls. Letztes Wochenende hast du 4.000 Euro verloren und dir geschworen, dass es das letzte Mal war.',
    optionen: [
      { label: 'Aufhören und Apps löschen', erfolg: { text: 'Du löschst alle Apps und sagst {freund}, dass er dich nie mehr fragen soll. Der Entzug ist hart.', effekte: [T({ moral: -2, disziplin: 4, privatglueck: 2 }), FLAG('wetten', false)] } },
      { label: 'Alles auf die nächste Wette setzen', hinweis: 'sehr riskant', kosten: anteil(0.04, 400), wurf: { basis: 0.4 }, erfolg: { text: 'Gewonnen, der Verlust ist weg. Es fühlt sich an wie Fliegen. Wie lange hält das?', effekte: [G(anteil(0.14, 1500)), FOLGE('r-wett-erpressung', 30, 0.35)] }, misserfolg: { text: 'Verloren. Der Kontostand blutet und du fühlst dich wie ein Idiot.', effekte: [T({ moral: -5, selbstvertrauen: -3, privatglueck: -4 }), FOLGE('r-wett-erpressung', 18, 0.7)] } },
      { label: 'Hilfe holen', kosten: 250, hinweis: 'kostet 250 €', erfolg: { text: 'Eine Beratungsstelle hilft dir, die Sucht in den Griff zu bekommen. Das war hart, aber der erste Schritt.', effekte: [T({ moral: 6, disziplin: 4, professionalitaet: 2, privatglueck: 3 }), FLAG('wetten', false)] } },
    ],
  },
  {
    id: 'r-wett-erpressung', kategorie: 'Risiko', gewicht: 0,
    titel: 'Ein Anruf von unbekannter Nummer', text: 'Eine ruhige Stimme sagt: „Du schuldest uns noch etwas. Am Wochenende spielst du so, dass dein Team verliert. Dann sind wir quitt. Und wenn nicht, erfährt die Presse, was du so treibst.“',
    optionen: [
      { label: 'Zur Polizei und zum Verein gehen', erfolg: { text: 'Die Polizei nimmt die Männer fest. Du wirst als Zeuge gelobt, aber das Ganze kostet Nerven.', effekte: [T({ ruf: 3, professionalitaet: 3, moral: -3, kabine: 2 }), NEWS('{name} deckt Wettskandal auf')] } },
      { label: 'Zahlen und Ruhe haben', kosten: anteil(0.25, 2000), hinweis: 'kostet viel', erfolg: { text: 'Du überweist das Geld und hoffst, dass es das war. Die Anrufe werden seltener.', effekte: [T({ moral: -4, privatglueck: -4 })] } },
      { label: 'Mitmachen', hinweis: 'sehr riskant', wurf: { basis: 0.35, traits: ['professionalitaet'] }, erfolg: { text: 'Du verlierst unauffällig. Niemand merkt etwas, aber du schläfst schlecht.', effekte: [T({ moral: -8, professionalitaet: -6, fanbeliebtheit: -2 }), FOLGE('r-wett-erpressung', 40, 0.5)] }, misserfolg: { text: 'Die Behörden entdecken die Auffälligkeiten. Du wirst verhaftet, der Verein suspendiert dich. Das ist das Ende deiner Karriere.', effekte: [NEWS('Wettskandal: {name} lebenslang gesperrt'), T({ ruf: -60, fanbeliebtheit: -50, moral: -30 }), AKT('skandal'), AKT('karriereende')] } },
    ],
  },
  {
    id: 'r-spielmanipulation', kategorie: 'Risiko', gewicht: 0.9, abstand: 400, bedingung: (c) => profi(c) && alterVon(c) >= 20 && trait(c, 'ruf') > 15 && c.saison.kalender[c.uhr.woche - 1]?.t === 'L',
    titel: 'Ein verlockendes Angebot', text: 'Nach dem Training spricht dich ein Mann im Anzug an: „50.000 Euro, wenn du im nächsten Spiel Gelb siehst. Nur Gelb. Niemand wird etwas merken.“ Er legt einen Umschlag auf den Beifahrersitz.',
    optionen: [
      { label: 'Annehmen', hinweis: 'sehr riskant', wurf: { basis: 0.55, traits: ['professionalitaet'] }, erfolg: { text: 'Du holst dir die Gelbe Karte. Es fällt niemandem auf und das Geld ist auf deinem Konto.', effekte: [G(anteil(0.4, 20000)), T({ professionalitaet: -4, moral: -3 }), ZAEHLE('manipulation', 1), FOLGE('r-spielmanipulation-folge', 35, 0.6)] }, misserfolg: { text: 'Der Verband bemerkt die Auffälligkeit bei den Wetten. Du wirst für lange Zeit gesperrt.', effekte: [NEWS('Wettskandal: {name} gesperrt'), SPERRE(40), T({ ruf: -35, fanbeliebtheit: -30, moral: -20, trainerBeziehung: -20 }), AKT('skandal')] } },
      { label: 'Ablehnen', erfolg: { text: 'Du gibst ihm den Umschlag zurück und gehst. Dein Herz rast, aber dein Gewissen ist klar.', effekte: [T({ professionalitaet: 3, disziplin: 2 })] } },
      { label: 'Den Verein informieren', erfolg: { text: 'Der Verein dankt dir. Der Mann wird später verhaftet, und du bekommst viel Lob.', effekte: [T({ ruf: 3, trainerBeziehung: 4, kabine: 2, professionalitaet: 3 })] } },
    ],
  },
  {
    id: 'r-spielmanipulation-folge', kategorie: 'Risiko', gewicht: 0,
    titel: 'Ermittlungen', text: 'Die Staatsanwaltschaft hat angefragt, ob du zum Thema Spielmanipulation Angaben machen kannst. Dein Berater sagt: „Kein Wort ohne Anwalt.“',
    optionen: [
      { label: 'Anwalt einschalten und schweigen', kosten: anteil(0.2, 3000), hinweis: 'kostet viel', wurf: { basis: 0.5 }, erfolg: { text: 'Die Beweise reichen nicht. Das Verfahren wird eingestellt. Puh.', effekte: [T({ moral: -2, ruf: -2 })] }, misserfolg: { text: 'Die Staatsanwaltschaft hat genug in der Hand. Eine lange Sperre und eine Geldstrafe sind die Folge.', effekte: [SPERRE(30), T({ ruf: -25, fanbeliebtheit: -20, moral: -12 }), AKT('skandal'), NEWS('{name} wegen Manipulation verurteilt')] } },
      { label: 'Alles gestehen', erfolg: { text: 'Du kooperierst und bekommst eine milde Strafe, aber die Schlagzeilen sind schlimm.', effekte: [SPERRE(12), T({ ruf: -15, fanbeliebtheit: -12, moral: -6, professionalitaet: 2 }), AKT('skandal')] } },
    ],
  },
  // ---------------------------------------------------------------- Doping
  {
    id: 'r-doping-angebot', kategorie: 'Risiko', gewicht: 1.2, abstand: 400, bedingung: (c) => profi(c) && alterVon(c) >= 18 && ov(c) < 85 && c.spielpraxis < 0.6,
    titel: 'Der Wunder-Cocktail', text: 'Ein Physiotherapeut, den du nur flüchtig kennst, flüstert dir zu: „Wenn du schneller und stärker werden willst, gibt es da etwas. Völlig unauffällig, nach zwei Wochen nicht mehr nachweisbar.“',
    optionen: [
      { label: 'Ablehnen und melden', erfolg: { text: 'Du meldest den Vorfall dem Verein. Der Physio wird entlassen, und dein Ruf als sauberer Sportler wächst.', effekte: [T({ professionalitaet: 4, ruf: 2, trainerBeziehung: 2 })] } },
      { label: 'Ablehnen und weitertrainieren', erfolg: { text: 'Du sagst Nein und trainierst weiter. Wer sauber bleibt, muss nachts keine Sorgen haben.', effekte: [T({ professionalitaet: 3, disziplin: 2 })] } },
      { label: 'Annehmen', hinweis: 'sehr riskant', erfolg: { text: 'Die Wirkung ist enorm: Schneller, kräftiger, länger fit. Aber irgendwann kommt die Kontrolle.', effekte: [S({ physis: 3, tempo: 2 }), T({ selbstvertrauen: 5, fitness: 8 }), FLAG('doping'), FOLGE('r-doping-kontrolle', 12, 0.85)] } },
    ],
  },
  {
    id: 'r-doping-kontrolle', kategorie: 'Risiko', gewicht: 0, bedingung: (c) => flag(c, 'doping'),
    titel: 'Dopingkontrolle', text: 'Nach dem Training warten zwei Kontrolleure der Anti-Doping-Agentur. „Sie wurden für eine Kontrolle ausgelost.“ Dir wird heiß und kalt.',
    optionen: [
      { label: 'Zur Kontrolle gehen und hoffen', hinweis: 'sehr riskant', wurf: { basis: 0.55 }, erfolg: { text: 'Die Probe ist unauffällig. Du hast Glück gehabt und schwörst, es nie wieder zu tun.', effekte: [T({ moral: -2, professionalitaet: -1 }), FLAG('doping', false)] }, misserfolg: { text: 'Positiv! Die Meldung geht durch alle Medien. Eine lange Sperre, die Sponsoren springen ab, und die Fans wenden sich ab.', effekte: [SPERRE(35), T({ ruf: -30, fanbeliebtheit: -25, moral: -15, trainerBeziehung: -15, kabine: -10 }), FLAG('doping', false), AKT('skandal'), AKT('sponsor-ende'), NEWS('Doping-Skandal: {name} positiv getestet')] } },
      { label: 'Die Kontrolle verweigern', erfolg: { text: 'Das gilt als positives Ergebnis. Die Konsequenzen sind dieselben, die Ausrede ist schlechter.', effekte: [SPERRE(40), T({ ruf: -35, fanbeliebtheit: -30, moral: -15 }), FLAG('doping', false), AKT('skandal'), AKT('sponsor-ende'), NEWS('{name} verweigert Dopingkontrolle')] } },
    ],
  },
  // ---------------------------------------------------------------- Steuer
  {
    id: 'r-steuertrick', kategorie: 'Risiko', gewicht: 1.2, abstand: 500, bedingung: (c) => profi(c) && gehalt(c) > 250_000 && !flag(c, 'steuertrick'),
    titel: 'Der Steuerberater hat eine Idee', text: 'Dein Steuerberater erklärt dir, dass es eine Möglichkeit gibt, über eine Briefkastenfirma auf Malta „optimierte“ Verträge zu gestalten. Du solltest nur nicht viel nachfragen.',
    optionen: [
      { label: 'Machen', hinweis: 'sehr riskant', erfolg: { text: 'Plötzlich bleibt dir viel mehr vom Gehalt. Deine Freunde beneiden dich, deine Mutter fragt nicht weiter.', effekte: [G(anteil(0.18, 20000)), FLAG('steuertrick'), FOLGE('r-steuerfahndung', 55, 0.6)] } },
      { label: 'Ablehnen, alles sauber', erfolg: { text: 'Du zahlst, was du schuldig bist. Es tut weh, aber du schläfst besser.', effekte: [T({ professionalitaet: 3 })] } },
    ],
  },
  {
    id: 'r-steuerfahndung', kategorie: 'Risiko', gewicht: 0, bedingung: (c) => flag(c, 'steuertrick'),
    titel: 'Hausdurchsuchung', text: 'Sechs Uhr morgens: Steuerfahnder klingeln an deiner Tür. Sie haben Durchsuchungsbeschluss und kistenweise Fragen. Deine Nachbarn schauen vom Balkon zu.',
    optionen: [
      { label: 'Selbstanzeige und Nachzahlung', kosten: anteil(0.45, 5000), hinweis: 'kostet viel', erfolg: { text: 'Du zahlst die Steuern nach und akzeptierst die Strafe. Die Schlagzeilen sind peinlich, aber das Verfahren wird eingestellt.', effekte: [T({ ruf: -6, fanbeliebtheit: -5, moral: -5 }), FLAG('steuertrick', false), AKT('skandal'), NEWS('Razzia bei {name}: Steuerfahnder im Haus')] } },
      { label: 'Anwalt einschalten und kämpfen', kosten: anteil(0.1, 2000), wurf: { basis: 0.35 }, erfolg: { text: 'Die Beweislage ist dünn. Das Verfahren wird gegen Auflage eingestellt.', effekte: [T({ ruf: -3, moral: -3 }), FLAG('steuertrick', false)] }, misserfolg: { text: 'Das Gericht verurteilt dich zu einer hohen Geldstrafe und einer Bewährungsstrafe. Der Verein ist nicht begeistert.', effekte: [G(({ spieler }) => -Math.round(spieler.geld * 0.4)), T({ ruf: -20, fanbeliebtheit: -15, moral: -10, trainerBeziehung: -8 }), FLAG('steuertrick', false), AKT('skandal'), NEWS('{name} wegen Steuerhinterziehung verurteilt')] } },
    ],
  },
  // ---------------------------------------------------------------- Skandale
  {
    id: 'r-disco', kategorie: 'Risiko', gewicht: 1.5, abstand: 200, bedingung: (c) => profi(c) && alterVon(c) >= 18 && trait(c, 'disziplin') < 60,
    titel: 'Schlägerei vor der Disco', text: 'Du stehst um drei Uhr nachts vor dem Club. Ein Betrunkener beleidigt dich und deine Mutter. Vier Freunde stehen hinter dir, zwei Handys filmen bereits.',
    optionen: [
      { label: 'Wegdrehen und Taxi rufen', erfolg: { text: 'Du gehst. Das Video zeigt, wie ruhig du bleibst, und die Fans bewundern deine Reife.', effekte: [T({ disziplin: 3, fanbeliebtheit: 2, professionalitaet: 2 })] } },
      { label: 'Zurückbrüllen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['disziplin'] }, erfolg: { text: 'Du schreist ihm noch etwas hinterher, dann ist es vorbei.', effekte: [T({ disziplin: -1 })] }, misserfolg: { text: 'Aus dem Gebrüll wird ein Gerangel. Die Polizei kommt, die Presse auch.', effekte: [T({ fanbeliebtheit: -4, ruf: -3, trainerBeziehung: -5, disziplin: -3 }), G(anteil(0.04, 400)), AKT('skandal'), NEWS('Schlägerei vor der Disco: {name} beteiligt')] } },
    ],
  },
  {
    id: 'r-trunkenheit', kategorie: 'Risiko', gewicht: 0.8, abstand: 500, bedingung: (c) => profi(c) && alterVon(c) >= 18 && trait(c, 'disziplin') < 50,
    titel: 'Nach der Party hinters Steuer', text: 'Nach dem Fest merkst du, dass dein Fahrer gegangen ist. Ein Taxi kostet 60 Euro, du hast zwei Bier und ein Gefühl der Unbesiegbarkeit.',
    optionen: [
      { label: 'Taxi nehmen', kosten: 60, hinweis: 'kostet 60 €', erfolg: { text: 'Vernünftig. Der Taxifahrer kennt dich vom Plakat und redet die ganze Fahrt über deine Karriere.', effekte: [T({ professionalitaet: 2, disziplin: 2 })] } },
      { label: 'Selbst fahren', hinweis: 'riskant', wurf: { basis: 0.65, traits: ['disziplin'] }, erfolg: { text: 'Du kommst heil an. Das war dumm und du weißt es.', effekte: [T({ disziplin: -2 })] }, misserfolg: { text: 'Eine Polizeikontrolle. Der Alkoholtest ist positiv, der Führerschein weg, die Schlagzeile vorprogrammiert.', effekte: [T({ ruf: -8, fanbeliebtheit: -8, trainerBeziehung: -8, disziplin: -4 }), G(anteil(0.08, 1000)), FLAG('fuehrerschein', false), AKT('skandal'), NEWS('Alkohol am Steuer: {name} verliert den Führerschein')] } },
    ],
  },
  {
    id: 'r-handyvideo-leak', kategorie: 'Risiko', gewicht: 0.6, abstand: 150, bedingung: (c) => profi(c) && trait(c, 'ruf') > 15,
    titel: 'Peinliches Video im Netz', text: 'Jemand hat ein Video aus einer Party-Nacht geleakt. Du siehst darin ziemlich beschwipst aus und singst mit einem Besen in der Hand. Die Kommentare reichen von lustig bis grausam.',
    optionen: [
      { label: 'Mit Humor reagieren', wurf: { basis: 0.55, traits: ['selbstvertrauen'] }, erfolg: { text: 'Du postest ein Selbstironie-Video. Die Fans lieben es und das Netz feiert dich.', effekte: [T({ fanbeliebtheit: 3, ruf: 1 })] }, misserfolg: { text: 'Deine Reaktion wirkt bemüht. Die Spötter machen weiter.', effekte: [T({ fanbeliebtheit: -2, selbstvertrauen: -2 })] } },
      { label: 'Anwalt und Löschung', kosten: 500, hinweis: 'kostet 500 €', erfolg: { text: 'Das Video verschwindet, die Kopien nicht. Immerhin wird es leiser.', effekte: [T({ ruf: -1 })] } },
    ],
  },
  {
    id: 'r-fremdgehen', kategorie: 'Risiko', gewicht: 1, abstand: 400, bedingung: (c) => profi(c) && hatPartner(c) && alterVon(c) >= 20 && trait(c, 'disziplin') < 65,
    titel: 'Eine verhängnisvolle Nacht', text: 'Nach dem Auswärtsspiel flirtet jemand an der Hotelbar mit dir. Eine Hand ruht auf deinem Arm. {partner} ist zu Hause und schickt dir gerade ein Herz.',
    optionen: [
      { label: 'Freundlich verabschieden', erfolg: { text: 'Du gehst auf dein Zimmer und rufst {partner} an. Gute Entscheidung.', effekte: [T({ privatglueck: 3, disziplin: 2 })] } },
      { label: 'Mit aufs Zimmer gehen', hinweis: 'riskant', wurf: { basis: 0.6, traits: ['disziplin'] }, erfolg: { text: 'Es bleibt ein Geheimnis. Mit schlechtem Gewissen.', effekte: [T({ moral: -3, privatglueck: -3, disziplin: -3 })] }, misserfolg: { text: 'Am nächsten Morgen steht es in der Zeitung. {partner} ruft nicht mehr an.', effekte: [AKT('partner-ende'), T({ privatglueck: -15, moral: -8, fanbeliebtheit: -5, ruf: -3 }), AKT('skandal'), NEWS('Fremdgeh-Skandal bei {name}'), FOLGE('r-ex-erpressung', 30, 0.4)] } },
    ],
  },
  {
    id: 'r-ex-erpressung', kategorie: 'Risiko', gewicht: 0,
    titel: 'Die Ex packt aus', text: 'Eine frühere Beziehung droht, intime Nachrichten an die Presse zu verkaufen, sollten nicht 15.000 Euro fließen.',
    optionen: [
      { label: 'Zahlen', kosten: anteil(0.12, 3000), hinweis: 'kostet Geld', erfolg: { text: 'Du zahlst und hoffst, dass es das war. Die Nachrichten werden gelöscht.', effekte: [T({ moral: -3 })] } },
      { label: 'Anwalt einschalten', kosten: anteil(0.03, 600), wurf: { basis: 0.6 }, erfolg: { text: 'Der Anwalt droht mit einer Anzeige wegen Erpressung, und die Drohung verpufft.', effekte: [T({ professionalitaet: 1 })] }, misserfolg: { text: 'Die Nachrichten werden trotzdem verkauft, die Zeitung druckt sie ab.', effekte: [T({ ruf: -5, fanbeliebtheit: -6, moral: -5 }), NEWS('Skandal-Chats von {name} veröffentlicht')] } },
      { label: 'Die Drohung ignorieren', wurf: { basis: 0.35 }, erfolg: { text: 'Die Drohung verläuft im Sande. Glück gehabt.', effekte: [] }, misserfolg: { text: 'Die Zeitung druckt alles ab. Ein Skandal, der lange nachhallt.', effekte: [T({ ruf: -8, fanbeliebtheit: -8, moral: -6 }), AKT('skandal'), NEWS('Skandal-Chats von {name} veröffentlicht')] } },
    ],
  },
  {
    id: 'r-bestechung', kategorie: 'Risiko', gewicht: 0.8, abstand: 400, bedingung: (c) => profi(c) && alterVon(c) >= 21 && trait(c, 'ruf') > 25 && c.saison.kalender[c.uhr.woche - 1]?.t === 'L',
    titel: 'Ein Gegner will Hilfe', text: 'Ein Spieler von {rivale}s altem Verein flüstert dir beim Auslaufen zu: „Wir brauchen dringend die Punkte. Wenn du nicht allzu bissig bist, würdest du dich lohnen.“ Er bietet dir Bargeld.',
    optionen: [
      { label: 'Ablehnen und melden', erfolg: { text: 'Du meldest es dem Verband. Der Spieler wird gesperrt, du bekommst viel Lob.', effekte: [T({ ruf: 3, professionalitaet: 3 })] } },
      { label: 'Annehmen', hinweis: 'sehr riskant', wurf: { basis: 0.5 }, erfolg: { text: 'Du hältst dich zurück, und die Sache bleibt unentdeckt. Das Geld brennt dir ein Loch in die Tasche.', effekte: [G(anteil(0.2, 8000)), T({ professionalitaet: -4, moral: -3 })] }, misserfolg: { text: 'Ein Videobeweis, ein Zeuge, eine Aussage: Du wirst gesperrt und der Verein trennt sich von dir.', effekte: [SPERRE(30), T({ ruf: -30, fanbeliebtheit: -25, moral: -15, trainerBeziehung: -20 }), AKT('skandal'), NEWS('Bestechungsskandal: {name} gesperrt')] } },
    ],
  },
  {
    id: 'r-pleite', kategorie: 'Risiko', gewicht: 2, abstand: 100, bedingung: (c) => c.spieler.geld < -2000 && c.vertrag !== null && !jugend(c),
    titel: 'Konto im Minus', text: 'Dein Kontostand ist tief im roten Bereich. Die Bank schickt Mahnungen, die Kreditkarte wird abgelehnt, und {berater} schüttelt den Kopf: „So geht das nicht weiter.“',
    optionen: [
      { label: 'Ausgaben radikal kürzen', erfolg: { text: 'Du kündigst Abos, verkaufst die Uhr und lebst bescheiden. Es dauert, aber es hilft.', effekte: [G(2500), T({ professionalitaet: 3, privatglueck: -3 }), { t: 'lebensstil', d: -2000 }] } },
      { label: 'Vorschuss vom Verein erbitten', erfolg: { text: 'Der Verein hilft aus, will aber künftig genau hinschauen.', effekte: [G(4000), T({ trainerBeziehung: -3, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'r-ultras-drohung', kategorie: 'Risiko', gewicht: 0.8, abstand: 300, bedingung: (c) => profi(c) && c.form < 40 && trait(c, 'fanbeliebtheit') < 20,
    titel: 'Drohbrief', text: 'Im Briefkasten liegt ein anonymer Brief: „Wenn du nicht bald besser spielst, kriegen wir dich.“ Der Verein verstärkt vorsorglich die Sicherheit.',
    optionen: [
      { label: 'Den Verein einschalten', erfolg: { text: 'Die Polizei kümmert sich. Der Verein gibt dir ein sicheres Gefühl, auch wenn du dich beobachtet fühlst.', effekte: [T({ moral: 2, trainerBeziehung: 2 })] } },
      { label: 'Ignorieren und weiterspielen', erfolg: { text: 'Du zeigst Nerven und lässt dich nicht einschüchtern. Aber nachts schläfst du unruhig.', effekte: [T({ selbstvertrauen: 2, moral: -3, privatglueck: -2 })] } },
    ],
  },
]

