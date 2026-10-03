import { AT, CH, DE, EN, ES, FR, IT } from './welle1'
import {
  BE, CZ, DK, GR, HR, HU, IL, NL, NO, PL, PT, RO, RS, SC, SE, TR, UA,
} from './welle2'
import {
  AD, AL, AM, AZ, BA, BG, BY, CY, EE, FI, FO, GE, GI, IE, IS, KZ, LI, LT, LU, LV, MD, ME, MK, MT, NI, RU, SI, SK, SM, WA, XK,
} from './welle3'
import type { LandDaten } from './types'

export type { LandDaten, LigaDef, VereinDef } from './types'

export const LAENDER: Record<string, LandDaten> = Object.fromEntries(
  [
    DE, AT, CH, EN, ES, IT, FR,
    NL, PT, BE, TR, SC, GR, DK, NO, SE, PL, CZ, HR, RS, UA, RO, HU, IL,
    SK, SI, BG, CY, FI, IE, IS, NI, WA, BA, AL, MK, ME, XK, AZ, AM, GE, KZ, BY, MD, LT, LV, EE, LU, MT, FO, GI, AD, SM, LI, RU,
  ].map((l) => [l.land, l]),
)

export interface Verein {
  id: string
  name: string
  land: string
  /** Grundstärke aus den Daten (Anker für die Entwicklung der Stärke). */
  basis: number
  ligaStart: string
}

export interface Liga {
  id: string
  land: string
  ebene: number
  name: string
  ab: number
}

const slug = (s: string) =>
  s.toLowerCase().replaceAll('ä', 'ae').replaceAll('ö', 'oe').replaceAll('ü', 'ue').replaceAll('ß', 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const VEREINE: Record<string, Verein> = {}
export const LIGEN: Record<string, Liga> = {}
/** Start-Mitgliedschaft der Ligen. */
export const LIGA_START: Record<string, string[]> = {}

for (const l of Object.values(LAENDER)) {
  l.ligen.forEach((ld, i) => {
    const id = `${l.land}${i + 1}`
    LIGEN[id] = { id, land: l.land, ebene: i + 1, name: ld.name, ab: ld.ab }
    LIGA_START[id] = []
    for (const [name, basis] of ld.vereine) {
      const vid = `${l.land}.${slug(name)}`
      if (VEREINE[vid]) throw new Error(`Doppelter Verein: ${vid}`)
      VEREINE[vid] = { id: vid, name, land: l.land, basis, ligaStart: id }
      LIGA_START[id].push(vid)
    }
  })
}

export const ligaIds = (land: string): string[] =>
  Object.keys(LIGEN).filter((id) => LIGEN[id].land === land).sort((a, b) => LIGEN[a].ebene - LIGEN[b].ebene)

export const vereinName = (id: string): string => VEREINE[id]?.name ?? 'Vereinslos'
