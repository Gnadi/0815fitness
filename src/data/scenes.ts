import type { Position, Skills, Traits } from '../engine/types'

export interface SceneEffect {
  text: string
  eigeneTore?: number
  gegnerTore?: number
  spielerTore?: number
  vorlagen?: number
  /** Änderung der Spielernote. */
  note?: number
  /** Änderungen an Traits (Deltas). */
  traits?: Partial<Traits>
  gelb?: boolean
  rot?: boolean
  verletzung?: boolean
  /** Spiel für den Spieler vorzeitig beendet. */
  ende?: boolean
}

export interface SceneOption {
  label: string
  risiko: 'sicher' | 'mittel' | 'riskant'
  /** Grundwahrscheinlichkeit, wird durch Skills, Traits und Tagesform verschoben. */
  basis: number
  skills?: (keyof Skills)[]
  traits?: (keyof Traits)[]
  erfolg: SceneEffect
  misserfolg: SceneEffect
}

export interface SceneTemplate {
  id: string
  positionen: Position[] | 'alle'
  gewicht: number
  titel: string
  /** Platzhalter: {gegner}. */
  text: string
  optionen: SceneOption[]
}

const OFFENSIV: Position[] = ['ST', 'AF', 'ZOM']

export const SCENES: SceneTemplate[] = [
  {
    id: 'torchance', positionen: OFFENSIV, gewicht: 3, titel: 'Riesenchance',
    text: 'Steilpass! Du bist frei durch und läufst allein auf den Keeper von {gegner} zu. Das halbe Stadion hält den Atem an.',
    optionen: [
      {
        label: 'Flach ins lange Eck', risiko: 'mittel', basis: 0.5, skills: ['schuss', 'technik'],
        erfolg: { text: 'Eiskalt! Der Ball zischt ins Eck, der Keeper ist chancenlos.', eigeneTore: 1, spielerTore: 1, note: 1.3, traits: { selbstvertrauen: 4, fanbeliebtheit: 1 } },
        misserfolg: { text: 'Der Keeper wirft sich in die Ecke und hält. Das war die Chance des Spiels.', note: -0.3, traits: { selbstvertrauen: -2 } },
      },
      {
        label: 'Den Torwart umspielen', risiko: 'riskant', basis: 0.38, skills: ['dribbling', 'technik'],
        erfolg: { text: 'Du tanzt den Keeper aus und schiebst lässig ein. Pure Arroganz, pure Klasse.', eigeneTore: 1, spielerTore: 1, note: 1.6, traits: { selbstvertrauen: 5, fanbeliebtheit: 2 } },
        misserfolg: { text: 'Der Keeper schnappt sich den Ball von deinem Fuß. Der Konter rollt, der Trainer tobt.', note: -0.7, traits: { selbstvertrauen: -3, trainerBeziehung: -1 } },
      },
      {
        label: 'Querlegen auf den Mitspieler', risiko: 'sicher', basis: 0.68, skills: ['pass'],
        erfolg: { text: 'Uneigennützig quergelegt, der Kollege schiebt ein. Die Kabine feiert dich.', eigeneTore: 1, vorlagen: 1, note: 0.9, traits: { kabine: 2 } },
        misserfolg: { text: 'Dein Querpass kommt zu ungenau, der Verteidiger klärt. Verschenkt.', note: -0.1 },
      },
    ],
  },
  {
    id: 'elfmeter', positionen: ['ST', 'AF', 'ZOM', 'ZM'], gewicht: 2, titel: 'Elfmeter!',
    text: 'Strafstoß für dein Team. Der Ball liegt auf dem Punkt, alle Augen sind auf dich und den Kapitän gerichtet.',
    optionen: [
      {
        label: 'Selbst antreten', risiko: 'mittel', basis: 0.62, skills: ['schuss'], traits: ['selbstvertrauen'],
        erfolg: { text: 'Du legst den Ball ins Eck, als hättest du nie etwas anderes gemacht. Drin!', eigeneTore: 1, spielerTore: 1, note: 1.1, traits: { selbstvertrauen: 5, fanbeliebtheit: 2 } },
        misserfolg: { text: 'Verschossen! Der Ball klatscht an den Pfosten. Die Zeitungen werden dich dafür lieben.', note: -1.0, traits: { selbstvertrauen: -8, kabine: -1, fanbeliebtheit: -2 } },
      },
      {
        label: 'Dem Stammschützen überlassen', risiko: 'sicher', basis: 0.76,
        erfolg: { text: 'Der Routinier verwandelt sicher und klopft dir dankbar auf die Schulter.', eigeneTore: 1, note: 0.1, traits: { kabine: 2 } },
        misserfolg: { text: 'Der Routinier scheitert am Keeper. Immerhin warst du es nicht.', note: 0 },
      },
    ],
  },
  {
    id: 'konter', positionen: ['ST', 'AF', 'ZOM', 'ZM', 'AV'], gewicht: 2, titel: 'Konter',
    text: 'Ballgewinn! Drei gegen zwei, du hast den Ball am Fuß und {gegner} ist komplett aufgerückt.',
    optionen: [
      {
        label: 'Tempo machen und selbst abschließen', risiko: 'riskant', basis: 0.4, skills: ['tempo', 'schuss'],
        erfolg: { text: 'Du läufst allen davon und hämmerst das Ding rein. Ein Tor zum Einrahmen.', eigeneTore: 1, spielerTore: 1, note: 1.4, traits: { selbstvertrauen: 4, fanbeliebtheit: 1 } },
        misserfolg: { text: 'Dein Abschluss geht weit drüber. Der Trainer schlägt die Hände über dem Kopf zusammen.', note: -0.5, traits: { trainerBeziehung: -1 } },
      },
      {
        label: 'Den freien Mitspieler bedienen', risiko: 'mittel', basis: 0.58, skills: ['pass', 'technik'],
        erfolg: { text: 'Perfekter Pass in den Lauf, der Kollege vollendet. Das war Kopfball-Fußball der feinen Art.', eigeneTore: 1, vorlagen: 1, note: 1.0, traits: { kabine: 1 } },
        misserfolg: { text: 'Der Pass ist zu steil und rollt ins Aus. Konter verpufft.', note: -0.3 },
      },
    ],
  },
  {
    id: 'distanzschuss', positionen: ['ZM', 'ZOM', 'ZDM', 'AF'], gewicht: 2, titel: 'Distanzschuss',
    text: 'Der Ball springt dir 25 Meter vor dem Tor vor die Füße. Keiner stört dich. Das Tor ruft.',
    optionen: [
      {
        label: 'Abziehen!', risiko: 'riskant', basis: 0.28, skills: ['schuss', 'technik'],
        erfolg: { text: 'Was für ein Strahl! Der Ball schlägt im Winkel ein. Tor des Monats, mindestens.', eigeneTore: 1, spielerTore: 1, note: 1.6, traits: { selbstvertrauen: 6, fanbeliebtheit: 3, ruf: 1 } },
        misserfolg: { text: 'Der Schuss landet auf der Tribüne, ungefähr dort, wo die Fans ihr Bier holen.', note: -0.2, traits: { selbstvertrauen: -1 } },
      },
      {
        label: 'Den Ball laufen lassen', risiko: 'sicher', basis: 0.85, skills: ['pass'],
        erfolg: { text: 'Du hältst den Ball in den eigenen Reihen. Unspektakulär, aber vernünftig.', note: 0.1 },
        misserfolg: { text: 'Dein Anspiel wird abgefangen. Gefährlich!', note: -0.3 },
      },
    ],
  },
  {
    id: 'steilpass', positionen: ['ZM', 'ZOM', 'ZDM'], gewicht: 3, titel: 'Die Lücke',
    text: 'Du siehst die Lücke in der Abwehr von {gegner}, als hätte jemand das Licht angeknipst.',
    optionen: [
      {
        label: 'Steilpass in die Tiefe', risiko: 'mittel', basis: 0.45, skills: ['pass', 'positionsspiel'],
        erfolg: { text: 'Traumpass! Der Stürmer läuft allein aufs Tor zu und lässt sich nicht lange bitten.', eigeneTore: 1, vorlagen: 1, note: 1.3, traits: { selbstvertrauen: 3, kabine: 2 } },
        misserfolg: { text: 'Zu scharf gespielt, der Ball rollt zum Torwart. Ein Pass für die Statistik der Gegner.', note: -0.3 },
      },
      {
        label: 'Sicherheitspass nach hinten', risiko: 'sicher', basis: 0.92,
        erfolg: { text: 'Kein Risiko, kein Ballverlust. Der Trainer nickt.', note: 0.1, traits: { trainerBeziehung: 1 } },
        misserfolg: { text: 'Selbst der einfache Pass geht daneben. Das passiert dir auch nur heute.', note: -0.3 },
      },
      {
        label: 'Selbst durchstarten', risiko: 'riskant', basis: 0.3, skills: ['dribbling', 'schuss'],
        erfolg: { text: 'Du lässt zwei Mann stehen und schließt trocken ab. Solo-Tor!', eigeneTore: 1, spielerTore: 1, note: 1.5, traits: { selbstvertrauen: 5, fanbeliebtheit: 2 } },
        misserfolg: { text: 'Du verlierst den Ball im Dribbling. Der Gegner kontert, es wird brenzlig.', gegnerTore: 1, note: -1.0, traits: { selbstvertrauen: -3 } },
      },
    ],
  },
  {
    id: 'zweikampf', positionen: ['IV', 'AV', 'ZDM'], gewicht: 3, titel: 'Allein gegen dich',
    text: 'Der Stürmer von {gegner} ist durch und läuft frontal auf dich zu. Hinter dir ist nur noch der Torwart.',
    optionen: [
      {
        label: 'Sauber den Ball spielen', risiko: 'mittel', basis: 0.55, skills: ['defensive', 'tempo'],
        erfolg: { text: 'Perfekt getimt! Du spitzelst den Ball weg, der Stürmer schaut dumm aus der Wäsche.', note: 1.1, traits: { selbstvertrauen: 3, fanbeliebtheit: 1 } },
        misserfolg: { text: 'Du kommst einen Schritt zu spät, der Stürmer vollstreckt. Da war mehr drin.', gegnerTore: 1, note: -1.1, traits: { selbstvertrauen: -3 } },
      },
      {
        label: 'Taktisches Foul', risiko: 'sicher', basis: 0.82, traits: ['disziplin'],
        erfolg: { text: 'Du hältst ihn ein bisschen fest. Gelb, aber die Situation ist entschärft.', gelb: true, note: 0.2, traits: { disziplin: -1 } },
        misserfolg: { text: 'Der Schiri hat genau hingeschaut. Rot! Das war kein Foul, das war ein Statement.', rot: true, note: -2.0, traits: { kabine: -2, trainerBeziehung: -3 } },
      },
    ],
  },
  {
    id: 'rettungstat', positionen: ['IV', 'AV', 'TW', 'ZDM'], gewicht: 2, titel: 'Brenzlige Szene',
    text: 'Der Ball ist schon fast hinter der Linie, nur du bist noch im Weg. Alles oder nichts.',
    optionen: [
      {
        label: 'Hechten und klären', risiko: 'mittel', basis: 0.5, skills: ['defensive', 'positionsspiel'],
        erfolg: { text: 'Auf der Linie gerettet! Die Fans singen deinen Namen.', note: 1.3, traits: { fanbeliebtheit: 2, selbstvertrauen: 3 } },
        misserfolg: { text: 'Du kommst einen Wimpernschlag zu spät. Der Ball zappelt im Netz.', gegnerTore: 1, note: -0.6 },
      },
      {
        label: 'Auf den Mitspieler vertrauen', risiko: 'sicher', basis: 0.7,
        erfolg: { text: 'Der Kollege klärt, du schnaufst durch. Teamwork.', note: 0.2, traits: { kabine: 1 } },
        misserfolg: { text: 'Der Kollege kommt nicht ran. Das hätte dir auffallen können.', gegnerTore: 1, note: -0.5, traits: { kabine: -1 } },
      },
    ],
  },
  {
    id: 'ecke', positionen: ['IV', 'ZDM', 'ST'], gewicht: 2, titel: 'Eckball',
    text: 'Ecke für dein Team. Du stehst am zweiten Pfosten, der Ball segelt genau in deine Richtung.',
    optionen: [
      {
        label: 'Kopfball Richtung Tor', risiko: 'mittel', basis: 0.35, skills: ['physis', 'positionsspiel'],
        erfolg: { text: 'Du steigst höher als alle anderen und wuchtest das Ding rein. Kopfballungeheuer!', eigeneTore: 1, spielerTore: 1, note: 1.4, traits: { selbstvertrauen: 4, fanbeliebtheit: 1 } },
        misserfolg: { text: 'Dein Kopfball geht übers Tor. Wenigstens hast du dein Haargel nicht ruiniert.', note: -0.1 },
      },
      {
        label: 'Zurücklegen auf den Mitspieler', risiko: 'sicher', basis: 0.6, skills: ['technik'],
        erfolg: { text: 'Der Kollege hämmert den Ball unter die Latte. Die Vorlage geht auf dich.', eigeneTore: 1, vorlagen: 1, note: 0.9, traits: { kabine: 1 } },
        misserfolg: { text: 'Der Ball wird geklärt, die Chance ist dahin.', note: 0 },
      },
    ],
  },
  {
    id: 'tw-elfmeter', positionen: ['TW'], gewicht: 4, titel: 'Elfmeter gegen dich',
    text: 'Strafstoß für {gegner}. Der Schütze legt sich den Ball zurecht und grinst dich an.',
    optionen: [
      {
        label: 'Linke Ecke', risiko: 'riskant', basis: 0.28, skills: ['positionsspiel'],
        erfolg: { text: 'Gehalten! Du fliegst in die richtige Ecke und wirst zum Helden des Abends.', note: 1.7, traits: { selbstvertrauen: 6, fanbeliebtheit: 3, ruf: 1 } },
        misserfolg: { text: 'Falsche Ecke, der Ball schlägt ein. Der Schütze jubelt, du schaust zu.', gegnerTore: 1, note: -0.3 },
      },
      {
        label: 'Rechte Ecke', risiko: 'riskant', basis: 0.28, skills: ['positionsspiel'],
        erfolg: { text: 'Gehalten! Du hast ihn durchschaut und wirst von den Mitspielern gefeiert.', note: 1.7, traits: { selbstvertrauen: 6, fanbeliebtheit: 3, ruf: 1 } },
        misserfolg: { text: 'Der Schütze schiebt cool in die andere Ecke. Pech.', gegnerTore: 1, note: -0.3 },
      },
      {
        label: 'In der Mitte bleiben', risiko: 'riskant', basis: 0.15,
        erfolg: { text: 'Der Schütze haut mittig drauf und du hältst. Reiner Mut oder reines Glück? Egal!', note: 1.9, traits: { selbstvertrauen: 7, fanbeliebtheit: 3 } },
        misserfolg: { text: 'Du bleibst stehen, der Ball fliegt in die Ecke. Das sah mutig aus. Und doof.', gegnerTore: 1, note: -0.5 },
      },
    ],
  },
  {
    id: 'tw-eins-gegen-eins', positionen: ['TW'], gewicht: 4, titel: 'Eins gegen eins',
    text: 'Ein Stürmer von {gegner} ist allein durch. Zwischen ihm und dem Tor stehst nur du.',
    optionen: [
      {
        label: 'Rausstürzen', risiko: 'mittel', basis: 0.5, skills: ['defensive', 'tempo'],
        erfolg: { text: 'Du machst dich breit, der Stürmer scheitert an deinen Beinen. Stark!', note: 1.4, traits: { selbstvertrauen: 4, fanbeliebtheit: 2 } },
        misserfolg: { text: 'Er lupft den Ball elegant über dich. Das tut weh.', gegnerTore: 1, note: -0.6 },
      },
      {
        label: 'Auf der Linie bleiben', risiko: 'riskant', basis: 0.38, skills: ['positionsspiel'],
        erfolg: { text: 'Du bleibst cool und lässt ihn zuerst schießen. Der Ball klatscht in deine Hände.', note: 1.3, traits: { selbstvertrauen: 3 } },
        misserfolg: { text: 'Er schiebt den Ball an dir vorbei. Ein Hauch zu passiv.', gegnerTore: 1, note: -0.5 },
      },
    ],
  },
  // Allgemeine Szenen für alle Positionen
  {
    id: 'provokation', positionen: 'alle', gewicht: 1, titel: 'Provokation',
    text: 'Dein Gegenspieler flüstert dir was über deine Mutter ins Ohr. Der Schiri sieht gerade weg.',
    optionen: [
      {
        label: 'Ignorieren', risiko: 'sicher', basis: 0.95,
        erfolg: { text: 'Du drehst dich weg und lächelst. Cool bleiben zahlt sich aus.', note: 0.1, traits: { disziplin: 1 } },
        misserfolg: { text: 'Du bleibst ruhig, aber der Spruch nagt an dir.', note: -0.1 },
      },
      {
        label: 'Zurückgiften', risiko: 'mittel', basis: 0.5, traits: ['disziplin'],
        erfolg: { text: 'Du giftest zurück, er tickt aus und sieht Gelb. Das Publikum liebt dich dafür.', note: 0.3, traits: { kabine: 2, fanbeliebtheit: 1 } },
        misserfolg: { text: 'Der Schiri hört nur deine Worte. Gelb für dich.', gelb: true, note: -0.5, traits: { disziplin: -1 } },
      },
      {
        label: 'Schubsen', risiko: 'riskant', basis: 0.3, traits: ['disziplin'],
        erfolg: { text: 'Kurzes Gerangel, der Schiri übersieht es. Die Mitspieler stehen hinter dir.', note: 0, traits: { kabine: 3, disziplin: -2 } },
        misserfolg: { text: 'Tätlichkeit! Rote Karte und eine lange Sperre. Das gibt Ärger mit dem Verein.', rot: true, note: -2.0, traits: { kabine: -2, trainerBeziehung: -4, disziplin: -3, moral: -4 } },
      },
    ],
  },
  {
    id: 'trainer-anweisung', positionen: 'alle', gewicht: 1.5, titel: 'Der Trainer brüllt',
    text: 'Der Trainer brüllt von der Seitenlinie: „Zurück ins System!“ Du hättest aber eine bessere Idee.',
    optionen: [
      {
        label: 'Anweisung befolgen', risiko: 'sicher', basis: 0.9,
        erfolg: { text: 'Du spielst das System runter. Der Trainer nickt zufrieden.', note: 0.2, traits: { trainerBeziehung: 2 } },
        misserfolg: { text: 'Du befolgst die Anweisung, aber es nützt nichts.', note: -0.1 },
      },
      {
        label: 'Eigene Idee durchziehen', risiko: 'riskant', basis: 0.4, skills: ['technik', 'dribbling'],
        erfolg: { text: 'Dein Alleingang bringt die Abwehr durcheinander, am Ende klingelt es. Wer gewinnt, hat recht.', eigeneTore: 1, vorlagen: 1, note: 1.2, traits: { selbstvertrauen: 4, trainerBeziehung: -2 } },
        misserfolg: { text: 'Ballverlust, Konter, Gegentor. Der Trainer schaut aus, als würde er dich am liebsten selbst auswechseln.', gegnerTore: 1, note: -1.0, traits: { trainerBeziehung: -5 } },
      },
    ],
  },
  {
    id: 'knoechel', positionen: 'alle', gewicht: 0.6, titel: 'Aua!',
    text: 'Zweikampf am Mittelkreis, dein Knöchel knackt hörbar. Es tut weh, aber vielleicht geht es noch.',
    optionen: [
      {
        label: 'Weiterspielen', risiko: 'riskant', basis: 0.55, traits: ['gesundheit'],
        erfolg: { text: 'Du beißt auf die Zähne und läufst es raus. Harte Schule.', note: 0.2, traits: { trainerBeziehung: 1, ehrgeiz: 1 } },
        misserfolg: { text: 'Nach ein paar Minuten geht nichts mehr. Das sieht nach einer Verletzung aus.', verletzung: true, ende: true, note: -0.5 },
      },
      {
        label: 'Auswechslung verlangen', risiko: 'sicher', basis: 1,
        erfolg: { text: 'Du gehst runter, auf Nummer sicher. Der Physio atmet auf.', ende: true, note: 0 },
        misserfolg: { text: 'Du gehst runter.', ende: true, note: 0 },
      },
    ],
  },
]

export const SCENE_BY_ID: Record<string, SceneTemplate> = Object.fromEntries(SCENES.map((s) => [s.id, s]))
