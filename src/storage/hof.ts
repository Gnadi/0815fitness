import type { KarriereRueckblick } from '../engine/types'
import { legende } from '../engine/legende'
import { gesamtStats, alleStats } from '../engine/statistik'
import type { KeyValueStore } from './saves'

const PREFIX = 'karriere:hof:'

/** Kompakte Zusammenfassung einer abgeschlossenen Karriere für die Hall of Fame. */
export interface HofEintrag {
  id: string
  name: string
  nationalitaet: string
  position: string
  klasse: string
  punkte: number
  vonSaison: number
  bisSaison: number
  spiele: number
  tore: number
  vorlagen: number
  laenderspiele: number
  titel: number
  vereine: number
  hoechsterMarktwert: number
  vermoegen: number
  archiviert: number
  /** Voller Rückblick für den Karriereende-Screen; fehlt bei Einträgen aus der ersten Version. */
  karriere?: KarriereRueckblick
}

export function hofEintrag(c: KarriereRueckblick): HofEintrag {
  const g = gesamtStats(c)
  const l = legende(c)
  const stats = alleStats(c)
  return {
    id: c.id,
    name: `${c.spieler.vorname} ${c.spieler.nachname}`,
    nationalitaet: c.spieler.nationalitaet,
    position: c.spieler.position,
    klasse: l.klasse,
    punkte: l.punkte,
    vonSaison: stats[0]?.saison ?? c.uhr.saison,
    bisSaison: stats[stats.length - 1]?.saison ?? c.uhr.saison,
    spiele: g.spiele,
    tore: g.tore,
    vorlagen: g.vorlagen,
    laenderspiele: c.laufbahn.laenderspiele,
    titel: c.laufbahn.titel.length + c.laufbahn.auszeichnungen.length,
    vereine: g.vereine,
    hoechsterMarktwert: c.laufbahn.hoechsterMarktwert,
    vermoegen: c.spieler.geld,
    archiviert: Date.now(),
    karriere: {
      id: c.id, spieler: c.spieler, uhr: c.uhr, flags: c.flags, laufbahn: c.laufbahn,
      erfolge: c.erfolge, historie: c.historie, saisonStats: c.saisonStats,
    },
  }
}

export function createHofStorage(store: KeyValueStore) {
  return {
    /** Gibt `false` zurück, wenn der Speicher voll ist. */
    archive(c: KarriereRueckblick): boolean {
      try {
        store.setItem(PREFIX + c.id, JSON.stringify(hofEintrag(c)))
        return true
      } catch {
        return false
      }
    },
    get(id: string): HofEintrag | null {
      try {
        return JSON.parse(store.getItem(PREFIX + id) ?? 'null') as HofEintrag | null
      } catch {
        return null
      }
    },
    has(id: string): boolean {
      return store.getItem(PREFIX + id) !== null
    },
    remove(id: string): void {
      store.removeItem(PREFIX + id)
    },
    /** Alle Einträge, die besten (meiste Ruhm-Punkte) zuerst. */
    list(): HofEintrag[] {
      const out: HofEintrag[] = []
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i)
        if (!k?.startsWith(PREFIX)) continue
        try {
          out.push(JSON.parse(store.getItem(k) ?? '') as HofEintrag)
        } catch {
          // beschädigten Eintrag überspringen
        }
      }
      return out.sort((a, b) => b.punkte - a.punkte || b.archiviert - a.archiviert)
    },
  }
}
