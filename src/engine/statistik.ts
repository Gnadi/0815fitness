import type { Career, SeasonStats } from './types'

export interface Gesamt {
  spiele: number
  startelf: number
  minuten: number
  tore: number
  vorlagen: number
  siege: number
  remis: number
  niederlagen: number
  gelb: number
  rot: number
  saisons: number
  vereine: number
  schnitt: number
}

/** Alle abgeschlossenen Saison-Abschnitte plus die laufende Saison. */
export function alleStats(c: Career): SeasonStats[] {
  return [...c.historie, c.saisonStats]
}

export function gesamtStats(c: Career): Gesamt {
  const alle = alleStats(c)
  const sum = (f: (s: SeasonStats) => number) => alle.reduce((a, s) => a + f(s), 0)
  const spiele = sum((s) => s.spiele)
  return {
    spiele,
    startelf: sum((s) => s.startelf),
    minuten: sum((s) => s.minuten),
    tore: sum((s) => s.tore),
    vorlagen: sum((s) => s.vorlagen),
    siege: sum((s) => s.siege),
    remis: sum((s) => s.remis),
    niederlagen: sum((s) => s.niederlagen),
    gelb: sum((s) => s.gelb),
    rot: sum((s) => s.rot),
    saisons: new Set(alle.map((s) => s.saison)).size,
    vereine: new Set(alle.filter((s) => s.spiele > 0 || s.vereinId).map((s) => s.vereinId)).size,
    schnitt: spiele ? sum((s) => s.notenSumme) / spiele : 0,
  }
}
