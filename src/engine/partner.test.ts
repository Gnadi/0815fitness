import { describe, expect, it } from 'vitest'
import { createCareer } from './newCareer'
import { fuelleText, wendeEffekteAn } from './ereignisse'
import { createRng } from './rng'
import { ALLE_EREIGNISSE } from '../data/events'
import type { Career } from './types'

const input = {
  vorname: 'Max', nachname: 'Muster', nationalitaet: 'DE', vereinId: 'DE.hannover-96', position: 'ST' as const,
  fuss: 'rechts' as const, hintergrund: 'arbeiterfamilie' as const, archetyp: 'strassenfussballer' as const, seed: 7,
}
const mitPartner = (g: 'w' | 'm'): Career => {
  const c = createCareer(input)
  return { ...c, personen: { ...c.personen, partner: 'Test Person', partnerGeschlecht: g } }
}

describe('Partner', () => {
  it('Pronomen passen zum Geschlecht', () => {
    const t = '{Sie} sagt, dass {sie} {ihr} {ihre} Zeit gibt.'
    expect(fuelleText(mitPartner('w'), t)).toBe('Sie sagt, dass sie ihr ihre Zeit gibt.')
    expect(fuelleText(mitPartner('m'), t)).toBe('Er sagt, dass er ihm seine Zeit gibt.')
  })

  it('partner-neu würfelt beide Geschlechter mit passendem Namen, partner-ende räumt auf', () => {
    const gesehen = new Set<string>()
    for (let seed = 1; seed < 40; seed++) {
      const { c } = wendeEffekteAn(createCareer(input), [{ t: 'aktion', name: 'partner-neu' }], createRng(seed))
      expect(c.personen.partner).toBeTruthy()
      expect(['w', 'm']).toContain(c.personen.partnerGeschlecht)
      gesehen.add(c.personen.partnerGeschlecht!)
      const ende = wendeEffekteAn(c, [{ t: 'aktion', name: 'partner-ende' }], createRng(seed)).c
      expect(ende.personen.partner).toBeNull()
      expect(ende.personen.partnerGeschlecht).toBeUndefined()
    }
    expect(gesehen.size).toBe(2)
  })

  it('Ereignistexte enthalten keine festen Geschlechtsangaben zur Partnerperson', () => {
    const verboten = /\b(Frau|Mädchen|Freundin|Klassenkameradin|Schwangerschaftstest)\b/
    const c = mitPartner('m')
    for (const e of ALLE_EREIGNISSE) {
      if (e.id === 'p-baby') continue
      const texte = [fuelleText(c, e.titel), fuelleText(c, e.text)]
      for (const o of e.optionen) for (const r of [o.erfolg, o.misserfolg]) if (r) texte.push(fuelleText(c, r.text))
      for (const t of texte) expect(t, e.id).not.toMatch(verboten)
    }
    // Baby: Adoption bei männlicher Partnerperson, Schwangerschaft sonst
    const baby = ALLE_EREIGNISSE.find((e) => e.id === 'p-baby')!
    expect(fuelleText(mitPartner('m'), baby.text)).toMatch(/Adoption/)
    expect(fuelleText(mitPartner('w'), baby.text)).toMatch(/Schwangerschaftstest/)
  })
})
