import { baueEigenheim } from './eigenheim'
import { baueFerienhaus } from './ferienhaus'
import { baueMehrfamilienhaus } from './mehrfamilienhaus'
import { baueVilla, type VillaParameter, type VillaSzene } from './szene'
import type { DreiDTyp } from './typen'

/** Baut die 3D-Szene zur Objektart. */
export function baueHaus(typ: DreiDTyp, p: VillaParameter): VillaSzene {
  switch (typ) {
    case 'villa': return baueVilla(p)
    case 'eigenheim': return baueEigenheim(p)
    case 'mfh': return baueMehrfamilienhaus(p)
    case 'ferienhaus': return baueFerienhaus(p)
  }
}
