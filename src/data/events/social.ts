import { AKT, FLAG, FOLGE, FOLLOWER, G, NEWS, T, anteil, flag, follower, jugend, profi, trait } from './helpers'
import type { EreignisDef } from './types'

const kanal = (c: Parameters<typeof flag>[0]): boolean => !jugend(c) && flag(c, 'insta')

/** Paket 3: Social Media, Reichweite, Sponsoren-Deals und die dunklen Seiten des Netzes. */
export const SOCIAL: EreignisDef[] = [
  {
    id: 'so-viral', kategorie: 'Medien', gewicht: 2, abstand: 80, bedingung: kanal,
    titel: 'Dein Clip wird viral', text: 'Ein Fan hat ein Video von deinem Trainingstrick hochgeladen. Eine Stunde später: 400.000 Aufrufe. Die Kommentarspalte brennt, Medien schreiben dich an, und deine Agentur fragt: „Nachlegen?“',
    optionen: [
      { label: 'Selbst einen Clip nachlegen', hinweis: 'riskant', wurf: { basis: 0.55, skills: ['technik'], traits: ['selbstvertrauen'] }, erfolg: { text: 'Dein zweites Video schlägt das erste. Die Reichweite explodiert.', effekte: [FOLLOWER(120), T({ fanbeliebtheit: 5, ruf: 2, selbstvertrauen: 3 })] }, misserfolg: { text: 'Du verhaust den Trick vor laufender Kamera. Der Clip geht ebenfalls viral, aber als Fail.', effekte: [FOLLOWER(40), T({ fanbeliebtheit: -1, selbstvertrauen: -3 })] } },
      { label: 'Die Welle reiten, aber ohne Aufwand', erfolg: { text: 'Du kommentierst mit einem Emoji und lässt die Reichweite für sich arbeiten.', effekte: [FOLLOWER(60), T({ fanbeliebtheit: 2 })] } },
    ],
  },
  {
    id: 'so-werbedeal', kategorie: 'Medien', gewicht: 2, abstand: 150, bedingung: (c) => kanal(c) && follower(c) >= 40,
    titel: 'Werbedeal für den Feed', text: 'Ein Energydrink-Hersteller bietet dir einen fünfstelligen Betrag für drei Beiträge. Der Vertrag fordert „authentische Begeisterung“ und verbietet jeden Hinweis darauf, dass du für die Posts bezahlt wirst.',
    optionen: [
      { label: 'Annehmen und sauber kennzeichnen', erfolg: { text: 'Du markierst die Beiträge klar als Werbung. Die Marke murrt, deine Follower nicken.', effekte: [G(anteil(0.12, 4000)), FOLLOWER(15), T({ fanbeliebtheit: 1, professionalitaet: 2 })] } },
      { label: 'Ohne Kennzeichnung posten', hinweis: 'riskant', wurf: { basis: 0.6, traits: ['professionalitaet'] }, erfolg: { text: 'Niemand merkt etwas. Das Geld ist trotzdem sauber verdient.', effekte: [G(anteil(0.18, 6000)), FOLLOWER(20)] }, misserfolg: { text: 'Ein Blogger deckt die Schleichwerbung auf. Abmahnung, Bußgeld, Schlagzeilen.', effekte: [G(-3000), T({ fanbeliebtheit: -4, ruf: -2 }), AKT('skandal'), NEWS('Schleichwerbung: {name} im Netz-Pranger')] } },
      { label: 'Ablehnen', erfolg: { text: 'Du hast keine Lust auf Dosenbrause. Deine Follower lieben dich dafür.', effekte: [T({ fanbeliebtheit: 2, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'so-krypto-pump', kategorie: 'Medien', gewicht: 1.2, abstand: 400, bedingung: (c) => kanal(c) && follower(c) >= 100 && !flag(c, 'kryptoWerbung'),
    titel: 'Die Münze mit dem Hund', text: 'Ein Start-up bietet dir 50.000 € (und ein paar Millionen Coins), wenn du „DOGGOLD“ in deiner Story erwähnst. „Das ist die Zukunft!“, schwärmt der Manager. Hinter ihm lächelt ein Anwalt zu breit.',
    optionen: [
      { label: 'Die Münze bewerben', hinweis: 'riskant', wurf: { basis: 0.35 }, erfolg: { text: 'Der Kurs steigt tatsächlich, du verkaufst zum richtigen Zeitpunkt. Pure Glückssache.', effekte: [FLAG('kryptoWerbung'), G(70_000), FOLLOWER(40), T({ ruf: 1 })] }, misserfolg: { text: 'Der Kurs kollabiert nach zwei Tagen. Deine Follower haben Geld verloren, du hast Post vom Anwalt.', effekte: [FLAG('kryptoWerbung'), G(20_000), T({ fanbeliebtheit: -6, ruf: -3 }), FOLGE('so-krypto-klage', 8, 0.8)] } },
      { label: 'Nein danke, das stinkt', erfolg: { text: 'Drei Wochen später ist die Münze pleite, das Start-up weg. Dein Berater strahlt.', effekte: [FLAG('kryptoWerbung'), T({ professionalitaet: 2, ruf: 1 })] } },
    ],
  },
  {
    id: 'so-krypto-klage', kategorie: 'Risiko', gewicht: 0,
    titel: 'Sammelklage', text: 'Anleger haben sich zusammengetan und klagen gegen die Influencer, die für DOGGOLD geworben haben. Auch dein Name steht auf der Liste. Der Anwalt sagt: „Das wird nicht billig.“',
    optionen: [
      { label: 'Vergleich schließen', kosten: 25_000, hinweis: 'kostet 25.000 €', erfolg: { text: 'Du zahlst, die Sache wird still beigelegt. Die Presse verliert das Interesse.', effekte: [T({ professionalitaet: 1, fanbeliebtheit: -1 })] } },
      { label: 'Es auf einen Prozess ankommen lassen', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['professionalitaet'] }, erfolg: { text: 'Das Gericht stellt fest: Du hast nicht vorsätzlich getäuscht. Freispruch, aber die Anwaltskosten bleiben.', effekte: [G(-8000), T({ ruf: 1 })] }, misserfolg: { text: 'Schuldspruch: Schadenersatz und Schlagzeilen.', effekte: [G(-60_000), T({ fanbeliebtheit: -5, ruf: -4 }), AKT('skandal'), NEWS('{name} verurteilt: Krypto-Werbung kostet Hunderttausende')] } },
    ],
  },
  {
    id: 'so-alter-post', kategorie: 'Medien', gewicht: 1.5, abstand: 300, bedingung: (c) => kanal(c) && trait(c, 'ruf') > 35,
    titel: 'Der Post von früher', text: 'Ein Reporter hat einen alten Beitrag von dir ausgegraben, aus der Zeit, als du 15 warst. Damals fandest du den Spruch lustig. Heute ist er ein Skandal. Dein Telefon klingelt im Sekundentakt.',
    optionen: [
      { label: 'Klar entschuldigen, ohne Ausrede', erfolg: { text: 'Du erklärst, dass du heute anders denkst. Die meisten Fans nehmen es dir ab.', effekte: [T({ fanbeliebtheit: -1, professionalitaet: 3, ruf: 1 })] } },
      { label: 'Löschen und Account stilllegen', erfolg: { text: 'Der Post ist weg, die Screenshots bleiben. Die Stimmung bleibt gereizt.', effekte: [T({ fanbeliebtheit: -3, ruf: -1 }), FOLLOWER(-30)] } },
      { label: 'Verteidigen', hinweis: 'riskant', wurf: { basis: 0.25, traits: ['selbstvertrauen'] }, erfolg: { text: 'Deine Fans halten zu dir. „Es war ein Scherz!“ wird zum Trend.', effekte: [T({ fanbeliebtheit: 2, selbstvertrauen: 2 })] }, misserfolg: { text: 'Das Verteidigen macht alles nur schlimmer. Sponsoren melden sich besorgt.', effekte: [T({ fanbeliebtheit: -6, ruf: -3 }), AKT('skandal'), NEWS('Alter Post: {name} schlägt Kritik in den Wind')] } },
    ],
  },
  {
    id: 'so-fake-follower', kategorie: 'Medien', gewicht: 1, abstand: 400, bedingung: (c) => kanal(c) && follower(c) >= 30 && !flag(c, 'fakeFollower'),
    titel: 'Gekaufte Reichweite', text: 'Eine Recherche zeigt: 40 Prozent deiner Follower sind Bots. Deine Agentur hat die Reichweite „optimiert“. Ein Sponsor fragt höflich nach dem Vertrag.',
    optionen: [
      { label: 'Agentur feuern und Reichweite bereinigen', erfolg: { text: 'Der Verlust tut weh, aber du stehst ehrlich da.', effekte: [FLAG('fakeFollower'), FOLLOWER(-80), T({ professionalitaet: 2, ruf: 1 })] } },
      { label: 'Aussitzen', hinweis: 'riskant', wurf: { basis: 0.5 }, erfolg: { text: 'Das Thema versandet. Niemand klickt mehr drauf.', effekte: [FLAG('fakeFollower')] }, misserfolg: { text: 'Der Sponsor kündigt wegen Täuschung. Die Presse liebt die Geschichte.', effekte: [FLAG('fakeFollower'), AKT('sponsor-ende'), T({ fanbeliebtheit: -4, ruf: -2 }), AKT('skandal')] } },
    ],
  },
  {
    id: 'so-live-patzer', kategorie: 'Medien', gewicht: 1.5, abstand: 200, bedingung: (c) => kanal(c) && profi(c),
    titel: 'Live-Stream aus der Kabine', text: 'Du startest aus Versehen einen Livestream in der Kabine. Dreißig Sekunden lang sieht jeder, wie {kapitaen} fluchend die Taktik der letzten Partie kommentiert.',
    optionen: [
      { label: 'Sofort löschen und {kapitaen} informieren', erfolg: { text: '{kapitaen} atmet durch. „Danke, dass du es sagst.“ Eine Kleinigkeit wird zur Kleinigkeit.', effekte: [T({ kabine: 2, professionalitaet: 2 })] } },
      { label: 'Es drinlassen, ist ja ehrlich', hinweis: 'riskant', wurf: { basis: 0.35, traits: ['kabine'] }, erfolg: { text: 'Das Netz feiert den Einblick. {kapitaen} nimmt es mit Humor.', effekte: [FOLLOWER(50), T({ fanbeliebtheit: 3, kabine: -1 })] }, misserfolg: { text: '{kapitaen} tobt, der Trainer ebenso. Du musst vor der Mannschaft Abbitte leisten.', effekte: [FOLLOWER(30), T({ kabine: -7, trainerBeziehung: -3 }), G(-500)] } },
    ],
  },
  {
    id: 'so-stream', kategorie: 'Medien', gewicht: 1.4, abstand: 400, bedingung: (c) => kanal(c) && !flag(c, 'stream'),
    titel: 'Eigener Streaming-Kanal', text: 'Ein Plattform-Manager schlägt vor, dass du wöchentlich zwei Stunden live gamest und quatschst. „Fußballer sind die neue Prominenz!“ Die Kamera läuft, wenn du willst, bei dir zu Hause.',
    optionen: [
      { label: 'Loslegen', kosten: 2500, hinweis: 'kostet 2.500 € (Technik)', erfolg: { text: 'Nach vier Streams hast du eine kleine, treue Community. Dein Lebensgefühl ändert sich ein bisschen.', effekte: [FLAG('stream'), FOLLOWER(60), T({ fanbeliebtheit: 3, privatglueck: 1, fitness: -1 })] } },
      { label: 'Nur gelegentlich mit Freunden', erfolg: { text: 'Mal zockst du mit {freund} vor der Kamera. Kleiner Spaß, kleine Reichweite.', effekte: [FLAG('stream'), FOLLOWER(15), T({ privatglueck: 3 })] } },
      { label: 'Nein, Privatsphäre geht vor', erfolg: { text: 'Du brauchst einen Rückzugsort ohne Kamera.', effekte: [T({ privatglueck: 1 })] } },
    ],
  },
  {
    id: 'so-podcast', kategorie: 'Medien', gewicht: 1, abstand: 500, bedingung: (c) => profi(c) && trait(c, 'ruf') > 35 && !flag(c, 'podcast'),
    titel: 'Dein eigener Podcast', text: 'Ein Audio-Anbieter will dich als Host für einen wöchentlichen Fußball-Podcast: „Das schnelle Spiel mit {name}“. Du sollst Spiele kommentieren, Gäste einladen und ein bisschen aus der Kabine plaudern.',
    optionen: [
      { label: 'Zusagen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['professionalitaet', 'selbstvertrauen'] }, erfolg: { text: 'Der Podcast wird zum Geheimtipp, und du entdeckst deine Redegabe.', effekte: [FLAG('podcast'), G(anteil(0.1, 3000)), FOLLOWER(25), T({ ruf: 2, fanbeliebtheit: 2 })] }, misserfolg: { text: 'Eine unbedachte Bemerkung über {rivale} in Folge drei bringt dir einen Anschiss ein.', effekte: [FLAG('podcast'), T({ trainerBeziehung: -3, kabine: -2, ruf: 1 }), G(anteil(0.05, 1500))] } },
      { label: 'Ablehnen', erfolg: { text: 'Du bleibst lieber hinter der Linie als hinter dem Mikrofon.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'so-autobiografie', kategorie: 'Medien', gewicht: 1, abstand: 900, bedingung: (c) => profi(c) && trait(c, 'ruf') > 55 && !flag(c, 'buch'),
    titel: 'Die Autobiografie', text: 'Ein Verlag bietet dir einen sechsstelligen Vorschuss für deine Lebensgeschichte. „Die Leser wollen Geheimnisse“, sagt der Lektor. „Gib uns Namen, Kabinengeschichten, Streit.“',
    optionen: [
      { label: 'Ehrlich und menschlich schreiben', erfolg: { text: 'Dein Buch erzählt von Zweifeln, Verletzungen und Glück. Kritiker loben die Reife.', effekte: [FLAG('buch'), G(anteil(0.3, 20_000)), T({ ruf: 3, fanbeliebtheit: 4, professionalitaet: 2 })] } },
      { label: 'Mit Enthüllungen auf Bestsellerkurs', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['ruf'] }, erfolg: { text: 'Das Buch verkauft sich wie verrückt. In der Kabine murren einige, aber die Kasse klingelt.', effekte: [FLAG('buch'), G(anteil(0.6, 50_000)), T({ ruf: 3, kabine: -4, fanbeliebtheit: 2 })] }, misserfolg: { text: 'Mehrere Ex-Kollegen klagen, der Verlag zieht die Auflage zurück. Peinlich und teuer.', effekte: [FLAG('buch'), G(-15_000), T({ kabine: -8, fanbeliebtheit: -4, ruf: -2 }), AKT('skandal')] } },
      { label: 'Ablehnen', erfolg: { text: 'Erst mal das Karriereende abwarten. Ein Buch kann auch später kommen.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'so-hacker', kategorie: 'Risiko', gewicht: 1, abstand: 500, bedingung: (c) => kanal(c) && follower(c) >= 40,
    titel: 'Account gehackt', text: 'Du wachst auf, und dein Account postet Werbung für eine obskure Wettseite. Dein Profilbild ist ein Frosch. Drei Millionen Menschen sehen es. Deine Agentur schreit durchs Telefon.',
    optionen: [
      { label: 'Plattform-Support und Anwalt einschalten', kosten: 1500, hinweis: 'kostet 1.500 €', erfolg: { text: 'Nach zwei Tagen ist alles wieder hergestellt. Der Schaden hält sich in Grenzen.', effekte: [T({ professionalitaet: 2, fanbeliebtheit: -1 })] } },
      { label: 'Selbst reagieren und mit Humor nehmen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['selbstvertrauen'] }, erfolg: { text: 'Dein „Frosch-Statement“ geht viral. Selbst die Hacker schicken Likes.', effekte: [FOLLOWER(45), T({ fanbeliebtheit: 3 })] }, misserfolg: { text: 'Dein Scherz geht daneben: Die Wettseite nutzt ihn als Werbung, und die Verbandsrechtler melden sich.', effekte: [T({ fanbeliebtheit: -3, ruf: -1 }), G(-2000)] } },
    ],
  },
  {
    id: 'so-meme', kategorie: 'Medien', gewicht: 1.4, abstand: 200, bedingung: (c) => profi(c) && c.form < 48 && trait(c, 'ruf') > 20,
    titel: 'Du bist ein Meme', text: 'Dein verstolperter Torschuss hat es ins Internet geschafft. Es gibt bereits sieben Varianten, ein Musikvideo und einen Account, der nur noch deine Fehlpässe sammelt.',
    optionen: [
      { label: 'Selbst mitlachen und ein Meme posten', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['selbstvertrauen'] }, erfolg: { text: 'Du gewinnst das Netz zurück. Selbstironie ist die beste Verteidigung.', effekte: [FOLLOWER(40), T({ fanbeliebtheit: 4, selbstvertrauen: 2 })] }, misserfolg: { text: 'Es wirkt gequält, und das Netz fährt noch eine Schippe drauf.', effekte: [T({ fanbeliebtheit: -2, selbstvertrauen: -3 })] } },
      { label: 'Auf dem Platz antworten', erfolg: { text: 'Du kämpfst dich zurück in Form. Die Memes verschwinden, wenn das nächste Tor fällt.', effekte: [T({ professionalitaet: 2, ehrgeiz: 2 })] } },
    ],
  },
  {
    id: 'so-haltung', kategorie: 'Medien', gewicht: 1.2, abstand: 400, bedingung: (c) => profi(c) && trait(c, 'ruf') > 30 && !flag(c, 'haltung'),
    titel: 'Haltung zeigen?', text: 'Der Verband organisiert eine Aktion für Vielfalt im Fußball. Viele Spieler tragen Armbinden, Bänder oder posten Botschaften. {berater} sagt: „Sponsoren schauen genau hin, in die eine wie in die andere Richtung.“',
    optionen: [
      { label: 'Klar Position beziehen', hinweis: 'riskant', wurf: { basis: 0.65, traits: ['selbstvertrauen'] }, erfolg: { text: 'Viele Fans und Kollegen klatschen. Du wirst als aufrechter Typ wahrgenommen.', effekte: [FLAG('haltung'), FOLLOWER(25), T({ fanbeliebtheit: 3, ruf: 2, kabine: 1 })] }, misserfolg: { text: 'Die Aktion löst heftige Debatten aus. Ein Teil der Fans ist verärgert, ein Sponsor schweigt vielsagend.', effekte: [FLAG('haltung'), T({ fanbeliebtheit: -2, ruf: 1 }), FOLLOWER(10)] } },
      { label: 'Sich zurückhalten', erfolg: { text: 'Du konzentrierst dich auf den Sport. Manche loben die Besonnenheit, andere vermissen Mut.', effekte: [FLAG('haltung'), T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'so-hass-dm', kategorie: 'Medien', gewicht: 1.3, abstand: 250, bedingung: (c) => kanal(c) && c.form < 55,
    titel: 'Hass in den Nachrichten', text: 'Nach dem Spiel landen hunderte Nachrichten in deinem Postfach: Drohungen, Beleidigungen, auch gegen deine Familie. Du merkst, wie dir der Magen zuschnürt.',
    optionen: [
      { label: 'Melden und Anzeige erstatten', kosten: 500, hinweis: 'kostet 500 €', erfolg: { text: 'Die Polizei nimmt die Sache ernst, die Plattform sperrt die schlimmsten Accounts. Du fühlst dich gesehen.', effekte: [T({ moral: 3, professionalitaet: 2, fanbeliebtheit: 1 })] } },
      { label: 'Öffentlich thematisieren', hinweis: 'riskant', wurf: { basis: 0.6, traits: ['selbstvertrauen'] }, erfolg: { text: 'Dein Beitrag löst eine Welle der Solidarität aus. Der Verein zeigt Rückgrat.', effekte: [FOLLOWER(35), T({ fanbeliebtheit: 5, ruf: 2, moral: 3 })] }, misserfolg: { text: 'Der Beitrag schlägt Wellen, aber auch Hass-Spiralen. Du ziehst dich entnervt zurück.', effekte: [T({ moral: -4, fanbeliebtheit: -1 })] } },
      { label: 'Account vorübergehend deaktivieren', erfolg: { text: 'Ruhe. Du merkst, wie gut es tut, einmal nichts zu lesen.', effekte: [FOLLOWER(-10), T({ moral: 5, privatglueck: 3 })] } },
    ],
  },
]
