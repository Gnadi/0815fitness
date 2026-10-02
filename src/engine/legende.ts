import { overall } from './rating'
import { alleStats, gesamtStats } from './statistik'
import { LAENDER } from '../data/clubs'
import type { Career } from './types'

const TITEL_PUNKTE = (name: string): number => {
  if (name === 'Champions League') return 30
  if (name === 'Europa League') return 14
  if (name === 'Conference League') return 8
  if (name.startsWith('WM')) return 40
  if (name.startsWith('EM')) return 28
  if (name.startsWith('Meister')) return 10
  if (Object.values(LAENDER).some((l) => l.pokal === name)) return 4
  return 2
}

export interface Legende {
  punkte: number
  klasse: string
  beschreibung: string
  hoechstwert: number
}

const KLASSEN: [number, string, string][] = [
  [0, 'Randnotiz', 'Man hat dich gesehen, aber niemand erinnert sich an dich.'],
  [60, 'Lokalheld', 'In deiner Heimatstadt kennt dich jedes Kind.'],
  [140, 'Ligastar', 'Zu deiner Zeit warst du eine feste Größe in der Liga.'],
  [260, 'Nationalheld', 'Ein ganzes Land erinnert sich an deine großen Momente.'],
  [420, 'Weltstar', 'Dein Name ist auf allen Kontinenten bekannt.'],
  [640, 'Legende', 'Du gehörst in die Ruhmeshalle des Fußballs.'],
  [900, 'Jahrhundertspieler', 'Eine Generation wurde nach dir benannt.'],
]

export function legende(c: Career): Legende {
  const g = gesamtStats(c)
  const peak = Math.max(overall(c.spieler), ...alleStats(c).map((s) => s.overallEnde))
  let p = 0
  for (const t of c.laufbahn.titel) p += TITEL_PUNKTE(t.name)
  p += c.laufbahn.auszeichnungen.length * 15
  p += g.tore * 0.2 + g.vorlagen * 0.1 + g.spiele * 0.03
  p += c.laufbahn.laenderspiele * 0.25 + c.laufbahn.laenderspielTore * 0.3
  p += Math.max(0, peak - 60) * 1.4
  p += c.erfolge.length * 1.5
  p -= c.laufbahn.skandale * 6
  p = Math.max(0, Math.round(p))
  const klasse = [...KLASSEN].reverse().find(([min]) => p >= min) ?? KLASSEN[0]
  return { punkte: p, klasse: klasse[1], beschreibung: klasse[2], hoechstwert: c.laufbahn.hoechsterMarktwert }
}
