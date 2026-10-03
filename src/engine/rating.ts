import type { Player, Position, Skills } from './types'

export const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))

export const SKILL_KEYS: (keyof Skills)[] = [
  'tempo', 'schuss', 'pass', 'dribbling', 'defensive', 'physis', 'technik', 'positionsspiel',
]

export const SKILL_LABELS: Record<keyof Skills, string> = {
  tempo: 'Tempo', schuss: 'Schuss', pass: 'Pass', dribbling: 'Dribbling',
  defensive: 'Defensive', physis: 'Physis', technik: 'Technik', positionsspiel: 'Positionsspiel',
}

/** Wie wichtig ein Skill auf einer Position ist (Summe je Position = 1). */
export const POSITION_WEIGHTS: Record<Position, Partial<Record<keyof Skills, number>>> = {
  TW: { positionsspiel: 0.35, defensive: 0.25, physis: 0.15, tempo: 0.1, technik: 0.1, pass: 0.05 },
  IV: { defensive: 0.35, physis: 0.2, positionsspiel: 0.2, tempo: 0.1, pass: 0.1, technik: 0.05 },
  AV: { tempo: 0.25, defensive: 0.2, pass: 0.15, physis: 0.1, dribbling: 0.1, positionsspiel: 0.1, technik: 0.1 },
  ZDM: { defensive: 0.25, pass: 0.2, positionsspiel: 0.2, physis: 0.15, technik: 0.1, tempo: 0.1 },
  ZM: { pass: 0.25, technik: 0.15, positionsspiel: 0.15, dribbling: 0.1, defensive: 0.1, physis: 0.1, schuss: 0.05, tempo: 0.1 },
  ZOM: { pass: 0.25, technik: 0.2, dribbling: 0.15, schuss: 0.15, positionsspiel: 0.1, tempo: 0.1, physis: 0.05 },
  AF: { tempo: 0.25, dribbling: 0.25, technik: 0.1, schuss: 0.15, pass: 0.1, positionsspiel: 0.1, physis: 0.05 },
  ST: { schuss: 0.3, positionsspiel: 0.2, tempo: 0.15, physis: 0.15, technik: 0.1, dribbling: 0.1 },
}

/** Gesamtstärke (1–100) aus den positionsgewichteten Skills. */
export function overall(p: Pick<Player, 'position' | 'skills'>): number {
  const w = POSITION_WEIGHTS[p.position]
  let sum = 0
  for (const k of SKILL_KEYS) sum += p.skills[k] * (w[k] ?? 0)
  return sum
}

export function alter(geburtsdatum: string, saison: number): number {
  return saison - Number(geburtsdatum.slice(0, 4))
}
