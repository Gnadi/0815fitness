import { LAENDER } from '../data/clubs'
import type { EuropaWettbewerb, Slot } from './types'

export function pokalRunden(land: string): number {
  const n = LAENDER[land].ligen.reduce((a, l) => a + l.vereine.length, 0)
  return n >= 40 ? 5 : n >= 20 ? 4 : 3
}

export const POKAL_NAMEN: Record<number, string[]> = {
  3: ['Viertelfinale', 'Halbfinale', 'Finale'],
  4: ['2. Runde', 'Viertelfinale', 'Halbfinale', 'Finale'],
  5: ['1. Runde', '2. Runde', 'Viertelfinale', 'Halbfinale', 'Finale'],
}

export const EUROPA_NAMEN: Record<EuropaWettbewerb, string> = {
  CL: 'Champions League',
  EL: 'Europa League',
  ECL: 'Conference League',
}

/** Turnier am Ende der Saison, die im geraden Folgejahr endet: EM (durch 4 teilbar) bzw. WM. */
export function turnierName(saison: number): string | null {
  const jahr = saison + 1
  if (jahr % 2 !== 0) return null
  return jahr % 4 === 0 ? `EM ${jahr}` : `WM ${jahr}`
}

interface Option {
  spieltage: number
  pokalRunden: number
  europa: EuropaWettbewerb | null
  turnier: boolean
  jugend: boolean
}

/**
 * Baut den Wochenkalender: Ligaspieltage mit eingestreuten Pokal- und Europapokal-Wochen,
 * Winterfenster in der Mitte, dann ggf. Turnier und das Sommerfenster.
 */
export function baueKalender(o: Option): Slot[] {
  const n = o.spieltage
  const items: { pos: number; slot: Slot }[] = []
  for (let i = 1; i <= n; i++) items.push({ pos: i, slot: { t: 'L', n: i } })

  if (!o.jugend) {
    for (let r = 1; r <= o.pokalRunden; r++) items.push({ pos: (n * r) / (o.pokalRunden + 1) + 0.4, slot: { t: 'P', n: r } })
    if (o.europa) {
      for (let j = 0; j < 8; j++) items.push({ pos: n * (0.06 + 0.075 * j) + 0.6, slot: { t: 'E', n: j + 1 } })
      const ko = [0.66, 0.74, 0.82, 0.9, 0.97]
      ko.forEach((f, j) => items.push({ pos: n * f + 0.6, slot: { t: 'E', n: 9 + j } }))
    }
  }
  items.push({ pos: n / 2 + 0.2, slot: { t: 'F', fenster: 'winter', erste: true } })
  items.push({ pos: n / 2 + 0.3, slot: { t: 'F', fenster: 'winter', letzte: true } })
  items.sort((a, b) => a.pos - b.pos)
  const slots = items.map((i) => i.slot)

  if (o.turnier) for (let i = 1; i <= 7; i++) slots.push({ t: 'T', n: i })
  slots.push({ t: 'F', fenster: 'sommer', erste: true })
  slots.push({ t: 'F', fenster: 'sommer' })
  slots.push({ t: 'F', fenster: 'sommer' })
  slots.push({ t: 'F', fenster: 'sommer', letzte: true })
  return slots
}

export function slotText(s: Slot): string {
  switch (s.t) {
    case 'L': return `Spieltag ${s.n}`
    case 'P': return 'Pokal'
    case 'E': return 'Europapokal'
    case 'T': return 'Turnier'
    case 'F': return s.fenster === 'winter' ? 'Winterpause' : 'Sommerpause'
  }
}
