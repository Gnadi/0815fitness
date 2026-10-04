import { VEREINE } from '../data/clubs'
import { baueKalender, pokalRunden } from './kalender'
import { baueTurnier } from './nationalteam'
import { alter } from './rating'
import type { Rng } from './rng'
import type { Career, Saison } from './types'
import { ligaVonVerein, neueLigaSaison } from './welt'

/** Liga-ID des aktuellen Vereins. */
export function aktuelleLiga(c: Pick<Career, 'welt' | 'vereinId'>): string {
  return ligaVonVerein(c.welt, c.vereinId) ?? VEREINE[c.vereinId].ligaStart
}

/** Baut Tabelle, Spielplan, Wettbewerbe und Kalender für die Saison `c.uhr.saison` des aktuellen Vereins. */
export function baueSaison(c: Career, rng: Rng, jugend: boolean): Saison {
  const ligaId = aktuelleLiga(c)
  const land = VEREINE[c.vereinId].land
  const { teams, spielplan, tabelle } = neueLigaSaison(c.welt, ligaId, rng)

  let wb: Saison['europa']['wb'] = null
  if (!jugend) {
    for (const k of ['CL', 'EL', 'ECL'] as const) if (c.welt.europa[k].includes(c.vereinId)) wb = k
  }

  const { turnier, turnierInfo } = jugend ? { turnier: null, turnierInfo: undefined } : baueTurnier(c, rng)

  const runden = pokalRunden(land)
  return {
    ligaId,
    jugend,
    teams,
    spielplan,
    tabelle,
    kalender: baueKalender({ spieltage: spielplan.length, pokalRunden: runden, europa: wb, turnier: !!turnier, jugend }),
    pokal: { status: jugend ? 'ausgeschieden' : 'aktiv', runde: 1, runden },
    europa: { wb, status: wb ? 'liga' : 'aus', punkte: 0, spiele: 0 },
    turnier,
    turnierInfo,
  }
}

export const istJugend = (c: Pick<Career, 'spieler'>, saison: number): boolean => alter(c.spieler.geburtsdatum, saison) < 18
