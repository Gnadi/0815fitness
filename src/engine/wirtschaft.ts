import { LIGEN, VEREINE } from '../data/clubs'
import { alter, clamp, overall } from './rating'
import type { Rng } from './rng'
import { gauss, ligaVonVerein } from './welt'
import { immoNettoWoche } from './immobilien'
import { privatLaufend } from './privat'
import type { Angebot, AngebotArt, Career, Player, Rolle, Welt } from './types'

// log10(Marktwert in €) an Stützstellen der Gesamtstärke
const WERT_PUNKTE: [number, number][] = [[30, 3.7], [40, 4.1], [50, 4.8], [60, 5.7], [70, 6.6], [80, 7.4], [90, 8.0], [100, 8.3]]

export function marktwert(p: Player, saison: number): number {
  const ov = overall(p)
  let i = 0
  while (i < WERT_PUNKTE.length - 2 && ov > WERT_PUNKTE[i + 1][0]) i++
  const [x0, y0] = WERT_PUNKTE[i]
  const [x1, y1] = WERT_PUNKTE[i + 1]
  const log = y0 + ((clamp(ov, 30, 100) - x0) / (x1 - x0)) * (y1 - y0)
  let wert = 10 ** log
  const a = alter(p.geburtsdatum, saison)
  if (a <= 21) wert *= 1 + Math.max(0, p.potenzial - ov) / 35
  if (a >= 31) wert *= Math.max(0.2, 1 - 0.14 * (a - 30))
  wert *= 1 + p.traits.ruf / 250
  return Math.round(wert / 1000) * 1000
}

const LAND_GEHALT: Record<string, number> = {
  EN: 1.4, DE: 1.1, ES: 1.1, IT: 1.1, FR: 1.1,
  NL: 0.8, PT: 0.8, BE: 0.8, TR: 0.9, AT: 0.7, CH: 0.8, SC: 0.7, GR: 0.7, DK: 0.7, NO: 0.7, SE: 0.7, RU: 0.9,
}
const EBENE_MIN = [0, 60_000, 40_000, 28_000, 20_000]

export function landGehalt(land: string): number {
  return LAND_GEHALT[land] ?? 0.5
}

/** Jahresgehalt, das ein Verein einem Spieler mit diesem Marktwert bietet. */
export function gehaltBei(vereinId: string, wert: number, welt: Welt): number {
  const v = VEREINE[vereinId]
  const ebene = LIGEN[ligaVonVerein(welt, vereinId) ?? v.ligaStart].ebene
  const staerke = welt.staerke[vereinId]
  const g = wert * 0.17 * (0.6 + staerke / 100) * landGehalt(v.land)
  return Math.round(Math.max(g, EBENE_MIN[Math.min(ebene, 4)] * landGehalt(v.land)) / 1000) * 1000
}

export function jugendGehalt(vereinId: string): number {
  return Math.round((6_000 * landGehalt(VEREINE[vereinId].land)) / 500) * 500
}

/** Wochenverdienst netto abzüglich Lebenshaltung. */
export function wochenEinkommen(c: Career): number {
  const immo = immoNettoWoche(c)
  if (!c.vertrag) return Math.round(immo)
  if (c.saison.jugend) return Math.round((c.vertrag.gehalt * 0.9) / 52 + immo)
  const lebensstil = Number(c.flags.lebensstil ?? 0)
  const sponsor = c.flags.sponsor === true ? c.spieler.traits.ruf * 1_500 + c.spieler.traits.fanbeliebtheit * 500 : 0
  const miete = Number(c.flags.mieteinnahmen ?? 0)
  const laufend = privatLaufend(c)
  return Math.round((c.vertrag.gehalt * 0.6 + sponsor + miete - 9_000 - lebensstil - laufend) / 52 + immo)
}

export const spielerOverall = (c: Career): number => overall(c.spieler)

// ---------------------------------------------------------------- Angebote

let angebotZaehler = 0
const neueId = (): string => `a${Date.now().toString(36)}${(angebotZaehler++).toString(36)}`

function rolleFuer(effektiv: number, staerke: number): Rolle {
  const d = effektiv - staerke
  return d > 3 ? 'Stammspieler' : d > -3 ? 'Rotation' : 'Perspektive'
}

/** Gewichtete Auswahl ohne Zurücklegen. */
function waehle<T>(items: { v: T; w: number }[], n: number, rng: Rng): T[] {
  const pool = [...items]
  const out: T[] = []
  while (out.length < n && pool.length) {
    const total = pool.reduce((a, x) => a + x.w, 0)
    if (total <= 0) break
    let r = rng.next() * total
    let idx = 0
    for (; idx < pool.length; idx++) {
      r -= pool[idx].w
      if (r <= 0) break
    }
    out.push(pool[Math.min(idx, pool.length - 1)].v)
    pool.splice(Math.min(idx, pool.length - 1), 1)
  }
  return out
}

export function jahreFuer(a: number, rng: Rng): number {
  if (a <= 20) return rng.int(3, 5)
  if (a <= 28) return rng.int(2, 5)
  if (a <= 32) return rng.int(1, 3)
  return rng.int(1, 2)
}

interface AngebotOptionen {
  art: AngebotArt
  anzahl: number
  /** Schließt Vereine aus (aktueller Verein, Stammverein). */
  ausser: string[]
  /** Nur Vereine bis zu dieser Ebene (Leihe: unterklassiger). */
  maxStaerke?: number
  minStaerke?: number
}

/** Erzeugt Angebote passend zu Stärke, Potenzial, Alter und Ruf. */
export function erzeugeAngebote(c: Career, rng: Rng, o: AngebotOptionen): Angebot[] {
  const p = c.spieler
  const a = alter(p.geburtsdatum, c.uhr.saison)
  const ov = overall(p)
  const effektiv = a <= 21 ? ov + Math.max(0, p.potenzial - ov) * 0.35 : ov
  const wert = marktwert(p, c.uhr.saison)
  const berater = 1 + Number(c.flags.beraterGuete ?? 1) * 0.04
  const ruf = p.traits.ruf

  const kandidaten = Object.values(VEREINE)
    .filter((v) => !o.ausser.includes(v.id))
    .map((v) => {
      const staerke = c.welt.staerke[v.id]
      if (o.maxStaerke !== undefined && staerke > o.maxStaerke) return null
      if (o.minStaerke !== undefined && staerke < o.minStaerke) return null
      const fit = Math.exp(-Math.abs(effektiv - staerke + 2) / 5)
      // Heimatland und Länder mit gleicher Sprache sind etwas attraktiver
      const heimat = v.land === p.nationalitaet ? 1.6 : 1
      const prestige = staerke > 80 ? Math.min(1, ruf / 70) : 1
      return { v, w: fit * heimat * prestige * (0.4 + ruf / 80) }
    })
    .filter((x): x is { v: (typeof VEREINE)[string]; w: number } => x !== null && x.w > 0.04)

  const gewaehlt = waehle(kandidaten.map((x) => ({ v: x.v, w: x.w })), o.anzahl, rng)
  return gewaehlt.map((v) => {
    const staerke = c.welt.staerke[v.id]
    const rolle: Rolle = o.art === 'leihe' ? 'Stammspieler' : rolleFuer(effektiv, staerke)
    const gehalt = gehaltBei(v.id, wert, c.welt) * berater * (0.9 + rng.next() * 0.3)
    return {
      id: neueId(),
      art: o.art,
      vereinId: v.id,
      gehalt: Math.round(gehalt / 1000) * 1000,
      jahre: o.art === 'leihe' ? 1 : jahreFuer(a, rng),
      rolle,
      ablose: Math.round((wert * (0.8 + rng.next() * 0.5)) / 10_000) * 10_000,
      verhandelt: 0,
    }
  })
}

/** Angebot eines bestimmten Vereins (z. B. Verlängerung oder Rückkehr des alten Klubs). */
export function vereinsAngebot(c: Career, rng: Rng, vereinId: string, art: AngebotArt): Angebot {
  const p = c.spieler
  const a = alter(p.geburtsdatum, c.uhr.saison)
  const wert = marktwert(p, c.uhr.saison)
  const berater = 1 + Number(c.flags.beraterGuete ?? 1) * 0.04
  const ov = overall(p)
  const staerke = c.welt.staerke[vereinId]
  return {
    id: neueId(),
    art,
    vereinId,
    gehalt: Math.round((gehaltBei(vereinId, wert, c.welt) * berater * (0.95 + rng.next() * 0.2)) / 1000) * 1000,
    jahre: jahreFuer(a, rng),
    rolle: rolleFuer(ov, staerke),
    ablose: 0,
    verhandelt: 0,
  }
}

/** Garantiert mindestens ein Angebot: schwächster Verein des Heimatlandes (oder irgendeiner). */
export function notAngebot(c: Career, rng: Rng, art: AngebotArt): Angebot {
  const land = c.spieler.nationalitaet
  const vereine = Object.values(VEREINE)
    .filter((v) => v.land === land)
    .sort((a, b) => c.welt.staerke[a.id] - c.welt.staerke[b.id])
  const v = vereine[Math.min(vereine.length - 1, rng.int(0, 2))] ?? Object.values(VEREINE)[0]
  const wert = marktwert(c.spieler, c.uhr.saison)
  return {
    id: neueId(),
    art,
    vereinId: v.id,
    gehalt: gehaltBei(v.id, wert, c.welt),
    jahre: 2,
    rolle: 'Perspektive',
    ablose: 0,
    verhandelt: 0,
  }
}

/** Nachverhandeln: bessere Konditionen, aber das Angebot kann platzen. */
export function verhandle(c: Career, rng: Rng, angebot: Angebot, was: 'gehalt' | 'rolle' | 'laufzeit'): { angebot: Angebot | null; text: string } {
  const t = c.spieler.traits
  const berater = Number(c.flags.beraterGuete ?? 1)
  const chance = clamp(0.62 - angebot.verhandelt * 0.15 + (t.ruf - 50) / 250 + berater * 0.03 + gauss(rng) * 0.02, 0.15, 0.9)
  if (!rng.chance(chance)) {
    return { angebot: null, text: `${VEREINE[angebot.vereinId].name} zieht das Angebot zurück. Zu gierig gepokert!` }
  }
  const neu = { ...angebot, verhandelt: angebot.verhandelt + 1 }
  if (was === 'gehalt') {
    neu.gehalt = Math.round((angebot.gehalt * 1.15) / 1000) * 1000
    return { angebot: neu, text: `${VEREINE[angebot.vereinId].name} legt beim Gehalt nach.` }
  }
  if (was === 'rolle') {
    neu.rolle = angebot.rolle === 'Perspektive' ? 'Rotation' : 'Stammspieler'
    return { angebot: neu, text: `${VEREINE[angebot.vereinId].name} sichert dir eine größere Rolle zu.` }
  }
  neu.jahre = Math.min(5, angebot.jahre + 1)
  return { angebot: neu, text: `${VEREINE[angebot.vereinId].name} verlängert die Laufzeit um ein Jahr.` }
}

