/** Seed-basierter Zufallsgenerator (mulberry32), damit Spielstände reproduzierbar bleiben. */
export interface Rng {
  /** Zufallszahl in [0, 1). */
  next(): number
  /** Ganzzahl in [min, max] (beide inklusive). */
  int(min: number, max: number): number
  /** true mit Wahrscheinlichkeit p (0..1). */
  chance(p: number): boolean
  pick<T>(items: readonly T[]): T
  /** Aktueller interner Zustand, um den Generator im Spielstand fortzusetzen. */
  state(): number
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    chance: (p) => next() < p,
    pick: (items) => items[Math.floor(next() * items.length)],
    state: () => a,
  }
}
