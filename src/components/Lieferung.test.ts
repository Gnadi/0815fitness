import { describe, expect, it } from 'vitest'
import { aufDerRunde } from './Lieferung'

describe('aufDerRunde', () => {
  it('erkennt Straßen der Runde, auch kleingeschrieben und abgekürzt', () => {
    expect(aufDerRunde('Kirchengasse 3')).toBe(true)
    expect(aufDerRunde('hauptstr. 12')).toBe(true)
    expect(aufDerRunde('Am Bach 1/4')).toBe(true)
  })
  it('andere Straßen sind nicht auf der Runde', () => {
    expect(aufDerRunde('Landstraße 5')).toBe(false)
  })
})
