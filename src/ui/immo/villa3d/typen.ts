import type { ImmoTyp } from '../../../engine/types'

/** Objektarten mit 3D-Ansicht. Eigene Datei ohne Three.js, damit das Exposé sie ohne den großen Viewer kennen kann. */
export const DREI_D_TYPEN = ['villa', 'eigenheim', 'mfh', 'ferienhaus'] as const
export type DreiDTyp = (typeof DREI_D_TYPEN)[number]

export const hat3D = (typ: ImmoTyp): typ is DreiDTyp => (DREI_D_TYPEN as readonly string[]).includes(typ)
