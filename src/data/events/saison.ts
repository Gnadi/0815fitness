import { AKT, FLAG, FOLGE, G, NEWS, S, STAERKE, T, VERL, anteil, ov, profi, punkteAbstand, restSpieltage, spieltag, tabellenplatz, trainerTyp, trait } from './helpers'
import type { Career } from '../../engine/types'
import type { EreignisDef } from './types'

/** Platz in der Tabelle, ab dem es um den Klassenerhalt geht (die letzten drei Plätze plus Puffer). */
const unten = (c: Career): boolean => {
  const n = c.saison.teams.length
  const p = tabellenplatz(c)
  return n >= 10 && p > 0 && p >= n - 3
}
const oben = (c: Career): boolean => {
  const p = tabellenplatz(c)
  return p > 0 && p <= 2 && c.saison.teams.length >= 10
}
const ligaPhase = (c: Career, min: number): boolean => profi(c) && !c.saison.jugend && spieltag(c) >= min

/** Paket 1: Trainerwechsel, Abstiegskampf und Titelrennen. */
export const SAISON: EreignisDef[] = [
  // ---------------------------------------------------------------- Trainerwechsel
  {
    id: 's-neuer-trainer', kategorie: 'Trainer', gewicht: 0, abstand: 20,
    titel: (c) => `Der neue Trainer: ${c.personen.trainer}`,
    text: (c) => {
      const t = trainerTyp(c)
      const kopf = `{trainer} ist seit einer Woche im Amt.`
      if (t === 'motivator') return `${kopf} Er umarmt jeden im Kader, ruft „Wir sind eine Familie!“ und lässt vor dem Training Musik laufen. Die Stimmung ist schlagartig besser, ob es auch die Ergebnisse sind, wird sich zeigen.`
      if (t === 'taktiker') return `${kopf} Er verteilt Taktikmappen, malt Laufwege auf Whiteboards und redet von „Halbräumen“. Du verstehst die Hälfte, die andere Hälfte klingt gut.`
      if (t === 'diktator') return `${kopf} Er verbietet Handys auf dem Gelände, führt Strafkassen ein und lässt um 6:30 Uhr trainieren. Alte Hasen stöhnen, aber die Zügel sind angezogen.`
      if (t === 'altmeister') return `${kopf} Ein Trainer der alten Schule, er hat schon alles gewonnen. Er spricht ruhig, sieht alles und setzt auf Routine. Junge Spieler fühlen sich übersehen.`
      if (t === 'jugendfoerderer') return `${kopf} Er schwärmt von jungen Spielern und lässt die Talente aus der U19 mittrainieren. Wer jung ist, hofft. Wer alt ist, schwitzt.`
      return `${kopf} Er lässt erst mal alles beim Alten und beobachtet.`
    },
    optionen: [
      { label: 'Gleich das Gespräch suchen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['professionalitaet', 'selbstvertrauen'] }, erfolg: { text: 'Du stellst dich vor und sagst, was du kannst. {trainer} nickt: „Genau solche Typen suche ich.“', effekte: [T({ trainerBeziehung: 8, selbstvertrauen: 3 })] }, misserfolg: { text: '{trainer} hat keine Zeit und winkt ab. Der erste Eindruck ist nicht der beste.', effekte: [T({ trainerBeziehung: -3, selbstvertrauen: -2 })] } },
      { label: 'Im Training überzeugen', erfolg: { text: 'Du gibst vom ersten Tag an Gas und lässt Leistung sprechen. {trainer} macht sich Notizen.', effekte: [T({ trainerBeziehung: 4, professionalitaet: 2, fitness: -2 })] } },
      { label: 'Abwarten', erfolg: { text: 'Du hältst dich im Hintergrund und beobachtest, wie der Neue tickt.', effekte: [T({ trainerBeziehung: 1 })] } },
    ],
  },
  {
    id: 's-trainer-motivator', kategorie: 'Trainer', gewicht: 1.5, abstand: 120, bedingung: (c) => profi(c) && trainerTyp(c) === 'motivator',
    titel: 'Gänsehaut-Ansprache', text: 'Vor dem Spiel hält {trainer} eine Rede, bei der selbst der Zeugwart Tränen in den Augen hat. „Heute schreiben wir Geschichte!“, ruft er. Die Kabine bebt.',
    optionen: [
      { label: 'Mitreißen lassen und voll aufdrehen', hinweis: 'riskant', wurf: { basis: 0.6, traits: ['moral'] }, erfolg: { text: 'Du läufst, als gäbe es kein Morgen. Die Mannschaft folgt dir.', effekte: [T({ moral: 5, kabine: 3, trainerBeziehung: 3, fitness: -3 })] }, misserfolg: { text: 'Du überdrehst, kassierst eine unnötige Gelbe und musst dich später rechtfertigen.', effekte: [T({ disziplin: -2, trainerBeziehung: -1 })] } },
      { label: 'Cool bleiben', erfolg: { text: 'Du lässt dich nicht anstecken und konzentrierst dich auf deine Aufgaben.', effekte: [T({ professionalitaet: 2 })] } },
    ],
  },
  {
    id: 's-trainer-taktiker', kategorie: 'Trainer', gewicht: 1.5, abstand: 120, bedingung: (c) => profi(c) && trainerTyp(c) === 'taktiker',
    titel: 'Hausaufgaben vom Taktikfuchs', text: '{trainer} schickt dir ein 40-seitiges PDF über den kommenden Gegner. Am Ende steht: „Bitte bis morgen auswendig.“',
    optionen: [
      { label: 'Gründlich durcharbeiten', erfolg: { text: 'Du kennst jede Schwäche des Gegners. Das macht sich im Spiel bezahlt.', effekte: [S({ positionsspiel: 2 }), T({ trainerBeziehung: 4, professionalitaet: 2 })] } },
      { label: 'Querlesen', erfolg: { text: 'Du überfliegst die Highlights und denkst dir den Rest dazu.', effekte: [S({ positionsspiel: 1 })] } },
      { label: 'Ignorieren', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['selbstvertrauen'] }, erfolg: { text: 'Du spielst nach Instinkt und liegst oft richtig. {trainer} schmunzelt.', effekte: [T({ selbstvertrauen: 3 })] }, misserfolg: { text: 'Du läufst in jede Abseitsfalle. {trainer} zeigt dir die Szenen im Video. Alle.', effekte: [T({ trainerBeziehung: -4, selbstvertrauen: -3 })] } },
    ],
  },
  {
    id: 's-trainer-diktator', kategorie: 'Trainer', gewicht: 1.5, abstand: 120, bedingung: (c) => profi(c) && trainerTyp(c) === 'diktator',
    titel: 'Der Drill-Sergeant', text: 'Nach der Niederlage lässt {trainer} die Mannschaft am freien Tag um 6 Uhr antreten. „Wer jetzt jammert, kann gleich zu Hause bleiben.“ Die Stimmung ist im Keller.',
    optionen: [
      { label: 'Schweigen und durchziehen', erfolg: { text: 'Du beißt die Zähne zusammen. Es tut weh, aber du wirst fitter.', effekte: [S({ physis: 1 }), T({ fitness: 3, disziplin: 3, moral: -3, kabine: 2 })] } },
      { label: 'Für die Mannschaft sprechen', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['kabine', 'selbstvertrauen'] }, erfolg: { text: '{trainer} schaut dich lange an und streicht die Einheit zusammen. Die Kabine feiert dich.', effekte: [T({ kabine: 8, trainerBeziehung: 1, ruf: 1 })] }, misserfolg: { text: '{trainer} verdoppelt die Strafe, nur für dich. Du sprintest bis zum Erbrechen.', effekte: [T({ trainerBeziehung: -5, fitness: -6, kabine: 3 })] } },
      { label: 'Krank melden', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['selbstvertrauen'] }, erfolg: { text: 'Der Mannschaftsarzt spielt mit. Du schläfst aus.', effekte: [T({ fitness: 3, disziplin: -2 })] }, misserfolg: { text: '{trainer} durchschaut es sofort. Die Geldstrafe ist saftig.', effekte: [G(anteil(0.01, 200)), T({ trainerBeziehung: -5, disziplin: -3 })] } },
    ],
  },
  {
    id: 's-trainer-altmeister', kategorie: 'Trainer', gewicht: 1.5, abstand: 120, bedingung: (c) => profi(c) && trainerTyp(c) === 'altmeister',
    titel: 'Geschichten vom Altmeister', text: '{trainer} erzählt beim Mittagessen, wie er 1998 mit einem Fisch im Rucksack ein Auswärtsspiel gewonnen hat. Die jungen Spieler schmunzeln, die alten nicken ernst.',
    optionen: [
      { label: 'Aufmerksam zuhören und fragen', erfolg: { text: 'Du saugst jede Anekdote auf. Zwischen den Geschichten steckt echtes Wissen.', effekte: [S({ positionsspiel: 1 }), T({ trainerBeziehung: 4, professionalitaet: 2 })] } },
      { label: 'Einen Witz machen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['selbstvertrauen', 'kabine'] }, erfolg: { text: 'Selbst {trainer} lacht laut. Die Stimmung ist bestens.', effekte: [T({ kabine: 4, trainerBeziehung: 2 })] }, misserfolg: { text: '{trainer} erstarrt. „Respekt, mein Junge, hat man früher gelernt.“', effekte: [T({ trainerBeziehung: -4 })] } },
    ],
  },
  {
    id: 's-trainer-jugend', kategorie: 'Trainer', gewicht: 1.5, abstand: 150, bedingung: (c) => profi(c) && trainerTyp(c) === 'jugendfoerderer' && ov(c) > 45,
    titel: 'Der Jugendförderer baut um', text: '{trainer} lässt drei Talente aus der U19 in die Startelf rücken. „Die sind hungrig“, sagt er. Ältere Spieler schauen genervt. Dich schaut er lange an.',
    optionen: [
      { label: 'Die Talente unter deine Fittiche nehmen', erfolg: { text: 'Du wirst zum Mentor. {trainer} schätzt deine Reife.', effekte: [T({ trainerBeziehung: 4, kabine: 3, ruf: 1 })] } },
      { label: 'Deinen Platz verteidigen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['ehrgeiz'] }, erfolg: { text: 'Du zeigst im Training, dass Erfahrung zählt. {trainer} lässt dich spielen.', effekte: [T({ ehrgeiz: 2, selbstvertrauen: 3, kabine: -1 })] }, misserfolg: { text: 'Die Jungen rennen dir davon. Du rutschst auf die Bank.', effekte: [T({ selbstvertrauen: -3, trainerBeziehung: -2 })] } },
    ],
  },
  {
    id: 's-interimstrainer', kategorie: 'Trainer', gewicht: 1.2, abstand: 160, bedingung: (c) => ligaPhase(c, 8) && (unten(c) || (tabellenplatz(c) > c.saison.teams.length / 2 && c.form < 40)),
    titel: 'Der Co-Trainer übernimmt', text: 'Nach der nächsten Pleite zieht der Verein die Reißleine: {trainer} geht, der Co-Trainer übernimmt „zunächst interimsweise“. Er stellt sich vor die Mannschaft und fragt: „Wer will mehr Verantwortung?“',
    optionen: [
      { label: 'Hand heben', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['ehrgeiz', 'selbstvertrauen'] }, erfolg: { text: 'Du wirst zu einer Säule der Übergangszeit. Der Interimstrainer weiß, was er an dir hat.', effekte: [T({ trainerBeziehung: 6, ruf: 1, kabine: 3 }), AKT('trainer-wechsel'), FOLGE('s-neuer-trainer', 2)] }, misserfolg: { text: 'Du übernimmst dich. Eine fahrige Trainingswoche, der Interimstrainer schaut skeptisch.', effekte: [T({ trainerBeziehung: -2, selbstvertrauen: -3 }), AKT('trainer-wechsel'), FOLGE('s-neuer-trainer', 2)] } },
      { label: 'Im Hintergrund bleiben', erfolg: { text: 'Du machst deine Arbeit, ohne aufzufallen. Mit einem neuen Mann an der Linie fängt alles von vorn an.', effekte: [T({ professionalitaet: 1 }), AKT('trainer-wechsel'), FOLGE('s-neuer-trainer', 2)] } },
    ],
  },

  // ---------------------------------------------------------------- Abstiegskampf
  {
    id: 's-krisensitzung', kategorie: 'Verein', gewicht: 2.2, abstand: 70, bedingung: (c) => ligaPhase(c, 12) && unten(c) && restSpieltage(c) > 6,
    titel: 'Krisensitzung', text: 'Der Verein steckt tief im Abstiegssumpf. Der Präsident ruft zur Krisensitzung in die Kabine: „Ab jetzt zählt nur noch eines: Klassenerhalt!“ Keiner traut sich, ihn anzusehen.',
    optionen: [
      { label: 'Aufstehen und Verantwortung übernehmen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['kabine', 'moral'] }, erfolg: { text: 'Du hältst eine kurze, ehrliche Rede. Danach wird im Training gebrüllt, gegrätscht und gelacht. Der Funke zündet.', effekte: [T({ kabine: 6, trainerBeziehung: 3, moral: 4, ruf: 1 }), STAERKE(1)] }, misserfolg: { text: 'Deine Worte klingen hohl, und {kapitaen} fährt dir über den Mund. Peinliche Stille.', effekte: [T({ kabine: -3, selbstvertrauen: -3 })] } },
      { label: 'Zuhören und auf dem Platz liefern', erfolg: { text: 'Du hältst den Mund und arbeitest. Wer so spielt, braucht keine Reden.', effekte: [T({ professionalitaet: 3, moral: 1 })] } },
      { label: 'Wechsel in Betracht ziehen', erfolg: { text: 'Du bist es leid, gegen den Abstieg zu spielen. Dein Berater hört sich um.', effekte: [T({ moral: -3, trainerBeziehung: -2 }), AKT('wechselwunsch')] } },
    ],
  },
  {
    id: 's-kasernierung', kategorie: 'Verein', gewicht: 1.5, abstand: 110, bedingung: (c) => ligaPhase(c, 14) && unten(c) && restSpieltage(c) > 4,
    titel: 'Kasernierung im Hotel', text: 'Der Trainer verordnet Kasernierung: Zwei Nächte im Hotel am Stadtrand, Handy abgeben, Mannschaftsfrühstück. „Wir müssen wieder zusammenwachsen“, sagt er. Dein Zimmer teilst du mit {freund}.',
    optionen: [
      { label: 'Mitmachen und Gemeinschaft stärken', erfolg: { text: 'Beim Tischkicker-Turnier lacht die Mannschaft zum ersten Mal seit Wochen. Es hilft.', effekte: [T({ kabine: 5, moral: 3, privatglueck: -2 }), STAERKE(1)] } },
      { label: 'Heimlich Besuch empfangen', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['disziplin'] }, erfolg: { text: 'Der Pizzabote kommt unbemerkt durch die Hintertür. Ein kleiner Sieg für die Moral.', effekte: [T({ moral: 3, disziplin: -1 })] }, misserfolg: { text: 'Der Co-Trainer erwischt dich mit zwei Pizzakartons. Strafe plus Spott der Kollegen.', effekte: [G(anteil(0.01, 200)), T({ trainerBeziehung: -4, disziplin: -3, kabine: -1 })] } },
    ],
  },
  {
    id: 's-sechspunktespiel', kategorie: 'Verein', gewicht: 2.5, abstand: 40, bedingung: (c) => ligaPhase(c, 20) && unten(c) && restSpieltage(c) <= 6 && restSpieltage(c) >= 1,
    titel: 'Sechs-Punkte-Spiel', text: 'Nächste Woche geht es gegen einen direkten Konkurrenten im Abstiegskampf. Die Zeitungen schreiben vom „Endspiel“, die Fans wollen kämpfende Spieler sehen. Du merkst jeden Tag, wie der Druck steigt.',
    optionen: [
      { label: 'Die Sonderschicht annehmen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['fitness', 'ehrgeiz'] }, erfolg: { text: 'Du läufst dir die Lunge aus dem Leib. Die Fans erkennen jeden Meter an.', effekte: [T({ fanbeliebtheit: 4, ruf: 1, moral: 3, fitness: -4 }), FLAG('abstiegskaempfer')] }, misserfolg: { text: 'Du bist ausgelaugt, bevor das Spiel überhaupt beginnt.', effekte: [T({ fitness: -7, moral: -2 })] } },
      { label: 'Die Spannung mit Lockerheit brechen', erfolg: { text: 'Du erzählst Witze beim Aufwärmen. Die Anspannung löst sich, die Beine werden leicht.', effekte: [T({ kabine: 3, moral: 2, selbstvertrauen: 2 })] } },
      { label: 'Aufs Handy verzichten und fokussieren', erfolg: { text: 'Keine Zeitung, kein Insta. Nur du, der Ball und der Plan.', effekte: [T({ professionalitaet: 2, selbstvertrauen: 1 })] } },
    ],
  },
  {
    id: 's-klassenerhalt-fans', kategorie: 'Verein', gewicht: 1.5, abstand: 60, bedingung: (c) => ligaPhase(c, 20) && unten(c) && restSpieltage(c) <= 8 && trait(c, 'fanbeliebtheit') < 55,
    titel: 'Fans fordern Einsatz', text: 'Die Fankurve hat ein Banner gespannt: „Kämpft oder geht!“ Ein Ultra vom Zaun ruft deinen Namen. Er will, dass du in der Schlussphase alles gibst.',
    optionen: [
      { label: 'Zum Zaun gehen und versprechen: „Wir bleiben oben!“', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['selbstvertrauen'] }, erfolg: { text: 'Die Kurve klatscht, singt deinen Namen und trägt dich durch die nächsten Spiele.', effekte: [T({ fanbeliebtheit: 6, moral: 3, ruf: 1 })] }, misserfolg: { text: 'Dein Versprechen holt dich nach einer Pleite ein. Die Pfiffe lassen nicht lange auf sich warten.', effekte: [T({ fanbeliebtheit: -4, selbstvertrauen: -3 })] } },
      { label: 'Nichts versprechen', erfolg: { text: 'Du lässt Taten sprechen. Ein paar Fans murren, aber die Mannschaft arbeitet.', effekte: [T({ professionalitaet: 2 })] } },
    ],
  },
  {
    id: 's-rettung', kategorie: 'Verein', gewicht: 0, abstand: 30,
    titel: 'Die Rettung', text: 'Der Klassenerhalt ist geschafft! Bei der Nachfeier im Stadion tobt die Kurve, die Spieler fallen sich in die Arme, und der Präsident gibt eine Lokalrunde aus. Aus dem Abstiegskampf ist ein Fest geworden.',
    optionen: [
      { label: 'Mit den Fans feiern', erfolg: { text: 'Du stehst auf dem Zaun und singst mit der Kurve. Dieses Gefühl bleibt.', effekte: [T({ fanbeliebtheit: 6, moral: 8, kabine: 4, ruf: 1 }), NEWS('{verein} rettet sich: {name} feiert mit der Kurve')] } },
      { label: 'Ruhig in die Kabine gehen', erfolg: { text: 'Du freust dich still. Der Druck fällt ab wie ein Stein.', effekte: [T({ moral: 6, professionalitaet: 2 })] } },
    ],
  },

  // ---------------------------------------------------------------- Titelrennen
  {
    id: 's-titelrennen', kategorie: 'Verein', gewicht: 2.2, abstand: 70, bedingung: (c) => ligaPhase(c, 14) && oben(c) && restSpieltage(c) > 6,
    titel: 'Plötzlich Titelkandidat', text: 'Dein Klub steht oben, und plötzlich fragt die ganze Stadt: „Ist da mehr drin?“ Die Presse schreibt vom Meisterkampf, die Fans fangen an zu träumen. Der Trainer winkt ab: „Von Titeln spricht hier keiner.“',
    optionen: [
      { label: 'Mutig sagen: „Wir wollen es wissen!“', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['selbstvertrauen', 'ehrgeiz'] }, erfolg: { text: 'Deine Ansage elektrisiert die Fans. Die Kabine zieht mit.', effekte: [T({ fanbeliebtheit: 5, ruf: 2, moral: 4, trainerBeziehung: -1 })] }, misserfolg: { text: 'Der Trainer ist sauer: „Hab ich nicht gesagt, wir reden nicht darüber?“ Der Druck steigt für alle.', effekte: [T({ trainerBeziehung: -4, selbstvertrauen: -2 })] } },
      { label: 'Tiefstapeln: „Wir arbeiten von Spiel zu Spiel.“', erfolg: { text: 'Eine Phrase, aber die richtige. {trainer} nickt zufrieden.', effekte: [T({ trainerBeziehung: 3, professionalitaet: 2 })] } },
      { label: 'Die Journalisten meiden', erfolg: { text: 'Du gehst durch den Hintereingang. Ruhe vor dem Sturm.', effekte: [T({ professionalitaet: 1, fanbeliebtheit: -1 })] } },
    ],
  },
  {
    id: 's-titelkampf-endspurt', kategorie: 'Verein', gewicht: 2.5, abstand: 40, bedingung: (c) => ligaPhase(c, 22) && oben(c) && restSpieltage(c) <= 6 && restSpieltage(c) >= 1 && punkteAbstand(c, 3) >= 0,
    titel: 'Endspurt im Titelkampf', text: 'Nur noch wenige Spieltage, und dein Verein hat die Meisterschaft in Reichweite. Im Training knistert es, und beim Warmmachen schauen sich alle immer wieder zur Tabelle um. Dein Handy platzt vor Nachrichten.',
    optionen: [
      { label: 'Fokus auf das Wesentliche', erfolg: { text: 'Du schaltest den Lärm aus: Essen, schlafen, trainieren, spielen. Die Routine trägt.', effekte: [T({ professionalitaet: 3, fitness: 2, moral: 2 }), FLAG('titelkampf')] } },
      { label: 'Die Mannschaft mit einem Grillabend zusammenschweißen', kosten: 400, hinweis: 'kostet 400 €', erfolg: { text: 'Würstchen, Bier (alkoholfrei, natürlich) und gemeinsame Pläne: Die Kabine rückt zusammen.', effekte: [T({ kabine: 5, moral: 4 }), FLAG('titelkampf')] } },
      { label: 'Alles auf eine Karte setzen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['ehrgeiz', 'fitness'] }, erfolg: { text: 'Du trainierst härter denn je. Die Beine tragen und die Form explodiert.', effekte: [T({ ehrgeiz: 3, selbstvertrauen: 4, fitness: -3 }), S({ physis: 1 }), FLAG('titelkampf')] }, misserfolg: { text: 'Du übertreibst, die Muskeln machen zu. Zwei Wochen Pause im schlechtesten Moment.', effekte: [VERL('Muskelverletzung', 2), T({ moral: -4 })] } },
    ],
  },
  {
    id: 's-meisterschaft-greifbar', kategorie: 'Verein', gewicht: 2, abstand: 40, bedingung: (c) => ligaPhase(c, 28) && tabellenplatz(c) === 1 && restSpieltage(c) <= 3 && restSpieltage(c) >= 1 && punkteAbstand(c, 2) >= 3,
    titel: 'Die Meisterschaft liegt in der Luft', text: 'Noch ein paar Spiele, dann könnte es so weit sein. Die Stadt hat schon die Fahnen ausgepackt, der Bürgermeister plant einen Empfang, und der Präsident hat bereits den Termin für die Meisterfeier angesetzt (heimlich). Dein Handy summt ohne Pause.',
    optionen: [
      { label: 'Mit der Feier noch warten', erfolg: { text: 'Du gibst im Interview zu Protokoll: „Gefeiert wird, wenn es durch ist.“ Das mögen die Fans und der Trainer.', effekte: [T({ professionalitaet: 3, trainerBeziehung: 3, kabine: 2 })] } },
      { label: 'Vorfreude genießen', hinweis: 'riskant', wurf: { basis: 0.6, traits: ['professionalitaet'] }, erfolg: { text: 'Du saugst die Stimmung auf, ohne den Kopf zu verlieren. Die nächste Partie geht souverän an euch.', effekte: [T({ moral: 5, fanbeliebtheit: 3 })] }, misserfolg: { text: 'Du denkst zu viel an die Feier, vergisst das Training, und ein Konkurrent kommt wieder näher.', effekte: [T({ professionalitaet: -2, trainerBeziehung: -3 })] } },
    ],
  },
  {
    id: 's-meisterkorso', kategorie: 'Verein', gewicht: 0, abstand: 30,
    titel: 'Meisterkorso', text: 'Ihr seid Meister! Die Stadt feiert noch immer: Der Bus fährt im Schritttempo durch die Innenstadt, 100.000 Menschen stehen am Straßenrand, Konfetti, Gesänge, Bengalos. Jemand drückt dir ein Bier in die Hand.',
    optionen: [
      { label: 'Jubeln, bis die Stimme weg ist', erfolg: { text: 'Du hast heute Nacht kaum geschlafen und morgen kaum eine Stimme. Es war jeden Moment wert.', effekte: [T({ moral: 12, fanbeliebtheit: 6, ruf: 3, fitness: -4, privatglueck: 4 }), NEWS('{name} feiert den Titel mit {verein}')] } },
      { label: 'Mit der Familie feiern', erfolg: { text: 'Du holst deine Liebsten auf den Bus. Die Fotos dieses Tages hängen bald überall.', effekte: [T({ privatglueck: 8, moral: 8, fanbeliebtheit: 3, ruf: 2 })] } },
    ],
  },
  {
    id: 's-titel-verspielt', kategorie: 'Verein', gewicht: 0, abstand: 30,
    titel: 'Der Titel ist weg', text: 'Der Titel ist knapp an euch vorbeigegangen. Die ganze Saison wart ihr dran, am Ende fehlten ein paar Punkte. Bei der Saisonabschlussfeier liegt Wehmut in der Luft: So kurz davor war der Klub lange nicht.',
    optionen: [
      { label: 'Die Mannschaft aufbauen', erfolg: { text: 'Du gehst von Spieler zu Spieler, klopfst auf Schultern und sagst: „Nächstes Jahr greifen wir wieder an.“', effekte: [T({ kabine: 5, moral: -2, professionalitaet: 2, ruf: 1 })] } },
      { label: 'Allein im Stadion sitzen bleiben', erfolg: { text: 'Du starrst in die leeren Ränge und lässt die Saison Revue passieren. Es schmerzt, aber der Hunger wächst.', effekte: [T({ ehrgeiz: 4, moral: -4 })] } },
    ],
  },
  {
    id: 's-pokalschock', kategorie: 'Verein', gewicht: 1.8, abstand: 45, bedingung: (c) => profi(c) && c.saison.pokal.status === 'ausgeschieden' && c.saison.pokal.runde <= 2 && c.vertrag?.rolle !== 'Jugend',
    titel: 'Pokal-Blamage', text: 'Gegen einen Viertligisten ausgeschieden! Die Zeitungen titeln „Schande von …“, ein Fan wirft dir sein Trikot vor die Füße. Der Präsident will nach dem Spiel alle sehen.',
    optionen: [
      { label: 'Fehler eingestehen und Schuld übernehmen', erfolg: { text: 'Du stellst dich den Fragen, ohne mit dem Finger zu zeigen. Das imponiert sogar den Kritikern.', effekte: [T({ professionalitaet: 3, fanbeliebtheit: 1, moral: -3 })] } },
      { label: 'Dem Gegner Respekt zollen', erfolg: { text: 'Du gratulierst dem Amateurverein und schenkst dem Torschützen dein Trikot. Die Szene geht durchs Netz.', effekte: [T({ fanbeliebtheit: 4, ruf: 1, moral: -2 })] } },
      { label: 'Den Schiri verantwortlich machen', hinweis: 'riskant', wurf: { basis: 0.3, traits: ['selbstvertrauen'] }, erfolg: { text: 'Die Fans stimmen dir zu: „Der hat nie gepfiffen.“ Der Verband ermahnt dich trotzdem.', effekte: [T({ fanbeliebtheit: 3 }), G(-300)] }, misserfolg: { text: 'Die Antwort kommt prompt: Gesperrt wegen Schiedsrichterkritik, und der Trainer schüttelt den Kopf.', effekte: [T({ trainerBeziehung: -4, fanbeliebtheit: -3 }), G(-500)] } },
    ],
  },
]
