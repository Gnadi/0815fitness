import { bestellschluss, lieferSonntag } from './logik'

export type Phase = 'offen' | 'zu' | 'ofen' | 'rad' | 'rueckblick'

export interface WochenStand {
  phase: Phase
  /** Der Sonntag, für den man jetzt bestellt. */
  bestellSonntag: Date
  /** Der Sonntag, um den es gerade geht (heute bzw. der nächste). */
  dieserSonntag: Date
}

const STUNDE = 3_600_000

/** In welcher Phase der Woche sind wir gerade? */
export function wochenStand(jetzt: Date): WochenStand {
  const bestellSonntag = lieferSonntag(jetzt)
  const heute = new Date(jetzt)
  heute.setHours(0, 0, 0, 0)
  const istSonntag = jetzt.getDay() === 0
  const h = jetzt.getHours() + jetzt.getMinutes() / 60

  if (istSonntag) {
    const phase: Phase = h < 4 ? 'zu' : h < 7 ? 'ofen' : h < 10 ? 'rad' : 'rueckblick'
    return { phase, bestellSonntag, dieserSonntag: heute }
  }
  // Mo–Sa: nach Bestellschluss (Fr 20:00) ist der Zettel für diesen Sonntag zu
  const naechster = new Date(heute)
  naechster.setDate(naechster.getDate() + (7 - jetzt.getDay()))
  const zu = jetzt.getTime() >= bestellschluss(naechster).getTime()
  return { phase: zu ? 'zu' : 'offen', bestellSonntag, dieserSonntag: naechster }
}

/** Fortlaufende Nummer des Sonntagszettels (Nr. 1 = erster Sonntag 2026). */
export function ausgabeNr(sonntag: Date): number {
  const start = new Date(2026, 0, 4) // erster Sonntag 2026
  return Math.round((sonntag.getTime() - start.getTime()) / (7 * 24 * STUNDE)) + 1
}

/** Fortschritt der Lieferrunde 0…1 (So 7:00–10:00). */
export function rundenFortschritt(jetzt: Date): number {
  const h = jetzt.getHours() + jetzt.getMinutes() / 60
  return Math.min(1, Math.max(0, (h - 7) / 3))
}

/** Fortschritt im Ofen 0…1 (So 4:00–7:00). */
export function backFortschritt(jetzt: Date): number {
  const h = jetzt.getHours() + jetzt.getMinutes() / 60
  return Math.min(1, Math.max(0, (h - 4) / 3))
}

/** ISO-Kalenderwoche (Montag als Wochenbeginn). */
export function kalenderwoche(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const tag = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - tag)
  const jahresbeginn = Date.UTC(t.getUTCFullYear(), 0, 1)
  return Math.ceil(((t.getTime() - jahresbeginn) / 86_400_000 + 1) / 7)
}

export function plusWochen(d: Date, wochen: number): Date {
  const n = new Date(d)
  n.setDate(n.getDate() + wochen * 7)
  return n
}
