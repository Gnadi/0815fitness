import { describe, expect, it } from 'vitest'
import { bestellschluss, lieferSonntag, summen, vergebeneKoerbe } from './logik'

const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

describe('lieferSonntag', () => {
  it('Montag → Sonntag derselben Woche', () => {
    expect(ymd(lieferSonntag(new Date(2026, 10, 16, 9)))).toBe('2026-11-22')
  })
  it('Freitag vor 20:00 → noch dieser Sonntag', () => {
    expect(ymd(lieferSonntag(new Date(2026, 10, 20, 19, 59)))).toBe('2026-11-22')
  })
  it('Freitag ab 20:00 → Sonntag der Woche darauf', () => {
    expect(ymd(lieferSonntag(new Date(2026, 10, 20, 20, 0)))).toBe('2026-11-29')
  })
  it('Samstag → übernächster Sonntag', () => {
    expect(ymd(lieferSonntag(new Date(2026, 10, 21, 8)))).toBe('2026-11-29')
  })
  it('Sonntag → nächster Sonntag', () => {
    expect(ymd(lieferSonntag(new Date(2026, 10, 15, 8)))).toBe('2026-11-22')
  })
  it('Bestellschluss ist Freitag 20:00', () => {
    const s = bestellschluss(new Date(2026, 10, 22))
    expect(s.getDay()).toBe(5)
    expect(s.getHours()).toBe(20)
  })
})

describe('summen', () => {
  it('Liefergebühr unter 20 €', () => {
    expect(summen({ semmel: 4 })).toEqual({ zwischensumme: 2.4, lieferung: 2.5, gesamt: 4.9, stueck: 4 })
  })
  it('gratis ab 20 €', () => {
    expect(summen({ bauernbrot: 2, linzer: 4 }).lieferung).toBe(0)
  })
  it('leerer Korb kostet nichts', () => {
    expect(summen({}).gesamt).toBe(0)
  })
})

describe('vergebeneKoerbe', () => {
  it('steigt im Lauf der Woche und bleibt unter der Kapazität', () => {
    const frueh = vergebeneKoerbe(new Date(2026, 10, 14, 9), 45)
    const spaet = vergebeneKoerbe(new Date(2026, 10, 20, 19), 45)
    expect(frueh).toBeLessThan(spaet)
    expect(spaet).toBeLessThanOrEqual(40)
  })
})
