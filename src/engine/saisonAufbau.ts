import { LAENDER, VEREINE } from '../data/clubs'
import { baueKalender, pokalRunden, turnierName } from './kalender'
import { alter, clamp, overall } from './rating'
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

  let turnier: Saison['turnier'] = null
  const tName = turnierName(c.uhr.saison)
  const daten = LAENDER[c.spieler.nationalitaet]
  if (!jugend && tName && c.flags.nationalspieler === true && !daten.gesperrt) {
    const qualifiziert = rng.chance(clamp((daten.national - 50) / 30, 0.15, 0.97))
    if (qualifiziert && overall(c.spieler) >= daten.national - 10) {
      turnier = { name: tName, status: 'gruppe', punkte: 0, spiele: 0 }
    }
  }

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
  }
}

export const istJugend = (c: Pick<Career, 'spieler'>, saison: number): boolean => alter(c.spieler.geburtsdatum, saison) < 18
