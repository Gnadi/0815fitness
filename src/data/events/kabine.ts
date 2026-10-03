import { FLAG, G, NEWS, S, T, alterVon, anteil, flag, gehalt, jugend, ov, profi, trait } from './helpers'
import type { EreignisDef } from './types'

export const KABINE: EreignisDef[] = [
  {
    id: 'k-kapitaen-streit', kategorie: 'Kabine', gewicht: 2.5, abstand: 100, bedingung: profi,
    titel: 'Kapitän {kapitaen} faucht dich an', text: 'Nach dem Training knöpft sich {kapitaen} dich vor der gesamten Mannschaft vor: „Wer hier zu spät zum Training kommt, braucht sich über Bankplätze nicht zu wundern.“ Alle schauen zu.',
    optionen: [
      { label: 'Entschuldigen und Besserung geloben', erfolg: { text: 'Du nimmst die Kritik an. {kapitaen} brummt, klopft dir auf die Schulter und ist wieder gut.', effekte: [T({ kabine: 3, disziplin: 2, selbstvertrauen: -1 })] } },
      { label: 'Kontern, du warst gar nicht zu spät', hinweis: 'riskant', wurf: { basis: 0.45, traits: ['selbstvertrauen', 'kabine'] },
        erfolg: { text: 'Du hast die Fakten auf deiner Seite und die Kabine pfeift {kapitaen} aus. Respekt!', effekte: [T({ selbstvertrauen: 4, kabine: 3 })] },
        misserfolg: { text: 'Du hast ein Argument, aber keinen Rückhalt. Die Stimmung kippt gegen dich.', effekte: [T({ kabine: -5, trainerBeziehung: -2 })] } },
      { label: 'Nach dem Training unter vier Augen aussprechen', erfolg: { text: 'Ihr redet offen und trinkt hinterher einen Kaffee. Die Fronten sind geklärt.', effekte: [T({ kabine: 4, professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'k-mannschaftsabend', kategorie: 'Kabine', gewicht: 3, abstand: 70, bedingung: profi,
    titel: 'Mannschaftsabend', text: 'Der Kapitän hat einen Tisch in der Stadt reserviert, alle gehen mit. Am nächsten Morgen ist Training um 9 Uhr.',
    optionen: [
      { label: 'Mitgehen und feiern', hinweis: 'kostet Fitness', erfolg: { text: 'Es wird ein langer Abend mit Karaoke. Dein Auftritt wird Legende, am nächsten Morgen bist du ein Wrack.', effekte: [T({ kabine: 5, moral: 4, fitness: -6, disziplin: -2 }), G(-120)] } },
      { label: 'Kurz vorbeischauen und früh gehen', erfolg: { text: 'Du trinkst Wasser, lachst viel und gehst um zehn. Alle respektieren das.', effekte: [T({ kabine: 2, professionalitaet: 2 })] } },
      { label: 'Absagen', erfolg: { text: 'Du bleibst zu Hause. In der Kabine heißt es, du seist ein Langweiler.', effekte: [T({ kabine: -3, professionalitaet: 2, fitness: 2 })] } },
    ],
  },
  {
    id: 'k-gehaltsneid', kategorie: 'Kabine', gewicht: 1.5, abstand: 150, bedingung: (c) => profi(c) && gehalt(c) > 150_000 && ov(c) < 75,
    titel: 'Neid auf die Gehaltsliste', text: 'Jemand hat die Gehaltsliste durchgestochen. Plötzlich weiß jeder, was du verdienst, und Kollegen, die länger hier sind, schauen schief.',
    optionen: [
      { label: 'Die Runde Bier zahlen', kosten: anteil(0.02, 200), hinweis: 'kostet Geld', erfolg: { text: 'Mit einer Runde ist der Frieden gekauft. Die Stimmung wird locker.', effekte: [T({ kabine: 4 })] } },
      { label: 'Ignorieren', wurf: { basis: 0.5, traits: ['kabine'] }, erfolg: { text: 'Niemand sagt etwas. Das Thema verschwindet nach ein paar Tagen.', effekte: [] }, misserfolg: { text: 'Die Spitzen häufen sich. Beim Passspiel fehlen plötzlich Anspielstationen.', effekte: [T({ kabine: -5, moral: -3 })] } },
      { label: 'Offensiv sagen: „Ich leiste dafür auch was“', erfolg: { text: 'Du schaust jedem in die Augen. Es herrscht kurz Stille, dann nickt der Kapitän.', effekte: [T({ kabine: -1, selbstvertrauen: 3 })] } },
    ],
  },
  {
    id: 'k-clique', kategorie: 'Kabine', gewicht: 2, abstand: 200, bedingung: profi,
    titel: 'Welche Clique?', text: 'In jeder Kabine gibt es Lager: die Alten am Fenster, die Jungen mit den Kopfhörern, die Legionäre mit ihrer eigenen Sprache. Beim Essen musst du dich irgendwo hinsetzen.',
    optionen: [
      { label: 'Zu den Alten, viel lernen', erfolg: { text: 'Die Routiniers bringen dir Tricks bei und Geschichten, die nicht stimmen.', effekte: [S({ positionsspiel: 1 }), T({ kabine: 2, professionalitaet: 2 })] } },
      { label: 'Zu den Jungen, Spaß haben', erfolg: { text: 'Mit den Jungs gibt es Playstation und Dosenlachen. Die Nähe fühlt sich gut an.', effekte: [T({ moral: 4, kabine: 2, disziplin: -1 })] } },
      { label: 'Zwischen allen Stühlen', erfolg: { text: 'Du suchst dir jeden Tag einen neuen Platz. Das nennt man diplomatisch.', effekte: [T({ kabine: 1 })] } },
    ],
  },
  {
    id: 'k-streit-training', kategorie: 'Kabine', gewicht: 2, abstand: 100, bedingung: profi,
    titel: 'Handgemenge im Training', text: '{rivale} grätscht dich im Trainingsspiel brutal um. Du springst auf, der Ball ist plötzlich egal. Beide Teams bilden sofort einen Kreis um euch.',
    optionen: [
      { label: 'Tief durchatmen und gehen', erfolg: { text: 'Du drehst dich weg. Der Trainer pfeift ab, und alle respektieren, dass du größer warst.', effekte: [T({ disziplin: 3, kabine: 2 })] } },
      { label: 'Zurückschubsen', hinweis: 'riskant', wurf: { basis: 0.5, traits: ['disziplin'] }, erfolg: { text: 'Kurzes Schubsen, dann trennen euch die Kollegen. Der Trainer sieht großzügig weg.', effekte: [T({ selbstvertrauen: 2, kabine: 1 })] }, misserfolg: { text: 'Aus dem Schubsen wird ein Faustschlag. {trainer} schickt dich unter die Dusche und verhängt eine Geldstrafe.', effekte: [G(anteil(0.02, 150)), T({ trainerBeziehung: -5, disziplin: -3 }), NEWS('Prügelei im Training bei {verein}')] } },
    ],
  },
  {
    id: 'k-neuling-prank', kategorie: 'Kabine', gewicht: 1.5, abstand: 100, bedingung: profi,
    titel: 'Aufnahmeritual', text: 'Der Neuzugang soll als Aufnahmeritual vor der Mannschaft singen. Er ist Schweizer, kennt aber nur Jodeln. Alle warten darauf, dass du mitmachst.',
    optionen: [
      { label: 'Mitsingen und ihm helfen', erfolg: { text: 'Gemeinsam seid ihr eine Katastrophe, aber eine sympathische. Er wird dein Freund.', effekte: [T({ kabine: 4, moral: 3 })] } },
      { label: 'Zuschauen und filmen', erfolg: { text: 'Das Video wird zum Kabinenhit. Der Neue lacht gequält.', effekte: [T({ kabine: 2, disziplin: -1 })] } },
    ],
  },
  {
    id: 'k-kabinenpredigt', kategorie: 'Kabine', gewicht: 2, abstand: 120, bedingung: (c) => profi(c) && c.form < 45,
    titel: 'Nach der nächsten Pleite', text: 'Drei Spiele ohne Sieg. In der Kabine herrscht eisige Stille, nur das Tropfen der Duschen ist zu hören. Du hast das Gefühl, jemand muss etwas sagen.',
    optionen: [
      { label: 'Aufstehen und die Mannschaft wachrütteln', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['selbstvertrauen', 'kabine'] }, erfolg: { text: 'Du triffst den richtigen Ton. {kapitaen} nickt, die Mannschaft rückt zusammen.', effekte: [T({ kabine: 5, ruf: 1, selbstvertrauen: 4 })] }, misserfolg: { text: 'Du bist der Jüngste im Raum und das hört man. Es setzt Augenrollen.', effekte: [T({ kabine: -3, selbstvertrauen: -3 })] } },
      { label: 'Schweigen und zuhören', erfolg: { text: 'Du hältst dich raus. Heute hat die Kabine andere Redner.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  {
    id: 'k-mentor', kategorie: 'Kabine', gewicht: 2, abstand: 200, bedingung: (c) => profi(c) && alterVon(c) <= 23,
    titel: 'Ein Veteran nimmt dich unter seine Fittiche', text: 'Der 36-jährige Routinier {freund} fragt, ob du nach dem Training zusammen noch Extraeinheiten machen willst. Er verspricht: „Ich zeig dir, wie man 40 Meter hinter dem Ball denkt.“',
    optionen: [
      { label: 'Annehmen, jede Woche', erfolg: { text: 'Es wird dein bestes Training des Jahres. Seine Tricks sind Gold wert.', effekte: [S({ positionsspiel: 2, pass: 1 }), T({ professionalitaet: 3, fitness: -2 })] } },
      { label: 'Höflich ablehnen', erfolg: { text: 'Du hast anderes vor. Er zuckt mit den Schultern und fragt den Nächsten.', effekte: [] } },
    ],
  },
  {
    id: 'k-spitzname', kategorie: 'Kabine', gewicht: 1.5, abstand: 300, bedingung: (c) => profi(c) && !flag(c, 'spitzname'),
    titel: 'Neuer Spitzname', text: 'Nach deinem peinlichen Ausrutscher im Training nennt dich die Mannschaft plötzlich „Bambi“. Selbst der Zeugwart kichert.',
    optionen: [
      { label: 'Annehmen und selbst nutzen', erfolg: { text: 'Du machst es zu deiner Marke. Die Fans rufen bald „Bambi!“ von der Tribüne.', effekte: [T({ kabine: 3, fanbeliebtheit: 3, ruf: 1 }), FLAG('spitzname')] } },
      { label: 'Verweigern und beleidigt sein', erfolg: { text: 'Nun ist er erst recht dein Name. Beleidigt sein hilft nie.', effekte: [T({ kabine: -2, moral: -2 }), FLAG('spitzname')] } },
    ],
  },
  {
    id: 'k-weihnachtsfeier', kategorie: 'Kabine', gewicht: 1.5, abstand: 200, bedingung: (c) => profi(c) && c.saison.kalender[c.uhr.woche - 1]?.t === 'F',
    titel: 'Weihnachtsfeier', text: 'Die Weihnachtsfeier des Vereins: Glühwein, Verkleidung und der Präsident, der zu laut redet. Es ist verlockend, den Abend richtig auszukosten.',
    optionen: [
      { label: 'Mit Weihnachtsmannmütze durch den Abend', hinweis: 'Fotos könnten kursieren', wurf: { basis: 0.6, traits: ['disziplin'] }, erfolg: { text: 'Ein lustiger Abend voller Gelächter. Die Fotos sind harmlos und die Stimmung steigt.', effekte: [T({ kabine: 5, moral: 4 })] }, misserfolg: { text: 'Ein Foto von dir mit einer Flasche und fraglicher Pose landet in der Boulevardzeitung.', effekte: [T({ kabine: 2, fanbeliebtheit: -2, ruf: -1 }), NEWS('Weihnachtsfeier: {name} lässt es krachen')] } },
      { label: 'Früh heimgehen', erfolg: { text: 'Du verabschiedest dich nach einem Glas. Zu Hause wartet ein ruhiger Abend.', effekte: [T({ kabine: -1, professionalitaet: 2, fitness: 2 })] } },
    ],
  },
  {
    id: 'k-rivale-position', kategorie: 'Kabine', gewicht: 2.5, abstand: 120, bedingung: (c) => profi(c) && c.vertrag?.rolle !== 'Stammspieler',
    titel: '{rivale} spielt auf deiner Position', text: '{rivale} ist fast so gut wie du und spielt auf deiner Position. Der Trainer vergleicht euch gnadenlos. Im Training wird jeder Zweikampf zum Duell.',
    optionen: [
      { label: 'Härter trainieren als er', erfolg: { text: 'Du bist jeden Tag der Erste und der Letzte. Es bringt dich weiter.', effekte: [S({ positionsspiel: 1, tempo: 1 }), T({ professionalitaet: 2, fitness: -3, trainerBeziehung: 2 })] } },
      { label: 'Ihn mit Tricks ausbooten', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['kabine'] }, erfolg: { text: 'Ein Gerücht hier, ein Wort dort: {rivale} wirkt plötzlich verunsichert. Du profitierst.', effekte: [T({ selbstvertrauen: 3, kabine: -1 })] }, misserfolg: { text: 'Die Intrige fliegt auf. In der Kabine sagt niemand mehr ein Wort zu dir.', effekte: [T({ kabine: -7, trainerBeziehung: -3 })] } },
      { label: 'Freundschaft anbieten', erfolg: { text: 'Ihr trainiert zusammen und pusht euch gegenseitig. Konkurrenz belebt das Geschäft.', effekte: [T({ kabine: 3, moral: 2 }), S({ pass: 1 })] } },
    ],
  },
  {
    id: 'k-spielerrat', kategorie: 'Kabine', gewicht: 1.5, abstand: 200, bedingung: (c) => profi(c) && alterVon(c) >= 20,
    titel: 'Prämien-Streit', text: '{kapitaen} verlangt im Namen der Mannschaft höhere Prämien und droht mit Streik beim Training. Er will dich auf seiner Seite sehen.',
    optionen: [
      { label: 'Solidarisch mitmachen', hinweis: 'riskant', wurf: { basis: 0.5 }, erfolg: { text: 'Das Präsidium gibt klein bei. Die Prämien steigen und die Kabine liebt dich.', effekte: [T({ kabine: 6, trainerBeziehung: -1 }), G(anteil(0.03, 300))] }, misserfolg: { text: 'Der Verein schaltet auf stur. Ihr zahlt alle Strafe und der Trainer ist verärgert.', effekte: [T({ kabine: 2, trainerBeziehung: -4 }), G(-300)] } },
      { label: 'Nicht mitmachen', erfolg: { text: 'Du gehst trainieren. Das nimmt dir niemand krumm, außer {kapitaen}.', effekte: [T({ kabine: -4, trainerBeziehung: 2 })] } },
    ],
  },
  {
    id: 'k-geburtstag', kategorie: 'Kabine', gewicht: 1.5, abstand: 70, bedingung: profi,
    titel: 'Geburtstag eines Mitspielers', text: '{freund} wird 30 und will mit der ganzen Mannschaft feiern. Jeder soll ein Geschenk mitbringen. Die Latte liegt hoch.',
    optionen: [
      { label: 'Teure Uhr schenken', kosten: anteil(0.03, 500), hinweis: 'kostet Geld', erfolg: { text: 'Die Uhr sorgt für große Augen. Er wird es dir nie vergessen.', effekte: [T({ kabine: 4, moral: 2 })] } },
      { label: 'Persönliches Geschenk basteln', erfolg: { text: 'Ein selbstgemachtes Fotoalbum, das die Kabine zum Heulen bringt. Genial.', effekte: [T({ kabine: 4, moral: 3 })] } },
      { label: 'Nur gratulieren', erfolg: { text: 'Dein Handschlag fällt etwas kühl aus.', effekte: [T({ kabine: -1 })] } },
    ],
  },
  {
    id: 'k-playlist', kategorie: 'Kabine', gewicht: 1.5, abstand: 100, bedingung: profi,
    titel: 'Musikkrieg in der Kabine', text: 'Es ist Spieltag und der Streit um die Kabinen-Playlist eskaliert: Schlager gegen Techno gegen Hip-Hop. Der Zeugwart will die Anlage abschalten.',
    optionen: [
      { label: 'Selber Playlist machen', wurf: { basis: 0.6, traits: ['kabine'] }, erfolg: { text: 'Deine Mischung trifft den Nerv. Beim Warmmachen wippt die halbe Mannschaft mit.', effekte: [T({ kabine: 3, moral: 3 })] }, misserfolg: { text: 'Niemand mag deine Auswahl. Der Zeugwart schaltet den Strom aus.', effekte: [T({ kabine: -2 })] } },
      { label: 'Kopfhörer aufsetzen', erfolg: { text: 'Du konzentrierst dich nur auf dich selbst. Vor dem Anpfiff bist du voll im Tunnel.', effekte: [T({ selbstvertrauen: 2, kabine: -1 })] } },
    ],
  },
  {
    id: 'k-aeltere-spieler-nerven', kategorie: 'Kabine', gewicht: 1, abstand: 200, bedingung: (c) => profi(c) && alterVon(c) >= 30,
    titel: 'Die Jungen übernehmen', text: 'Die Neuzugänge sind mit Rap-Videos und Muskeln beschäftigt und halten dich für einen Opa. Dabei bist du erst 30. Gefühlt jedenfalls.',
    optionen: [
      { label: 'Zeigen, was man mit Erfahrung kann', erfolg: { text: 'Im Trainingsspiel narrst du die Jungs. Schlagartig wirst du als Chef gefragt.', effekte: [T({ kabine: 4, selbstvertrauen: 3 })] } },
      { label: 'Lässig bleiben und lachen', erfolg: { text: 'Du machst Witze über deine Knie. Die Stimmung ist locker.', effekte: [T({ kabine: 2, moral: 2 })] } },
    ],
  },
  {
    id: 'k-kapitaensbinde', kategorie: 'Kabine', gewicht: 1.5, abstand: 300, bedingung: (c) => profi(c) && alterVon(c) >= 24 && trait(c, 'kabine') > 65 && trait(c, 'ruf') > 35 && !flag(c, 'kapitaen'),
    titel: 'Die Kapitänsbinde', text: 'Der Trainer fragt dich nach dem Training, ob du die Kapitänsbinde übernehmen würdest. {kapitaen} gibt sie nach der Saison ab. Mit der Binde kommen Verantwortung und Interviews.',
    optionen: [
      { label: 'Annehmen', erfolg: { text: 'Du bist jetzt offiziell der Anführer. Die Fans lieben es, die Presse auch.', effekte: [T({ ruf: 5, kabine: 5, fanbeliebtheit: 4, selbstvertrauen: 5, professionalitaet: 2 }), FLAG('kapitaen'), NEWS('{name} wird neuer Kapitän von {verein}')] } },
      { label: 'Ablehnen, du willst dich auf dein Spiel konzentrieren', erfolg: { text: 'Der Trainer ist enttäuscht, respektiert es aber.', effekte: [T({ trainerBeziehung: -1 })] } },
    ],
  },
  {
    id: 'k-kritik-kollege', kategorie: 'Kabine', gewicht: 1.5, abstand: 150, bedingung: (c) => profi(c) && c.vertrag?.rolle === 'Stammspieler',
    titel: 'Ein Mitspieler bekommt Ärger', text: 'Dein Mitspieler {freund} wird in der Presse nach einem Fehler regelrecht zerrissen. Er bittet dich, öffentlich ein gutes Wort für ihn einzulegen.',
    optionen: [
      { label: 'Ihn öffentlich in Schutz nehmen', erfolg: { text: 'Dein Statement wird gefeiert: „Wir gewinnen und verlieren als Team.“ Die Kabine ist stolz.', effekte: [T({ kabine: 4, ruf: 1, fanbeliebtheit: 1 })] } },
      { label: 'Nichts sagen', erfolg: { text: 'Du hältst dich raus. {freund} ist enttäuscht, aber versteht.', effekte: [T({ kabine: -2 })] } },
    ],
  },
  { id: 'k-pokerabend', kategorie: 'Kabine', gewicht: 1.5, abstand: 100, bedingung: (c) => profi(c) && !jugend(c),
    titel: 'Pokerabend im Mannschaftsbus', text: 'Im Mannschaftsbus wird gepokert. Die Einsätze steigen. {kapitaen} blufft grinsend. Dein Stapel ist kleiner geworden.',
    optionen: [
      { label: 'All-in!', hinweis: 'riskant', wurf: { basis: 0.35 }, erfolg: { text: 'Du gewinnst mit einem Paar Vieren. Wie auch immer.', effekte: [G(anteil(0.02, 200)), T({ kabine: 4, selbstvertrauen: 3 })] }, misserfolg: { text: 'Du verlierst alles. Der Kapitän klopft dir mitleidig auf die Schulter.', effekte: [G(-250), T({ kabine: 2, moral: -2 })] } },
      { label: 'Aussteigen', erfolg: { text: 'Du hörst früh auf und behältst dein Geld und deine Würde.', effekte: [T({ professionalitaet: 1 })] } },
    ],
  },
  { id: 'k-sportjournalist-vorfall', kategorie: 'Kabine', gewicht: 0.5, abstand: 400, bedingung: (c) => profi(c) && c.spieler.traits.ruf > 30,
    titel: 'Mitspieler packt aus', text: 'Ein Teamkollege hat einem Journalisten verraten, dass es in der Kabine knirscht. Die Zeitung druckt es groß. Nun wird jeder verdächtigt.',
    optionen: [
      { label: 'Den Teamgeist beschwören', wurf: { basis: 0.55, traits: ['kabine'] }, erfolg: { text: 'Du hältst eine kleine Rede, und nach dem nächsten Sieg ist alles vergessen.', effekte: [T({ kabine: 4, ruf: 1 })] }, misserfolg: { text: 'Keiner glaubt dir. Die Stimmung bleibt schlecht.', effekte: [T({ kabine: -3 })] } },
      { label: 'Selbst den Verräter suchen', erfolg: { text: 'Du wirst zum Detektiv. Leider findest du niemanden und nervst alle.', effekte: [T({ kabine: -2, moral: -1 })] } },
    ],
  },
]

