import { describe, expect, it } from 'vitest'
import { createRng } from './rng'
import { createCareer } from './newCareer'
import { createSaveStorage, type KeyValueStore } from '../storage/saves'

function memoryStore(): KeyValueStore {
  const m = new Map<string, string>()
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size },
  }
}

const input = {
  vorname: 'Max', nachname: 'Muster', nationalitaet: 'AT', position: 'ST' as const,
  fuss: 'rechts' as const, hintergrund: 'arbeiterfamilie' as const, archetyp: 'strassenfussballer' as const,
}

describe('rng', () => {
  it('ist mit gleichem Seed reproduzierbar', () => {
    const a = createRng(42), b = createRng(42)
    expect([a.next(), a.next(), a.int(1, 10)]).toEqual([b.next(), b.next(), b.int(1, 10)])
  })
  it('setzt sich über den gespeicherten Zustand fort', () => {
    const a = createRng(7)
    a.next()
    const b = createRng(a.state())
    expect(b.next()).toBe(a.next())
  })
})

describe('newCareer', () => {
  it('erzeugt einen 16-jährigen Spieler mit gültigen Werten', () => {
    const c = createCareer({ ...input, seed: 1 }, 2026)
    expect(c.spieler.geburtsdatum.startsWith('2010-')).toBe(true)
    for (const v of Object.values(c.spieler.skills)) expect(v).toBeGreaterThanOrEqual(1)
    expect(createCareer({ ...input, seed: 1 }, 2026).spieler.skills).toEqual(c.spieler.skills)
  })
})

describe('saves', () => {
  it('speichert, lädt, listet und löscht Spielstände', () => {
    const s = createSaveStorage(memoryStore())
    const c = createCareer(input)
    s.save(c)
    expect(s.load(c.id)?.spieler.nachname).toBe('Muster')
    expect(s.list()).toHaveLength(1)
    s.remove(c.id)
    expect(s.list()).toHaveLength(0)
  })
  it('exportiert und importiert einen Spielstand', () => {
    const a = createSaveStorage(memoryStore()), b = createSaveStorage(memoryStore())
    const c = createCareer(input)
    a.save(c)
    b.importJson(a.exportJson(c.id)!)
    expect(b.load(c.id)?.seed).toBe(c.seed)
  })
})
