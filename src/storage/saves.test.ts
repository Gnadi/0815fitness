import { describe, expect, it } from 'vitest'
import { createCareer } from '../engine/newCareer'
import { createSaveStorage, type KeyValueStore } from './saves'

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
  vorname: 'Max', nachname: 'Muster', nationalitaet: 'AT', vereinId: 'AT.lask', position: 'ST' as const,
  fuss: 'rechts' as const, hintergrund: 'arbeiterfamilie' as const, archetyp: 'strassenfussballer' as const, seed: 7,
}

describe('saves', () => {
  it('speichert, lädt, listet und löscht Spielstände', () => {
    const s = createSaveStorage(memoryStore())
    const c = createCareer(input)
    expect(s.save(c)).toBe(true)
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
  it('lehnt alte Formate ab', () => {
    const store = memoryStore()
    const s = createSaveStorage(store)
    const c = createCareer(input)
    store.setItem('karriere:save:alt', JSON.stringify({ ...c, id: 'alt', version: 1 }))
    expect(s.load('alt')).toBeNull()
    expect(s.list()[0].kompatibel).toBe(false)
    expect(() => s.importJson(JSON.stringify({ ...c, version: 1 }))).toThrow()
  })
  it('meldet einen vollen Speicher', () => {
    const store = memoryStore()
    store.setItem = () => { throw new Error('quota') }
    expect(createSaveStorage(store).save(createCareer(input))).toBe(false)
  })
})
