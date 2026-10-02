import { schlagzeile } from './headlines'
import { WOCHEN_PRO_SAISON, SPIELTAGE, applyTraits, berechneNote, neuesSpiel, rolleEinsatz, waehleOption } from './match'
import { SKILL_KEYS, alter, clamp } from './rating'
import { createRng, type Rng } from './rng'
import { beendeSaison } from './season'
import { FOCUS, trainingDeltas } from './training'
import type { Career, Einsatz, Injury, MatchState, TrainingFocus, WeekReport } from './types'

const LOG_LIMIT = 80

function withRng(c: Career, fn: (rng: Rng) => Career): Career {
  const rng = createRng(c.rngState)
  const out = fn(rng)
  return { ...out, rngState: rng.state() }
}

const saisonLabel = (saison: number) => `${saison}/${String(saison + 1).slice(2)}`

const VERLETZUNGEN: { name: string; min: number; max: number; gewicht: number }[] = [
  { name: 'Zerrung', min: 1, max: 3, gewicht: 30 },
  { name: 'Prellung', min: 1, max: 2, gewicht: 10 },
  { name: 'Muskelfaserriss', min: 3, max: 6, gewicht: 35 },
  { name: 'Bänderdehnung im Sprunggelenk', min: 4, max: 8, gewicht: 20 },
  { name: 'Muskelbündelriss', min: 8, max: 12, gewicht: 4 },
  { name: 'Kreuzbandriss', min: 28, max: 40, gewicht: 1 },
]

function wuerfleVerletzung(rng: Rng): Injury {
  const total = VERLETZUNGEN.reduce((a, v) => a + v.gewicht, 0)
  let r = rng.next() * total
  for (const v of VERLETZUNGEN) {
    r -= v.gewicht
    if (r <= 0) return { name: v.name, wochen: rng.int(v.min, v.max) }
  }
  return { name: 'Zerrung', wochen: 2 }
}

function verletzungsChance(c: Career, gespielt: boolean): number {
  const t = c.spieler.traits
  const p = 0.01 + 0.0004 * Math.max(0, 70 - t.fitness) + FOCUS[c.training].verletzungsrisiko + (gespielt ? 0.012 : 0)
  return Math.max(0.002, p * (2 - t.gesundheit / 100))
}

/** Beginnt die Woche: Training, ggf. Reha, danach Spiel (mit Szenen) oder direkt der Wochenbericht. */
export function startWeek(c: Career, focus: TrainingFocus): Career {
  if (c.phase !== 'planung') return c
  return withRng(c, (rng) => {
    const hinweise: string[] = []
    const verletzt = c.verletzung !== null
    const effektiv: TrainingFocus = verletzt ? 'regeneration' : focus
    const def = FOCUS[effektiv]

    const skills = { ...c.spieler.skills }
    const gewinne = trainingDeltas(c, effektiv)
    const deltas: WeekReport['deltas'] = []
    for (const k of SKILL_KEYS) {
      const d = gewinne[k] ?? 0
      if (d <= 0) continue
      skills[k] = clamp(skills[k] + d, 1, 100)
      deltas.push({ skill: k, delta: d })
    }
    deltas.sort((a, b) => b.delta - a.delta)

    const f0 = c.spieler.traits.fitness
    const fitness = clamp(f0 - def.ermuedung + 6 + 0.25 * (100 - f0))
    const privatglueck = clamp(c.spieler.traits.privatglueck + def.privatglueck)

    let verletzung = c.verletzung
    let trainingText = `Training: ${FOCUS[focus].name}`
    if (verletzung) {
      const rest = verletzung.wochen - 1
      trainingText = `Reha: ${verletzung.name}`
      if (rest <= 0) {
        hinweise.push(`${verletzung.name} ist ausgeheilt. Du bist wieder fit!`)
        verletzung = null
      } else {
        hinweise.push(`Noch ${rest} Woche${rest === 1 ? '' : 'n'} Pause wegen ${verletzung.name}.`)
        verletzung = { ...verletzung, wochen: rest }
      }
    }

    const matchtag = c.uhr.woche <= SPIELTAGE
    let sperre = c.sperre
    let einsatz: Einsatz | null = null
    if (matchtag && !verletzt) {
      if (sperre > 0) {
        sperre -= 1
        hinweise.push('Gesperrt: Du musst dir das Spiel von der Tribüne ansehen.')
      } else {
        einsatz = rolleEinsatz(c, rng)
      }
    } else if (matchtag && verletzt) {
      hinweise.push('Verletzt: Du fehlst im Kader.')
    }

    const bericht: WeekReport = {
      saison: c.uhr.saison,
      woche: c.uhr.woche,
      trainingText,
      deltas,
      szenenLog: [],
      hinweise,
    }
    const c2: Career = {
      ...c,
      training: focus,
      spieler: { ...c.spieler, skills, traits: { ...c.spieler.traits, fitness, privatglueck } },
      verletzung,
      sperre,
      bericht,
    }

    if (einsatz === null) return beendeWoche(c2, rng, null, 'nicht-eingesetzt', verletzt)
    const heim = c.uhr.woche % 2 === 1
    const m = neuesSpiel(c2, rng, einsatz === 'startelf' ? 'startelf' : 'einwechslung', heim)
    if (einsatz === 'nicht-eingesetzt') return beendeWoche(c2, rng, m, einsatz, verletzt)
    if (m.szenen.length === 0) return beendeWoche(c2, rng, m, m.einsatz, verletzt)
    return { ...c2, phase: 'szene', match: m }
  })
}

/** Spieler wählt eine Option in der aktuellen Schlüsselszene. */
export function waehle(c: Career, optionIndex: number): Career {
  if (c.phase !== 'szene' || !c.match || c.match.ausgang !== null) return c
  return withRng(c, (rng) => waehleOption(c, rng, optionIndex))
}

/** „Weiter“ nach dem Szenenausgang: nächste Szene oder Spielende. */
export function weiterImSpiel(c: Career): Career {
  const m = c.match
  if (c.phase !== 'szene' || !m || m.ausgang === null) return c
  if (m.frueherEnde || m.index + 1 >= m.szenen.length) {
    return withRng(c, (rng) => beendeWoche(c, rng, m, m.einsatz, false))
  }
  return { ...c, match: { ...m, index: m.index + 1, ausgang: null } }
}

function beendeWoche(c: Career, rng: Rng, m: MatchState | null, einsatz: Einsatz, reha: boolean): Career {
  const gespielt = einsatz !== 'nicht-eingesetzt'
  const bericht = c.bericht!
  const hinweise = [...bericht.hinweise]
  let traits = c.spieler.traits
  let form = c.form
  let stats = c.saisonStats
  let sperre = c.sperre
  let ergebnis: WeekReport['ergebnis']
  let kopf: string | undefined

  if (m) {
    const tore = m.basisEigene + m.eigeneTore
    const gegentore = m.basisGegner + m.gegnerTore
    const note = gespielt ? berechneNote(c, m, tore, gegentore) : null
    const minuten = !gespielt ? 0 : einsatz === 'startelf' ? (m.frueherEnde ? rng.int(25, 75) : 90) : 25

    if (note !== null) {
      traits = applyTraits(traits, {
        moral: tore > gegentore ? 3 : tore < gegentore ? -2 : 0,
        selbstvertrauen: Math.round((note - 6) * 2.5),
        fanbeliebtheit: m.spielerTore * 2 + (note >= 8 ? 1 : 0) - (note <= 4.5 ? 1 : 0),
        ruf: Math.round((m.spielerTore * 0.8 + (note - 6) * 0.3) * 10) / 10,
        trainerBeziehung: Math.round((note - 6) * 1.2 * 10) / 10,
        fitness: -Math.round(einsatz === 'startelf' ? (12 * minuten) / 90 : 5),
      })
      form = clamp(0.7 * form + 0.3 * (50 + (note - 6) * 20))
      stats = {
        ...stats,
        spiele: stats.spiele + 1,
        startelf: stats.startelf + (einsatz === 'startelf' ? 1 : 0),
        minuten: stats.minuten + minuten,
        tore: stats.tore + m.spielerTore,
        vorlagen: stats.vorlagen + m.vorlagen,
        notenSumme: stats.notenSumme + note,
        gelb: stats.gelb + (m.gelb ? 1 : 0),
        rot: stats.rot + (m.rot ? 1 : 0),
        siege: stats.siege + (tore > gegentore ? 1 : 0),
        remis: stats.remis + (tore === gegentore ? 1 : 0),
        niederlagen: stats.niederlagen + (tore < gegentore ? 1 : 0),
      }
      if (m.rot) {
        sperre = 2
        hinweise.push('Rote Karte: Zwei Spiele Sperre.')
      }
    } else {
      traits = applyTraits(traits, { moral: -1.5 })
      form = 0.9 * form + 0.1 * 50
    }

    ergebnis = {
      gegner: m.gegner, heim: m.heim, tore, gegentore, einsatz, note,
      spielerTore: m.spielerTore, vorlagen: m.vorlagen, gelb: m.gelb, rot: m.rot,
    }
    kopf = schlagzeile(
      { name: c.spieler.nachname, gegner: m.gegner, tore, gegentore, einsatz, note, spielerTore: m.spielerTore, vorlagen: m.vorlagen, rot: m.rot },
      rng,
    )
  }

  // Verletzung: direkt aus einer Szene oder aus dem Wochenrisiko.
  let verletzung = c.verletzung
  if (!verletzung && !reha && ((m?.verletzt ?? false) || rng.chance(verletzungsChance(c, gespielt)))) {
    verletzung = wuerfleVerletzung(rng)
    hinweise.push(`Verletzung: ${verletzung.name}, ${verletzung.wochen} Woche${verletzung.wochen === 1 ? '' : 'n'} Pause.`)
    if (verletzung.wochen >= 20) traits = applyTraits(traits, { moral: -10, selbstvertrauen: -10 })
  }

  const log = [...c.log]
  const prefix = `${saisonLabel(c.uhr.saison)}, Woche ${c.uhr.woche}: `
  if (kopf) log.push(prefix + kopf)
  for (const h of hinweise.filter((x) => x.startsWith('Verletzung') || x.startsWith('Rote'))) log.push(prefix + h)

  return {
    ...c,
    spieler: { ...c.spieler, traits },
    form,
    saisonStats: stats,
    sperre,
    verletzung,
    match: null,
    phase: 'bericht',
    log: log.slice(-LOG_LIMIT),
    bericht: {
      ...bericht,
      ergebnis,
      schlagzeile: kopf,
      szenenLog: m?.szenenLog ?? [],
      hinweise,
    },
  }
}

/** Schließt den Wochenbericht ab und springt in die nächste Woche (oder das Saisonende). */
export function weiter(c: Career): Career {
  if (c.phase !== 'bericht') return c
  const woche = c.uhr.woche + 1
  const next: Career = { ...c, bericht: null, uhr: { ...c.uhr, woche }, phase: 'planung' }
  return woche > WOCHEN_PRO_SAISON ? beendeSaison(next) : next
}

/** Beendet die Karriere freiwillig (ab 30). */
export function beendeKarriere(c: Career): Career {
  if (c.phase !== 'planung' && c.phase !== 'saisonende') return c
  if (alter(c.spieler.geburtsdatum, c.uhr.saison) < 30) return c
  return { ...c, phase: 'karriereende' }
}
