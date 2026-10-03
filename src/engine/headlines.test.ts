import { describe, expect, it } from 'vitest'
import { schlagzeile, type HeadlineInput } from './headlines'
import { createRng } from './rng'

const basis: HeadlineInput = {
  name: 'Muster', gegner: 'TSV Hartberg', tore: 1, gegentore: 1, einsatz: 'einwechslung', note: 5.9, spielerTore: 0, vorlagen: 0, rot: false,
}

describe('Schlagzeilen', () => {
  it('nennt ein Unentschieden mit Toren nie „torlos“', () => {
    for (let seed = 1; seed <= 200; seed++) {
      for (const [t, g] of [[1, 1], [2, 2], [3, 3]]) {
        const z = schlagzeile({ ...basis, tore: t, gegentore: g }, createRng(seed))
        expect(z.toLowerCase(), z).not.toContain('torlos')
        expect(z.toLowerCase(), z).not.toContain('null zu null')
      }
    }
  })

  it('torlose Remis und Unentschieden mit eigenem Tor passen zum Ergebnis', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const z = schlagzeile({ ...basis, tore: 0, gegentore: 0 }, createRng(seed))
      expect(z.toLowerCase(), z).toMatch(/torlos|null zu null/)
      const e = schlagzeile({ ...basis, spielerTore: 1 }, createRng(seed))
      expect(e, e).not.toContain('reicht nicht')
    }
  })
})
