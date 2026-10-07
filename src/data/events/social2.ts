import { AKT, FLAG, FOLGE, FOLLOWER, G, NEWS, S, T, TWITCH, ABOS, VERL, abos, anteil, flag, follower, hatInsta, hatTwitch, hatYoutube, profi, trait, twitch } from './helpers'
import type { EreignisDef } from './types'

const rate = (c: Parameters<typeof flag>[0]): string => String(c.flags.streamRate ?? 'wenig')

/** Paket 11: Influencer-Alltag auf Twitch, YouTube und Instagram. Die Einstellungen dazu liegen im Privat-Tab unter „Social“. */
export const SOCIAL2: EreignisDef[] = [
  // ---------------------------------------------------------------- Twitch
  {
    id: 'so-tw-raid', kategorie: 'Medien', gewicht: 1.6, abstand: 150, bedingung: (c) => hatTwitch(c) && twitch(c) >= 5 && rate(c) !== 'aus',
    titel: 'Raid von einem Streamer-Star', text: 'Mitten im Stream erscheint die Meldung: „Ein Großstreamer schickt dir 8.000 Zuschauer!“ Der Chat explodiert in Sekunden, das Wort „PogChamp“ scrollt so schnell, dass du nichts mehr lesen kannst.',
    optionen: [
      { label: 'Die Neuen herzlich willkommen heißen', hinweis: 'riskant', wurf: { basis: 0.6, traits: ['selbstvertrauen', 'professionalitaet'] }, erfolg: { text: 'Du erzählst Anekdoten aus der Kabine und beantwortest Fragen. Hunderte bleiben als Follower.', effekte: [TWITCH(45), T({ ruf: 1, fanbeliebtheit: 2 })] }, misserfolg: { text: 'Du stotterst, der Chat macht sich lustig, ein Clip davon geht rum.', effekte: [TWITCH(12), T({ selbstvertrauen: -2 })] } },
      { label: 'Das Spiel konzentriert weiterspielen', erfolg: { text: 'Du lässt den Moment einfach laufen. Ein paar Neue bleiben.', effekte: [TWITCH(18)] } },
    ],
  },
  {
    id: 'so-tw-donation', kategorie: 'Medien', gewicht: 1.4, abstand: 200, bedingung: (c) => hatTwitch(c) && twitch(c) >= 10 && rate(c) !== 'aus',
    titel: '2.000 € Donation im Chat', text: 'Ein anonymer Zuschauer spendet 2.000 € mit der Nachricht: „Zeig’s denen am Wochenende!“ Der Chat flippt aus, die Plattform blendet einen Konfettiregen ein.',
    optionen: [
      { label: 'Betrag an einen guten Zweck weitergeben', erfolg: { text: 'Du verkündest live, dass das Geld an ein Kinderhospiz geht. Der Chat applaudiert, die Presse greift es auf.', effekte: [T({ fanbeliebtheit: 4, ruf: 2, moral: 3 }), TWITCH(10), NEWS('{name} spendet Stream-Einnahmen')] } },
      { label: 'Behalten und einfach Danke sagen', erfolg: { text: 'Du bedankst dich freundlich. Das Geld freut dich, auch wenn ein paar Zuschauer die Stirn runzeln.', effekte: [G(1600), TWITCH(3)] } },
      { label: 'Nachfragen, wer das war', hinweis: 'riskant', wurf: { basis: 0.45 }, erfolg: { text: 'Ein Fan outet sich, ihr kommt ins Gespräch. Daraus wird ein späterer Sponsorenkontakt.', effekte: [G(1600), T({ ruf: 1 })] }, misserfolg: { text: 'Der Spender fühlt sich bloßgestellt, Hass-Kommentare häufen sich.', effekte: [G(1600), T({ fanbeliebtheit: -2 }), TWITCH(-4)] } },
    ],
  },
  {
    id: 'so-tw-toxisch', kategorie: 'Medien', gewicht: 1.6, abstand: 150, bedingung: (c) => hatTwitch(c) && twitch(c) >= 8 && rate(c) !== 'aus',
    titel: 'Der Chat wird toxisch', text: 'Seit ein paar Streams sind im Chat gehässige Kommentare unterwegs: Beleidigungen gegen Mitspieler, rassistische Emotes, Fan-Streit. Du merkst, dass dich das selbst beschäftigt.',
    optionen: [
      { label: 'Mod-Team einstellen', kosten: 500, hinweis: 'kostet 500 €', erfolg: { text: 'Drei zuverlässige Mods räumen den Chat auf. Die Stimmung wird deutlich netter.', effekte: [TWITCH(6), T({ fanbeliebtheit: 2, moral: 2, professionalitaet: 1 })] } },
      { label: 'Eine klare Ansage live machen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['selbstvertrauen', 'ruf'] }, erfolg: { text: 'Deine Ansage kommt gut an. Viele klatschen, die Trolle verschwinden.', effekte: [TWITCH(10), T({ fanbeliebtheit: 3, ruf: 2 })] }, misserfolg: { text: 'Du wirst laut und genervt. Ein Clip davon macht die Runde.', effekte: [TWITCH(-3), T({ fanbeliebtheit: -2 })] } },
      { label: 'Chat nur noch für Abonnenten', erfolg: { text: 'Ruhe im Stream, aber die Reichweite sinkt ein wenig.', effekte: [TWITCH(-5), T({ moral: 2 })] } },
    ],
  },
  {
    id: 'so-tw-ausraster', kategorie: 'Medien', gewicht: 1.4, abstand: 200, bedingung: (c) => hatTwitch(c) && rate(c) !== 'aus' && c.form < 42,
    titel: 'Ausraster im Livestream', text: 'Nach der bitteren Niederlage gehst du live, um „abzuschalten“. Dann geht im Spiel alles schief, und du brüllst dein Headset an. Dein Handy zeigt dir 18.000 Zuschauer, die alles sehen.',
    optionen: [
      { label: 'Sofort entschuldigen', erfolg: { text: 'Du erklärst offen, dass der Tag mies war. Die meisten Zuschauer haben Verständnis.', effekte: [T({ professionalitaet: 2, fanbeliebtheit: 1 }), TWITCH(4)] } },
      { label: 'Es mit Humor nehmen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['selbstvertrauen'] }, erfolg: { text: 'Dein Selbstironie-Clip geht viral, Zuschauer feiern deine Menschlichkeit.', effekte: [TWITCH(35), T({ fanbeliebtheit: 4 })] }, misserfolg: { text: 'Der Scherz wirkt unreif. Der Verein bittet zum Gespräch.', effekte: [T({ trainerBeziehung: -3, fanbeliebtheit: -3, ruf: -1 })] } },
      { label: 'Stream schließen und nichts sagen', erfolg: { text: 'Du loggst dich aus. Die Clips leben ohne dich weiter.', effekte: [T({ fanbeliebtheit: -2, moral: -1 })] } },
    ],
  },
  {
    id: 'so-tw-sperre', kategorie: 'Medien', gewicht: 1, abstand: 300, bedingung: (c) => hatTwitch(c) && twitch(c) >= 15 && rate(c) !== 'aus',
    titel: 'Kanal gesperrt', text: 'Die Plattform hat deinen Kanal wegen Urheberrechtsverletzungen gesperrt: Die Hintergrundmusik in drei Streams war nicht lizenziert. Eine automatisierte Mail, kein Ansprechpartner. 30.000 Zuschauer stehen vor einem schwarzen Bildschirm.',
    optionen: [
      { label: 'Anwalt einschalten und Einspruch einlegen', kosten: 800, hinweis: 'kostet 800 €', wurf: { basis: 0.7, traits: ['professionalitaet'] }, erfolg: { text: 'Nach einer Woche ist dein Kanal wieder da, die Musik ist ersetzt.', effekte: [TWITCH(-2), T({ professionalitaet: 2 })] }, misserfolg: { text: 'Der Einspruch läuft ins Leere. Du startest mit einem neuen Kanal bei Null.', effekte: [TWITCH(-20), T({ moral: -3 })] } },
      { label: 'Neuen Kanal aufmachen', erfolg: { text: 'Die treuesten Fans folgen dir. Der Rest verliert sich.', effekte: [TWITCH(-12), T({ moral: -1 })] } },
    ],
  },
  {
    id: 'so-tw-verein-verbot', kategorie: 'Verein', gewicht: 1.2, abstand: 250, bedingung: (c) => hatTwitch(c) && profi(c) && rate(c) !== 'aus',
    titel: 'Der Verein greift ein', text: 'Beim Stream rutscht dir aus Versehen die Taktiktafel ins Bild. {trainer} kocht: „Wir diskutieren das nicht live!“ Der Verein verbietet Aufnahmen aus dem Trainingsgelände und der Kabine.',
    optionen: [
      { label: 'Regeln akzeptieren und Streams trennen', erfolg: { text: 'Ab sofort bleiben Verein und Stream getrennt. Der Trainer atmet auf.', effekte: [T({ trainerBeziehung: 3, professionalitaet: 2 }), TWITCH(-3)] } },
      { label: 'Heimlich weitermachen', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['disziplin'] }, erfolg: { text: 'Niemand merkt etwas. Die Streams bleiben beliebt.', effekte: [TWITCH(15)] }, misserfolg: { text: 'Ein Mitspieler verrät dich. Strafe, Rüffel, Gerede.', effekte: [G(anteil(0.02, 500)), T({ trainerBeziehung: -5, kabine: -3, disziplin: -2 })] } },
    ],
  },
  {
    id: 'so-tw-kollab', kategorie: 'Medien', gewicht: 1.3, abstand: 250, bedingung: (c) => hatTwitch(c) && twitch(c) >= 20,
    titel: 'Kollab mit einem Streaming-Star', text: 'Ein bekannter Streamer fordert dich zu einem Duell in einem Fußballspiel heraus: „1v1 live, Verlierer gibt eine Runde Pizza für den Chat aus.“ Zehntausende werden zuschauen.',
    optionen: [
      { label: 'Annehmen', hinweis: 'riskant', wurf: { basis: 0.5, skills: ['technik', 'dribbling'], traits: ['selbstvertrauen'] }, erfolg: { text: 'Du gewinnst nach Verlängerung, der Chat spielt verrückt. Dein Kanal wächst stark.', effekte: [TWITCH(70), T({ fanbeliebtheit: 4, selbstvertrauen: 4 })] }, misserfolg: { text: 'Du verlierst knapp, bestellst Pizza für 200 Leute und gewinnst trotzdem Sympathie.', effekte: [TWITCH(40), G(-400), T({ fanbeliebtheit: 2 })] } },
      { label: 'Absagen', erfolg: { text: 'Du hältst dich lieber zurück. Der Streamer reagiert gelassen.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'so-tw-charity-marathon', kategorie: 'Medien', gewicht: 1, abstand: 400, bedingung: (c) => hatTwitch(c) && twitch(c) >= 15 && trait(c, 'fanbeliebtheit') > 35,
    titel: '24-Stunden-Charity-Stream', text: 'Eine Kinderhilfsorganisation fragt, ob du einen 24-Stunden-Livestream für Spenden machen würdest. Andere Sportler haben das schon getan, und jedes Mal sind sechsstellige Summen zusammengekommen. Nur Schlaf gibt es kaum.',
    optionen: [
      { label: 'Zusagen', hinweis: 'riskant', wurf: { basis: 0.6, traits: ['fitness', 'gesundheit'] }, erfolg: { text: 'Du hältst durch, dein Chat sammelt über 80.000 €. Du sackst danach im Bett zusammen, aber glücklich.', effekte: [TWITCH(60), T({ fanbeliebtheit: 8, ruf: 3, fitness: -8, moral: 5 }), NEWS('{name} sammelt 80.000 € im Marathon-Stream')] }, misserfolg: { text: 'Nach 19 Stunden brichst du ab und wirst mit Kreislaufproblemen versorgt. Das Ziel wird trotzdem fast erreicht.', effekte: [TWITCH(25), VERL('Erschöpfung', 1), T({ fanbeliebtheit: 4, fitness: -10 })] } },
      { label: 'Kürzer streamen (6 Stunden)', erfolg: { text: 'Du sammelst 20.000 € und bleibst gesund. Die Organisation ist trotzdem begeistert.', effekte: [TWITCH(18), T({ fanbeliebtheit: 4, ruf: 1 })] } },
      { label: 'Absagen', erfolg: { text: 'Du zahlst lieber direkt eine Spende. Aus dem Hintergrund zu helfen, liegt dir mehr.', effekte: [G(-1500), T({ ruf: 1 })] } },
    ],
  },
  {
    id: 'so-tw-partner', kategorie: 'Medien', gewicht: 1.2, abstand: 500, bedingung: (c) => hatTwitch(c) && twitch(c) >= 50 && !flag(c, 'twitchPartner'),
    titel: 'Partnerprogramm', text: 'Die Plattform bietet dir den Partnerstatus an: bessere Konditionen, Abo-Emotes, ein Managementteam. Die Bedingung: Mindestens drei Streams pro Woche.',
    optionen: [
      { label: 'Annehmen und regelmäßig liefern', erfolg: { text: 'Der Partnerstatus bringt Geld, Reichweite und Verpflichtungen. Deine Streams sind jetzt dreimal pro Woche.', effekte: [FLAG('twitchPartner'), FLAG('streamRate', 'normal'), G(anteil(0.1, 5000)), TWITCH(15), T({ ruf: 2 })] } },
      { label: 'Ablehnen: Freiheit geht vor', erfolg: { text: 'Du streamst lieber, wann du willst. Weniger Geld, mehr Ruhe.', effekte: [FLAG('twitchPartner'), T({ privatglueck: 2 })] } },
    ],
  },
  {
    id: 'so-tw-ausgebrannt', kategorie: 'Gesundheit', gewicht: 2.2, abstand: 100, bedingung: (c) => hatTwitch(c) && rate(c) === 'viel' && trait(c, 'privatglueck') < 50,
    titel: 'Ausgebrannt vom Streamen', text: 'Täglich live, abends Videos schneiden, nachts Chat lesen: Du merkst, dass du kaum noch schläfst. {partner} hat dich seit Tagen nicht ohne Kopfhörer gesehen. Dein Physio fragt: „Wann hast du zuletzt wirklich geruht?“',
    optionen: [
      { label: 'Auf drei Streams pro Woche reduzieren', erfolg: { text: 'Der Druck lässt nach. Deine Fans verstehen es, du bekommst mehr Schlaf.', effekte: [FLAG('streamRate', 'normal'), T({ privatglueck: 6, fitness: 5, moral: 4 })] } },
      { label: 'Pause von zwei Wochen', erfolg: { text: 'Du schaltest alles ab. Beim Comeback sind viele Fans noch da.', effekte: [FLAG('streamRate', 'aus'), TWITCH(-4), T({ privatglueck: 8, fitness: 7, moral: 6 })] } },
      { label: 'Weitermachen', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['gesundheit', 'moral'] }, erfolg: { text: 'Du hältst durch, aber der Körper zeigt Spuren.', effekte: [T({ fitness: -3, privatglueck: -2 })] }, misserfolg: { text: 'Beim Training klappst du zusammen. Der Arzt verordnet Schonung.', effekte: [VERL('Erschöpfung', 2), T({ moral: -4, trainerBeziehung: -2 })] } },
    ],
  },
  {
    id: 'so-tw-reaktion', kategorie: 'Medien', gewicht: 1.4, abstand: 120, bedingung: (c) => hatTwitch(c) && profi(c) && String(c.flags.streamInhalt ?? 'gaming') === 'fussball' && rate(c) !== 'aus',
    titel: 'Live-Reaktion auf das eigene Spiel', text: 'Du schaust dir dein letztes Spiel gemeinsam mit dem Chat an und kommentierst jede Szene. Dann kommt die Szene, in der {kapitaen} dir den Ball nicht abgibt. Der Chat will wissen, was du darüber denkst.',
    optionen: [
      { label: 'Diplomatisch bleiben', erfolg: { text: 'Du sagst: „Wir hatten da ein Missverständnis.“ Ein bisschen langweilig, aber sicher.', effekte: [T({ kabine: 1, professionalitaet: 2 })] } },
      { label: 'Offen kritisieren', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['selbstvertrauen'] }, erfolg: { text: 'Deine ehrliche Meinung kommt gut an. Der Clip geht viral, und {kapitaen} lacht darüber.', effekte: [TWITCH(30), T({ fanbeliebtheit: 3, ruf: 1 })] }, misserfolg: { text: '{kapitaen} schaut den Clip und stellt dich zur Rede. Die Kabine ist angespannt.', effekte: [TWITCH(12), T({ kabine: -6, trainerBeziehung: -3 })] } },
    ],
  },
  {
    id: 'so-tw-meetup', kategorie: 'Medien', gewicht: 1, abstand: 300, bedingung: (c) => hatTwitch(c) && twitch(c) >= 30,
    titel: 'Community-Treffen', text: 'Deine Community will dich persönlich kennenlernen: Eine Fan-Gruppe plant ein Treffen in einer Sportbar, mit Public Viewing und einem FIFA-Turnier. Rund 200 Leute haben schon zugesagt.',
    optionen: [
      { label: 'Hingehen und feiern', kosten: 600, hinweis: 'kostet 600 €', erfolg: { text: 'Du verteilst Autogramme, spielst gegen Fans und bekommst Geschenke. Dein Kanal wächst durch diese Nähe.', effekte: [TWITCH(25), T({ fanbeliebtheit: 5, privatglueck: 3, fitness: -1 })] } },
      { label: 'Eine Videobotschaft schicken', erfolg: { text: 'Die Fans freuen sich über die Geste. Ganz so persönlich ist es nicht.', effekte: [TWITCH(6), T({ fanbeliebtheit: 1 })] } },
    ],
  },

  // ---------------------------------------------------------------- YouTube
  {
    id: 'so-yt-start', kategorie: 'Medien', gewicht: 1.6, abstand: 400, bedingung: (c) => !hatYoutube(c) && !c.saison.jugend && (hatInsta(c) || hatTwitch(c)) && trait(c, 'ruf') > 15,
    titel: 'Eigener YouTube-Kanal', text: 'Ein Videoproduzent schlägt vor: „Ein Vlog-Kanal über dein Leben als Profi: Training, Reisen, Alltag.“ Er hätte zwei Kameraleute, einen Schnittplatz und Ideen für die ersten zehn Folgen.',
    optionen: [
      { label: 'Kanal starten', kosten: 3000, hinweis: 'kostet 3.000 €', erfolg: { text: 'Die erste Folge läuft gut, die zweite noch besser. Du bekommst Mails von Fans aus drei Ländern.', effekte: [FLAG('youtube'), ABOS(8), T({ ruf: 1, fanbeliebtheit: 2, fitness: -1 })] } },
      { label: 'Mit einfachen Mitteln selbst filmen', erfolg: { text: 'Du filmst mit dem Handy, schneidest selbst und lernst schnell dazu. Ein sympathischer, kleiner Kanal.', effekte: [FLAG('youtube'), ABOS(3), T({ professionalitaet: 1 })] } },
      { label: 'Nein, kein Interesse', erfolg: { text: 'Du hältst nichts von Vlogs. Der Produzent sucht sich einen anderen Sportler.', effekte: [T({ privatglueck: 1 })] } },
    ],
  },
  {
    id: 'so-yt-clickbait', kategorie: 'Medien', gewicht: 1.4, abstand: 200, bedingung: (c) => hatYoutube(c) && abos(c) >= 5,
    titel: 'Clickbait-Titel', text: 'Dein Schnittmeister schlägt einen Titel vor: „SCHOCK! Das hat {name} NIEMALS erwartet…“ Er verspricht doppelte Klicks. Der eigentliche Inhalt ist ein Spaziergang mit dem Hund.',
    optionen: [
      { label: 'Titel nehmen', hinweis: 'riskant', wurf: { basis: 0.55 }, erfolg: { text: 'Die Aufrufe schießen hoch. Du weißt, dass es billig war, die Zahlen sprechen aber für sich.', effekte: [ABOS(25), T({ professionalitaet: -1 })] }, misserfolg: { text: 'Die Kommentare sind voller Hohn: „Wieder reingelegt!“ Die Abos sinken.', effekte: [ABOS(-8), T({ fanbeliebtheit: -2 })] } },
      { label: 'Einen ehrlichen Titel nehmen', erfolg: { text: 'Weniger Klicks, aber gute Kommentare. Ein treues Publikum wächst langsam.', effekte: [ABOS(6), T({ professionalitaet: 1, fanbeliebtheit: 1 })] } },
    ],
  },
  {
    id: 'so-yt-monetarisierung', kategorie: 'Finanzen', gewicht: 1.3, abstand: 400, bedingung: (c) => hatYoutube(c) && abos(c) >= 10 && !flag(c, 'ytMonetarisiert'),
    titel: 'Monetarisierung freigeschaltet', text: 'Dein Kanal hat die Schwellen erreicht: ab jetzt bekommst du Werbeeinnahmen. Die Plattform schickt eine Glückwunsch-Mail mit einem goldenen Button.',
    optionen: [
      { label: 'Werbung schalten', erfolg: { text: 'Die ersten Einnahmen sind bescheiden, aber ein tolles Gefühl. Ein neues Standbein.', effekte: [FLAG('ytMonetarisiert'), G(anteil(0.05, 1500)), ABOS(2)] } },
      { label: 'Werbefrei bleiben', erfolg: { text: 'Du verzichtest auf die Anzeigen. Deine Zuschauer danken es dir mit Abos.', effekte: [FLAG('ytMonetarisiert'), ABOS(8), T({ fanbeliebtheit: 2 })] } },
    ],
  },
  {
    id: 'so-yt-shorts', kategorie: 'Medien', gewicht: 1.3, abstand: 150, bedingung: (c) => hatYoutube(c) && abos(c) >= 3,
    titel: 'Short geht durch die Decke', text: 'Ein 15-Sekunden-Clip, in dem du einen Ball im Park jonglierst, hat nach vier Stunden 1,2 Millionen Aufrufe. Die Kommentare: „Wieso spielt der nicht in der Nationalmannschaft?“',
    optionen: [
      { label: 'Gleich Folgeclips drehen', hinweis: 'riskant', wurf: { basis: 0.55, skills: ['technik'] }, erfolg: { text: 'Die Serie schlägt voll ein. Dein Kanal wächst über Nacht.', effekte: [ABOS(35), T({ fanbeliebtheit: 3, ruf: 1 }), S({ technik: 1 })] }, misserfolg: { text: 'Zu viel Druck, zu viel Perfektion. Die Folgeclips floppen.', effekte: [ABOS(8), T({ selbstvertrauen: -1 })] } },
      { label: 'Es dabei belassen', erfolg: { text: 'Du lässt den Clip einfach für sich stehen. Ein paar Tausend Abos bleiben hängen.', effekte: [ABOS(12)] } },
    ],
  },
  {
    id: 'so-yt-vlog-verein', kategorie: 'Verein', gewicht: 1.2, abstand: 250, bedingung: (c) => hatYoutube(c) && profi(c) && abos(c) >= 5,
    titel: 'Ein Tag im Leben auf dem Vereinsgelände', text: 'Dein Kamerateam will einen „Tag im Leben eines Profis“ drehen, mit Aufnahmen aus Kabine, Kraftraum und Kantine. Die Medienabteilung des Vereins hat bereits angefragt, ob sie das Material vorher sehen darf.',
    optionen: [
      { label: 'Mit dem Verein abstimmen', erfolg: { text: 'Die Medienabteilung gibt grünes Licht und teilt das Video sogar auf ihren Kanälen. Du bekommst viele neue Abonnenten.', effekte: [ABOS(30), T({ trainerBeziehung: 3, fanbeliebtheit: 3 })] } },
      { label: 'Einfach drehen, was passt', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['professionalitaet'] }, erfolg: { text: 'Das Video wird ein Hit, der Verein lässt es durchgehen.', effekte: [ABOS(40), T({ fanbeliebtheit: 3 })] }, misserfolg: { text: 'Man sieht Kollegen in Unterhose und die Taktiktafel. Der Verein verlangt das Löschen und eine Entschuldigung.', effekte: [ABOS(-4), T({ trainerBeziehung: -4, kabine: -4 }), G(-500)] } },
    ],
  },
  {
    id: 'so-yt-kollab-mitspieler', kategorie: 'Medien', gewicht: 1.2, abstand: 250, bedingung: (c) => hatYoutube(c) && profi(c) && abos(c) >= 8,
    titel: 'Gemeinsames Video mit {freund}', text: '{freund} will mit dir ein Video drehen: „Wer kennt den anderen besser?“ Beide beantworten peinliche Fragen. Die Produktion ist günstig, der Spaß garantiert.',
    optionen: [
      { label: 'Mitmachen', hinweis: 'riskant', wurf: { basis: 0.65, traits: ['kabine'] }, erfolg: { text: 'Das Video wird zum Fan-Liebling. Die Kabine feiert euch, die Zahlen steigen.', effekte: [ABOS(28), T({ kabine: 3, fanbeliebtheit: 3, privatglueck: 2 })] }, misserfolg: { text: 'Eine Antwort wird missverstanden. Die Sache wird ein kleiner Skandal.', effekte: [ABOS(10), T({ fanbeliebtheit: -2, kabine: -2 })] } },
      { label: 'Absagen', erfolg: { text: '{freund} nimmt es locker. Aber der Spaß geht an dir vorbei.', effekte: [T({ privatglueck: -1 })] } },
    ],
  },

  // ---------------------------------------------------------------- Instagram & TikTok
  {
    id: 'so-ig-tiktok', kategorie: 'Medien', gewicht: 1.5, abstand: 200, bedingung: (c) => hatInsta(c) && profi(c) && trait(c, 'ruf') > 20,
    titel: 'Die TikTok-Challenge', text: 'Auf TikTok kursiert eine Challenge: „Lattenkreuz aus 30 Metern, rückwärts!“ Tausende Fußballer haben mitgemacht, einer ist schon gescheitert und musste ins Krankenhaus. Dein Berater sieht die Zahlen und schüttelt den Kopf.',
    optionen: [
      { label: 'Mitmachen', hinweis: 'riskant', wurf: { basis: 0.5, skills: ['schuss', 'technik'] }, erfolg: { text: 'Beim dritten Versuch klappt es. Der Clip hat bald fünf Millionen Aufrufe.', effekte: [FOLLOWER(140), T({ fanbeliebtheit: 4, ruf: 1, selbstvertrauen: 3 })] }, misserfolg: { text: 'Beim siebten Versuch rutschst du weg, und es knackt im Sprunggelenk. Der Verein ist außer sich.', effekte: [VERL('Bänderdehnung im Sprunggelenk', 4), FOLLOWER(60), T({ trainerBeziehung: -5, moral: -3 })] } },
      { label: 'Eine sichere Variante drehen', erfolg: { text: 'Du drehst eine vorsichtige Version. Weniger Aufmerksamkeit, aber auch kein Risiko.', effekte: [FOLLOWER(25), T({ professionalitaet: 2 })] } },
      { label: 'Nicht mitmachen', erfolg: { text: 'Du wartest die nächste Challenge ab. Dein Körper dankt es dir.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'so-ig-agentur', kategorie: 'Medien', gewicht: 1.4, abstand: 500, bedingung: (c) => hatInsta(c) && follower(c) >= 50 && !flag(c, 'socialAgentur'),
    titel: 'Eine Agentur will deine Kanäle managen', text: 'Eine Influencer-Agentur bietet an, alle deine Kanäle zu betreuen: Content-Planung, Werbedeals, Reichweite. Dafür behält sie 20 % deiner Social-Media-Einnahmen. Die Vertragslaufzeit beträgt zwei Jahre.',
    optionen: [
      { label: 'Unterschreiben', erfolg: { text: 'Die Agentur schickt dir Skripte, Drehpläne und Deals. Die Reichweite steigt deutlich, dein Leben wird aber fremdbestimmter.', effekte: [FLAG('socialAgentur'), FOLLOWER(60), G(anteil(0.1, 5000)), T({ ruf: 2, privatglueck: -2 })] } },
      { label: 'Nachverhandeln: nur 10 %', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['ruf'] }, erfolg: { text: 'Die Agentur gibt nach. Du unterschreibst zu besseren Konditionen.', effekte: [FLAG('socialAgentur'), FOLLOWER(60), G(anteil(0.15, 7000)), T({ ruf: 2 })] }, misserfolg: { text: 'Die Agentur zieht das Angebot zurück. „Wir finden andere Spieler.“', effekte: [T({ moral: -1 })] } },
      { label: 'Alles selbst machen', erfolg: { text: 'Du behältst die Kontrolle. Das kostet Zeit, aber auch Geld sparst du.', effekte: [FLAG('socialAgentur'), T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'so-ig-beef', kategorie: 'Medien', gewicht: 1.3, abstand: 250, bedingung: (c) => hatInsta(c) && follower(c) >= 20 && trait(c, 'ruf') > 25,
    titel: 'Öffentlicher Streit im Netz', text: 'Ein anderer Fußballer kommentiert unter deinem Foto: „Mehr Filter als Pässe, was?“ Binnen einer Stunde streiten sich 4.000 Leute in den Kommentaren, und die Presse fragt an.',
    optionen: [
      { label: 'Souverän kontern', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['selbstvertrauen'] }, erfolg: { text: 'Dein Konter ist witzig und trifft. Das Netz applaudiert, der Gegner zieht seinen Kommentar zurück.', effekte: [FOLLOWER(45), T({ fanbeliebtheit: 3, ruf: 1 })] }, misserfolg: { text: 'Dein Konter wirkt bemüht, ein Gegner-Clip trifft härter. Der Streit eskaliert.', effekte: [FOLLOWER(15), T({ fanbeliebtheit: -2, ruf: -1 })] } },
      { label: 'Ignorieren', erfolg: { text: 'Das Netz wendet sich nach zwei Tagen ab. Souveränität zahlt sich aus.', effekte: [T({ professionalitaet: 2 })] } },
      { label: 'Persönlich anrufen', erfolg: { text: 'Ihr sprecht euch aus. Ein gemeinsames Foto beendet die Sache.', effekte: [FOLLOWER(20), T({ fanbeliebtheit: 2, professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'so-ig-meilenstein', kategorie: 'Medien', gewicht: 1.6, abstand: 600, bedingung: (c) => hatInsta(c) && follower(c) >= 500 && !flag(c, 'igMeilenstein'),
    titel: 'Halbe Million Follower', text: 'Dein Instagram-Account knackt die 500.000. Plötzlich schreiben dir internationale Marken, und eine Modefirma bietet eine eigene Kollektion an. Dein Berater: „Jetzt kannst du dir die Deals aussuchen.“',
    optionen: [
      { label: 'Kollektion mit der Modefirma', hinweis: 'riskant', wurf: { basis: 0.6, traits: ['ruf'] }, erfolg: { text: 'Die Kollektion verkauft sich blendend. Ein Teil der Gewinne landet bei dir.', effekte: [FLAG('igMeilenstein'), G(anteil(0.4, 20_000)), FOLLOWER(40), T({ ruf: 2 })] }, misserfolg: { text: 'Die Teile sind zu teuer und zu wild. Die Lagerbestände bleiben voll.', effekte: [FLAG('igMeilenstein'), G(-8000), T({ fanbeliebtheit: -1 })] } },
      { label: 'Nur langfristige Partner wählen', erfolg: { text: 'Du suchst dir zwei Marken aus, die zu dir passen. Die Zusammenarbeit läuft angenehm.', effekte: [FLAG('igMeilenstein'), G(anteil(0.2, 10_000)), T({ professionalitaet: 2, ruf: 1 })] } },
    ],
  },
  {
    id: 'so-ig-ausruester-konflikt', kategorie: 'Medien', gewicht: 1.2, abstand: 300, bedingung: (c) => hatInsta(c) && c.flags.sponsor === true,
    titel: 'Falscher Schuh im Bild', text: 'Auf einem privaten Foto trägst du Sneaker der Konkurrenz deines Ausrüsters. Das Bild geht durch die Fan-Seiten. Dein Sponsor fordert eine Stellungnahme: „Das war kein Versehen, oder?“',
    optionen: [
      { label: 'Entschuldigen und das Foto löschen', erfolg: { text: 'Der Sponsor nimmt die Entschuldigung an. Du bleibst unter Vertrag.', effekte: [FOLLOWER(-4), T({ professionalitaet: 2 })] } },
      { label: 'Es als Versehen darstellen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['professionalitaet'] }, erfolg: { text: 'Du erklärst es plausibel. Der Sponsor glaubt dir.', effekte: [T({ selbstvertrauen: 1 })] }, misserfolg: { text: 'Der Sponsor beendet die Zusammenarbeit. Ein Gespräch mit dem Anwalt folgt.', effekte: [AKT('sponsor-ende'), T({ ruf: -2, fanbeliebtheit: -2 })] } },
      { label: 'Das Foto stehen lassen', erfolg: { text: 'Du bleibst gelassen. Das Netz feiert deine Haltung, der Sponsor schweigt vielsagend.', effekte: [FOLLOWER(20), T({ fanbeliebtheit: 2 }), FOLGE('so-ig-sponsor-kuendigung', 6, 0.5)] } },
    ],
  },
  {
    id: 'so-ig-sponsor-kuendigung', kategorie: 'Medien', gewicht: 0,
    titel: 'Der Sponsor kündigt', text: 'Der Ausrüster verkündet in einem knappen Schreiben, dass er die Zusammenarbeit „aus strategischen Gründen“ beendet. Jeder weiß, was gemeint ist.',
    optionen: [
      { label: 'Ruhig bleiben', erfolg: { text: 'Du ziehst weiter. Neue Partner stehen bald in der Tür.', effekte: [AKT('sponsor-ende'), T({ professionalitaet: 1 })] } },
      { label: 'Öffentlich nachtreten', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['selbstvertrauen'] }, erfolg: { text: 'Deine Fans stellen sich hinter dich. Die Marke steht schlecht da.', effekte: [AKT('sponsor-ende'), FOLLOWER(40), T({ fanbeliebtheit: 3 })] }, misserfolg: { text: 'Der Beitrag verbrennt Brücken. Auch andere Marken zögern.', effekte: [AKT('sponsor-ende'), T({ ruf: -2, fanbeliebtheit: -1 })] } },
    ],
  },
  {
    id: 'so-ig-ghostwriter', kategorie: 'Medien', gewicht: 1.1, abstand: 300, bedingung: (c) => hatInsta(c) && flag(c, 'socialAgentur'),
    titel: 'Die Agentur postet einen Fehler', text: 'Die Agentur hat einen Beitrag in deinem Namen veröffentlicht: „Für mich zählt nur der Titel, der Verein ist mir egal!“ Du hast ihn nie gesehen. Die Fans sind sauer, die Vereinsführung auch.',
    optionen: [
      { label: 'Sofort löschen und klarstellen', erfolg: { text: 'Du erklärst, dass die Agentur einen Fehler gemacht hat. Die Fans verzeihen dir.', effekte: [FOLLOWER(-5), T({ fanbeliebtheit: -1, professionalitaet: 2 })] } },
      { label: 'Die Agentur öffentlich zur Rede stellen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['selbstvertrauen'] }, erfolg: { text: 'Die Agentur entschuldigt sich öffentlich, und du bekommst Entschädigung.', effekte: [G(4000), T({ fanbeliebtheit: 2 })] }, misserfolg: { text: 'Die Agentur droht mit rechtlichen Schritten, die Sache wird kompliziert.', effekte: [G(-2000), T({ moral: -2 })] } },
    ],
  },
  {
    id: 'so-ig-schwund', kategorie: 'Medien', gewicht: 1.4, abstand: 200, bedingung: (c) => hatInsta(c) && follower(c) >= 20 && String(c.flags.postRate ?? 'normal') === 'aus',
    titel: 'Die Follower laufen weg', text: 'Seit Wochen postest du nichts mehr. Der Algorithmus hat dich begraben, Fans fragen: „Lebt der noch?“ Deine Agentur verschickt Statistiken in Rot.',
    optionen: [
      { label: 'Wieder regelmäßig posten', erfolg: { text: 'Du postest ein Foto vom Training, ein Gruß an die Fans. Der Anfang ist gemacht.', effekte: [FLAG('postRate', 'normal'), FOLLOWER(5), T({ fanbeliebtheit: 1 })] } },
      { label: 'Bewusst offline bleiben', erfolg: { text: 'Du brauchst die Pause. Reichweite ist nicht alles.', effekte: [T({ privatglueck: 3, moral: 2 })] } },
    ],
  },
]

