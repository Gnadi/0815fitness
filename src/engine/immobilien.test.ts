import { describe, expect, it } from 'vitest'
import { PRIVAT_BY_ID } from '../data/privat'
import { Aktionen } from './aktionen'
import { depotVon, einzahlen, vermoegen } from './finanzen'
import { hatWohnsitz, immoAktiv, immoAngeboteAktualisieren, immoKaufen, immoKaufPruefung, immoNettoWoche, immoSanieren, immoSkalieren, immoTilgen, immoVerkaufen, immoWoche } from './immobilien'
import { createCareer } from './newCareer'
import { privatAktion, privatKuendigen, privatLaufend, privatPassiv, privatPruefung } from './privat'
import { createRng } from './rng'
import { wochenEinkommen } from './wirtschaft'
import type { Career } from './types'

const input = {
  vorname: 'Max', nachname: 'Muster', nationalitaet: 'DE', vereinId: 'DE.hannover-96', position: 'ST' as const,
  fuss: 'rechts' as const, hintergrund: 'arbeiterfamilie' as const, archetyp: 'strassenfussballer' as const, seed: 11,
}
const reich = (geld: number): Career => {
  let c = createCareer(input)
  c = { ...c, spieler: { ...c.spieler, geld }, vertrag: c.vertrag ? { ...c.vertrag, gehalt: 400_000 } : c.vertrag }
  return immoAngeboteAktualisieren(c, createRng(5))
}

describe('Geldanlagen', () => {
  it('ältere Spielstände ohne neue Anlageklassen funktionieren', () => {
    let c = reich(100_000)
    c = { ...c, depot: { tagesgeld: { wert: 10, eingezahlt: 10 }, etf: { wert: 20, eingezahlt: 20 }, krypto: { wert: 5, eingezahlt: 5 } } as never }
    expect(depotVon(c).gold.wert).toBe(0)
    c = einzahlen(c, 'gold', 1_000)
    expect(depotVon(c).gold.wert).toBe(1_000)
    expect(vermoegen(c)).toBeCloseTo(100_000 + 35 - 1_000 + 1_000 - 0, 0)
  })
})

describe('Immobilien', () => {
  it('bietet fünf Objekte, darunter ein Zuhause', () => {
    const c = reich(1_000_000)
    expect(c.immoAngebote).toHaveLength(5)
    expect(c.immoAngebote!.some((a) => ['eigenheim', 'villa'].includes(a.typ))).toBe(true)
  })

  it('Barkauf zieht Preis plus Nebenkosten ab und erhält das Vermögen bis auf die Nebenkosten', () => {
    const c = reich(5_000_000)
    const a = c.immoAngebote!.find((x) => x.typ === 'apartment' || x.typ === 'wohnung' || x.typ === 'mfh') ?? c.immoAngebote![0]
    const vorher = vermoegen(c)
    const r = immoKaufen(c, a.id, false)
    expect(immoAktiv(r.c)).toHaveLength(1)
    expect(r.c.spieler.geld).toBeCloseTo(c.spieler.geld - a.preis * 1.06, 0)
    expect(vermoegen(r.c)).toBeCloseTo(vorher - a.preis * 0.06, 0)
  })

  it('Finanzierung verlangt Eigenkapital und Bonität', () => {
    const arm = reich(1_000)
    const a = arm.immoAngebote![0]
    expect(immoKaufPruefung(arm, a, true)).toMatch(/Eigenkapital/)
    expect(immoKaufen(arm, a.id, false).c).toBe(arm)
    const c = reich(2_000_000)
    const r = immoKaufen(c, a.id, true)
    const i = immoAktiv(r.c)[0]
    expect(i.kredit).toBeCloseTo(a.preis * 0.8, -1)
    expect(immoTilgen(r.c, i.id).c.immobilien![0].kredit).toBeLessThan(i.kredit)
  })

  it('nur ein Zuhause gleichzeitig; Verkauf gibt Erlös nach Kosten', () => {
    let c = reich(20_000_000)
    const heim = c.immoAngebote!.find((x) => x.typ === 'eigenheim' || x.typ === 'villa')!
    c = immoKaufen(c, heim.id, false).c
    expect(hatWohnsitz(c)).toBe(true)
    c = { ...c, immoAngebote: [{ ...heim, id: 'zweites' }] }
    expect(immoKaufPruefung(c, c.immoAngebote![0], false)).toMatch(/Zuhause/)
    const geld = c.spieler.geld
    const v = immoVerkaufen(c, heim.id)
    expect(v.c.spieler.geld).toBeCloseTo(geld + heim.preis * 0.94, 0)
    expect(immoAktiv(v.c)).toHaveLength(0)
  })

  it('Wochenentwicklung und Zahlungsstrom', () => {
    let c = reich(5_000_000)
    const a = c.immoAngebote!.find((x) => x.typ === 'mfh' || x.typ === 'wohnung' || x.typ === 'apartment')
    if (!a) return
    c = immoKaufen(c, a.id, true).c
    const netto = immoNettoWoche(c)
    expect(Number.isFinite(netto)).toBe(true)
    const rng = createRng(2)
    const kredit0 = c.immobilien![0].kredit
    for (let w = 0; w < 52; w++) c = immoWoche(c, rng).c
    expect(c.immobilien![0].kredit).toBeLessThan(kredit0)
    expect(c.immobilien![0].wert).toBeGreaterThan(0)
    expect(immoSkalieren(c, 0.5).immobilien![0].wert).toBeCloseTo(c.immobilien![0].wert * 0.5)
  })

  it('Modernisierung steigert Wert und Miete einmal pro Jahr', () => {
    let c = reich(5_000_000)
    const a = c.immoAngebote!.find((x) => x.miete > 0)!
    c = immoKaufen(c, a.id, false).c
    const w = c.immobilien![0].wert
    const r = immoSanieren(c, a.id)
    expect(r.c.immobilien![0].wert).toBeCloseTo(w * 1.09)
    expect(immoSanieren(r.c, a.id).c).toBe(r.c)
  })

  it('Immobilien-Cashflow erscheint im Wocheneinkommen', () => {
    const c = reich(5_000_000)
    const a = c.immoAngebote!.find((x) => x.miete > 0)!
    const mit = immoKaufen(c, a.id, false).c
    expect(wochenEinkommen(mit)).not.toBe(wochenEinkommen(c))
  })
})

describe('Privatleben', () => {
  it('Aktivitäten kosten Geld, wirken und haben Wartezeit', () => {
    const c = reich(10_000)
    const r = privatAktion(c, 'freunde')
    expect(r.c.spieler.geld).toBe(9_800)
    expect(privatPruefung(r.c, PRIVAT_BY_ID.freunde)).toMatch(/Wieder möglich/)
    expect(privatAktion(r.c, 'freunde').c).toBe(r.c)
  })

  it('braucht Partner bzw. Kinder', () => {
    const c = { ...reich(10_000), personen: { ...reich(1).personen, partner: null } }
    expect(privatAktion(c, 'date').c).toBe(c)
    expect(privatAktion({ ...c, personen: { ...c.personen, partner: 'Anna' } }, 'date').c.spieler.geld).toBe(9_850)
    expect(privatAktion(c, 'familie-ausflug').c).toBe(c)
  })

  it('Besitz wirkt wöchentlich, kostet laufend und lässt sich kündigen; Autos ersetzen sich', () => {
    let c = reich(2_000_000)
    expect(privatLaufend(c)).toBe(0)
    c = privatAktion(c, 'hund').c
    expect(privatLaufend(c)).toBe(1_500)
    expect(privatPassiv(c).privatglueck).toBeGreaterThan(0)
    expect(privatAktion(c, 'hund').c).toBe(c)
    c = privatAktion(c, 'auto-sport').c
    const nachSport = c.spieler.geld
    c = privatAktion(c, 'auto-luxus').c
    expect(Object.keys(c.privat!.besitz).filter((k) => k.startsWith('auto'))).toEqual(['auto-luxus'])
    expect(c.spieler.geld).toBe(nachSport - 400_000 + 65_000)
    c = privatKuendigen(c, 'hund').c
    expect(privatLaufend(c)).toBe(20_000)
  })

  it('Mietwohnung ruht, sobald man ein Eigenheim besitzt', () => {
    let c = reich(30_000_000)
    c = privatAktion(c, 'miete-schick').c
    expect(privatLaufend(c)).toBe(18_000)
    const heim = c.immoAngebote!.find((x) => x.typ === 'eigenheim' || x.typ === 'villa')!
    c = immoKaufen(c, heim.id, false).c
    expect(privatLaufend(c)).toBe(0)
  })

  it('Aktionen über das Aktionen-Objekt erreichbar', () => {
    const c = reich(500_000)
    expect(Aktionen.privat(c, 'konzert').c.spieler.geld).toBe(499_500)
  })
})
