import { describe, expect, it } from 'vitest'
import { createCareer } from './newCareer'
import { Aktionen } from './aktionen'
import { ANLAGEN, PHASEN, VC_PHASEN, vcZiel, auszahlen, beteiligungenVon, dealsAktualisieren, depotGesamt, depotVon, einzahlen, marktWoche, neuerDeal, skaliere, sparplan, sparplanProzent, vcAktiv, vcAufstocken, vcBuchwert, vcEinsteigen, vcVerkaufen, vcWoche, vermoegen } from './finanzen'
import { fuelleText, wendeEffekteAn } from './ereignisse'
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
    // Sparrate einstellbar (5–100 %)
    const hoch = Aktionen.sparplanProzent(an, 100)
    expect(depotVon(sparplan(hoch, 500)).etf.wert).toBeCloseTo(500, 0)
    expect(sparplanProzent(Aktionen.sparplanProzent(an, 250))).toBe(100)
    expect(sparplanProzent(Aktionen.sparplanProzent(an, 0))).toBe(5)
    expect(sparplanProzent(an)).toBe(30)
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

describe('Venture Capital', () => {
  it('Einstieg bindet Geld, Zweitmarkt zahlt 60 %, Aufstocken erhöht den Einsatz', () => {
    const rng = createRng(2)
    let c = mitGeld(20_000)
    c = vcEinsteigen(c, neuerDeal(rng), 5_000)
    expect(c.spieler.geld).toBe(15_000)
    expect(vcAktiv(c)).toHaveLength(1)
    expect(vermoegen(c)).toBe(20_000)
    const id = vcAktiv(c)[0].id
    c = vcAufstocken(c, id, 1_000)
    expect(vcAktiv(c)[0].eingezahlt).toBe(6_000)
    c = vcVerkaufen(c, id)
    expect(c.spieler.geld).toBe(14_000 + 3_600)
    expect(vcAktiv(c)).toHaveLength(0)
    expect(beteiligungenVon(c)[0].status).toBe('verkauft')
    expect(vcEinsteigen(mitGeld(0), neuerDeal(rng), 1_000).beteiligungen).toBeUndefined()
  })

  it('Ergebnisse sind realistisch: etwa die Hälfte scheitert, der Schnitt liegt über dem Einsatz', () => {
    const rng = createRng(11)
    let pleite = 0
    let wert = 0
    const n = 300
    for (let i = 0; i < n; i++) {
      let c = mitGeld(10_000)
      c = vcEinsteigen(c, neuerDeal(rng), 10_000)
      for (let w = 0; w < 6 * 52; w++) {
        c = { ...c, wochenGesamt: c.wochenGesamt + 1 }
        c = vcWoche(c, rng).c
      }
      const b = beteiligungenVon(c)[0]
      if (b.status === 'pleite') pleite++
      wert += b.status === 'exit' ? b.wert : vcBuchwert(c)
      if (b.status === 'exit') expect(c.spieler.geld).toBe(b.wert)
    }
    expect(pleite / n).toBeGreaterThan(0.3)
    expect(pleite / n).toBeLessThan(0.65)
    expect(wert / (n * 10_000)).toBeGreaterThan(1.2)
    expect(wert / (n * 10_000)).toBeLessThan(3.5)
  })

  it('Deals gibt es erst ab 5.000 € und werden alle 13 Wochen erneuert', () => {
    const rng = createRng(4)
    expect(dealsAktualisieren(mitGeld(1_000), rng).deals).toBeUndefined()
    const c = dealsAktualisieren(mitGeld(9_000), rng)
    expect(c.deals).toHaveLength(3)
    expect(dealsAktualisieren({ ...c, wochenGesamt: 14 }, rng).deals).toBe(c.deals)
    expect(dealsAktualisieren({ ...c, wochenGesamt: 26 }, rng).deals).not.toBe(c.deals)
  })

  it('Ereignis-Effekte und Aktionen legen Beteiligungen an', () => {
    const rng = createRng(1)
    let c = mitGeld(10_000)
    c = wendeEffekteAn(c, [{ t: 'vcEinstieg', anteil: 0.5 }], rng).c
    expect(vcAktiv(c)[0].eingezahlt).toBe(5_000)
    c = wendeEffekteAn(c, [{ t: 'vcAufstocken', anteil: 0.5 }], rng).c
    expect(vcAktiv(c)[0].eingezahlt).toBe(7_500)
    const mitDeals = Aktionen.einzahlen(dealsAktualisieren(mitGeld(10_000), rng), 'etf', 0)
    const deal = mitDeals.deals![0]
    const eingestiegen = Aktionen.vcEinsteigen(mitDeals, deal.id, 0.1)
    expect(vcAktiv(eingestiegen)[0].name).toBe(deal.name)
    expect(eingestiegen.deals).toHaveLength(2)
  })
  describe('Series und Investoren-Entscheidungen', () => {
    it('Höhere Runden sind sicherer und haben weniger Hebel', () => {
      const rng = createRng(21)
      const stat = (phase: (typeof VC_PHASEN)[number]) => {
        let pleite = 0
        let wert = 0
        const n = 250
        for (let i = 0; i < n; i++) {
          let c = mitGeld(1_000_000)
          c = vcEinsteigen(c, neuerDeal(rng, false, phase), 1_000_000)
          for (let w = 0; w < 6 * 52; w++) {
            c = { ...c, wochenGesamt: c.wochenGesamt + 1 }
            c = vcWoche(c, rng).c
          }
          const b = beteiligungenVon(c)[0]
          if (b.status === 'pleite') pleite++
          wert += b.status === 'exit' ? b.wert : vcBuchwert(c)
        }
        return { pleite: pleite / n, ev: wert / (n * 1_000_000) }
      }
      const s = VC_PHASEN.map(stat)
      for (let i = 1; i < s.length; i++) {
        expect(s[i].pleite).toBeLessThan(s[i - 1].pleite)
        expect(s[i].ev).toBeLessThan(s[i - 1].ev)
      }
      expect(s[3].ev).toBeGreaterThan(0.95)
    })

    it('Deals höherer Runden gibt es nur mit genug Geld, Mindestticket wird erzwungen', () => {
      const rng = createRng(5)
      expect(dealsAktualisieren(mitGeld(30_000), rng).deals!.map((d) => d.phase ?? 'Seed')).toEqual(['Seed', 'Seed', 'Seed', 'Serie A'])
      const reich = dealsAktualisieren(mitGeld(2_000_000), rng)
      expect(reich.deals!.map((d) => d.phase)).toEqual(['Seed', 'Seed', 'Seed', 'Serie A', 'Serie B', 'Serie C'])
      const serieC = reich.deals!.find((d) => d.phase === 'Serie C')!
      expect(Aktionen.vcEinsteigen(mitGeld(150_000), serieC.id, 0.5).beteiligungen).toBeUndefined()
      const ok = Aktionen.vcEinsteigen({ ...reich, spieler: { ...reich.spieler, geld: 400_000 } }, serieC.id, 0.5)
      expect(vcAktiv(ok)[0]).toMatchObject({ phase: 'Serie C', eingezahlt: 200_000 })
      expect(PHASEN['Serie C'].minTicket).toBe(100_000)
    })

    it('Investoren-Effekte wirken auf das Start-up, auch Aufstocken per Aktion', () => {
      const rng = createRng(2)
      let c = vcEinsteigen(mitGeld(20_000), neuerDeal(rng), 10_000)
      const ziel = vcZiel(c)!
      c = wendeEffekteAn(c, [{ t: 'vcWert', faktor: 1.5 }], rng).c
      expect(vcAktiv(c)[0].wert).toBe(15_000)
      c = wendeEffekteAn(c, [{ t: 'vcRunde', faktor: 2 }], rng).c
      expect(vcAktiv(c)[0]).toMatchObject({ wert: 30_000, phase: 'Serie A' })
      expect(fuelleText(c, '{startup} {runde}')).toBe(`${ziel.name} Serie A`)
      c = Aktionen.vcAufstocken(c, ziel.id, 0.5)
      expect(vcAktiv(c)[0].eingezahlt).toBe(15_000)
      const geldVorher = c.spieler.geld
      c = wendeEffekteAn(c, [{ t: 'vcExit', faktor: 1.4 }], rng).c
      expect(vcAktiv(c)).toHaveLength(0)
      expect(c.spieler.geld).toBe(geldVorher + Math.round(35_000 * 1.4))
      expect(beteiligungenVon(c)[0].status).toBe('exit')
      const pleite = wendeEffekteAn(vcEinsteigen(mitGeld(5_000), neuerDeal(rng), 5_000), [{ t: 'vcPleite' }], rng).c
      expect(beteiligungenVon(pleite)[0]).toMatchObject({ status: 'pleite', wert: 0 })
      // ohne Start-up passiert nichts
      expect(wendeEffekteAn(mitGeld(5_000), [{ t: 'vcExit', faktor: 2 }], rng).c.spieler.geld).toBe(5_000)
    })
  })
})
