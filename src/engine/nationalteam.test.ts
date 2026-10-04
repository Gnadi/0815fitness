import { describe, expect, it } from 'vitest'
import { createCareer } from './newCareer'
import { baueTurnier, gruppenPlatz, kaderRang, natRolle, natSpielVerbuchen, natVon, turnierErgebnis } from './nationalteam'
import { createRng } from './rng'
import { spieleSaisons } from './sim'
import { verbucheErgebnis } from './wettbewerbe'
import { applyTraits } from './match'
import type { Career, Skills } from './types'

const input = {
  vorname: 'Max', nachname: 'Muster', nationalitaet: 'DE', vereinId: 'DE.hannover-96', position: 'ST' as const,
  fuss: 'rechts' as const, hintergrund: 'arbeiterfamilie' as const, archetyp: 'strassenfussballer' as const, seed: 21,
}

const mitStaerke = (c: Career, wert: number): Career => {
  const skills = Object.fromEntries(Object.keys(c.spieler.skills).map((k) => [k, wert])) as unknown as Skills
  return { ...c, spieler: { ...c.spieler, skills } }
}

describe('Nationalteam', () => {
  it('bessere Spieler haben einen besseren Rang und eine bessere Rolle', () => {
    const c = createCareer(input)
    const schwach = mitStaerke(c, 40)
    const stark = mitStaerke(c, 95)
    expect(kaderRang(stark)).toBeLessThan(kaderRang(schwach))
    expect(natRolle(stark)).toBe('Stammspieler')
    expect(natRolle(schwach)).toBe('Außenseiter')
  })

  it('Vertrauen verändert sich mit Spielnoten', () => {
    const nt = natVon({})
    const gut = natSpielVerbuchen(nt, { saison: 2026, label: 'Test', gegner: 'X', tore: 2, gegentore: 0, einsatz: 'startelf', note: 8.5, spielerTore: 1 }, 90)
    const schlecht = natSpielVerbuchen(nt, { saison: 2026, label: 'Test', gegner: 'X', tore: 0, gegentore: 3, einsatz: 'startelf', note: 4, spielerTore: 0 }, 90)
    expect(gut.vertrauen).toBeGreaterThan(nt.vertrauen)
    expect(schlecht.vertrauen).toBeLessThan(nt.vertrauen)
    expect(gut.spiele).toHaveLength(1)
    expect(gut.minuten).toBe(90)
  })

  it('Turnier mit Gruppe: Tabelle füllt sich, Weiterkommen folgt der Tabelle', () => {
    let c = mitStaerke(createCareer(input), 95)
    c = { ...c, uhr: { ...c.uhr, saison: 2025 }, flags: { ...c.flags, nationalspieler: true }, nationalteam: { ...natVon(c), vertrauen: 95 } }
    let turnier = null
    for (let seed = 1; seed < 60 && !turnier; seed++) turnier = baueTurnier(c, createRng(seed)).turnier
    expect(turnier).not.toBeNull()
    expect(turnier!.gruppe!.teams).toHaveLength(4)
    expect(new Set(turnier!.gruppe!.teams.map((t) => t.id)).size).toBe(4)
    let s = { ...c.saison, turnier }
    const rng = createRng(3)
    for (let n = 0; n < 3; n++) {
      const gegner = s.turnier!.gruppe!.teams[n + 1]
      const v = verbucheErgebnis({ ...c, saison: s }, rng, 'turnier', gegner.id, true, 2, 1, 90, gegner.staerke)
      s = v.saison
    }
    const g = s.turnier!.gruppe!
    expect(Object.values(g.tabelle).every((z) => z[0] === 3)).toBe(true)
    expect(g.ergebnisse).toHaveLength(6)
    expect(gruppenPlatz(g).pkt).toBe(9)
    expect(s.turnier!.status).toBe('achtel')
    // K.-o.-Spiel wird protokolliert
    const v = verbucheErgebnis({ ...c, saison: s }, rng, 'turnier', 'FR', true, 0, 1, 90, 85)
    expect(v.saison.turnier!.status).toBe('aus')
    expect(v.saison.turnier!.verlauf).toHaveLength(1)
    expect(turnierErgebnis(v.saison.turnier!)).toBe('Aus im Achtelfinale')
  })

  it('nicht Nationalspieler: kein Turnier, keine Info', () => {
    const c = createCareer(input)
    expect(baueTurnier({ ...c, uhr: { ...c.uhr, saison: 2025 } }, createRng(1))).toEqual({ turnier: null })
  })

  it('Langer Lauf als Nationalspieler erzeugt Protokoll und Turnierhistorie', () => {
    let c = createCareer({ ...input, seed: 5 })
    c = { ...c, flags: { ...c.flags, nationalspieler: true }, spieler: { ...mitStaerke(c, 80).spieler, traits: applyTraits(c.spieler.traits, { ruf: 60 }) } }
    c = spieleSaisons(c, 8)
    const nt = natVon(c)
    expect(nt.turniere.length).toBeGreaterThan(0)
    expect(Number.isFinite(nt.vertrauen)).toBe(true)
    expect(nt.vertrauen).toBeGreaterThanOrEqual(0)
    expect(nt.vertrauen).toBeLessThanOrEqual(100)
  })
})
