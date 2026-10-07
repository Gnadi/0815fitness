import { AKT, FLAG, FOLGE, G, NEWS, S, T, anteil, flag, ov, profi, staerkeVerein, tabellenplatz, trait } from './helpers'
import type { EreignisDef } from './types'

export const TRAINER: EreignisDef[] = [
  {
    id: 't-bank', kategorie: 'Trainer', gewicht: 3, abstand: 90, bedingung: (c) => profi(c) && c.saisonStats.spiele >= 4 && c.spielpraxis < 0.35,
    titel: 'Schon wieder nur Bank', text: 'Zum dritten Mal in Folge sitzt du auf der Bank und siehst {rivale} auf deiner Position spielen. Dein Berater ruft an: „So geht es nicht weiter.“',
    optionen: [
      { label: 'Mit {trainer} reden', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['trainerBeziehung', 'professionalitaet'] }, erfolg: { text: '{trainer} erklärt dir, woran du arbeiten musst. Er verspricht dir eine Chance.', effekte: [T({ trainerBeziehung: 4, moral: 3 })] }, misserfolg: { text: '{trainer} reagiert genervt: „Verdien es dir im Training.“ Das Gespräch endet kühl.', effekte: [T({ trainerBeziehung: -4, moral: -3 })] } },
      { label: 'Wechselwunsch hinterlegen', hinweis: 'verändert deine Lage', erfolg: { text: 'Dein Berater hört sich um. Nach Transfers klingt es verlockend, aber die Stimmung im Klub kippt.', effekte: [AKT('wechselwunsch')] } },
      { label: 'Kopf unten halten und arbeiten', erfolg: { text: 'Du beißt dich durch. Irgendwann kommt deine Chance, dann bist du bereit.', effekte: [T({ professionalitaet: 3, disziplin: 2, moral: -2 })] } },
    ],
  },
  {
    id: 't-zu-spaet', kategorie: 'Trainer', gewicht: 2, abstand: 100, bedingung: profi,
    titel: 'Zu spät zum Training', text: 'Dein Wecker hat nicht geklingelt, der Stau war endlos, und {trainer} hat Pünktlichkeit zur Religion erhoben. Du kommst 25 Minuten zu spät.',
    optionen: [
      { label: 'Ehrlich: „Verschlafen.“', erfolg: { text: 'Du zahlst die Strafe in die Mannschaftskasse. {trainer} hat Respekt vor Ehrlichkeit.', effekte: [G(-100), T({ trainerBeziehung: 1, disziplin: 1 })] } },
      { label: 'Eine Ausrede erfinden', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['selbstvertrauen'] }, erfolg: { text: 'Die Geschichte mit dem Rohrbruch nimmt dir jeder ab. Teils sogar der Trainer.', effekte: [T({ disziplin: -1 })] }, misserfolg: { text: 'Der Physio hat dich vor dem Café gesehen. Das wird teuer.', effekte: [G(anteil(0.01, 150)), T({ trainerBeziehung: -4, disziplin: -2 })] } },
    ],
  },
  {
    id: 't-taktikstreit', kategorie: 'Trainer', gewicht: 2, abstand: 120, bedingung: (c) => profi(c) && ov(c) > 55,
    titel: 'Taktik-Zoff', text: 'In der Videoanalyse zeigt {trainer} einen Fehler von dir. Du bist anderer Meinung und hast eine ganz andere Lösung im Kopf. Der Raum wird still.',
    optionen: [
      { label: 'Widersprechen und deine Idee vorstellen', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['selbstvertrauen'], skills: ['positionsspiel'] }, erfolg: { text: '{trainer} denkt nach und gibt dir recht. Er probiert deine Variante im Training.', effekte: [T({ trainerBeziehung: 3, selbstvertrauen: 4, ruf: 1 })] }, misserfolg: { text: '{trainer} lässt dich auflaufen und zeigt vor allen, dass er recht hat.', effekte: [T({ trainerBeziehung: -4, selbstvertrauen: -3 })] } },
      { label: 'Schlucken und nicken', erfolg: { text: 'Du notierst dir alles und schweigst. Nach dem Training kaust du lange auf der Unterlippe.', effekte: [T({ trainerBeziehung: 1, selbstvertrauen: -1 })] } },
    ],
  },
  {
    id: 't-trainerwechsel', kategorie: 'Trainer', gewicht: 1, abstand: 160, bedingung: (c) => profi(c) && tabellenplatz(c) > 0 && c.saison.tabelle[c.vereinId] !== undefined && c.saison.tabelle[c.vereinId][0] > 8,
    titel: 'Trainer entlassen', text: 'Nach der jüngsten Serie entlässt der Verein {trainer}. Die Zeitung nennt es „Trainerbeben“, der Sportdirektor sagt „Neustart“. In der Kabine herrscht Unsicherheit.',
    optionen: [
      { label: 'Abwarten, wer kommt', erfolg: { text: 'Ein neuer Trainer übernimmt. Alle Karten werden neu gemischt, auch für dich.', effekte: [AKT('trainer-wechsel'), T({ moral: 2 }), FOLGE('s-neuer-trainer', 1)] } },
      { label: 'Altem Trainer eine SMS schicken', erfolg: { text: '{trainer} bedankt sich in einer langen Nachricht. Menschlichkeit zählt.', effekte: [AKT('trainer-wechsel'), T({ professionalitaet: 2 }), FOLGE('s-neuer-trainer', 1)] } },
    ],
  },
  {
    id: 't-lob', kategorie: 'Trainer', gewicht: 2, abstand: 90, bedingung: (c) => profi(c) && c.form > 62,
    titel: 'Lob vom Trainer', text: 'Auf der Pressekonferenz lobt {trainer} deine Entwicklung: „Er hat die Mentalität, die wir uns wünschen.“ Dein Handy explodiert vor Nachrichten.',
    optionen: [
      { label: 'Bescheiden bleiben', erfolg: { text: 'Du sagst nur: „Ich arbeite hart für die Mannschaft.“ Alle sind beeindruckt.', effekte: [T({ trainerBeziehung: 3, professionalitaet: 2, fanbeliebtheit: 2 })] } },
      { label: 'Selbstbewusst auftreten', erfolg: { text: 'Du sagst: „Ich bin erst am Anfang.“ Das klingt gut, aber auch ein wenig arrogant.', effekte: [T({ selbstvertrauen: 4, ruf: 2, kabine: -1 })] } },
    ],
  },
  {
    id: 't-privatstunde', kategorie: 'Trainer', gewicht: 2, abstand: 100, bedingung: (c) => profi(c) && ov(c) < 80,
    titel: 'Extraeinheit mit dem Co-Trainer', text: 'Der Co-Trainer bietet dir 1:1-Einheiten an, nach Dienstschluss, gegen einen kleinen Obolus. Er sagt: „Ich sehe bei dir noch viel Potenzial.“',
    optionen: [
      { label: 'Zusagen', kosten: anteil(0.015, 300), hinweis: 'kostet Geld', erfolg: { text: 'Die Einheiten sind anstrengend, aber effektiv. Du lernst, wie du deine Stärken besser einsetzt.', effekte: [S({ technik: 1, positionsspiel: 1, schuss: 1 }), T({ professionalitaet: 2, fitness: -3 })] } },
      { label: 'Ablehnen', erfolg: { text: 'Du brauchst die Freizeit. Der Co-Trainer zuckt mit den Schultern.', effekte: [T({ fitness: 2 })] } },
    ],
  },
  {
    id: 't-positionswechsel', kategorie: 'Trainer', gewicht: 1.5, abstand: 400, bedingung: (c) => profi(c) && ov(c) > 52 && !flag(c, 'positionGeprueft'),
    titel: 'Neue Rolle?', text: '{trainer} will dich testweise auf einer neuen Position einsetzen. „Du hast die Technik dafür“, sagt er, „und wir brauchen dich dort.“',
    optionen: [
      { label: 'Ausprobieren', hinweis: 'riskant', wurf: { basis: 0.5, skills: ['technik', 'positionsspiel'] }, erfolg: { text: 'Die neue Rolle liegt dir überraschend gut. Deine Vielseitigkeit ist gefragt.', effekte: [S({ positionsspiel: 2, pass: 1 }), T({ trainerBeziehung: 4, selbstvertrauen: 2 }), FLAG('positionGeprueft')] }, misserfolg: { text: 'Du fühlst dich auf der neuen Position verloren und wirst bald zurückbeordert.', effekte: [T({ selbstvertrauen: -3, trainerBeziehung: 1 }), FLAG('positionGeprueft')] } },
      { label: 'Bei deiner Position bleiben', erfolg: { text: '{trainer} akzeptiert das, ohne Begeisterung.', effekte: [T({ trainerBeziehung: -2 }), FLAG('positionGeprueft')] } },
    ],
  },
  {
    id: 't-presse-kritik', kategorie: 'Trainer', gewicht: 1.5, abstand: 150, bedingung: (c) => profi(c) && c.form < 42,
    titel: 'Der Trainer lässt dich öffentlich auflaufen', text: 'Auf der Pressekonferenz sagt {trainer}: „Einzelne Spieler haben sich heute nicht an den Plan gehalten.“ Jeder weiß, wen er meint.',
    optionen: [
      { label: 'Öffentlich antworten', hinweis: 'riskant', wurf: { basis: 0.35, traits: ['selbstvertrauen'] }, erfolg: { text: 'Du verteidigst dich souverän. Die Fans stehen hinter dir.', effekte: [T({ fanbeliebtheit: 4, trainerBeziehung: -2, selbstvertrauen: 3 })] }, misserfolg: { text: 'Deine Antwort wirkt trotzig. Die Zeitung titelt: „{name} gegen {trainer}“.', effekte: [T({ trainerBeziehung: -6, fanbeliebtheit: -2 }), NEWS('{name} legt sich mit {trainer} an')] } },
      { label: 'Nichts sagen, im Spiel antworten', erfolg: { text: 'Du hältst den Mund und nimmst dir vor, im nächsten Spiel zu liefern.', effekte: [T({ professionalitaet: 2, selbstvertrauen: -1 })] } },
    ],
  },
  {
    id: 't-vertrauen', kategorie: 'Trainer', gewicht: 1.5, abstand: 200, bedingung: (c) => profi(c) && trait(c, 'trainerBeziehung') > 70,
    titel: 'Der Trainer vertraut dir', text: '{trainer} bittet dich vor dem Spiel zu einem Vier-Augen-Gespräch: „Du bist ein Spieler, auf den ich mich verlassen kann. Ich möchte, dass du dem Team heute mehr Verantwortung gibst.“',
    optionen: [
      { label: 'Verantwortung übernehmen', erfolg: { text: 'Du führst das Team. Dein Auftritt hinterlässt Eindruck.', effekte: [T({ trainerBeziehung: 3, kabine: 3, selbstvertrauen: 4 })] } },
      { label: 'Um mehr Zeit bitten', erfolg: { text: '{trainer} zuckt mit den Schultern: „Okay, aber nicht zu lang.“', effekte: [T({ trainerBeziehung: -1 })] } },
    ],
  },
  {
    id: 't-abstiegskampf', kategorie: 'Trainer', gewicht: 2, abstand: 120, bedingung: (c) => profi(c) && tabellenplatz(c) >= c.saison.teams.length - 2 && (c.saison.tabelle[c.vereinId]?.[0] ?? 0) > 10,
    titel: 'Abstiegskampf', text: 'Die Mannschaft steht am Tabellenende. {trainer} versammelt alle um sich: „Es geht ums Ganze. Wer nicht kämpft, fliegt raus.“ Du merkst, wie die Nervosität steigt.',
    optionen: [
      { label: 'Vorangehen und kämpfen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['moral', 'ehrgeiz'] }, erfolg: { text: 'Du rennst, grätschst und ziehst alle mit. Die Fans feiern dich als Kämpfer.', effekte: [T({ fanbeliebtheit: 5, kabine: 3, ruf: 1, fitness: -3 })] }, misserfolg: { text: 'Du willst zu viel und zerfällst im Druck.', effekte: [T({ moral: -3, selbstvertrauen: -3 })] } },
      { label: 'Ruhig bleiben', erfolg: { text: 'Du konzentrierst dich auf deine Aufgaben. Mit Ruhe kommt Qualität.', effekte: [T({ professionalitaet: 2 })] } },
    ],
  },
  {
    id: 't-neuer-star', kategorie: 'Trainer', gewicht: 1.5, abstand: 150, bedingung: (c) => profi(c) && c.vertrag?.rolle !== 'Perspektive' && staerkeVerein(c) > 60,
    titel: 'Der Verein verpflichtet einen Star', text: 'Der Klub präsentiert stolz einen Star für deine Position, 20 Millionen Ablöse, ein Jahresgehalt, bei dem dir schwindelig wird. Du schaust zu, wie die Fans jubeln.',
    optionen: [
      { label: 'Kampfansage: Dich verdrängt keiner', erfolg: { text: 'Du gibst im Training Vollgas und zeigst dem Neuen, wer hier die Nummer eins ist.', effekte: [T({ ehrgeiz: 3, professionalitaet: 2, fitness: -3 }), S({ positionsspiel: 1 })] } },
      { label: 'Dem Neuen zum Einstand die Hand reichen', erfolg: { text: 'Ihr verstehst euch gut, er hat auch Respekt vor dir. Konkurrenz belebt das Geschäft.', effekte: [T({ kabine: 4, moral: 2 })] } },
      { label: 'Über einen Wechsel nachdenken', erfolg: { text: 'Du willst spielen und fragst dich, ob dieser Verein noch der richtige ist.', effekte: [T({ moral: -3 }), AKT('wechselwunsch')] } },
    ],
  },
]

