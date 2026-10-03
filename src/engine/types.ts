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
  woche: number // 1-basierter Index in `saison.kalender`
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

// ---------------------------------------------------------------- Vertrag & Markt

export type Rolle = 'Stammspieler' | 'Rotation' | 'Perspektive' | 'Jugend'

export interface Vertrag {
  /** Jahresgehalt in Euro. */
  gehalt: number
  /** Letzte Saison (Startjahr), für die der Vertrag gilt. */
  endeSaison: number
  rolle: Rolle
}

/** Wenn der Spieler verliehen ist, steht hier der Stammverein samt Vertrag. */
export interface Leihe {
  vonVerein: string
  vertrag: Vertrag
}

export type AngebotArt = 'transfer' | 'leihe' | 'verlaengerung' | 'profivertrag' | 'vereinslos'

export interface Angebot {
  id: string
  art: AngebotArt
  vereinId: string
  gehalt: number
  jahre: number
  rolle: Rolle
  /** Nur zur Anzeige. */
  ablose: number
  /** Wie oft schon nachverhandelt wurde. */
  verhandelt: number
}

export type Fenster = 'sommer' | 'winter' | null

// ---------------------------------------------------------------- Welt & Saison

export type EuropaWettbewerb = 'CL' | 'EL' | 'ECL'

export interface Welt {
  /** Aktuelle Stärke je Verein-ID. */
  staerke: Record<string, number>
  /** Mitglieder je Liga-ID. */
  ligen: Record<string, string[]>
  /** Teilnehmer der Europapokale (für die kommende bzw. laufende Saison). */
  europa: Record<EuropaWettbewerb, string[]>
  /** Meister je Saison und Liga-ID, nur 1. Ligen. */
  meister: Record<string, string>
}

export type Slot =
  | { t: 'L'; n: number } // Liga-Spieltag
  | { t: 'P'; n: number } // Pokalrunde
  | { t: 'E'; n: number } // Europapokal-Spiel (1–8 Ligaphase, 9 Playoff, 10 Achtelf., 11 Viertelf., 12 Halbf., 13 Finale)
  | { t: 'T'; n: number } // Turnier (1–3 Gruppe, 4 Achtelf., 5 Viertelf., 6 Halbf., 7 Finale)
  | { t: 'F'; fenster?: 'sommer' | 'winter'; erste?: boolean; letzte?: boolean }

/** Tabellenzeile: [Spiele, Siege, Remis, Niederlagen, Tore, Gegentore]. */
export type Zeile = [number, number, number, number, number, number]

export type PokalStatus = 'aktiv' | 'ausgeschieden' | 'sieger'
export type EuropaStatus = 'liga' | 'playoff' | 'achtel' | 'viertel' | 'halb' | 'finale' | 'aus' | 'sieger'
export type TurnierStatus = 'gruppe' | 'achtel' | 'viertel' | 'halb' | 'finale' | 'aus' | 'sieger'

export interface Saison {
  ligaId: string
  /** Jugendmannschaft: alle Stärken −12, Tabelle ohne Auf-/Abstieg. */
  jugend: boolean
  teams: string[]
  /** Spieltag -> Paarungen als Indizes in `teams` [Heim, Auswärts]. */
  spielplan: [number, number][][]
  tabelle: Record<string, Zeile>
  kalender: Slot[]
  pokal: { status: PokalStatus; runde: number; runden: number }
  europa: { wb: EuropaWettbewerb | null; status: EuropaStatus; punkte: number; spiele: number }
  turnier: { name: string; status: TurnierStatus; punkte: number; spiele: number } | null
}

// ---------------------------------------------------------------- Spiel & Berichte

export type Wettbewerb = 'liga' | 'pokal' | 'europa' | 'turnier'

export interface SeasonStats {
  saison: number
  alter: number
  verein: string
  vereinId: string
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
  /** Endplatzierung in der Liga (0 = unbekannt). */
  platz: number
  liga: string
}

/** Laufendes Spiel mit Schlüsselszenen, wartet auf Entscheidungen. */
export interface MatchState {
  wettbewerb: Wettbewerb
  label: string
  gegnerId: string
  gegner: string
  gegnerStaerke: number
  eigeneStaerke: number
  heim: boolean
  ko: boolean
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
    label: string
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
    /** Entscheidung bei Unentschieden in K.-o.-Spielen. */
    elfmeter?: 'gewonnen' | 'verloren'
    weiter?: boolean
  }
  schlagzeile?: string
  szenenLog: string[]
  hinweise: string[]
  /** Geld, das in dieser Woche gutgeschrieben wurde. */
  einkommen: number
}

export interface SeasonReport {
  stats: SeasonStats[]
  deltas: { skill: keyof Skills; delta: number }[]
  hinweise: string[]
  titel: string[]
  tabelle: { id: string; name: string; zeile: Zeile }[]
}

export type Phase = 'planung' | 'szene' | 'bericht' | 'ereignis' | 'saisonende' | 'karriereende'

// ---------------------------------------------------------------- Ereignisse

export interface GeplantesEreignis {
  id: string
  /** Absolute Woche (`wochenGesamt`), ab der es auftreten darf. */
  ab: number
}

export interface EreignisZustand {
  id: string
  /** Gewählte Option, sobald entschieden. */
  gewaehlt: number | null
  ausgang: string | null
  /** Zusammenfassung der Wirkung für die Anzeige. */
  wirkung: string[]
}

export interface Personen {
  trainer: string
  kapitaen: string
  rivale: string
  freund: string
  berater: string
  /** Partnerin/Partner, falls vorhanden. */
  partner: string | null
  /** Lieblings-Journalist(in) bzw. Boulevard-Reporter. */
  reporter: string
}

export interface Titel {
  saison: number
  name: string
  verein: string
}

export interface Laufbahn {
  titel: Titel[]
  auszeichnungen: Titel[]
  laenderspiele: number
  laenderspielTore: number
  transfers: { saison: number; von: string; zu: string; ablose: number }[]
  hoechsterMarktwert: number
  /** Gesperrte Spiele insgesamt, Skandale etc. für Statistik. */
  skandale: number
}

export interface Einstellungen {
  /** Schlüsselszenen automatisch (sichere Option) entscheiden. */
  autoSzenen: boolean
}

export interface Career {
  id: string
  version: number
  erstellt: number // Unix-ms
  geaendert: number // Unix-ms
  seed: number
  rngState: number
  uhr: CareerClock
  /** Absoluter Wochenzähler seit Karrierestart. */
  wochenGesamt: number
  spieler: Player
  vereinId: string // '' = vereinslos
  vertrag: Vertrag | null
  leihe: Leihe | null
  welt: Welt
  saison: Saison
  /** Aktuelle Form 0–100. */
  form: number
  /** Gleitender Wert 0–1: wie viel Spielpraxis zuletzt (beschleunigt das Training). */
  spielpraxis: number
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
  fenster: Fenster
  angebote: Angebot[]
  wechselwunsch: boolean
  personen: Personen
  ereignis: EreignisZustand | null
  ereignisSchlange: string[]
  geplant: GeplantesEreignis[]
  /** Letzte Auslösung je Ereignis (absolute Woche). */
  ereignisZeiten: Record<string, number>
  laufbahn: Laufbahn
  erfolge: string[]
  einstellungen: Einstellungen
  /** Flags für Ereignisketten und Story-Zustände. */
  flags: Record<string, number | boolean | string>
  /** Schlagzeilen und Meldungen, neueste zuletzt. */
  log: string[]
}
