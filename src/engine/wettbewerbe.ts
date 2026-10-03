import { LAENDER, VEREINE } from '../data/clubs'
import { nationen } from '../data/nationen'
import { EUROPA_NAMEN, POKAL_NAMEN } from './kalender'
import type { Paarung } from './match'
import { clamp } from './rating'
import type { Rng } from './rng'
import { gauss, jugendAbzug, tabelleEintragen } from './welt'
import type { Career, EuropaStatus, TurnierStatus } from './types'

const EUROPA_KO: Record<number, { status: EuropaStatus; name: string }> = {
  9: { status: 'playoff', name: 'Playoff' },
  10: { status: 'achtel', name: 'Achtelfinale' },
  11: { status: 'viertel', name: 'Viertelfinale' },
  12: { status: 'halb', name: 'Halbfinale' },
  13: { status: 'finale', name: 'Finale' },
}
const EUROPA_NAECHSTE: Record<string, EuropaStatus> = { playoff: 'achtel', achtel: 'viertel', viertel: 'halb', halb: 'finale', finale: 'sieger' }

const TURNIER_KO: Record<number, { status: TurnierStatus; name: string }> = {
  4: { status: 'achtel', name: 'Achtelfinale' },
  5: { status: 'viertel', name: 'Viertelfinale' },
  6: { status: 'halb', name: 'Halbfinale' },
  7: { status: 'finale', name: 'Finale' },
}
const TURNIER_NAECHSTE: Record<string, TurnierStatus> = { achtel: 'viertel', viertel: 'halb', halb: 'finale', finale: 'sieger' }

/** Stärke der eigenen Mannschaft im jeweiligen Wettbewerb. */
export function eigeneStaerke(c: Career, wb: 'liga' | 'pokal' | 'europa' | 'turnier'): number {
  if (wb === 'turnier') return LAENDER[c.spieler.nationalitaet].national
  return (c.welt.staerke[c.vereinId] ?? 40) - jugendAbzug(c.saison.jugend)
}

function ligaGegner(c: Career, n: number): Paarung | null {
  const s = c.saison
  const tag = s.spielplan[n - 1]
  if (!tag) return null
  const idx = s.teams.indexOf(c.vereinId)
  const spiel = tag.find(([h, a]) => h === idx || a === idx)
  if (!spiel) return null
  const heim = spiel[0] === idx
  const gegnerId = s.teams[heim ? spiel[1] : spiel[0]]
  const abzug = jugendAbzug(s.jugend)
  return {
    wettbewerb: 'liga',
    label: s.jugend ? `U19-Spieltag ${n}` : `Spieltag ${n}`,
    gegnerId,
    gegner: s.jugend ? `${VEREINE[gegnerId].name} U19` : VEREINE[gegnerId].name,
    gegnerStaerke: c.welt.staerke[gegnerId] - abzug,
    eigeneStaerke: eigeneStaerke(c, 'liga'),
    heim,
    ko: false,
  }
}

function pokalGegner(c: Career, rng: Rng, runde: number): Paarung {
  const land = VEREINE[c.vereinId].land
  const alle = Object.values(VEREINE)
    .filter((v) => v.land === land && v.id !== c.vereinId)
    .sort((a, b) => c.welt.staerke[a.id] - c.welt.staerke[b.id])
  const { runden } = c.saison.pokal
  const q = clamp(0.3 + (0.65 * (runde - 1)) / Math.max(1, runden - 1) + gauss(rng) * 0.08, 0, 1)
  const gegner = alle[Math.round(q * (alle.length - 1))]
  const namen = POKAL_NAMEN[runden]
  return {
    wettbewerb: 'pokal',
    label: `${LAENDER[land].pokal}: ${namen[runde - 1]}`,
    gegnerId: gegner.id,
    gegner: gegner.name,
    gegnerStaerke: c.welt.staerke[gegner.id],
    eigeneStaerke: eigeneStaerke(c, 'pokal'),
    heim: rng.chance(0.5) || runde === runden,
    ko: true,
  }
}

function europaGegner(c: Career, rng: Rng, n: number): Paarung | null {
  const e = c.saison.europa
  if (!e.wb) return null
  const pool = c.welt.europa[e.wb].filter((id) => id !== c.vereinId)
  if (!pool.length) return null
  let ko = false
  let name = `Ligaphase ${n}`
  if (n <= 8) {
    if (e.status !== 'liga' || e.spiele !== n - 1) return null
  } else {
    const k = EUROPA_KO[n]
    if (!k || e.status !== k.status) return null
    ko = true
    name = k.name
  }
  // K.-o.-Spiele: stärkere Gegner wahrscheinlicher
  const gewichtet = pool.map((id) => ({ id, w: ko ? Math.exp(c.welt.staerke[id] / 12) : 1 }))
  const total = gewichtet.reduce((a, x) => a + x.w, 0)
  let r = rng.next() * total
  let gegnerId = gewichtet[0].id
  for (const x of gewichtet) {
    r -= x.w
    if (r <= 0) { gegnerId = x.id; break }
  }
  return {
    wettbewerb: 'europa',
    label: `${EUROPA_NAMEN[e.wb]}: ${name}`,
    gegnerId,
    gegner: VEREINE[gegnerId].name,
    gegnerStaerke: c.welt.staerke[gegnerId],
    eigeneStaerke: eigeneStaerke(c, 'europa'),
    heim: n <= 8 ? n % 2 === 1 : rng.chance(0.5),
    ko,
  }
}

function turnierGegner(c: Career, rng: Rng, n: number): Paarung | null {
  const t = c.saison.turnier
  if (!t) return null
  let ko = false
  let name = `Gruppenphase ${n}`
  if (n <= 3) {
    if (t.status !== 'gruppe' || t.spiele !== n - 1) return null
  } else {
    const k = TURNIER_KO[n]
    if (!k || t.status !== k.status) return null
    ko = true
    name = k.name
  }
  const wm = t.name.startsWith('WM')
  const pool = nationen(wm, c.spieler.nationalitaet)
  const nation = pool[rng.int(0, pool.length - 1)]
  // Im K.-o.-System eher stärkere Gegner
  const stark = ko ? [...pool].sort((a, b) => b.staerke - a.staerke).slice(0, Math.max(8, Math.floor(pool.length / 2))) : pool
  const g = ko ? stark[rng.int(0, stark.length - 1)] : nation
  return {
    wettbewerb: 'turnier',
    label: `${t.name}: ${name}`,
    gegnerId: g.id,
    gegner: g.name,
    gegnerStaerke: g.staerke,
    eigeneStaerke: eigeneStaerke(c, 'turnier'),
    heim: true,
    ko,
  }
}

/** Paarung für die aktuelle Woche oder `null` (spielfreie Woche). */
export function paarungFuerWoche(c: Career, rng: Rng): Paarung | null {
  const slot = c.saison.kalender[c.uhr.woche - 1]
  if (!slot) return null
  switch (slot.t) {
    case 'L': return ligaGegner(c, slot.n)
    case 'P': return c.saison.pokal.status === 'aktiv' && c.saison.pokal.runde === slot.n ? pokalGegner(c, rng, slot.n) : null
    case 'E': return europaGegner(c, rng, slot.n)
    case 'T': return turnierGegner(c, rng, slot.n)
    default: return null
  }
}

export interface Verbucht {
  saison: Career['saison']
  hinweise: string[]
  /** Neu gewonnene Titel (Namen). */
  titel: string[]
  elfmeter?: 'gewonnen' | 'verloren'
  weiter?: boolean
}

/** Schlägt das Ergebnis eines Spiels im jeweiligen Wettbewerb nieder (Tabelle, Runden, Titel). */
export function verbucheErgebnis(
  c: Career,
  rng: Rng,
  wb: 'liga' | 'pokal' | 'europa' | 'turnier',
  gegnerId: string,
  heim: boolean,
  tore: number,
  gegentore: number,
  eigene: number,
  gegner: number,
): Verbucht {
  const s = structuredClone(c.saison)
  const hinweise: string[] = []
  const titel: string[] = []
  let elfmeter: 'gewonnen' | 'verloren' | undefined
  let weiter: boolean | undefined

  const ko = (): boolean => {
    if (tore > gegentore) return true
    if (tore < gegentore) return false
    const gewonnen = rng.chance(clamp(0.5 + (eigene - gegner) / 250, 0.25, 0.75))
    elfmeter = gewonnen ? 'gewonnen' : 'verloren'
    return gewonnen
  }

  if (wb === 'liga') {
    if (heim) tabelleEintragen(s.tabelle, c.vereinId, gegnerId, tore, gegentore)
    else tabelleEintragen(s.tabelle, gegnerId, c.vereinId, gegentore, tore)
  } else if (wb === 'pokal') {
    weiter = ko()
    if (weiter) {
      if (s.pokal.runde >= s.pokal.runden) {
        s.pokal.status = 'sieger'
        titel.push(LAENDER[VEREINE[c.vereinId].land].pokal)
        hinweise.push('Pokalsieger! Der Pott gehört euch.')
      } else {
        s.pokal.runde++
        hinweise.push('Ihr zieht in die nächste Pokalrunde ein.')
      }
    } else {
      s.pokal.status = 'ausgeschieden'
      hinweise.push('Aus im Pokal.')
    }
  } else if (wb === 'europa') {
    const e = s.europa
    if (e.status === 'liga') {
      e.spiele++
      e.punkte += tore > gegentore ? 3 : tore === gegentore ? 1 : 0
      if (e.spiele >= 8) {
        e.status = e.punkte >= 16 ? 'achtel' : e.punkte >= 9 ? 'playoff' : 'aus'
        hinweise.push(
          e.status === 'achtel' ? `Ligaphase mit ${e.punkte} Punkten beendet: direkt im Achtelfinale!`
            : e.status === 'playoff' ? `Ligaphase mit ${e.punkte} Punkten beendet: ab in die Playoffs.`
              : `Ligaphase mit ${e.punkte} Punkten beendet: Aus in Europa.`,
        )
      }
    } else {
      weiter = ko()
      if (weiter) {
        e.status = EUROPA_NAECHSTE[e.status]
        if (e.status === 'sieger' && e.wb) {
          titel.push(EUROPA_NAMEN[e.wb])
          hinweise.push(`${EUROPA_NAMEN[e.wb]}-Sieger! Europa liegt euch zu Füßen.`)
        } else hinweise.push('Ihr zieht in die nächste Europapokal-Runde ein.')
      } else {
        e.status = 'aus'
        hinweise.push('Aus im Europapokal.')
      }
    }
  } else if (wb === 'turnier' && s.turnier) {
    const t = s.turnier
    if (t.status === 'gruppe') {
      t.spiele++
      t.punkte += tore > gegentore ? 3 : tore === gegentore ? 1 : 0
      if (t.spiele >= 3) {
        const weiterKommt = t.punkte >= 4 || (t.punkte === 3 && rng.chance(0.5))
        t.status = weiterKommt ? 'achtel' : 'aus'
        hinweise.push(weiterKommt ? `Gruppenphase überstanden (${t.punkte} Punkte).` : `Gruppenphase mit ${t.punkte} Punkten beendet: Das Turnier ist vorbei.`)
      }
    } else {
      weiter = ko()
      if (weiter) {
        t.status = TURNIER_NAECHSTE[t.status]
        if (t.status === 'sieger') {
          titel.push(t.name)
          hinweise.push(`${t.name}-Sieger! Ein ganzes Land liegt sich in den Armen.`)
        } else hinweise.push('Ihr zieht in die nächste Turnierrunde ein.')
      } else {
        t.status = 'aus'
        hinweise.push('Aus im Turnier.')
      }
    }
  }
  return { saison: s, hinweise, titel, elfmeter, weiter }
}

