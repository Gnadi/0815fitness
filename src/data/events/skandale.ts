import { AKT, FLAG, FOLGE, G, NEWS, T, anteil, flag, gehalt, hatBesitz, jugend, profi, trait } from './helpers'
import type { EreignisDef } from './types'

const reich = (c: Parameters<typeof gehalt>[0]): boolean => profi(c) && c.spieler.geld > 50_000

/** Paket 9: Skandale, Betrug und Rechtsstreit (Risiko-Ketten). */
export const SKANDALE: EreignisDef[] = [
  {
    id: 'sk-berater-betrug', kategorie: 'Risiko', gewicht: 1, abstand: 700, bedingung: (c) => reich(c) && !flag(c, 'beraterBetrug') && c.spieler.geld > 200_000,
    titel: 'Der Berater und das Konto', text: 'Dein Steuerberater ruft an: „Mit deinen Kontoauszügen stimmt etwas nicht.“ Mehrere Überweisungen laufen an eine Firma, die du nicht kennst. Dein Berater {berater} ist seit zwei Tagen nicht erreichbar.',
    optionen: [
      { label: 'Sofort Anzeige erstatten und das Konto sperren', kosten: 3000, hinweis: 'kostet 3.000 €', erfolg: { text: 'Die Polizei ermittelt, die Bank bucht einen Teil zurück. Der Schaden bleibt begrenzt.', effekte: [FLAG('beraterBetrug'), G(({ spieler }) => -Math.round(spieler.geld * 0.04)), AKT('berater-wechsel'), T({ moral: -4, professionalitaet: 2 }), FOLGE('sk-prozess-berater', 20, 0.8)] } },
      { label: 'Erst mit {berater} sprechen', hinweis: 'riskant', wurf: { basis: 0.3, traits: ['professionalitaet'] }, erfolg: { text: '{berater} erklärt alles: ein Versehen, das Geld fließt zurück. Du bleibst misstrauisch, aber es ist gut ausgegangen.', effekte: [FLAG('beraterBetrug'), T({ moral: -2 })] }, misserfolg: { text: '{berater} taucht unter, und der Schaden wächst jeden Tag. Als du endlich Anzeige erstattest, ist ein beträchtlicher Teil weg.', effekte: [FLAG('beraterBetrug'), G(({ spieler }) => -Math.round(spieler.geld * 0.15)), AKT('berater-wechsel'), T({ moral: -8, privatglueck: -4 }), FOLGE('sk-prozess-berater', 20, 0.8)] } },
    ],
  },
  {
    id: 'sk-prozess-berater', kategorie: 'Risiko', gewicht: 0,
    titel: 'Prozess gegen den Berater', text: 'Monate später beginnt der Prozess. Dein ehemaliger Berater sitzt auf der Anklagebank, die Presse hängt an der Tür. Dein Anwalt sagt: „Es gibt Chancen, Teile des Schadens zurückzubekommen.“',
    optionen: [
      { label: 'Persönlich aussagen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['professionalitaet', 'selbstvertrauen'] }, erfolg: { text: 'Deine Aussage überzeugt das Gericht. Der Berater wird verurteilt, du bekommst einen Teil des Geldes zurück.', effekte: [G(({ spieler }) => Math.round(Math.min(60_000, spieler.geld * 0.06))), T({ ruf: 2, moral: 4, fanbeliebtheit: 2 })] }, misserfolg: { text: 'Die Verteidigung nimmt dich auseinander. Der Schaden bleibt, die Schlagzeilen auch.', effekte: [T({ moral: -3, ruf: -1 })] } },
      { label: 'Vergleich akzeptieren', erfolg: { text: 'Du verzichtest auf einen Teil, bekommst dafür sofort Geld und deine Ruhe.', effekte: [G(8000), T({ moral: 2 })] } },
    ],
  },
  {
    id: 'sk-stalker', kategorie: 'Risiko', gewicht: 1, abstand: 600, bedingung: (c) => profi(c) && trait(c, 'ruf') > 50 && !flag(c, 'stalker'),
    titel: 'Der Fan, der nicht aufgibt', text: 'Seit Wochen schickt dir jemand Briefe, Fotos von deinem Haus, sogar von deinem Auto. Gestern stand er vor dem Trainingsgelände und rief deinen Namen. Dein Sicherheitschef sagt: „Das wird ernst.“',
    optionen: [
      { label: 'Anzeige erstatten und Schutz verstärken', kosten: 4000, hinweis: 'kostet 4.000 €', erfolg: { text: 'Die Polizei erwirkt eine Kontaktsperre. Du schläfst wieder ruhiger.', effekte: [FLAG('stalker'), T({ privatglueck: 3, moral: 2, professionalitaet: 1 })] } },
      { label: 'Ihn zur Rede stellen', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['selbstvertrauen'] }, erfolg: { text: 'Ihr sprecht draußen vor dem Stadion. Er wirkt eingeschüchtert und verspricht, nichts mehr zu schicken.', effekte: [FLAG('stalker'), T({ selbstvertrauen: 3 })] }, misserfolg: { text: 'Das Gespräch eskaliert, er filmt dich und stellt es ins Netz. Die Kommentare sind gnadenlos.', effekte: [FLAG('stalker'), T({ fanbeliebtheit: -3, privatglueck: -4, moral: -3 })] } },
      { label: 'Ignorieren', erfolg: { text: 'Du hoffst, dass es aufhört. Es hört nicht auf.', effekte: [FLAG('stalker'), T({ privatglueck: -6, moral: -4 })] } },
    ],
  },
  {
    id: 'sk-einbruch', kategorie: 'Risiko', gewicht: 1.2, abstand: 500, bedingung: (c) => profi(c) && c.spieler.geld > 30_000 && !jugend(c),
    titel: 'Einbruch während des Spiels', text: 'Du kommst nach dem Auswärtsspiel nach Hause: Tür aufgebrochen, Schubladen ausgekippt, Uhren und Bargeld weg. Dein Handy hat eine Nachricht der Nachbarn: „Wir haben Schatten gesehen.“',
    optionen: [
      { label: 'Polizei rufen und Sicherheitsdienst engagieren', kosten: 2500, hinweis: 'kostet 2.500 €', erfolg: { text: 'Die Spurensicherung findet Fingerabdrücke. Du bekommst einen Teil der Sachen zurück und eine Alarmanlage.', effekte: [G(-3000), T({ privatglueck: -3, professionalitaet: 1 })] } },
      { label: 'Versicherung einschalten', hinweis: 'riskant', wurf: { basis: 0.55 }, erfolg: { text: 'Die Versicherung zahlt zügig. Der Schock bleibt, der Verlust nicht.', effekte: [G(-800), T({ privatglueck: -4 })] }, misserfolg: { text: 'Die Versicherung beruft sich auf Klauseln. Der Streit zieht sich hin.', effekte: [G(({ spieler }) => -Math.round(Math.min(40_000, spieler.geld * 0.05))), T({ privatglueck: -6, moral: -3 })] } },
    ],
  },
  {
    id: 'sk-clan', kategorie: 'Risiko', gewicht: 1, abstand: 700, bedingung: (c) => profi(c) && c.spieler.geld > 50_000 && !flag(c, 'clan'),
    titel: 'Der Jugendfreund und seine neuen Freunde', text: '{freund} ruft an: „Ich brauche einen Gefallen.“ Du triffst ihn in einem Café, mit zwei Männern, die nicht zu ihm passen. Sie lächeln zu freundlich. „Du bist jetzt reich, du kannst helfen.“',
    optionen: [
      { label: 'Klar Nein sagen und gehen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['selbstvertrauen'] }, erfolg: { text: 'Du stehst auf und gehst, ohne dich umzudrehen. Dein Herz rast, aber nichts passiert.', effekte: [FLAG('clan'), T({ professionalitaet: 2, selbstvertrauen: 3 })] }, misserfolg: { text: 'Die Männer bleiben freundlich, aber ihre Augen werden kalt: „Wir sehen uns.“ In der Nacht klingelt dein Telefon.', effekte: [FLAG('clan'), T({ privatglueck: -5, moral: -4 }), FOLGE('sk-clan-druck', 10, 0.9)] } },
      { label: 'Einmalig Geld geben', kosten: anteil(0.1, 5000), hinweis: 'kostet viel', erfolg: { text: 'Du überreichst einen Umschlag. Die Männer nicken. „Danke“, sagt {freund} leise. Du weißt, es war nicht das letzte Mal.', effekte: [FLAG('clan'), T({ moral: -3, professionalitaet: -1 }), FOLGE('sk-clan-druck', 15, 0.7)] } },
      { label: 'Die Polizei einschalten', erfolg: { text: 'Du gehst zu den Ermittlern. Sie nehmen es ernst und bieten Schutz an. {freund} meldet sich nie wieder.', effekte: [FLAG('clan'), T({ ruf: 1, professionalitaet: 3, privatglueck: -3, moral: -2 })] } },
    ],
  },
  {
    id: 'sk-clan-druck', kategorie: 'Risiko', gewicht: 0,
    titel: 'Sie melden sich wieder', text: 'Ein Brief ohne Absender: Fotos von dir, von deiner Familie und eine Summe. Daneben steht: „Wir erwarten Ihre Antwort.“ Dein Anwalt wird bleich: „Das ist Erpressung.“',
    optionen: [
      { label: 'Zur Polizei gehen', hinweis: 'riskant', wurf: { basis: 0.65, traits: ['professionalitaet'] }, erfolg: { text: 'Die Ermittler nehmen die Gruppe fest. Du wirst als Zeuge geschützt und kommst glimpflich davon.', effekte: [T({ ruf: 2, privatglueck: -2, moral: -2 }), NEWS('{name} hilft bei Zerschlagung eines Erpresserrings')] }, misserfolg: { text: 'Die Ermittlungen laufen schleppend, und die Gruppe schlägt zurück. Du lebst ein paar Wochen in Angst.', effekte: [T({ privatglueck: -8, moral: -6 }), G(-6000)] } },
      { label: 'Zahlen und hoffen', kosten: anteil(0.2, 8000), hinweis: 'kostet viel', erfolg: { text: 'Du zahlst. Es bleibt ruhig, bis zur nächsten Forderung.', effekte: [T({ moral: -5, privatglueck: -4 })] } },
    ],
  },
  {
    id: 'sk-boulevard-klage', kategorie: 'Medien', gewicht: 1.2, abstand: 500, bedingung: (c) => profi(c) && trait(c, 'ruf') > 40,
    titel: 'Falsche Schlagzeile', text: 'Eine Boulevardzeitung behauptet, du seist im Nachtclub randaliert und hättest einen Türsteher geschlagen. Beweise gibt es keine, aber das Bild eines wütenden Mannes mit Kapuze sieht dir erschreckend ähnlich.',
    optionen: [
      { label: 'Klagen und Gegendarstellung fordern', kosten: 5000, hinweis: 'kostet 5.000 €', wurf: { basis: 0.6, traits: ['ruf'] }, erfolg: { text: 'Das Gericht gibt dir recht. Die Zeitung muss eine Gegendarstellung drucken und Schmerzensgeld zahlen.', effekte: [G(15_000), T({ ruf: 2, fanbeliebtheit: 3 })] }, misserfolg: { text: 'Das Gericht weist die Klage ab. Du hast Geld und Nerven verloren.', effekte: [T({ ruf: -1, moral: -3 })] } },
      { label: 'Souverän ignorieren', erfolg: { text: 'Du lässt es auf sich beruhen. Nach einer Woche redet niemand mehr darüber.', effekte: [T({ professionalitaet: 2, fanbeliebtheit: -1 })] } },
      { label: 'Humorvoll kontern', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['selbstvertrauen'] }, erfolg: { text: 'Dein ironischer Post geht viral. Die Zeitung steht blamiert da.', effekte: [T({ fanbeliebtheit: 5, selbstvertrauen: 3 })] }, misserfolg: { text: 'Dein Scherz wirkt wie ein Geständnis. Das macht es nicht besser.', effekte: [T({ fanbeliebtheit: -3, ruf: -1 })] } },
    ],
  },
  {
    id: 'sk-autounfall', kategorie: 'Risiko', gewicht: 1, abstand: 500, bedingung: (c) => profi(c) && (hatBesitz(c, 'auto-sport') || hatBesitz(c, 'auto-luxus') || hatBesitz(c, 'auto-klein')),
    titel: 'Unfall nachts auf der Landstraße', text: 'Auf dem Heimweg vom Mannschaftsabend rutschst du in einer Kurve von der Fahrbahn. Der Wagen stellt sich quer, die Airbags lösen aus. Niemand ist ernsthaft verletzt, aber die Polizei ist schnell da.',
    optionen: [
      { label: 'Ehrlich alles sagen', erfolg: { text: 'Ein Atemtest ergibt null Promille. Du erhältst nur einen Strafzettel für zu schnelles Fahren.', effekte: [G(-1500), T({ professionalitaet: 1, moral: -2 })] } },
      { label: 'Anwalt anrufen und Aussage verweigern', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['professionalitaet'] }, erfolg: { text: 'Der Anwalt regelt es diskret. Keine Presse, kein Aufsehen.', effekte: [G(-4000)] }, misserfolg: { text: 'Jemand hat gefilmt. Das Video taucht im Netz auf, die Schlagzeile lautet „Fahrerflucht?“.', effekte: [G(-6000), T({ fanbeliebtheit: -4, ruf: -2 }), AKT('skandal'), NEWS('{name} nach Unfall im Visier der Presse')] } },
    ],
  },
  {
    id: 'sk-zoll', kategorie: 'Risiko', gewicht: 0.8, abstand: 700, bedingung: (c) => profi(c) && hatBesitz(c, 'uhr') && !flag(c, 'zollaerger'),
    titel: 'Die Uhr am Flughafen', text: 'Bei der Rückreise vom Trainingslager entdeckt der Zoll deine Luxusuhr. „Haben Sie die angemeldet?“ Du hast sie vergessen, und der Beamte lächelt wissend: „Dann sprechen wir wohl länger.“',
    optionen: [
      { label: 'Nachzahlen und offen sein', kosten: 6000, hinweis: 'kostet 6.000 €', erfolg: { text: 'Du zahlst Zoll und Steuern nach. Keine Schlagzeile, kein Ärger.', effekte: [FLAG('zollaerger'), T({ professionalitaet: 2 })] } },
      { label: 'Behaupten, die Uhr sei ein Geschenk', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['professionalitaet'] }, erfolg: { text: 'Der Beamte glaubt dir, du kommst durch. Der Atem bleibt kurz weg.', effekte: [FLAG('zollaerger'), T({ selbstvertrauen: 2 })] }, misserfolg: { text: 'Die Behörde prüft die Rechnung und findet Ungereimtheiten. Eine hohe Strafe und die Presse sind dir sicher.', effekte: [FLAG('zollaerger'), G(({ spieler }) => -Math.round(Math.max(15_000, spieler.geld * 0.04))), T({ ruf: -3, fanbeliebtheit: -3 }), AKT('skandal'), NEWS('Zoll-Affäre um {name}')] } },
    ],
  },
  {
    id: 'sk-vertragsstreit', kategorie: 'Risiko', gewicht: 1, abstand: 600, bedingung: (c) => profi(c) && c.laufbahn.transfers.length >= 1 && gehalt(c) > 100_000,
    titel: 'Klage des Ex-Vereins', text: 'Dein früherer Verein verklagt dich auf Schadenersatz: Du seist vertragsbrüchig geworden, behauptet der Anwalt. Dein Berater winkt ab: „Das ist heiße Luft.“ Dein neuer Verein ist trotzdem besorgt.',
    optionen: [
      { label: 'Vergleich schließen', kosten: anteil(0.08, 5000), hinweis: 'kostet Geld', erfolg: { text: 'Du zahlst, die Sache ist erledigt. Dein neuer Verein atmet auf.', effekte: [T({ professionalitaet: 1, trainerBeziehung: 1 })] } },
      { label: 'Vor Gericht ziehen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['ruf', 'professionalitaet'] }, erfolg: { text: 'Das Gericht weist die Klage ab. Dein Ex-Verein steht blamiert da.', effekte: [G(-3000), T({ ruf: 2, fanbeliebtheit: 2 })] }, misserfolg: { text: 'Das Gericht spricht dem Verein Schadenersatz zu. Teuer und peinlich.', effekte: [G(({ spieler }) => -Math.round(Math.min(120_000, spieler.geld * 0.12))), T({ ruf: -2, moral: -3, trainerBeziehung: -2 })] } },
    ],
  },
  {
    id: 'sk-dopingverdacht', kategorie: 'Risiko', gewicht: 0.6, abstand: 800, bedingung: (c) => profi(c) && trait(c, 'ruf') > 45 && c.flags.doping !== true,
    titel: 'Gerücht über unerlaubte Mittel', text: 'Ein Journalist deutet an, dass deine Leistungssteigerung „auffällig“ sei. In den sozialen Medien taucht das Wort „Doping“ auf, obwohl du nie etwas genommen hast. Der Verein bittet um eine Stellungnahme.',
    optionen: [
      { label: 'Freiwilligen Test anbieten', erfolg: { text: 'Das Ergebnis ist sauber, die Presse ändert den Ton. Dein Ruf als Saubermann wächst.', effekte: [T({ ruf: 3, professionalitaet: 3, fanbeliebtheit: 3 })] } },
      { label: 'Klagen', kosten: 3500, hinweis: 'kostet 3.500 €', wurf: { basis: 0.6, traits: ['ruf'] }, erfolg: { text: 'Der Journalist muss widerrufen und eine Geldstrafe zahlen. Du bist rehabilitiert.', effekte: [G(6000), T({ ruf: 2, fanbeliebtheit: 2 })] }, misserfolg: { text: 'Die Klage wird abgewiesen, und es heißt: „Wer klagt, hat etwas zu verbergen.“', effekte: [T({ fanbeliebtheit: -3, ruf: -1 })] } },
      { label: 'Gar nicht reagieren', erfolg: { text: 'Das Gerücht verebbt nach einer Woche. Ein Rest Misstrauen bleibt.', effekte: [T({ fanbeliebtheit: -1 })] } },
    ],
  },
]

