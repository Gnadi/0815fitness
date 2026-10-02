import type { Rng } from './rng'
import type { Einsatz } from './types'

export interface HeadlineInput {
  name: string
  gegner: string
  tore: number
  gegentore: number
  einsatz: Einsatz
  note: number | null
  spielerTore: number
  vorlagen: number
  rot: boolean
}

/** Boulevard-Schlagzeile zum Spiel. Reihenfolge der Regeln = Priorität. */
export function schlagzeile(h: HeadlineInput, rng: Rng): string {
  const sieg = h.tore > h.gegentore
  const niederlage = h.tore < h.gegentore
  const f = (s: string) => s.replaceAll('{name}', h.name).replaceAll('{gegner}', h.gegner)

  let pool: string[]
  if (h.einsatz === 'nicht-eingesetzt') {
    pool = [
      '{name} schaut zu: Trainer lässt ihn gegen {gegner} auf der Bank versauern',
      'Kein Einsatz für {name}: „Ich bleibe geduldig“, sagt er und meint es nicht so',
      '{name} im Kader, aber nicht im Spiel: Das Warten geht weiter',
    ]
  } else if (h.rot) {
    pool = [
      'Platzverweis! {name} verabschiedet sich vorzeitig unter die Dusche',
      'Rot für {name}: Der Trainer schäumt, die Fans pfeifen',
    ]
  } else if (h.spielerTore >= 3) {
    pool = ['HAT-TRICK! {name} schießt {gegner} im Alleingang ab', '{name} dreht durch: Dreierpack gegen {gegner}!']
  } else if (h.spielerTore === 2) {
    pool = ['Doppelpack! {name} lässt {gegner} verzweifeln', '{name} trifft doppelt: „Heute lief einfach alles“']
  } else if (h.spielerTore === 1 && sieg) {
    pool = ['{name} schießt sein Team zum Sieg gegen {gegner}', 'Matchwinner {name}: Treffer sichert den Dreier']
  } else if (h.spielerTore === 1) {
    pool = ['{name} trifft, doch es reicht nicht: Bittere Pille gegen {gegner}']
  } else if (h.vorlagen > 0 && sieg) {
    pool = ['Vorlagengeber {name}: Mit Übersicht zum Sieg über {gegner}']
  } else if (h.note !== null && h.note >= 8) {
    pool = ['{name} überragend: Note {note} gegen {gegner}', 'Ein Spiel wie aus einem Guss: {name} spielt groß auf']
  } else if (h.note !== null && h.note <= 4.5) {
    pool = ['Katastrophen-Auftritt: {name} unterirdisch gegen {gegner}', 'Abend zum Vergessen für {name}: „Frag nicht“']
  } else if (niederlage) {
    pool = ['Pleite gegen {gegner}: {name} sucht nach Antworten', '{name} und Co. gehen gegen {gegner} unter']
  } else if (sieg) {
    pool = ['Arbeitssieg gegen {gegner}: {name} mit solider Leistung', 'Dreier eingefahren: {name} tut seinen Teil']
  } else {
    pool = ['Remis gegen {gegner}: Keiner will den Fehler gemacht haben', 'Unentschieden: {name} und {gegner} trennen sich torlos in der Debatte']
  }
  return f(rng.pick(pool).replace('{note}', h.note?.toFixed(1) ?? ''))
}
