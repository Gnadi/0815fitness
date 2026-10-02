import { SAVE_VERSION } from '../engine/version'
import type { Career } from '../engine/types'

const PREFIX = 'karriere:save:'

/** Minimales Storage-Interface, damit sich localStorage später gegen IndexedDB tauschen lässt. */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  key(index: number): string | null
  readonly length: number
}

export interface SaveSummary {
  id: string
  name: string
  saison: number
  geaendert: number
  /** false bei Spielständen älterer, nicht mehr lesbarer Versionen. */
  kompatibel: boolean
}

export function createSaveStorage(store: KeyValueStore) {
  const ids = (): string[] => {
    const out: string[] = []
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i)
      if (k?.startsWith(PREFIX)) out.push(k.slice(PREFIX.length))
    }
    return out
  }

  const parse = (id: string): Career | null => {
    const raw = store.getItem(PREFIX + id)
    if (!raw) return null
    try {
      return JSON.parse(raw) as Career
    } catch {
      return null
    }
  }

  const load = (id: string): Career | null => {
    const c = parse(id)
    return c && c.version === SAVE_VERSION ? c : null
  }

  return {
    /** Gibt `false` zurück, wenn der Speicher voll ist. */
    save(career: Career): boolean {
      try {
        store.setItem(PREFIX + career.id, JSON.stringify({ ...career, geaendert: Date.now() }))
        return true
      } catch {
        return false
      }
    },
    load,
    remove(id: string): void {
      store.removeItem(PREFIX + id)
    },
    list(): SaveSummary[] {
      return ids()
        .map(parse)
        .filter((c): c is Career => c !== null)
        .map((c) => ({
          id: c.id,
          name: `${c.spieler.vorname} ${c.spieler.nachname}`,
          saison: c.uhr.saison,
          geaendert: c.geaendert,
          kompatibel: c.version === SAVE_VERSION,
        }))
        .sort((a, b) => b.geaendert - a.geaendert)
    },
    /** Spielstand als JSON-String für den Datei-Export. */
    exportJson(id: string): string | null {
      return store.getItem(PREFIX + id)
    },
    importJson(json: string): Career {
      const career = JSON.parse(json) as Career
      if (career.version !== SAVE_VERSION || !career.spieler || !career.welt) throw new Error('Spielstand hat ein nicht unterstütztes Format.')
      store.setItem(PREFIX + career.id, JSON.stringify(career))
      return career
    },
  }
}
