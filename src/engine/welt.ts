import { LAENDER, LIGA_START, LIGEN, VEREINE, ligaIds } from '../data/clubs'
import { clamp } from './rating'
import type { Rng } from './rng'
import type { EuropaWettbewerb, Saison, Welt, Zeile } from './types'

/** Näherung einer Normalverteilung (Summe dreier Gleichverteilungen), Mittelwert 0, σ ≈ 1. */
export const gauss = (rng: Rng): number => (rng.next() + rng.next() + rng.next() - 1.5) * 2

export function ligaVonVerein(welt: Welt, vereinId: string): string | null {
  for (const [id, ms] of Object.entries(welt.ligen)) if (ms.includes(vereinId)) return id
  return null
}

export function createWelt(): Welt {
  const welt: Welt = {
    staerke: Object.fromEntries(Object.values(VEREINE).map((v) => [v.id, v.basis])),
    ligen: Object.fromEntries(Object.entries(LIGA_START).map(([k, v]) => [k, [...v]])),
    europa: { CL: [], EL: [], ECL: [] },
    meister: {},
  }
  const platz: Record<string, string[]> = {}
  for (const l of Object.keys(LAENDER)) {
    const id = `${l}1`
    platz[id] = [...welt.ligen[id]].sort((a, b) => welt.staerke[b] - welt.staerke[a])
  }
  welt.europa = europaTeilnehmer(platz)
  return welt
}

/** Europapokal-Teilnehmer aus den Rangfolgen der 1. Ligen (Schlüssel `${land}1`). */
export function europaTeilnehmer(rangfolgen: Record<string, string[]>): Welt['europa'] {
  const out: Welt['europa'] = { CL: [], EL: [], ECL: [] }
  for (const [land, daten] of Object.entries(LAENDER)) {
    if (daten.gesperrt) continue
    const rang = rangfolgen[`${land}1`] ?? []
    let i = 0
    const keys: EuropaWettbewerb[] = ['CL', 'EL', 'ECL']
    daten.europa.forEach((n, k) => {
      for (let j = 0; j < n && i < rang.length; j++) out[keys[k]].push(rang[i++])
    })
  }
  return out
}

// ---------------------------------------------------------------- Spielplan & Tabelle

/** Anzahl Runden (Hin-/Rückrunden), abhängig von der Ligagröße. */
export const rundenFuer = (n: number) => (n >= 14 ? 2 : n >= 10 ? 3 : 4)

/** Kreismethode: Spielplan für n Teams, mehrere Runden, Heimrecht wechselt je Runde. */
export function erzeugeSpielplan(n: number, rng: Rng): [number, number][][] {
  const teams = Array.from({ length: n + (n % 2) }, (_, i) => i) // ungerade: Freilos = Index n
  const m = teams.length
  const runde1: [number, number][][] = []
  const rot = [...teams]
  for (let r = 0; r < m - 1; r++) {
    const tag: [number, number][] = []
    for (let i = 0; i < m / 2; i++) {
      const a = rot[i]
      const b = rot[m - 1 - i]
      if (a >= n || b >= n) continue
      tag.push(r % 2 === 0 ? [a, b] : [b, a])
    }
    runde1.push(tag)
    rot.splice(1, 0, rot.pop()!)
  }
  const out: [number, number][][] = []
  const runden = rundenFuer(n)
  for (let k = 0; k < runden; k++) {
    const tage = k === 0 ? runde1 : shuffle(runde1, rng)
    for (const tag of tage) out.push(k % 2 === 0 ? tag.map(([a, b]) => [a, b]) : tag.map(([a, b]) => [b, a]))
  }
  return out
}

function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const leereZeile = (): Zeile => [0, 0, 0, 0, 0, 0]

export const punkte = (z: Zeile) => z[1] * 3 + z[2]

export function poisson(rng: Rng, lambda: number): number {
  const limit = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= rng.next()
  } while (p > limit)
  return k - 1
}

/** Torerwartung beider Teams aus Stärken, `heimvorteil` in Stärkepunkten. */
export function simuliereTore(staerkeHeim: number, staerkeAuswaerts: number, rng: Rng, heimvorteil = 2): [number, number] {
  const diff = staerkeHeim - staerkeAuswaerts + heimvorteil
  return [poisson(rng, 1.2 * Math.exp(diff / 35)), poisson(rng, 1.1 * Math.exp(-diff / 35))]
}

export function tabelleEintragen(tabelle: Record<string, Zeile>, heim: string, auswaerts: string, th: number, ta: number): void {
  const h = (tabelle[heim] ??= leereZeile())
  const a = (tabelle[auswaerts] ??= leereZeile())
  h[0]++; a[0]++
  h[4] += th; h[5] += ta; a[4] += ta; a[5] += th
  if (th > ta) { h[1]++; a[3]++ } else if (th < ta) { h[3]++; a[1]++ } else { h[2]++; a[2]++ }
}

export interface Rang {
  id: string
  zeile: Zeile
  pkt: number
}

export function rangliste(tabelle: Record<string, Zeile>, teams?: readonly string[]): Rang[] {
  const ids = teams ?? Object.keys(tabelle)
  return ids
    .map((id) => {
      const zeile = tabelle[id] ?? leereZeile()
      return { id, zeile, pkt: punkte(zeile) }
    })
    .sort((a, b) =>
      b.pkt - a.pkt || b.zeile[4] - b.zeile[5] - (a.zeile[4] - a.zeile[5]) || b.zeile[4] - a.zeile[4] || a.id.localeCompare(b.id),
    )
}

export const jugendAbzug = (jugend: boolean) => (jugend ? 12 : 0)

/** Simuliert einen Spieltag (ohne den Verein `ausser`). */
export function simuliereSpieltag(s: Saison, welt: Welt, tag: number, rng: Rng, ausser?: string): void {
  const paarungen = s.spielplan[tag - 1]
  if (!paarungen) return
  for (const [i, j] of paarungen) {
    const h = s.teams[i]
    const a = s.teams[j]
    if (h === ausser || a === ausser) continue
    const [th, ta] = simuliereTore(welt.staerke[h], welt.staerke[a], rng)
    tabelleEintragen(s.tabelle, h, a, th, ta)
  }
}

/** Spielplan und Tabelle für eine Liga in einer neuen Saison. */
export function neueLigaSaison(welt: Welt, ligaId: string, rng: Rng): Pick<Saison, 'teams' | 'spielplan' | 'tabelle'> {
  const teams = shuffle(welt.ligen[ligaId], rng)
  return {
    teams,
    spielplan: erzeugeSpielplan(teams.length, rng),
    tabelle: Object.fromEntries(teams.map((t) => [t, leereZeile()])),
  }
}

/** Simuliert eine komplette Saison einer Liga und gibt die Rangfolge zurück. */
export function simuliereLiga(welt: Welt, ligaId: string, rng: Rng): Rang[] {
  const teams = welt.ligen[ligaId]
  const plan = erzeugeSpielplan(teams.length, rng)
  const tabelle: Record<string, Zeile> = Object.fromEntries(teams.map((t) => [t, leereZeile()]))
  for (const tag of plan) {
    for (const [i, j] of tag) {
      const [th, ta] = simuliereTore(welt.staerke[teams[i]], welt.staerke[teams[j]], rng)
      tabelleEintragen(tabelle, teams[i], teams[j], th, ta)
    }
  }
  return rangliste(tabelle, teams)
}

export interface SaisonAbschluss {
  rangfolgen: Record<string, Rang[]>
  aufsteiger: string[]
  absteiger: string[]
}

/**
 * Schließt die Saison der ganzen Welt ab: Ligen simulieren (die Spieler-Liga mit echter Tabelle),
 * Auf- und Abstieg, Entwicklung der Vereinsstärke, Meister, Europapokal-Teilnehmer.
 */
export function schliesseWeltAb(welt: Welt, saison: number, spielerLiga: { id: string; rang: Rang[] } | null, rng: Rng): SaisonAbschluss {
  const rangfolgen: Record<string, Rang[]> = {}
  for (const id of Object.keys(LIGEN)) {
    rangfolgen[id] = spielerLiga && spielerLiga.id === id ? spielerLiga.rang : simuliereLiga(welt, id, rng)
  }

  const aufsteiger: string[] = []
  const absteiger: string[] = []
  for (const land of Object.keys(LAENDER)) {
    const ids = ligaIds(land)
    // Neue Mitgliedschaften gleichzeitig berechnen, damit sich Wechsel nicht gegenseitig beeinflussen.
    const neu: Record<string, string[]> = Object.fromEntries(ids.map((id) => [id, rangfolgen[id].map((r) => r.id)]))
    for (let t = 0; t < ids.length - 1; t++) {
      const k = Math.min(LIGEN[ids[t]].ab, neu[ids[t]].length, neu[ids[t + 1]].length)
      if (k <= 0) continue
      const unten = neu[ids[t]].splice(neu[ids[t]].length - k, k)
      const oben = neu[ids[t + 1]].splice(0, k)
      neu[ids[t]].push(...oben)
      neu[ids[t + 1]].unshift(...unten)
      absteiger.push(...unten)
      aufsteiger.push(...oben)
    }
    for (const id of ids) welt.ligen[id] = neu[id]
  }

  // Meister und Stärkeentwicklung
  for (const id of Object.keys(LIGEN)) {
    const rang = rangfolgen[id]
    if (LIGEN[id].ebene === 1) welt.meister[`${saison}.${id}`] = rang[0].id
    rang.forEach((r, i) => {
      const v = VEREINE[r.id]
      const anteil = rang.length > 1 ? i / (rang.length - 1) : 0.5
      const bonus = (0.5 - anteil) * 1.2
      welt.staerke[r.id] = clamp(0.65 * welt.staerke[r.id] + 0.35 * v.basis + gauss(rng) * 1.5 + bonus, 15, 97)
    })
  }

  const erste: Record<string, string[]> = {}
  for (const land of Object.keys(LAENDER)) erste[`${land}1`] = rangfolgen[`${land}1`].map((r) => r.id)
  welt.europa = europaTeilnehmer(erste)
  return { rangfolgen, aufsteiger, absteiger }
}
