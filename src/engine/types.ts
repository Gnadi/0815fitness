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

export type TrainingFocus =
  | 'ausgewogen'
  | 'technik'
  | 'schuss'
  | 'physis'
  | 'defensive'
  | 'extraschicht'
  | 'regeneration'

export type Einsatz = 'startelf' | 'einwechslung' | 'nicht-eingesetzt'

export interface Injury {
  name: string
  wochen: number
}

/** Platzhalter-Verein bis zur Vereinsdatenbank (Meilenstein 4). */
export interface ClubRef {
  name: string
  staerke: number
}

export interface SeasonStats {
  saison: number
  alter: number
  verein: string
  spiele: number
  startelf: number
  minuten: number
  tore: number
  vorlagen: number
  notenSumme: number
  gelb: number
  rot: number
  siege: number
  remis: number
  niederlagen: number
  overallStart: number
  overallEnde: number
  skillsStart: Skills
}

/** Laufendes Spiel mit Schlüsselszenen, wartet auf Entscheidungen. */
export interface MatchState {
  gegner: string
  gegnerStaerke: number
  heim: boolean
  einsatz: Exclude<Einsatz, 'nicht-eingesetzt'>
  basisEigene: number
  basisGegner: number
  szenen: string[]
  index: number
  /** Ergebnistext der letzten Entscheidung, wartet auf „Weiter“. */
  ausgang: string | null
  eigeneTore: number
  gegnerTore: number
  spielerTore: number
  vorlagen: number
  note: number
  gelb: boolean
  rot: boolean
  verletzt: boolean
  frueherEnde: boolean
  szenenLog: string[]
}

export interface WeekReport {
  saison: number
  woche: number
  trainingText: string
  deltas: { skill: keyof Skills; delta: number }[]
  ergebnis?: {
    gegner: string
    heim: boolean
    tore: number
    gegentore: number
    einsatz: Einsatz
    note: number | null
    spielerTore: number
    vorlagen: number
    gelb: boolean
    rot: boolean
  }
  schlagzeile?: string
  szenenLog: string[]
  hinweise: string[]
}

export interface SeasonReport {
  stats: SeasonStats
  deltas: { skill: keyof Skills; delta: number }[]
  hinweise: string[]
}

export type Phase = 'planung' | 'szene' | 'bericht' | 'saisonende' | 'karriereende'

export interface Career {
  id: string
  version: number
  erstellt: number // Unix-ms
  geaendert: number // Unix-ms
  seed: number
  rngState: number
  uhr: CareerClock
  spieler: Player
  /** ID des aktuellen Vereins in der Vereinsdatenbank (ab Meilenstein 4). */
  vereinId: string
  verein: ClubRef
  /** Aktuelle Form 0–100. */
  form: number
  verletzung: Injury | null
  /** Anzahl gesperrter Spiele. */
  sperre: number
  training: TrainingFocus
  phase: Phase
  match: MatchState | null
  bericht: WeekReport | null
  saisonBericht: SeasonReport | null
  saisonStats: SeasonStats
  historie: SeasonStats[]
  /** IDs bereits ausgelöster Ereignisse samt Flags für Ereignisketten. */
  flags: Record<string, number | boolean | string>
  /** Schlagzeilen und Meldungen, neueste zuletzt. */
  log: string[]
}
