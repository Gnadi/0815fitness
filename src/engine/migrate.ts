import { startZustand } from './newCareer'
import { SAVE_VERSION } from './version'
import type { Career } from './types'

/** Bringt ältere Spielstände auf das aktuelle Format. */
export function migrate(raw: Career): Career {
  if (raw.version >= SAVE_VERSION) return raw
  // v1 -> v2: Wochenschleife (Verein, Form, Verletzung, Statistik …)
  const defaults = startZustand(raw.spieler, raw.uhr.saison)
  return { ...defaults, ...raw, version: SAVE_VERSION }
}
