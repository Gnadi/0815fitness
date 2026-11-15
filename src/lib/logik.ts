import { LIEFERGEBUEHR, GRATIS_AB, PRODUKT_NACH_ID } from '../data/produkte'

export type Warenkorb = Record<string, number>

const TAG = 24 * 60 * 60 * 1000

/** Bestellschluss für einen Liefer-Sonntag: der Freitag davor um 20:00. */
export function bestellschluss(sonntag: Date): Date {
  const d = new Date(sonntag)
  d.setDate(d.getDate() - 2)
  d.setHours(20, 0, 0, 0)
  return d
}

/** Der nächste Sonntag, für den man jetzt noch bestellen kann. */
export function lieferSonntag(jetzt: Date): Date {
  const d = new Date(jetzt)
  d.setHours(0, 0, 0, 0)
  const bisSonntag = (7 - d.getDay()) % 7 || 7
  d.setDate(d.getDate() + bisSonntag)
  if (jetzt.getTime() >= bestellschluss(d).getTime()) d.setDate(d.getDate() + 7)
  return d
}

export function restzeit(jetzt: Date, ziel: Date): string {
  const ms = Math.max(0, ziel.getTime() - jetzt.getTime())
  const tage = Math.floor(ms / TAG)
  const std = Math.floor((ms % TAG) / 3_600_000)
  const min = Math.floor((ms % 3_600_000) / 60_000)
  if (tage > 0) return `${tage} ${tage === 1 ? 'Tag' : 'Tage'} ${std} Std.`
  if (std > 0) return `${std} Std. ${min} Min.`
  return `${min} Min.`
}

export const euro = (n: number) => n.toLocaleString('de-AT', { style: 'currency', currency: 'EUR' })

export const datumLang = (d: Date) =>
  d.toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long' })

export function summen(korb: Warenkorb) {
  let zwischensumme = 0
  let stueck = 0
  for (const [id, menge] of Object.entries(korb)) {
    const p = PRODUKT_NACH_ID[id]
    if (!p || menge <= 0) continue
    zwischensumme += p.preis * menge
    stueck += menge
  }
  zwischensumme = Math.round(zwischensumme * 100) / 100
  const lieferung = stueck === 0 || zwischensumme >= GRATIS_AB ? 0 : LIEFERGEBUEHR
  return { zwischensumme, lieferung, gesamt: Math.round((zwischensumme + lieferung) * 100) / 100, stueck }
}

export function bestellnummer(): string {
  const zeichen = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 5; i++) s += zeichen[Math.floor(Math.random() * zeichen.length)]
  return `RB-${s}`
}
