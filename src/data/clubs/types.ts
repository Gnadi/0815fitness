/** [Name, Stärke 1–100] – Stärke = Durchschnitt der Startelf auf der Skill-Skala der Spieler. */
export type VereinDef = readonly [name: string, staerke: number]

export interface LigaDef {
  name: string
  /** Absteiger in die nächste modellierte Liga (= Aufsteiger von dort). 0 bei der untersten Liga. */
  ab: number
  vereine: readonly VereinDef[]
}

export interface LandDaten {
  land: string
  pokal: string
  /** Europapokal-Plätze der 1. Liga: [Champions League, Europa League, Conference League]. */
  europa: readonly [number, number, number]
  /** Stärke der Nationalmannschaft (1–100). */
  national: number
  /** Von UEFA-Wettbewerben ausgeschlossen. */
  gesperrt?: boolean
  ligen: readonly LigaDef[]
}
