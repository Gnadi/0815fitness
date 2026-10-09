import { AKT, FLAG, FOLGE, G, NEWS, S, T, VERL, alterVon, flag, jugend, ov, spielSkills } from './helpers'
import type { EreignisDef } from './types'

export const JUGEND: EreignisDef[] = [
  {
    id: 'j-schule', kategorie: 'Jugend', gewicht: 3, abstand: 60, bedingung: jugend,
    titel: 'Klausur am Montag', text: 'Am Montag steht die Mathe-Klausur an, am Montagabend das wichtigste Training der Woche. Deine Eltern erinnern dich daran, dass „Fußballer“ kein Schulabschluss ist.',
    optionen: [
      { label: 'Lernen und früh ins Bett', erfolg: { text: 'Die Klausur läuft ordentlich. Dein Trainer wundert sich nur, warum du so ausgeruht wirkst.', effekte: [T({ disziplin: 3, privatglueck: 2, fitness: 4 })] } },
      { label: 'Spicken lassen, Training geht vor', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['disziplin'] },
        erfolg: { text: 'Die Note ist okay, das Training stark. Mission geglückt!', effekte: [T({ selbstvertrauen: 3, privatglueck: -1 })] },
        misserfolg: { text: 'Erwischt! Elternabend, Hausarrest, und dein Trainer erfährt es auch.', effekte: [T({ disziplin: -3, privatglueck: -4, trainerBeziehung: -2 })] } },
      { label: 'Nachhilfe nehmen', kosten: 40, hinweis: 'kostet 40 €', erfolg: { text: 'Mit Nachhilfe klappt beides. Wer organisiert ist, hat mehr vom Leben.', effekte: [T({ professionalitaet: 3, privatglueck: 1 })] } },
    ],
  },
  {
    id: 'j-sichtung', kategorie: 'Jugend', gewicht: 2.5, abstand: 70, bedingung: (c) => jugend(c) && ov(c) > 45,
    titel: 'Scouts auf der Tribüne', text: 'Vor dem Spiel raunt dir {freund} zu: „Siehst du den Typen im Mantel? Das ist ein Scout. Von einem ganz großen Verein!“ Plötzlich sind deine Knie weich.',
    optionen: [
      { label: 'Alles geben, jetzt oder nie', hinweis: 'riskant', wurf: { basis: 0.45, skills: spielSkills(['technik', 'dribbling'], ['positionsspiel', 'defensive']), traits: ['selbstvertrauen'] },
        erfolg: { text: 'Du spielst wie im Rausch. Nach dem Spiel gibt der Scout dir seine Karte. Dein Name macht die Runde.', effekte: [T({ ruf: 4, selbstvertrauen: 5, moral: 4 }), FLAG('scoutGesehen')] },
        misserfolg: { text: 'Du willst zu viel und gehst im Zweikampf unter. Der Scout schreibt kaum etwas auf.', effekte: [T({ selbstvertrauen: -4, moral: -3 })] } },
      { label: 'Normal spielen, nicht verrückt machen', erfolg: { text: 'Du spielst solide wie immer. Ob der Scout etwas gesehen hat? Du wirst es nie erfahren.', effekte: [T({ ruf: 1, selbstvertrauen: 1 })] } },
    ],
  },
  {
    id: 'j-internat', kategorie: 'Jugend', gewicht: 2, abstand: 80, bedingung: (c) => jugend(c) && alterVon(c) <= 17,
    titel: 'Heimweh', text: 'Es ist Sonntagabend im Internat. Draußen regnet es, die Mitbewohner sind weg, und deine Mutter hat dir ein Foto vom Küchentisch geschickt. Plötzlich fühlt sich alles ziemlich weit weg an.',
    optionen: [
      { label: 'Zuhause anrufen', erfolg: { text: 'Ihr redet über zwei Stunden. Danach fühlst du dich besser, obwohl die Telefonrechnung wehtut.', effekte: [T({ moral: 5, privatglueck: 4 })] } },
      { label: 'Mit den Jungs Karten spielen', erfolg: { text: 'Wer verliert, putzt das Bad. Du verlierst. Aber du gehörst jetzt dazu.', effekte: [T({ kabine: 4, moral: 3 })] } },
      { label: 'Mit dem Jugendtrainer reden', wurf: { basis: 0.7, traits: ['professionalitaet'] },
        erfolg: { text: '{trainer} hört dir zu und erzählt, wie er selbst mal geheult hat. Er wird dir sympathisch.', effekte: [T({ trainerBeziehung: 5, moral: 4 })] },
        misserfolg: { text: '{trainer} hat gerade keine Zeit und winkt ab. Du fühlst dich noch einsamer.', effekte: [T({ moral: -3 })] } },
    ],
  },
  {
    id: 'j-freundin', kategorie: 'Jugend', gewicht: 2, bedingung: (c) => jugend(c) && c.personen.partner === null && alterVon(c) >= 16, abstand: 150,
    titel: 'Wer ist das Mädchen am Zaun?', text: 'Seit Wochen steht dieselbe Person nach dem Training am Zaun. Heute spricht sie dich an: „Du bist doch der Neue? Ich bin Klassenkameradin von {freund}. Ich fand dich im letzten Spiel gut.“',
    optionen: [
      { label: 'Nach dem Training einen Kaffee trinken', erfolg: { text: 'Ihr redet stundenlang. Zum ersten Mal seit Wochen denkst du nicht an Fußball.', effekte: [AKT('partner-neu'), T({ privatglueck: 8, moral: 4 }), FOLGE('p-beziehung-krise', 40, 0.6)] } },
      { label: 'Freundlich bleiben, aber Distanz halten', erfolg: { text: 'Du konzentrierst dich lieber aufs Training. Manche Dinge können warten.', effekte: [T({ disziplin: 2, professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'j-eltern-berater', kategorie: 'Jugend', gewicht: 2, abstand: 200, bedingung: (c) => jugend(c) && ov(c) > 50 && !flag(c, 'beraterGewaehlt'),
    titel: 'Der Onkel kennt jemanden', text: 'Dein Onkel hat „da jemanden“, der dich gegen 20 Prozent Provision ganz nach oben bringt. Gleichzeitig hat sich eine seriöse Agentur gemeldet. Die Familie diskutiert beim Mittagessen lautstark.',
    optionen: [
      { label: 'Die professionelle Agentur nehmen', erfolg: { text: 'Die Agentur schickt dir eine Mappe voller Zahlen. Dein Onkel schmollt, aber dein Name ist jetzt in besseren Händen.', effekte: [AKT('berater-upgrade'), AKT('berater-upgrade'), FLAG('beraterGewaehlt'), T({ privatglueck: -2 })] } },
      { label: 'Beim Onkel bleiben', erfolg: { text: 'Familie ist Familie. Der Onkel strahlt, die Zukunft wird sich zeigen.', effekte: [FLAG('beraterGewaehlt'), T({ privatglueck: 3 })] } },
      { label: 'Erst mal gar keinen Berater', erfolg: { text: 'Du willst dich auf Fußball konzentrieren. Ob das klug ist, wird die Zukunft zeigen.', effekte: [FLAG('beraterGewaehlt'), T({ professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'j-wachstumsschub', kategorie: 'Jugend', gewicht: 2, abstand: 200, bedingung: (c) => jugend(c) && alterVon(c) <= 17,
    titel: 'Wachstumsschub', text: 'Im Sommer bist du plötzlich zehn Zentimeter größer. Deine Beine fühlen sich an wie die eines Rehkitzes. Der Ball landet nie dort, wo du ihn haben willst.',
    optionen: [
      { label: 'Geduldig Koordinationstraining machen', erfolg: { text: 'Nach ein paar Wochen sitzt alles wieder. Deine Reichweite ist jetzt ein echter Vorteil.', effekte: [S({ physis: 2, technik: 1 }), T({ professionalitaet: 2 })] } },
      { label: 'Ignorieren, wird schon', wurf: { basis: 0.5 }, erfolg: { text: 'Dein Körper gewöhnt sich von allein daran. Glück gehabt.', effekte: [S({ physis: 2 })] }, misserfolg: { text: 'Du verhedderst dich ständig und verlierst Spielpraxis und Selbstvertrauen.', effekte: [S({ technik: -2 }), T({ selbstvertrauen: -4 })] } },
    ],
  },
  {
    id: 'j-u-nationalmannschaft', kategorie: 'Jugend', gewicht: 2.5, abstand: 150, bedingung: (c) => jugend(c) && ov(c) > 52 && !flag(c, 'u-nationalspieler'),
    titel: 'Einladung zur U-Nationalmannschaft', text: 'Ein Brief vom Verband! Du bist zum Lehrgang der Jugendnationalmannschaft eingeladen. Die Eltern kleben das Schreiben sofort an den Kühlschrank.',
    optionen: [
      { label: 'Natürlich zusagen!', hinweis: 'ruft den Verband auf den Plan', wurf: { basis: 0.75, traits: ['professionalitaet'] },
        erfolg: { text: 'Du überzeugst und bekommst sogar ein Länderspiel in der Altersklasse. Die Heimatzeitung druckt dein Foto.', effekte: [T({ ruf: 5, selbstvertrauen: 5, fanbeliebtheit: 2 }), FLAG('u-nationalspieler'), NEWS('{name} spielt für die Jugendnationalmannschaft')] },
        misserfolg: { text: 'Beim Lehrgang gehst du unter und wirst nicht noch einmal eingeladen.', effekte: [T({ selbstvertrauen: -3 }), FLAG('u-nationalspieler')] } },
      { label: 'Absagen, Schule und Verein gehen vor', erfolg: { text: 'Der Verband ist enttäuscht, dein Trainer ist begeistert.', effekte: [T({ trainerBeziehung: 3, ruf: -1 })] } },
    ],
  },
  {
    id: 'j-mobbing', kategorie: 'Jugend', gewicht: 2, abstand: 150, bedingung: jugend,
    titel: 'Der Neue wird fertiggemacht', text: 'Der Torwart-Neuling wird in der Kabine mit Klebeband an die Bank gefesselt. Der Rädelsführer ist {rivale}. Alle lachen, nur der Neue nicht.',
    optionen: [
      { label: 'Eingreifen und Klebeband abreißen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['selbstvertrauen'] },
        erfolg: { text: 'Du stellst dich vor ihn. {rivale} zieht kleinlaut ab. Der Neue schaut dich an, als wärst du Messi.', effekte: [T({ kabine: 3, moral: 3, selbstvertrauen: 3 })] },
        misserfolg: { text: 'Du wirst ausgelacht und bist nun selbst das Ziel. Immerhin hat der Neue sich befreit.', effekte: [T({ kabine: -4, moral: -2 })] } },
      { label: 'Mitlachen', erfolg: { text: 'Du gehörst dazu, auch wenn sich der Magen später verkrampft.', effekte: [T({ kabine: 2, disziplin: -2, moral: -2 })] } },
      { label: 'Den Trainer informieren', erfolg: { text: '{trainer} greift durch und der Spuk ist vorbei. In der Kabine giltst du als Petze.', effekte: [T({ trainerBeziehung: 4, kabine: -3 })] } },
    ],
  },
  {
    id: 'j-sponsor-schuh', kategorie: 'Jugend', gewicht: 1.5, abstand: 200, bedingung: (c) => jugend(c) && c.spieler.traits.ruf > 8 && !flag(c, 'schuhvertrag'),
    titel: 'Der Schuhladen von nebenan', text: 'Das Sportgeschäft um die Ecke will dich mit Schuhen und etwas Taschengeld ausstatten. Dafür sollst du ein Foto im Laden machen und das lokale Käseblatt nutzen.',
    optionen: [
      { label: 'Zusagen', erfolg: { text: 'Du bekommst neue Schuhe, 300 Euro und eine kleine Berühmtheit im Viertel.', effekte: [G(300), T({ fanbeliebtheit: 3, ruf: 1 }), FLAG('schuhvertrag')] } },
      { label: 'Ablehnen, Verein hat Ausrüster', erfolg: { text: 'Auch eine Entscheidung. Dein Trainer nickt anerkennend.', effekte: [T({ professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'j-ausbildung', kategorie: 'Jugend', gewicht: 2, abstand: 120, bedingung: (c) => jugend(c) && alterVon(c) === 17,
    titel: 'Plan B', text: 'Der Verein schlägt vor, parallel eine Ausbildung zu machen. Nur eine Handvoll Jugendspieler schafft es zum Profi. Deine Mutter sagt: „Hab einen Plan B.“',
    optionen: [
      { label: 'Ausbildung beginnen', erfolg: { text: 'Du verbringst vormittags Zeit in der Werkstatt, abends auf dem Platz. Es ist anstrengend, aber beruhigend.', effekte: [T({ professionalitaet: 3, disziplin: 3, fitness: -3, privatglueck: 3 })] } },
      { label: 'Alles auf Fußball setzen', hinweis: 'Karte Alles oder nichts', erfolg: { text: 'Du gibst alles für den Traum. Die Mutter schluckt.', effekte: [T({ ehrgeiz: 5, privatglueck: -2 }), S({ technik: 1 })] } },
    ],
  },
  {
    id: 'j-streetfussball', kategorie: 'Jugend', gewicht: 2, abstand: 100, bedingung: jugend,
    titel: 'Käfig-Kick', text: 'Deine alten Kumpels laden dich zum Spiel im Käfig ein. Da gibt es keine Taktik, nur Tricks und Sprüche. Dein Trainer hat verboten, dass ihr außerhalb des Vereins spielt.',
    optionen: [
      { label: 'Heimlich mitspielen', hinweis: 'riskant', wurf: { basis: 0.7, traits: ['gesundheit'] },
        erfolg: { text: 'Du zauberst im Käfig, die Kumpels feiern dich. Die Technik wird besser und niemand erfährt davon.', effekte: [S({ dribbling: 1, technik: 1 }), T({ moral: 4 })] },
        misserfolg: { text: 'Ein Tritt auf den Knöchel, das hat nichts mit Taktik zu tun. Und der Trainer erfährt es natürlich.', effekte: [VERL('Prellung', 2), T({ trainerBeziehung: -3 })] } },
      { label: 'Lieber zu Hause bleiben', erfolg: { text: 'Du bleibst brav. Die Kumpels murren, aber du bist ausgeruht.', effekte: [T({ disziplin: 2, fitness: 3 })] } },
    ],
  },
  {
    id: 'j-fuehrerschein', kategorie: 'Jugend', gewicht: 1.5, abstand: 300, bedingung: (c) => alterVon(c) === 17 && !flag(c, 'fuehrerschein'),
    titel: 'Führerschein', text: 'Mit 17 begleitetes Fahren, mit 18 die Freiheit. Der Fahrlehrer will 1.500 Euro, die du nicht hast.',
    optionen: [
      { label: 'Eltern um Hilfe bitten', erfolg: { text: 'Deine Eltern zahlen und versprechen, dass du dafür den Abwasch machst. Für immer.', effekte: [FLAG('fuehrerschein'), T({ privatglueck: 3 })] } },
      { label: 'Vom Taschengeld bezahlen', kosten: 1500, hinweis: 'kostet 1.500 €', erfolg: { text: 'Du zahlst alles selbst. Stolz, aber blank.', effekte: [FLAG('fuehrerschein'), T({ professionalitaet: 2, privatglueck: 4 })] } },
      { label: 'Bahn fahren, kostet nichts', erfolg: { text: 'Du kommst mit dem Bus überall hin, nur eben langsam.', effekte: [T({ fitness: 1 })] } },
    ],
  },
  {
    id: 'j-handyvideo', kategorie: 'Jugend', gewicht: 2, abstand: 150, bedingung: jugend,
    titel: 'Peinliches Video', text: 'Ein Mitschüler hat ein Video von dir gedreht: Du tanzt in der Kabine zu einem Schlager. Es hat bereits 40.000 Aufrufe.',
    optionen: [
      { label: 'Selbst darüber lachen und mitteilen', wurf: { basis: 0.65, traits: ['selbstvertrauen'] },
        erfolg: { text: 'Du machst daraus einen Spaß. Die Kommentare feiern dich. Ein Kicker mit Humor, das kommt an.', effekte: [T({ fanbeliebtheit: 4, ruf: 1, kabine: 2 })] },
        misserfolg: { text: 'Der Spruch wird als Flucht nach vorn gedeutet. Es hagelt Spott.', effekte: [T({ selbstvertrauen: -3, fanbeliebtheit: -1 })] } },
      { label: 'Löschen lassen', erfolg: { text: 'Mit viel Mühe verschwindet das Video. Danach bleibt ein kleiner Stachel im Stolz.', effekte: [T({ moral: -1, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'j-trainer-hart', kategorie: 'Jugend', gewicht: 2, abstand: 120, bedingung: jugend,
    titel: 'Der Trainer ist heute besonders streng', text: '{trainer} lässt dich nach dem Training allein 20 Sprints laufen, weil du bei der Passübung geschlampt hast. Der Rest geht duschen.',
    optionen: [
      { label: 'Durchbeißen und noch zehn drauflegen', erfolg: { text: 'Der Trainer schaut beeindruckt. Deine Beine brennen, aber der Ruf wächst.', effekte: [S({ tempo: 1 }), T({ trainerBeziehung: 3, fitness: -4, disziplin: 2 })] } },
      { label: 'Murren und halbherzig laufen', erfolg: { text: 'Du läufst, aber mit Gesicht. {trainer} sieht alles.', effekte: [T({ trainerBeziehung: -3, disziplin: -1 })] } },
    ],
  },
  {
    id: 'j-ehrung', kategorie: 'Jugend', gewicht: 1.5, abstand: 200, bedingung: (c) => jugend(c) && (c.spieler.position === 'TW'
      ? c.saisonStats.spiele >= 6 && c.saisonStats.notenSumme / c.saisonStats.spiele >= 6.8
      : c.saisonStats.tore + c.saisonStats.vorlagen >= 6),
    titel: 'Jugendspieler des Monats', text: (c) => c.spieler.position === 'TW'
      ? 'Die Lokalzeitung wählt dich zum Jugendspieler des Monats, weil du zuletzt gefühlt jeden Ball gehalten hast. Beim Foto sollst du die Trophäe küssen. Mit Pickeln im Gesicht.'
      : 'Die Lokalzeitung wählt dich zum Jugendspieler des Monats. Beim Foto sollst du die Trophäe küssen. Mit Pickeln im Gesicht.',
    optionen: [
      { label: 'Stolz in die Kamera grinsen', erfolg: { text: 'Das Foto hängt noch Jahre im Vereinsheim. Dein Ruhm ist lokal, aber echt.', effekte: [T({ ruf: 3, fanbeliebtheit: 3, selbstvertrauen: 3 })] } },
      { label: 'Die Trophäe an die ganze Mannschaft weiterreichen', erfolg: { text: 'Du verteilst den Ruhm. Das kommt in der Kabine gut an.', effekte: [T({ kabine: 4, ruf: 1, selbstvertrauen: 1 })] } },
    ],
  },
]
