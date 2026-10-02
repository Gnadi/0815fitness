import { POSITION_WEIGHTS, SKILL_KEYS, alter, clamp } from './rating'
import type { Career, Skills, TrainingFocus } from './types'

export interface FocusDef {
  id: TrainingFocus
  name: string
  beschreibung: string
  /** Gewicht je Skill; `position` = nach Positionsrelevanz. */
  gewichte: Partial<Record<keyof Skills, number>> | 'position'
  /** Fitness-Verbrauch (negativ = Erholung). */
  ermuedung: number
  verletzungsrisiko: number
  privatglueck: number
}

const ALLE = 0.45

export const FOCUS: Record<TrainingFocus, FocusDef> = {
  ausgewogen: {
    id: 'ausgewogen', name: 'Ausgewogen', beschreibung: 'Von allem etwas, schonend für den Körper.',
    gewichte: Object.fromEntries(SKILL_KEYS.map((k) => [k, ALLE])), ermuedung: 4, verletzungsrisiko: 0, privatglueck: 0,
  },
  technik: {
    id: 'technik', name: 'Technik', beschreibung: 'Technik, Dribbling und Passspiel.',
    gewichte: { technik: 1, dribbling: 0.8, pass: 0.8, schuss: 0.1, positionsspiel: 0.1 }, ermuedung: 6, verletzungsrisiko: 0, privatglueck: 0,
  },
  schuss: {
    id: 'schuss', name: 'Abschluss', beschreibung: 'Schusstechnik und Torinstinkt.',
    gewichte: { schuss: 1, positionsspiel: 0.6, technik: 0.4 }, ermuedung: 6, verletzungsrisiko: 0, privatglueck: 0,
  },
  physis: {
    id: 'physis', name: 'Athletik', beschreibung: 'Kraft und Tempo, aber zehrt am Körper.',
    gewichte: { physis: 1, tempo: 0.8, defensive: 0.3 }, ermuedung: 9, verletzungsrisiko: 0.006, privatglueck: 0,
  },
  defensive: {
    id: 'defensive', name: 'Defensivarbeit', beschreibung: 'Zweikämpfe und Stellungsspiel.',
    gewichte: { defensive: 1, positionsspiel: 0.7, physis: 0.3 }, ermuedung: 6, verletzungsrisiko: 0, privatglueck: 0,
  },
  extraschicht: {
    id: 'extraschicht', name: 'Extraschicht', beschreibung: 'Zusatztraining auf deiner Position. Schnell besser, aber riskant.',
    gewichte: 'position', ermuedung: 12, verletzungsrisiko: 0.015, privatglueck: -2,
  },
  regeneration: {
    id: 'regeneration', name: 'Regeneration', beschreibung: 'Kräfte tanken, Fitness aufbauen.',
    gewichte: {}, ermuedung: -20, verletzungsrisiko: -0.01, privatglueck: 1,
  },
}

export const FOCUS_LIST = Object.values(FOCUS)

const BASE = 0.18

function altersfaktor(a: number): number {
  if (a <= 17) return 1.25
  if (a === 18) return 1.1
  if (a === 19) return 1.0
  if (a === 20) return 0.85
  if (a === 21) return 0.7
  if (a === 22) return 0.55
  if (a === 23) return 0.45
  if (a === 24) return 0.35
  if (a <= 26) return 0.25
  if (a <= 28) return 0.12
  return 0.03
}

/** Wöchentlicher Skill-Zuwachs für den gewählten Trainingsfokus. */
export function trainingDeltas(c: Career, focus: TrainingFocus): Partial<Record<keyof Skills, number>> {
  const def = FOCUS[focus]
  const p = c.spieler
  const a = alter(p.geburtsdatum, c.uhr.saison)
  const talent = 0.6 + (p.potenzial / 100) * 0.8
  const pro = 0.8 + p.traits.professionalitaet / 250
  const fit = 0.6 + (0.4 * p.traits.fitness) / 100
  const posW = POSITION_WEIGHTS[p.position]
  const out: Partial<Record<keyof Skills, number>> = {}

  for (const k of SKILL_KEYS) {
    const w = def.gewichte === 'position' ? Math.min(1.3, (posW[k] ?? 0) * 3.2) + 0.1 : (def.gewichte[k] ?? 0)
    if (w <= 0) continue
    const relevanz = 0.8 + 2 * (posW[k] ?? 0)
    const spielraum = clamp((p.potenzial + 8 - p.skills[k]) / 20, 0, 1)
    out[k] = BASE * w * relevanz * altersfaktor(a) * talent * pro * fit * spielraum
  }
  return out
}
