import { describe, expect, it } from 'vitest'
import { LAENDER, LIGEN, LIGA_START, VEREINE, ligaIds } from './clubs'
import { COUNTRIES } from './countries'
import { SCENES } from './scenes'
import { ALLE_EREIGNISSE, EREIGNIS_BY_ID } from './events'
import type { Effekt } from './events/types'
import { FARB_NAMEN, vereinsfarben } from './vereinsfarben'
import { leuchtdichte, vereinsPalette } from '../ui/farben'

describe('Vereinsdaten', () => {
  it('deckt alle 55 UEFA-Länder ab', () => {
    expect(COUNTRIES).toHaveLength(55)
    for (const c of COUNTRIES) expect(LAENDER[c.id], c.id).toBeDefined()
  })
  it('hat gerade Ligagrößen, plausible Stärken und konsistente Auf-/Abstiege', () => {
    for (const id of Object.keys(LIGEN)) {
      const n = LIGA_START[id].length
      expect(n % 2, `${id} hat ${n} Vereine`).toBe(0)
      expect(n, id).toBeGreaterThanOrEqual(6)
    }
    for (const v of Object.values(VEREINE)) {
      expect(v.basis).toBeGreaterThan(10)
      expect(v.basis).toBeLessThan(97)
    }
    for (const land of Object.keys(LAENDER)) {
      const ids = ligaIds(land)
      for (let t = 0; t < ids.length - 1; t++) expect(LIGEN[ids[t]].ab, ids[t]).toBeGreaterThan(0)
    }
  })
})

describe('Szenen und Ereignisse', () => {
  it('Szenen haben mindestens zwei Optionen', () => {
    for (const s of SCENES) expect(s.optionen.length, s.id).toBeGreaterThanOrEqual(2)
  })
  it('Ereignis-IDs sind eindeutig und Folgeereignisse existieren', () => {
    expect(new Set(ALLE_EREIGNISSE.map((e) => e.id)).size).toBe(ALLE_EREIGNISSE.length)
    const gesammelt: Effekt[] = []
    for (const e of ALLE_EREIGNISSE) {
      expect(e.optionen.length, e.id).toBeGreaterThanOrEqual(2)
      for (const o of e.optionen) {
        gesammelt.push(...(o.erfolg.effekte ?? []), ...(o.misserfolg?.effekte ?? []))
        if (o.wurf) expect(o.misserfolg, `${e.id}: Wurf ohne Misserfolg`).toBeDefined()
      }
    }
    for (const eff of gesammelt) if (eff.t === 'folge') expect(EREIGNIS_BY_ID[eff.id], eff.id).toBeDefined()
  })
  it('bietet genug Inhalt', () => {
    expect(ALLE_EREIGNISSE.length).toBeGreaterThanOrEqual(100)
  })
})

describe('Vereinsfarben', () => {
  it('alle hinterlegten Vereinsnamen existieren', () => {
    const namen = new Set(Object.values(VEREINE).map((v) => v.name))
    for (const n of FARB_NAMEN) expect(namen.has(n), n).toBe(true)
  })
  it('jeder Verein bekommt eine lesbare Palette (dunkler Hintergrund, heller Akzent)', () => {
    for (const id of Object.keys(VEREINE)) {
      const [a, b] = vereinsfarben(id)
      const p = vereinsPalette(a, b)
      expect(p['--accent'], id).toBeTruthy()
      expect(p['--bg']).toMatch(/^hsl\(/)
    }
    // Sehr dunkle Hauptfarbe: die Zweitfarbe bzw. eine aufgehellte Variante wird Akzent
    expect(vereinsPalette('#000000', '#ffffff')['--accent']).toBe('#ffffff')
    expect(vereinsPalette('#0a0a30', '#111111')['--accent']).toMatch(/^hsl\(/)
    expect(leuchtdichte('#ffffff')).toBeGreaterThan(0.95)
  })
})
