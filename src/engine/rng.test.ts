import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

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
