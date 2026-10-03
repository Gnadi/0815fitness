import { VEREINE } from '../clubs'
import { depotGesamt, depotVon, vcZiel } from '../../engine/finanzen'
import { alter, overall } from '../../engine/rating'
import { rangliste } from '../../engine/welt'
import type { Career, Skills, Traits } from '../../engine/types'
import type { Anlage } from '../../engine/types'
import type { AktionName, Effekt, Txt } from './types'

export const alterVon = (c: Career): number => alter(c.spieler.geburtsdatum, c.uhr.saison)
export const ov = (c: Career): number => overall(c.spieler)
export const trait = (c: Career, k: keyof Traits): number => c.spieler.traits[k]
export const flag = (c: Career, k: string): boolean => c.flags[k] === true
export const zahl = (c: Career, k: string): number => Number(c.flags[k] ?? 0)
export const jugend = (c: Career): boolean => c.saison.jugend
export const profi = (c: Career): boolean => !c.saison.jugend && c.vereinId !== ''
export const gehalt = (c: Career): number => c.vertrag?.gehalt ?? 0
export const geldAb = (n: number) => (c: Career): boolean => c.spieler.geld >= n
export const depotWert = (c: Career): number => depotGesamt(c)
export const anlageWert = (c: Career, k: 'tagesgeld' | 'etf' | 'krypto'): number => depotVon(c)[k].wert
export const hatPartner = (c: Career): boolean => c.personen.partner !== null
export const verletzt = (c: Career): boolean => c.verletzung !== null
export const staerkeVerein = (c: Career): number => c.welt.staerke[c.vereinId] ?? 0
export const landVerein = (c: Career): string => VEREINE[c.vereinId]?.land ?? c.spieler.nationalitaet

/** Aktueller Tabellenplatz (0 = unbekannt). */
export function tabellenplatz(c: Career): number {
  const r = rangliste(c.saison.tabelle, c.saison.teams)
  return r.findIndex((x) => x.id === c.vereinId) + 1
}

/** Geld abhängig vom Jahresgehalt (Anteil, mindestens `min`). */
export const anteil = (p: number, min = 0) => (c: Career): number => Math.max(min, Math.round((gehalt(c) * p) / 100) * 100)

// Kurzformen für Effekte
export const T = (d: Partial<Traits>): Effekt => ({ t: 'traits', d })
export const S = (d: Partial<Skills>): Effekt => ({ t: 'skills', d })
export const G = (d: number | ((c: Career) => number)): Effekt => ({ t: 'geld', d })
export const LEBEN = (d: number): Effekt => ({ t: 'lebensstil', d })
export const FLAG = (k: string, v?: boolean | number | string): Effekt => ({ t: 'flag', k, v })
export const ZAEHLE = (k: string, d: number): Effekt => ({ t: 'zaehle', k, d })
export const FOLGE = (id: string, wochen: number, p?: number): Effekt => ({ t: 'folge', id, wochen, p })
export const VERL = (name: string, wochen: number): Effekt => ({ t: 'verletzung', name, wochen })
export const SPERRE = (spiele: number): Effekt => ({ t: 'sperre', spiele })
export const NEWS = (text: Txt): Effekt => ({ t: 'schlagzeile', text })
export const AKT = (name: AktionName): Effekt => ({ t: 'aktion', name })
export const VC_EINSTIEG = (anteil: number, gut = false): Effekt => ({ t: 'vcEinstieg', anteil, gut })
export const VC_AUFSTOCKEN = (anteil: number): Effekt => ({ t: 'vcAufstocken', anteil })
export const VC_WERT = (faktor: number): Effekt => ({ t: 'vcWert', faktor })
export const VC_RUNDE = (faktor: number): Effekt => ({ t: 'vcRunde', faktor })
export const VC_EXIT = (faktor: number): Effekt => ({ t: 'vcExit', faktor })
export const VC_PLEITE: Effekt = { t: 'vcPleite' }
export const hatVcZiel = (c: Career): boolean => vcZiel(c) !== undefined
export const vcAktivAnzahl = (c: Career): number => (c.beteiligungen ?? []).filter((b) => b.status === 'aktiv').length
export const DEPOT = (anlage: Anlage | 'alle', faktor: number): Effekt => ({ t: 'depot', anlage, faktor })
export const INVEST = (anlage: Anlage, anteil: number): Effekt => ({ t: 'invest', anlage, anteil })
export const ABHEBEN = (anlage: Anlage | 'alle', anteil: number): Effekt => ({ t: 'abheben', anlage, anteil })
