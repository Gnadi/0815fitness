export type Position = 'TW' | 'IV' | 'AV' | 'ZDM' | 'ZM' | 'ZOM' | 'AF' | 'ST'
export type Foot = 'links' | 'rechts' | 'beidfüßig'
export type Background = 'arbeiterfamilie' | 'fussballerfamilie' | 'akademiker'
export type Archetype = 'strassenfussballer' | 'akademietalent' | 'spaetzuender'

/** Fußball-Attribute, 1–100. */
export interface Skills {
  tempo: number
  schuss: number
  pass: number
  dribbling: number
  defensive: number
  physis: number
  technik: number
  positionsspiel: number
}

/** Mentale, soziale und private Werte, 0–100. */
export interface Traits {
  moral: number
  selbstvertrauen: number
  disziplin: number
  professionalitaet: number
  ehrgeiz: number
  ruf: number
  fanbeliebtheit: number
  trainerBeziehung: number
  kabine: number
  fitness: number
  gesundheit: number
  privatglueck: number
}

export interface Player {
  vorname: string
  nachname: string
  geburtsdatum: string // ISO
  nationalitaet: string // Länder-ID
  position: Position
  fuss: Foot
  hintergrund: Background
  archetyp: Archetype
  skills: Skills
  traits: Traits
  /** Verdecktes Potenzial (Obergrenze der Gesamtstärke). */
  potenzial: number
  geld: number // in Euro
}

export interface CareerClock {
  saison: number // Startjahr der Saison, z. B. 2026
  woche: number // 1..40
}

export interface Career {
  id: string
  version: number
  erstellt: number // Unix-ms
  geaendert: number // Unix-ms
  seed: number
  rngState: number
  uhr: CareerClock
  spieler: Player
  /** ID des aktuellen Vereins in der Vereinsdatenbank. */
  vereinId: string
  /** IDs bereits ausgelöster Ereignisse samt Flags für Ereignisketten. */
  flags: Record<string, number | boolean | string>
  log: string[]
}
