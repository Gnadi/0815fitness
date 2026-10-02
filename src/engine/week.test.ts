import { describe, expect, it } from 'vitest'
import { SCENES } from '../data/scenes'
import { migrate } from './migrate'
import { createCareer, type NewCareerInput } from './newCareer'
import { overall } from './rating'
import { naechsteSaison } from './season'
import { spieleKarriere, spieleSaison } from './sim'
import { startWeek, waehle, weiter, weiterImSpiel } from './week'
import type { Career, Position } from './types'

const input: NewCareerInput = {
  vorname: 'Max', nachname: 'Muster', nationalitaet: 'AT', position: 'ST',
  fuss: 'rechts', hintergrund: 'arbeiterfamilie', archetyp: 'strassenfussballer', seed: 7,
}

describe('Szenen-Daten', () => {
  it('hat für jede Position mindestens drei Szenen mit je ≥ 2 Optionen', () => {
    const positionen: Position[] = ['TW', 'IV', 'AV', 'ZDM', 'ZM', 'ZOM', 'AF', 'ST']
    for (const p of positionen) {
      const s = SCENES.filter((x) => x.positionen === 'alle' || x.positionen.includes(p))
      expect(s.length, p).toBeGreaterThanOrEqual(3)
    }
    for (const s of SCENES) expect(s.optionen.length, s.id).toBeGreaterThanOrEqual(2)
  })
})

describe('Wochenschleife', () => {
  it('spielt eine komplette Saison mit konsistentem Zustand', () => {
    const c = spieleSaison(createCareer(input))
    expect(c.phase).toBe('saisonende')
    expect(c.saisonStats.spiele).toBeLessThanOrEqual(34)
    expect(c.saisonStats.spiele).toBeGreaterThan(0)
    expect(c.saisonStats.siege + c.saisonStats.remis + c.saisonStats.niederlagen).toBe(c.saisonStats.spiele)
    expect(c.historie).toHaveLength(1)
    for (const v of Object.values(c.spieler.skills)) {
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(100)
    }
    const next = naechsteSaison(c)
    expect(next.uhr).toEqual({ saison: 2027, woche: 1 })
    expect(next.saisonStats.spiele).toBe(0)
  })

  it('ist mit gleichem Seed und gleichen Entscheidungen reproduzierbar', () => {
    const a = spieleSaison(createCareer(input))
    const b = spieleSaison(createCareer(input))
    expect(a.saisonStats).toEqual(b.saisonStats)
    expect(a.log).toEqual(b.log)
  })

  it('trainiert den gewählten Fokus stärker', () => {
    const c = createCareer(input)
    const technik = startWeek({ ...c, uhr: { saison: 2026, woche: 40 } }, 'technik').spieler.skills
    const physis = startWeek({ ...c, uhr: { saison: 2026, woche: 40 } }, 'physis').spieler.skills
    expect(technik.technik - c.spieler.skills.technik).toBeGreaterThan(physis.technik - c.spieler.skills.technik)
    expect(physis.physis - c.spieler.skills.physis).toBeGreaterThan(technik.physis - c.spieler.skills.physis)
  })

  it('verletzte Spieler trainieren Reha und spielen nicht', () => {
    const c = { ...createCareer(input), verletzung: { name: 'Zerrung', wochen: 2 } }
    const r = startWeek(c, 'extraschicht')
    expect(r.phase).toBe('bericht')
    expect(r.bericht?.ergebnis).toBeUndefined()
    expect(r.verletzung?.wochen).toBe(1)
    expect(r.bericht?.trainingText).toContain('Reha')
  })

  it('Regeneration baut Fitness auf, Extraschicht ab', () => {
    const c = createCareer(input)
    const f = (focus: 'regeneration' | 'extraschicht') =>
      startWeek({ ...c, uhr: { saison: 2026, woche: 40 } }, focus).spieler.traits.fitness
    expect(f('regeneration')).toBeGreaterThan(c.spieler.traits.fitness)
    expect(f('extraschicht')).toBeLessThan(f('regeneration'))
  })

  it('Entscheidungen in Szenen verändern das Spiel; Weiter geht nur nach einer Wahl', () => {
    let c: Career = createCareer({ ...input, seed: 3 })
    // Woche suchen, in der gespielt wird
    for (let i = 0; i < 20 && c.phase !== 'szene'; i++) {
      c = startWeek(c, 'ausgewogen')
      if (c.phase === 'bericht') c = weiter(c)
    }
    expect(c.phase).toBe('szene')
    expect(weiterImSpiel(c)).toBe(c) // noch keine Entscheidung
    const nach = waehle(c, 0)
    expect(nach.match?.ausgang).toBeTruthy()
    expect(waehle(nach, 0)).toBe(nach) // zweite Wahl in derselben Szene wirkungslos
  })

  it('Rote Karte führt zu Sperre', () => {
    let gesehen = false
    for (let seed = 1; seed <= 120 && !gesehen; seed++) {
      const c = spieleSaison({ ...createCareer({ ...input, seed, position: 'IV' }) }, 'ausgewogen', 1)
      gesehen = c.saisonStats.rot > 0
    }
    expect(gesehen).toBe(true)
  })

  it('Spieler entwickeln sich bis zum Karrierehöhepunkt und lassen danach nach', () => {
    const { verlauf } = spieleKarriere({ ...input, seed: 11 }, 20)
    const peak = Math.max(...verlauf.map((v) => v.overall))
    expect(peak).toBeGreaterThan(verlauf[0].overall + 8)
    expect(verlauf[verlauf.length - 1].overall).toBeLessThan(peak)
    const c = createCareer(input)
    expect(overall(c.spieler)).toBeGreaterThan(20)
  })
})

describe('Migration', () => {
  it('ergänzt in v1-Spielständen die neuen Felder', () => {
    const neu = createCareer(input)
    const alt = { ...neu, version: 1 } as unknown as Record<string, unknown>
    for (const k of ['verein', 'form', 'verletzung', 'sperre', 'training', 'phase', 'match', 'bericht', 'saisonBericht', 'saisonStats', 'historie']) delete alt[k]
    const m = migrate(alt as unknown as Career)
    expect(m.version).toBe(2)
    expect(m.phase).toBe('planung')
    expect(m.verein.staerke).toBeGreaterThan(0)
    expect(m.saisonStats.saison).toBe(2026)
  })
})
