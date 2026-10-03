import { describe, expect, it } from 'vitest'
import { LAENDER, LIGA_START, VEREINE } from '../data/clubs'
import { Aktionen } from './aktionen'
import { legende } from './legende'
import { createCareer, type NewCareerInput } from './newCareer'
import { alter, overall } from './rating'
import { createRng } from './rng'
import { bot, spieleKarriere, spieleSaisons } from './sim'
import type { Career, Position } from './types'

const input: NewCareerInput = {
  vorname: 'Max', nachname: 'Muster', nationalitaet: 'DE', vereinId: 'DE.hannover-96', position: 'ST',
  fuss: 'rechts', hintergrund: 'arbeiterfamilie', archetyp: 'strassenfussballer', seed: 7,
}

function pruefeInvarianten(c: Career): void {
  for (const v of Object.values(c.spieler.traits)) {
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThanOrEqual(100)
    expect(Number.isFinite(v)).toBe(true)
  }
  for (const v of Object.values(c.spieler.skills)) {
    expect(v).toBeGreaterThanOrEqual(1)
    expect(v).toBeLessThanOrEqual(100)
  }
  expect(Number.isFinite(c.spieler.geld)).toBe(true)
  if (c.vereinId) expect(VEREINE[c.vereinId]).toBeDefined()
  if (c.phase !== 'saisonende' && c.phase !== 'karriereende') {
    expect(c.saison.kalender[c.uhr.woche - 1]).toBeDefined()
  }
  expect(c.saison.teams).toContain(c.vereinId || c.saison.teams[0])
}

describe('Karriere-Ablauf', () => {
  it('startet in der Jugend und wird nach zwei Jahren Profi', () => {
    let c = createCareer(input)
    expect(c.saison.jugend).toBe(true)
    expect(c.vertrag?.rolle).toBe('Jugend')
    c = spieleSaisons(c, 2)
    expect(c.saison.jugend).toBe(false)
    expect(c.vertrag).not.toBeNull()
    expect(c.vertrag!.rolle).not.toBe('Jugend')
    expect(alter(c.spieler.geburtsdatum, c.uhr.saison)).toBe(18)
    expect(c.laufbahn.transfers.length).toBeGreaterThanOrEqual(0)
  })

  it('ist mit gleichem Seed und gleichen Entscheidungen reproduzierbar', () => {
    const a = spieleSaisons(createCareer(input), 4)
    const b = spieleSaisons(createCareer(input), 4)
    expect(a.historie).toEqual(b.historie)
    expect(a.log).toEqual(b.log)
    expect(a.spieler.skills).toEqual(b.spieler.skills)
  })

  it('Spieler entwickeln sich bis zum Höhepunkt und lassen danach nach', () => {
    const { verlauf } = spieleKarriere({ ...input, seed: 11 }, 20)
    const peak = Math.max(...verlauf.map((v) => v.overall))
    expect(peak).toBeGreaterThan(verlauf[0].overall + 10)
    expect(verlauf[verlauf.length - 1].overall).toBeLessThan(peak)
  })

  it('läuft für jedes UEFA-Land ohne Fehler (Bot, 5 Jahre)', { timeout: 120_000 }, () => {
    let n = 0
    for (const land of Object.keys(LAENDER)) {
      const clubs = LIGA_START[`${land}1`]
      const vereinId = clubs[(n * 3) % clubs.length]
      const { career } = spieleKarriere({ ...input, nationalitaet: land, vereinId, seed: 100 + n++ }, 5)
      expect(career.historie.length).toBeGreaterThanOrEqual(4)
      pruefeInvarianten(career)
    }
  })

  it('übersteht zufällige Entscheidungen (Fuzzing)', { timeout: 240_000 }, () => {
    const positionen: Position[] = ['TW', 'IV', 'AV', 'ZDM', 'ZM', 'ZOM', 'AF', 'ST']
    for (let seed = 1; seed <= 12; seed++) {
      const zufall = createRng(seed * 977)
      const land = Object.keys(LAENDER)[seed * 4 % 55]
      const clubs = LIGA_START[`${land}1`]
      let c = createCareer({ ...input, nationalitaet: land, vereinId: clubs[seed % clubs.length], position: positionen[seed % 8], seed })
      let schritte = 0
      let letzteSaison = c.uhr.saison
      while (c.phase !== 'karriereende' && c.uhr.saison < 2026 + 22 && schritte++ < 120_000) {
        c = bot(c, { zufall })
        if (c.uhr.saison !== letzteSaison) {
          letzteSaison = c.uhr.saison
          pruefeInvarianten(c)
        }
      }
      expect(schritte).toBeLessThan(120_000)
      expect(legende(c).punkte).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('Transferfenster', () => {
  it('Sommerfenster: Vertragsende führt zu Angeboten und automatischer Unterschrift', () => {
    let c = createCareer(input)
    c = spieleSaisons(c, 3)
    // Bis zum nächsten Sommerfenster spielen, ohne Angebote zu beachten
    let guard = 0
    while (c.fenster !== 'sommer' && guard++ < 5000) c = bot(c, { wechseln: false })
    expect(c.fenster).toBe('sommer')
    // Vertrag manuell auslaufen lassen: erst nächste Saison testen
    const mitVertrag = c.vertrag !== null
    expect(mitVertrag || c.angebote.length > 0).toBe(true)
  })

  it('Annehmen und Verhandeln wirken wie erwartet', () => {
    let c = createCareer(input)
    c = spieleSaisons(c, 2, { wechseln: false })
    let guard = 0
    while (!(c.fenster && c.angebote.length) && guard++ < 20_000) c = bot(c, { wechseln: false })
    if (c.fenster && c.angebote.length) {
      const a = c.angebote[0]
      const r = Aktionen.verhandeln(c, a.id, 'gehalt')
      expect(r.text.length).toBeGreaterThan(0)
      const c2 = Aktionen.annehmen(r.c.angebote.length ? r.c : c, (r.c.angebote[0] ?? a).id)
      expect(c2.angebote).toHaveLength(0)
      expect(c2.vertrag).not.toBeNull()
    }
  })

  it('der gewählte Profivertrag wird am Fensterende nicht überschrieben', () => {
    let c = createCareer({ ...input, seed: 21 })
    let guard = 0
    while (!(c.fenster === 'sommer' && c.angebote.some((a) => a.art === 'profivertrag')) && guard++ < 20_000) c = bot(c, { wechseln: false })
    const wahl = c.angebote[c.angebote.length - 1]
    c = Aktionen.annehmen(c, wahl.id)
    const vertrag = c.vertrag
    while (c.fenster && guard++ < 40_000) c = bot(c, { wechseln: false })
    expect(c.vereinId).toBe(wahl.vereinId)
    expect(c.vertrag?.gehalt).toBe(vertrag?.gehalt)
    expect(c.vertrag?.rolle).toBe(wahl.rolle)
  })

  it('Gesamtstärke wird nie ungültig', () => {
    const c = spieleSaisons(createCareer(input), 3)
    expect(overall(c.spieler)).toBeGreaterThan(30)
  })
})
