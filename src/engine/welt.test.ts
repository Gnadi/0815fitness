import { describe, expect, it } from 'vitest'
import { LIGEN, VEREINE } from '../data/clubs'
import { createRng } from './rng'
import { createWelt, erzeugeSpielplan, rundenFuer, schliesseWeltAb, simuliereLiga } from './welt'

describe('Spielplan', () => {
  it('lässt jeden gegen jeden gleich oft antreten, Heim/Auswärts ausgeglichen', () => {
    for (const n of [6, 8, 12, 16, 18, 20, 24]) {
      const plan = erzeugeSpielplan(n, createRng(n))
      expect(plan.length).toBe((n - 1) * rundenFuer(n))
      const paare = new Map<string, number>()
      const heim = new Array<number>(n).fill(0)
      for (const tag of plan) {
        const seen = new Set<number>()
        for (const [h, a] of tag) {
          expect(seen.has(h) || seen.has(a)).toBe(false)
          seen.add(h); seen.add(a)
          const k = [Math.min(h, a), Math.max(h, a)].join('-')
          paare.set(k, (paare.get(k) ?? 0) + 1)
          heim[h]++
        }
      }
      for (const v of paare.values()) expect(v).toBe(rundenFuer(n))
      expect(paare.size).toBe((n * (n - 1)) / 2)
      const sp = plan.length
      for (const h of heim) expect(Math.abs(h - sp / 2)).toBeLessThanOrEqual(rundenFuer(n) <= 3 ? 3 : 2)
    }
  })
})

describe('Welt', () => {
  it('behält Ligagrößen und Vereinszahl bei Auf-/Abstieg', () => {
    const welt = createWelt()
    const groessen = Object.fromEntries(Object.entries(welt.ligen).map(([k, v]) => [k, v.length]))
    const rng = createRng(1)
    for (let s = 0; s < 6; s++) schliesseWeltAb(welt, 2026 + s, null, rng)
    for (const id of Object.keys(LIGEN)) expect(welt.ligen[id].length, id).toBe(groessen[id])
    const alle = Object.values(welt.ligen).flat()
    expect(new Set(alle).size).toBe(Object.keys(VEREINE).length)
    for (const s of Object.values(welt.staerke)) {
      expect(s).toBeGreaterThanOrEqual(15)
      expect(s).toBeLessThanOrEqual(97)
    }
    for (const k of ['CL', 'EL', 'ECL'] as const) expect(welt.europa[k].length).toBeGreaterThan(8)
  })
  it('bessere Teams werden häufiger Meister', () => {
    const welt = createWelt()
    const rng = createRng(3)
    let besterMeister = 0
    for (let i = 0; i < 20; i++) {
      const rang = simuliereLiga(welt, 'DE1', rng)
      if (rang[0].id === 'DE.fc-bayern-muenchen') besterMeister++
    }
    expect(besterMeister).toBeGreaterThan(8)
  })
})
