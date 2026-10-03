import { describe, expect, it } from 'vitest'
import { createCareer } from './newCareer'
import { Aktionen } from './aktionen'
import { ANLAGEN, auszahlen, depotGesamt, depotVon, einzahlen, marktWoche, skaliere, sparplan, vermoegen } from './finanzen'
import { wendeEffekteAn } from './ereignisse'
import { createRng } from './rng'
import { spieleSaisons } from './sim'
import type { Career } from './types'

const input = {
  vorname: 'Max', nachname: 'Muster', nationalitaet: 'DE', vereinId: 'DE.hannover-96', position: 'ST' as const,
  fuss: 'rechts' as const, hintergrund: 'arbeiterfamilie' as const, archetyp: 'strassenfussballer' as const, seed: 7,
}
const mitGeld = (geld: number): Career => {
  const c = createCareer(input)
  return { ...c, spieler: { ...c.spieler, geld } }
}

describe('Finanzen', () => {
  it('Ein- und Auszahlen erhält das Gesamtvermögen', () => {
    let c = mitGeld(10_000)
    c = einzahlen(c, 'etf', 4_000)
    expect(c.spieler.geld).toBe(6_000)
    expect(depotVon(c).etf.wert).toBe(4_000)
    expect(vermoegen(c)).toBe(10_000)
    c = auszahlen(c, 'etf', 1_000)
    expect(c.spieler.geld).toBe(7_000)
    expect(depotVon(c).etf.eingezahlt).toBeCloseTo(3_000)
    // mehr als vorhanden geht nicht
    expect(einzahlen(c, 'krypto', 1e9).spieler.geld).toBe(0)
    expect(auszahlen(c, 'tagesgeld', 100)).toBe(c)
  })

  it('Der Markt bewegt Anlagen, Tagesgeld steigt immer', () => {
    let c = einzahlen(einzahlen(mitGeld(30_000), 'tagesgeld', 10_000), 'krypto', 10_000)
    const rng = createRng(3)
    let vorher = depotVon(c).tagesgeld.wert
    let kryptoSchwankt = false
    for (let i = 0; i < 60; i++) {
      const k = depotVon(c).krypto.wert
      c = marktWoche(c, rng)
      expect(depotVon(c).tagesgeld.wert).toBeGreaterThanOrEqual(vorher)
      vorher = depotVon(c).tagesgeld.wert
      if (Math.abs(depotVon(c).krypto.wert - k) / k > 0.05) kryptoSchwankt = true
    }
    expect(kryptoSchwankt).toBe(true)
    expect(marktWoche(mitGeld(5_000), rng).depot).toBeUndefined() // leeres Depot bleibt unberührt
  })

  it('Sparplan investiert nur bei aktivem Flag und positivem Einkommen', () => {
    const c = mitGeld(1_000)
    expect(sparplan(c, 500)).toBe(c)
    const an = { ...c, flags: { ...c.flags, sparplan: true } }
    expect(depotVon(sparplan(an, 500)).etf.wert).toBeCloseTo(150, 0)
    expect(sparplan(an, -50)).toBe(an)
  })

  it('Ereignis-Effekte verändern das Depot', () => {
    const rng = createRng(1)
    let c = mitGeld(10_000)
    c = wendeEffekteAn(c, [{ t: 'invest', anlage: 'etf', anteil: 0.5 }], rng).c
    expect(depotVon(c).etf.wert).toBe(5_000)
    const r = wendeEffekteAn(c, [{ t: 'depot', anlage: 'alle', faktor: 0.8 }], rng)
    expect(depotVon(r.c).etf.wert).toBeCloseTo(4_000)
    expect(r.wirkung.some((w) => w.startsWith('Depot −'))).toBe(true)
    c = wendeEffekteAn(r.c, [{ t: 'abheben', anlage: 'alle', anteil: 1 }], rng).c
    expect(depotGesamt(c)).toBe(0)
    expect(c.spieler.geld).toBeCloseTo(9_000, -1)
    expect(skaliere(c, 'etf', 2)).toBeDefined()
  })

  it('Aktionen laufen über den Spielstand und ältere Spielstände ohne Depot funktionieren', () => {
    let c = mitGeld(8_000)
    expect(c.depot).toBeUndefined()
    c = Aktionen.einzahlen(c, 'tagesgeld', 0.5)
    expect(depotVon(c).tagesgeld.wert).toBe(4_000)
    c = Aktionen.auszahlen(c, 'tagesgeld', 1)
    expect(depotGesamt(c)).toBe(0)
    c = Aktionen.sparplan(c, true)
    expect(c.flags.sparplan).toBe(true)
    for (const a of ANLAGEN) expect(depotVon(c)[a].wert).toBeGreaterThanOrEqual(0)
  })

  it('Eine Karriere mit Sparplan baut über die Jahre ein Depot auf', () => {
    let c = createCareer(input)
    c = { ...c, flags: { ...c.flags, sparplan: true } }
    c = spieleSaisons(c, 5)
    expect(depotVon(c).etf.wert).toBeGreaterThan(0)
  })
})
