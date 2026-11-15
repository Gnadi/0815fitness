import { describe, expect, it } from 'vitest'
import { ausgabeNr, kalenderwoche, wochenStand } from './woche'

const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

describe('wochenStand', () => {
  it('Mittwoch: Zettel offen für diesen Sonntag', () => {
    const s = wochenStand(new Date(2026, 10, 18, 12))
    expect(s.phase).toBe('offen')
    expect(ymd(s.bestellSonntag)).toBe('2026-11-22')
  })
  it('Freitag 21:00: Zettel zu, Bestellungen gehen auf die Woche darauf', () => {
    const s = wochenStand(new Date(2026, 10, 20, 21))
    expect(s.phase).toBe('zu')
    expect(ymd(s.dieserSonntag)).toBe('2026-11-22')
    expect(ymd(s.bestellSonntag)).toBe('2026-11-29')
  })
  it('Sonntag: Ofen, Rad, Rückblick', () => {
    expect(wochenStand(new Date(2026, 10, 22, 5)).phase).toBe('ofen')
    expect(wochenStand(new Date(2026, 10, 22, 8, 15)).phase).toBe('rad')
    expect(wochenStand(new Date(2026, 10, 22, 11)).phase).toBe('rueckblick')
  })
})

describe('ausgabeNr', () => {
  it('zählt die Sonntage seit Jahresbeginn', () => {
    expect(ausgabeNr(new Date(2026, 0, 4))).toBe(1)
    expect(ausgabeNr(new Date(2026, 10, 22))).toBe(47)
  })
})

describe('kalenderwoche', () => {
  it('rechnet ISO-Wochen', () => {
    expect(kalenderwoche(new Date(2026, 10, 22))).toBe(47)
    expect(kalenderwoche(new Date(2026, 0, 4))).toBe(1)
    expect(kalenderwoche(new Date(2027, 0, 3))).toBe(53)
  })
})
