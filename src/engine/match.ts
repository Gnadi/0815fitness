import { SCENES, SCENE_BY_ID, type SceneEffect, type SceneOption } from '../data/scenes'
import { clamp, overall } from './rating'
import type { Rng } from './rng'
import { poisson } from './welt'
import type { Career, Einsatz, MatchState, Rolle, Skills, Traits, Wettbewerb } from './types'

export function applyTraits(traits: Traits, delta: Partial<Traits> | undefined): Traits {
  if (!delta) return traits
  const out = { ...traits }
  for (const [k, v] of Object.entries(delta) as [keyof Traits, number][]) out[k] = clamp(out[k] + v)
  return out
}

const ROLLEN_BONUS: Record<Rolle, number> = { Stammspieler: 2, Rotation: 0, Perspektive: -2, Jugend: 0 }

/** Würfelt, ob der Spieler spielt: Stammelf, Einwechslung oder gar nicht. */
export function rolleEinsatz(c: Career, rng: Rng, teamStaerke: number, national?: { bonus: number; vertrauen: number }): Einsatz {
  const t = c.spieler.traits
  const bonus = national ? national.bonus : c.vertrag ? ROLLEN_BONUS[c.vertrag.rolle] : 0
  const diff = overall(c.spieler) - teamStaerke + bonus
  const x = diff / 4 + ((national ? national.vertrauen : t.trainerBeziehung) - 50) / 40 + (c.form - 50) / 60
  const pStart = clamp(1 / (1 + Math.exp(-x)), 0.03, 0.97)
  if (rng.chance(pStart)) return 'startelf'
  return rng.chance(0.55) ? 'einwechslung' : 'nicht-eingesetzt'
}

function pickScenes(c: Career, rng: Rng, anzahl: number): string[] {
  const pos = c.spieler.position
  const pool = SCENES.filter((s) => s.positionen === 'alle' || s.positionen.includes(pos))
  const chosen: string[] = []
  while (chosen.length < anzahl && pool.length > chosen.length) {
    const rest = pool.filter((s) => !chosen.includes(s.id))
    const total = rest.reduce((a, s) => a + s.gewicht, 0)
    let r = rng.next() * total
    for (const s of rest) {
      r -= s.gewicht
      if (r <= 0) {
        chosen.push(s.id)
        break
      }
    }
  }
  return chosen
}

/** Nicht jedes Spiel hat Schlüsselszenen: Startelf 0–2, Einwechslung 0–1. Wichtige Spiele eher mehr. */
function szenenAnzahl(rng: Rng, einsatz: 'startelf' | 'einwechslung', wichtig: boolean): number {
  if (einsatz === 'einwechslung') return rng.chance(wichtig ? 0.7 : 0.5) ? 1 : 0
  const r = rng.next()
  const s = wichtig ? 0.1 : 0.2
  return r < s ? 0 : r < 0.7 ? 1 : 2
}

export interface Paarung {
  wettbewerb: Wettbewerb
  label: string
  gegnerId: string
  gegner: string
  gegnerStaerke: number
  eigeneStaerke: number
  heim: boolean
  ko: boolean
}

export function neuesSpiel(c: Career, rng: Rng, einsatz: Exclude<Einsatz, 'nicht-eingesetzt'>, p: Paarung): MatchState {
  const diff = p.eigeneStaerke - p.gegnerStaerke + (p.heim ? 2 : -2)
  const wichtig = p.ko || p.wettbewerb === 'europa' || p.wettbewerb === 'turnier'
  return {
    wettbewerb: p.wettbewerb,
    label: p.label,
    gegnerId: p.gegnerId,
    gegner: p.gegner,
    gegnerStaerke: p.gegnerStaerke,
    eigeneStaerke: p.eigeneStaerke,
    heim: p.heim,
    ko: p.ko,
    einsatz,
    basisEigene: poisson(rng, 1.15 * Math.exp(diff / 35)),
    basisGegner: poisson(rng, 1.15 * Math.exp(-diff / 35)),
    szenen: pickScenes(c, rng, szenenAnzahl(rng, einsatz, wichtig)),
    index: 0,
    ausgang: null,
    eigeneTore: 0,
    gegnerTore: 0,
    spielerTore: 0,
    vorlagen: 0,
    note: 0,
    gelb: false,
    rot: false,
    verletzt: false,
    frueherEnde: false,
    szenenLog: [],
  }
}

/** Erfolgswahrscheinlichkeit einer Option, abhängig von Skills, Traits, Selbstvertrauen, Fitness und Gegner. */
export function erfolgschance(c: Career, m: MatchState, o: SceneOption): number {
  const { skills, traits } = c.spieler
  const avg = (vals: number[]) => vals.reduce((a, b) => a + b, 0) / vals.length
  const skillMod = o.skills?.length ? (avg(o.skills.map((k: keyof Skills) => skills[k])) - 50) / 100 : 0
  const traitMod = o.traits?.length ? (avg(o.traits.map((k) => traits[k])) - 50) / 100 : 0
  const sv = (traits.selbstvertrauen - 50) / 250
  const fit = traits.fitness < 60 ? -(60 - traits.fitness) / 300 : 0
  const gegner = -(m.gegnerStaerke - overall(c.spieler)) / 250
  return clamp(o.basis + skillMod + traitMod + sv + fit + gegner, 0.05, 0.95)
}

/** Wendet die Entscheidung auf das laufende Spiel an. */
export function waehleOption(c: Career, rng: Rng, optionIndex: number): Career {
  const m = c.match
  if (!m || m.ausgang !== null) return c
  const scene = SCENE_BY_ID[m.szenen[m.index]]
  const option = scene.optionen[optionIndex]
  if (!option) return c

  const gelungen = rng.chance(erfolgschance(c, m, option))
  const e: SceneEffect = gelungen ? option.erfolg : option.misserfolg

  const next: MatchState = {
    ...m,
    ausgang: e.text,
    eigeneTore: m.eigeneTore + (e.eigeneTore ?? 0),
    gegnerTore: m.gegnerTore + (e.gegnerTore ?? 0),
    spielerTore: m.spielerTore + (e.spielerTore ?? 0),
    vorlagen: m.vorlagen + (e.vorlagen ?? 0),
    note: m.note + (e.note ?? 0),
    gelb: m.gelb || !!e.gelb,
    rot: m.rot || !!e.rot,
    verletzt: m.verletzt || !!e.verletzung,
    frueherEnde: m.frueherEnde || !!e.ende || !!e.rot,
    szenenLog: [...m.szenenLog, `${scene.titel}: ${e.text}`],
  }
  return {
    ...c,
    spieler: { ...c.spieler, traits: applyTraits(c.spieler.traits, e.traits) },
    match: next,
  }
}

/** Gesamtnote 1–10 aus Szenen, Gegnerstärke, Ergebnis und Fitness. */
export function berechneNote(c: Career, m: MatchState, tore: number, gegentore: number): number {
  const staerkeMod = clamp((overall(c.spieler) - m.gegnerStaerke) / 25, -0.5, 0.5)
  const ergebnis = tore > gegentore ? 0.3 : tore < gegentore ? -0.3 : 0
  const margin = Math.abs(tore - gegentore) >= 3 ? Math.sign(tore - gegentore) * 0.3 : 0
  const fitness = -Math.max(0, 60 - c.spieler.traits.fitness) / 20
  return Math.round(clamp(6 + staerkeMod + m.note + ergebnis + margin + fitness, 3, 10) * 10) / 10
}
