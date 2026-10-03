import type { Career, Skills, Traits } from '../../engine/types'

/** Text oder Funktion, die den Text aus dem Spielstand berechnet. Platzhalter: {name} {vorname} {verein} {trainer} {kapitaen} {rivale} {freund} {berater} {partner} {reporter}. */
export type Txt = string | ((c: Career) => string)

export type AktionName =
  | 'berater-wechsel'
  | 'berater-upgrade'
  | 'verlaengerung-anbieten'
  | 'nationalspieler'
  | 'laenderspiel'
  | 'trainer-wechsel'
  | 'partner-neu'
  | 'partner-ende'
  | 'wechselwunsch'
  | 'verein-wechseln-erzwingen'
  | 'sponsor-neu'
  | 'sponsor-ende'
  | 'skandal'
  | 'auszeichnung'
  | 'karriereende'
  | 'gehaltserhoehung'

export type Effekt =
  | { t: 'traits'; d: Partial<Traits> }
  | { t: 'skills'; d: Partial<Skills> }
  | { t: 'geld'; d: number | ((c: Career) => number) }
  | { t: 'lebensstil'; d: number }
  | { t: 'flag'; k: string; v?: boolean | number | string }
  | { t: 'zaehle'; k: string; d: number }
  | { t: 'folge'; id: string; wochen: number; p?: number }
  | { t: 'verletzung'; name: string; wochen: number }
  | { t: 'sperre'; spiele: number }
  | { t: 'reha'; wochen: number }
  | { t: 'schlagzeile'; text: Txt }
  | { t: 'aktion'; name: AktionName }

export interface Ausgang {
  text: Txt
  effekte?: Effekt[]
}

export interface Wurf {
  basis?: number
  skills?: (keyof Skills)[]
  traits?: (keyof Traits)[]
  /** Überschreibt die Berechnung komplett. */
  chance?: (c: Career) => number
}

export interface EreignisOption {
  label: Txt
  /** Kleiner Hinweis neben der Option (z. B. „riskant“, „kostet Geld“). */
  hinweis?: string
  bedingung?: (c: Career) => boolean
  /** Geld, das die Option kostet (Option gesperrt, wenn nicht genug da ist). */
  kosten?: number | ((c: Career) => number)
  wurf?: Wurf
  erfolg: Ausgang
  misserfolg?: Ausgang
}

export type Kategorie = 'Kabine' | 'Trainer' | 'Privat' | 'Medien' | 'Karriere' | 'Risiko' | 'Verein' | 'Familie' | 'Jugend' | 'Gesundheit'

export interface EreignisDef {
  id: string
  kategorie: Kategorie
  titel: Txt
  text: Txt
  /** Auslösegewicht unter den zufälligen Ereignissen (0 = nur als Folge oder Pflicht). */
  gewicht: number
  /** Mindestabstand in Wochen bis zur Wiederholung; ohne Angabe ist das Ereignis einmalig. */
  abstand?: number
  bedingung?: (c: Career) => boolean
  /** Pflichtereignisse werden vor Zufallsereignissen ausgelöst, sobald die Bedingung stimmt. */
  pflicht?: boolean
  optionen: EreignisOption[]
}
