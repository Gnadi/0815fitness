import { FLAG, G, NEWS, S, T, VERL, alterVon, flag, jugend, ov, profi, staerkeVerein, trait, verletzt } from './helpers'
import type { EreignisDef } from './types'

export const VEREIN: EreignisDef[] = [
  {
    id: 'v-trainingslager', kategorie: 'Verein', gewicht: 2, abstand: 100, bedingung: (c) => profi(c) && c.saison.kalender[c.uhr.woche - 1]?.t === 'F',
    titel: 'Trainingslager im Süden', text: 'Der Verein reist zum Trainingslager nach Spanien. Zehn Tage Sonne, Sprints, Zimmer teilen mit {freund}. Der Fitnesstrainer hat eine „kleine Überraschung“ angekündigt.',
    optionen: [
      { label: 'Alles geben', hinweis: 'riskant', wurf: { basis: 0.75, traits: ['gesundheit'] }, erfolg: { text: 'Du kommst topfit zurück. Die Beine sind kräftiger, die Kondition besser.', effekte: [S({ physis: 2, tempo: 1 }), T({ fitness: 6, kabine: 3, trainerBeziehung: 2 })] }, misserfolg: { text: 'Übertrieben! Dein Oberschenkel zwickt, der Physio schüttelt den Kopf.', effekte: [VERL('Zerrung', 3), T({ fitness: -4, moral: -3 })] } },
      { label: 'Dosiert trainieren', erfolg: { text: 'Du hörst auf deinen Körper und kommst unbeschadet zurück.', effekte: [S({ physis: 1 }), T({ fitness: 3, professionalitaet: 2 })] } },
    ],
  },
  {
    id: 'v-fanfest', kategorie: 'Verein', gewicht: 2, abstand: 150, bedingung: (c) => profi(c),
    titel: 'Fanfest im Stadion', text: 'Der Verein lädt zum Fanfest. Hunderte Fans warten auf Autogramme und Selfies. {kapitaen} erwartet, dass die ganze Mannschaft kommt.',
    optionen: [
      { label: 'Zeit nehmen für alle', erfolg: { text: 'Du schreibst Autogramme, bis die Hand taub ist. Die Fans lieben dich dafür.', effekte: [T({ fanbeliebtheit: 6, ruf: 1, moral: 3, fitness: -2 })] } },
      { label: 'Nur kurz vorbeischauen', erfolg: { text: 'Du bleibst eine Stunde, gibst ein paar Autogramme und gehst.', effekte: [T({ fanbeliebtheit: 2 })] } },
      { label: 'Fernbleiben', erfolg: { text: 'Die Fans haben dein Fehlen bemerkt. Auf der Webseite gibt es Spott.', effekte: [T({ fanbeliebtheit: -4, kabine: -2 })] } },
    ],
  },
  {
    id: 'v-finanzkrise', kategorie: 'Verein', gewicht: 1, abstand: 400, bedingung: (c) => profi(c) && staerkeVerein(c) < 62 && c.vertrag !== null && c.vertrag.gehalt > 30_000,
    titel: 'Der Verein ist klamm', text: 'Der Präsident hält eine ernste Rede: „Wir sind in finanziellen Schwierigkeiten. Wenn niemand verzichtet, droht uns die Insolvenz.“ Er bittet alle um zehn Prozent Gehaltsverzicht.',
    optionen: [
      { label: 'Verzichten', erfolg: { text: 'Du zeigst Größe, und der Verein überlebt. Die Fans feiern dich.', effekte: [T({ fanbeliebtheit: 6, kabine: 4, ruf: 1, moral: 2 }), G(({ vertrag }) => -Math.round((vertrag?.gehalt ?? 0) * 0.05)), NEWS('{name} verzichtet auf Gehalt')] } },
      { label: 'Nur vom Berater prüfen lassen', erfolg: { text: 'Dein Berater schüttelt den Kopf: „Das ist vertraglich nicht vorgesehen.“ Du verzichtest nicht, und es wird bekannt.', effekte: [T({ fanbeliebtheit: -4, kabine: -4 })] } },
    ],
  },
  {
    id: 'v-praesident', kategorie: 'Verein', gewicht: 1.5, abstand: 300, bedingung: (c) => profi(c) && trait(c, 'ruf') > 30,
    titel: 'Der Präsident lädt dich ein', text: 'Der Präsident bittet dich zum Mittagessen. „Wir planen die Zukunft“, sagt er und schiebt dir eine Rechnung zu, die du sicherlich nicht bezahlen wirst.',
    optionen: [
      { label: 'Zuhören und diplomatisch bleiben', erfolg: { text: 'Er schwärmt von seinen Plänen. Dein Name fällt öfter als du denkst.', effekte: [T({ trainerBeziehung: 2, ruf: 1 })] } },
      { label: 'Gehalt und Rolle ansprechen', hinweis: 'riskant', wurf: { basis: 0.4, traits: ['ruf'] }, erfolg: { text: 'Er nickt und verspricht, mit dem Sportdirektor zu sprechen. Dein Gehalt steigt.', effekte: [T({ moral: 3 })] }, misserfolg: { text: 'Er schaut dich an, als hättest du ihm die Brieftasche gestohlen.', effekte: [T({ trainerBeziehung: -3 })] } },
    ],
  },
  {
    id: 'v-stadion', kategorie: 'Verein', gewicht: 1, abstand: 400, bedingung: (c) => profi(c) && alterVon(c) >= 22,
    titel: 'Stadionjubiläum', text: 'Das Stadion feiert Jubiläum. Alte Legenden sind eingeladen, und du darfst ihnen eine Ehrenrunde aufs Feld begleiten.',
    optionen: [
      { label: 'Mit der Legende ein Foto machen', erfolg: { text: 'Das Foto geht durch die Vereinszeitung. Du bist bei den Fans der würdige Nachfolger.', effekte: [T({ fanbeliebtheit: 4, ruf: 1 })] } },
      { label: 'Den Moment still genießen', erfolg: { text: 'Du stehst auf dem Rasen und spürst die Geschichte. Gänsehaut.', effekte: [T({ moral: 4, ehrgeiz: 2 })] } },
    ],
  },
  {
    id: 'v-pr-termin', kategorie: 'Verein', gewicht: 2, abstand: 100, bedingung: profi,
    titel: 'PR-Termin im Seniorenheim', text: 'Der Verein schickt dich ins Seniorenheim: Händeschütteln, Torte, Autogramme. Jemand fragt, ob du der Sohn von Herrn Schmidt bist.',
    optionen: [
      { label: 'Charmant sein', erfolg: { text: 'Du gewinnst die Herzen der Bewohner und bekommst Kuchen für die Mannschaft mit.', effekte: [T({ fanbeliebtheit: 3, kabine: 2, moral: 2 })] } },
      { label: 'Schnell wieder weg', erfolg: { text: 'Du bist nach zehn Minuten wieder draußen. Der Pressesprecher schluckt.', effekte: [T({ fanbeliebtheit: -1 })] } },
    ],
  },
  {
    id: 'v-neuer-vertrag-lob', kategorie: 'Verein', gewicht: 1, abstand: 300, bedingung: (c) => profi(c) && c.vertrag?.rolle === 'Perspektive' && ov(c) > staerkeVerein(c) - 8,
    titel: 'Der Sportdirektor sieht Potenzial', text: 'Der Sportdirektor nimmt dich beiseite: „Wir haben große Pläne mit dir. Beweis uns, dass wir recht haben.“ Das Gespräch dauert nur zwei Minuten, aber es hallt nach.',
    optionen: [
      { label: 'Motiviert antworten', erfolg: { text: 'Du gehst mit Feuer aus dem Gespräch. Die nächsten Trainings sind die besten seit Wochen.', effekte: [T({ moral: 4, ehrgeiz: 3, trainerBeziehung: 1 })] } },
      { label: 'Mit Ruhe zuhören', erfolg: { text: 'Du nickst und bedankst dich. Der Sportdirektor ist sich sicher: der ist reif.', effekte: [T({ professionalitaet: 2 })] } },
    ],
  },
  // ---------------------------------------------------------------- Gesundheit
  {
    id: 'g-physio', kategorie: 'Gesundheit', gewicht: 2.5, abstand: 70, bedingung: (c) => !jugend(c) && !verletzt(c) && c.spieler.traits.fitness < 60,
    titel: 'Ziehen im Oberschenkel', text: 'Beim Warmmachen spürst du ein leichtes Ziehen im Oberschenkel. Der Physio sagt: „Das sieht nach Überlastung aus. Eine Woche Pause wäre klug.“ Das Spiel ist wichtig.',
    optionen: [
      { label: 'Pause machen', erfolg: { text: 'Du verpasst nichts Großes und bist die Woche darauf wieder voll da.', effekte: [T({ fitness: 6, professionalitaet: 2, gesundheit: 1 })] } },
      { label: 'Zähne zusammenbeißen und spielen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['gesundheit'] }, erfolg: { text: 'Es geht gerade so. Das Spiel läuft gut, aber das Ziehen bleibt.', effekte: [T({ selbstvertrauen: 2, fitness: -4, trainerBeziehung: 2 })] }, misserfolg: { text: 'Nach einer halben Stunde ein Knacken, es ist ein Muskelfaserriss.', effekte: [VERL('Muskelfaserriss', 4), T({ moral: -3 })] } },
    ],
  },
  {
    id: 'g-ernaehrung', kategorie: 'Gesundheit', gewicht: 1.5, abstand: 400, bedingung: (c) => profi(c) && !flag(c, 'ernaehrung'),
    titel: 'Ernährungsberater', text: 'Ein Ernährungsberater erklärt dir, dass Pizza und Cola nicht ideal sind für Leistungssportler. „Ich stelle dir einen Plan zusammen.“',
    optionen: [
      { label: 'Plan nehmen', kosten: 600, hinweis: 'kostet 600 €', erfolg: { text: 'Du isst plötzlich Quinoa und Brokkoli. Der Körper dankt es dir.', effekte: [FLAG('ernaehrung'), T({ fitness: 6, professionalitaet: 4, gesundheit: 4 }), S({ physis: 1 })] } },
      { label: 'Weiter wie bisher', erfolg: { text: 'Das Schnitzel schmeckt einfach zu gut.', effekte: [T({ privatglueck: 1 })] } },
    ],
  },
  {
    id: 'g-schlaf', kategorie: 'Gesundheit', gewicht: 1.5, abstand: 200, bedingung: (c) => !jugend(c) && trait(c, 'fitness') < 70,
    titel: 'Schlafprobleme', text: 'Seit Tagen wachst du mitten in der Nacht auf, Gedanken an das nächste Spiel kreisen im Kopf. Im Training bist du müde.',
    optionen: [
      { label: 'Schlaflabor und Routine', kosten: 250, hinweis: 'kostet 250 €', erfolg: { text: 'Mit einer festen Routine und dunklem Zimmer schläfst du bald wie ein Murmeltier.', effekte: [T({ fitness: 6, moral: 3, professionalitaet: 2 })] } },
      { label: 'Ignorieren und durchhalten', erfolg: { text: 'Du kaufst dir einen Kaffeevollautomaten. Das hilft nur leidlich.', effekte: [T({ fitness: -3, moral: -1 })] } },
    ],
  },
  {
    id: 'g-reha-geduld', kategorie: 'Gesundheit', gewicht: 3, abstand: 25, bedingung: (c) => c.verletzung !== null && c.verletzung.wochen >= 4,
    titel: 'Reha: Geduld oder Ehrgeiz?', text: 'Die Reha dauert dir zu lang. Du siehst auf dem Handy, wie dein Team gewinnt. Der Physio sagt, es würde noch Wochen dauern, aber du fühlst dich schon besser.',
    optionen: [
      { label: 'Geduldig bleiben', erfolg: { text: 'Du hörst auf den Physio. Die Genesung läuft planmäßig.', effekte: [T({ professionalitaet: 3, gesundheit: 2, moral: -1 })] } },
      { label: 'Zusatzeinheiten machen', hinweis: 'riskant', wurf: { basis: 0.55, traits: ['gesundheit', 'professionalitaet'] }, erfolg: { text: 'Du verkürzt die Reha um eine Woche. Mutig und diesmal gut gegangen.', effekte: [{ t: 'reha', wochen: 1 }, T({ ehrgeiz: 2 })] }, misserfolg: { text: 'Ein Rückschlag in der Reha. Die Pause wird länger.', effekte: [T({ moral: -4, gesundheit: -3 })] } },
    ],
  },
  {
    id: 'g-kreuzband-psyche', kategorie: 'Gesundheit', gewicht: 4, abstand: 100, bedingung: (c) => c.verletzung !== null && c.verletzung.name === 'Kreuzbandriss' && c.verletzung.wochen < 22,
    titel: 'Die Angst vor dem ersten Zweikampf', text: 'Das Knie hält, aber im Kopf zweifelst du. Wird es beim ersten Zweikampf wieder reißen? Nachts liegst du wach.',
    optionen: [
      { label: 'Mit der Sportpsychologin arbeiten', kosten: 300, hinweis: 'kostet 300 €', erfolg: { text: 'Gemeinsam bearbeitet ihr die Angst. Nach und nach kommt das Vertrauen zurück.', effekte: [T({ selbstvertrauen: 8, moral: 6, professionalitaet: 2 })] } },
      { label: 'Alleine durchstehen', erfolg: { text: 'Du kämpfst allein. Es dauert, aber du schaffst es.', effekte: [T({ moral: -2, selbstvertrauen: 1, professionalitaet: 1 })] } },
    ],
  },
]
