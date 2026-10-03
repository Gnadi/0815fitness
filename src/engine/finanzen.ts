import { gauss } from './welt'
import type { Rng } from './rng'
import type { Anlage, Career, Depot } from './types'

export const ANLAGEN: readonly Anlage[] = ['tagesgeld', 'etf', 'krypto']

export const ANLAGE_INFO: Record<Anlage, { name: string; text: string; risiko: 'sicher' | 'mittel' | 'riskant' }> = {
  tagesgeld: { name: 'Tagesgeld', text: 'Sicher, ca. 2,5 % Zinsen pro Jahr.', risiko: 'sicher' },
  etf: { name: 'Aktien-ETF', text: 'Ø ca. 7 % pro Jahr, schwankt spürbar.', risiko: 'mittel' },
  krypto: { name: 'Krypto', text: 'Kann sich verdoppeln oder halbieren. Nur mit Spielgeld.', risiko: 'riskant' },
}

/** Jahresrendite (mu) und Schwankung (sigma) je Anlage. */
const MARKT: Record<Anlage, { mu: number; sigma: number; min: number; max: number }> = {
  tagesgeld: { mu: 0.025, sigma: 0, min: 0, max: 1 },
  etf: { mu: 0.07, sigma: 0.16, min: -0.12, max: 0.12 },
  krypto: { mu: 0.12, sigma: 0.75, min: -0.4, max: 0.5 },
}

export const leeresDepot = (): Depot => ({
  tagesgeld: { wert: 0, eingezahlt: 0 },
  etf: { wert: 0, eingezahlt: 0 },
  krypto: { wert: 0, eingezahlt: 0 },
})

export const depotVon = (c: Pick<Career, 'depot'>): Depot => c.depot ?? leeresDepot()

export const depotGesamt = (c: Pick<Career, 'depot'>): number => ANLAGEN.reduce((a, k) => a + depotVon(c)[k].wert, 0)

export const vermoegen = (c: Pick<Career, 'depot' | 'spieler'>): number => c.spieler.geld + depotGesamt(c)

/** Legt `betrag` vom Konto in der Anlage an (begrenzt auf den Kontostand). */
export function einzahlen(c: Career, anlage: Anlage, betrag: number): Career {
  const b = Math.min(Math.floor(betrag), Math.floor(c.spieler.geld))
  if (b <= 0) return c
  const d = depotVon(c)
  const p = d[anlage]
  return {
    ...c,
    spieler: { ...c.spieler, geld: c.spieler.geld - b },
    depot: { ...d, [anlage]: { wert: p.wert + b, eingezahlt: p.eingezahlt + b } },
  }
}

/** Zahlt `betrag` aus der Anlage aufs Konto aus (begrenzt auf den Wert). */
export function auszahlen(c: Career, anlage: Anlage, betrag: number): Career {
  const d = depotVon(c)
  const p = d[anlage]
  const b = Math.min(Math.floor(betrag), Math.floor(p.wert))
  if (b <= 0) return c
  const rest = p.wert - b
  const anteil = p.wert > 0 ? rest / p.wert : 0
  return {
    ...c,
    spieler: { ...c.spieler, geld: c.spieler.geld + b },
    depot: { ...d, [anlage]: { wert: rest, eingezahlt: p.eingezahlt * anteil } },
  }
}

/** Multipliziert den Wert einer Anlage (Ereignisse wie Börsencrash). */
export function skaliere(c: Career, anlage: Anlage | 'alle', faktor: number): Career {
  const d = { ...depotVon(c) }
  for (const k of ANLAGEN) if (anlage === 'alle' || anlage === k) d[k] = { ...d[k], wert: d[k].wert * faktor }
  return { ...c, depot: d }
}

/** Wöchentliche Kursentwicklung aller Anlagen. */
export function marktWoche(c: Career, rng: Rng): Career {
  const d = depotVon(c)
  if (depotGesamt(c) <= 0) return c
  const neu = { ...d }
  for (const k of ANLAGEN) {
    const m = MARKT[k]
    const r = Math.max(m.min, Math.min(m.max, m.mu / 52 + (m.sigma / Math.sqrt(52)) * gauss(rng)))
    neu[k] = { ...d[k], wert: d[k].wert * (1 + r) }
  }
  return { ...c, depot: neu }
}

/** Sparplan: ein Teil des Wochenverdiensts fließt automatisch in den ETF. */
export function sparplan(c: Career, einkommen: number): Career {
  if (c.flags.sparplan !== true || einkommen <= 0) return c
  return einzahlen(c, 'etf', einkommen * 0.3)
}
