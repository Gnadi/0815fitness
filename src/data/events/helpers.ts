import { VEREINE } from '../clubs'
import { depotGesamt, depotVon } from '../../engine/finanzen'
import { alter, overall } from '../../engine/rating'
import { rangliste } from '../../engine/welt'
import type { Career, Skills, Traits } from '../../engine/types'
import type { Anlage } from '../../engine/types'
import { punkte } from '../../engine/welt'
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
export const anlageWert = (c: Career, k: Anlage): number => depotVon(c)[k].wert
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
export const vcAktivAnzahl = (c: Career): number => (c.beteiligungen ?? []).filter((b) => b.status === 'aktiv').length
export const DEPOT = (anlage: Anlage | 'alle', faktor: number): Effekt => ({ t: 'depot', anlage, faktor })
export const INVEST = (anlage: Anlage, anteil: number): Effekt => ({ t: 'invest', anlage, anteil })
export const ABHEBEN = (anlage: Anlage | 'alle', anteil: number): Effekt => ({ t: 'abheben', anlage, anteil })
export const IMMO = (faktor: number): Effekt => ({ t: 'immo', faktor })
export const BESITZ = (id: string): Effekt => ({ t: 'besitz', id })
export const immoAnzahl = (c: Career): number => (c.immobilien ?? []).filter((i) => i.status === 'aktiv').length
export const vermietet = (c: Career): boolean => (c.immobilien ?? []).some((i) => i.status === 'aktiv' && i.miete > 0)
export const hatBesitz = (c: Career, id: string): boolean => id in (c.privat?.besitz ?? {})
export const STAERKE = (d: number): Effekt => ({ t: 'vereinsstaerke', d })

/** Nummer des aktuellen Liga-Spieltags (0 = keine Ligawoche). */
export function spieltag(c: Career): number {
  const s = c.saison.kalender[c.uhr.woche - 1]
  return s?.t === 'L' ? s.n : 0
}
/** Verbleibende Ligaspieltage nach dem aktuellen. */
export const restSpieltage = (c: Career): number => Math.max(0, c.saison.spielplan.length - spieltag(c))
/** Punkte des Spielers-Vereins minus Punkte des Teams auf dem gegebenen Platz (1-basiert). */
export function punkteAbstand(c: Career, platz: number): number {
  const r = rangliste(c.saison.tabelle, c.saison.teams)
  const ich = r.find((x) => x.id === c.vereinId)
  const ziel = r[platz - 1]
  return ich && ziel ? ich.pkt - ziel.pkt : 0
}
export const punkteVerein = (c: Career): number => {
  const z = c.saison.tabelle[c.vereinId]
  return z ? punkte(z) : 0
}
export const trainerTyp = (c: Career): string => String(c.flags.trainerTyp ?? '')
/** Spieler spielt in einem anderen Land als dem Heimatland. */
export const imAusland = (c: Career): boolean => profi(c) && landVerein(c) !== c.spieler.nationalitaet
/** Eigener Verein ist im Land `land` (Länder-ID, z. B. 'TR'). */
export const inLand = (c: Career, ...land: string[]): boolean => profi(c) && land.includes(landVerein(c))
/** Social-Media-Reichweite in Tausend Followern (0 = noch kein Kanal). */
export const follower = (c: Career): number => Number(c.flags.follower ?? 0)
export const FOLLOWER = (d: number): Effekt => ({ t: 'zaehle', k: 'follower', d })
/** Der Spieler verbringt gerade ein Jahr ohne Verein. */
export const imPausenjahr = (c: Career): boolean => c.vereinId === '' && c.vertrag === null && !c.saison.jugend && zahl(c, 'pausenjahre') > 0
/** Verkürzt die laufende Verletzung um `wochen`. */
export const REHA = (wochen: number): Effekt => ({ t: 'reha', wochen })
/** Art des aktuellen Transferfensters (null außerhalb). */
export const fensterArt = (c: Career): 'sommer' | 'winter' | null => {
  const s = c.saison.kalender[c.uhr.woche - 1]
  return s?.t === 'F' ? (s.fenster ?? null) : null
}
/** Ein Turnier (EM/WM) läuft und der Verein des Spielers hat es noch nicht verlassen. */
export const turnierAktiv = (c: Career): boolean => c.saison.turnier !== null && c.saison.turnier.status !== 'aus' && c.saison.turnier.status !== 'sieger' && c.saison.kalender[c.uhr.woche - 1]?.t === 'T'
export const nationalspieler = (c: Career): boolean => flag(c, 'nationalspieler')
/** Twitch-Follower bzw. YouTube-Abonnenten in Tausend. */
export const twitch = (c: Career): number => Number(c.flags.twitch ?? 0)
export const abos = (c: Career): number => Number(c.flags.abos ?? 0)
export const TWITCH = (d: number): Effekt => ({ t: 'zaehle', k: 'twitch', d })
export const ABOS = (d: number): Effekt => ({ t: 'zaehle', k: 'abos', d })
export const hatTwitch = (c: Career): boolean => !jugend(c) && flag(c, 'twitchKanal')
export const hatYoutube = (c: Career): boolean => !jugend(c) && flag(c, 'youtube')
export const hatInsta = (c: Career): boolean => !jugend(c) && flag(c, 'insta')
