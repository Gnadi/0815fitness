import type { ImmoLage, ImmoTyp } from '../engine/types'

export interface ImmoTypInfo {
  name: string
  icon: string
  text: string
  /** Richtpreis in Euro (mittlere Lage). */
  preis: number
  /** Jährliche Bruttomiete in Prozent des Preises (0 = keine Vermietung). */
  rendite: number
  /** Erwartete jährliche Wertsteigerung und Schwankung. */
  mu: number
  sigma: number
  /** Nebenkosten, Instandhaltung und Steuern pro Jahr in Prozent des Werts. */
  nebenkosten: number
  /** Anteil des Jahres, in dem vermietet ist. */
  auslastung: number
  /** Selbst genutzt: Hier wohnst du. Nur ein Wohnsitz möglich. */
  wohnsitz?: boolean
  /** Wöchentlicher Privatglück-Effekt durch Nutzung. */
  komfort: number
  /** Wöchentlicher Ruf-Effekt (Prestige). */
  prestige?: number
}

export const IMMO_TYPEN: Record<ImmoTyp, ImmoTypInfo> = {
  apartment: { name: 'Studenten-Apartment', icon: '🏢', text: 'Kleine Einheit in Uni-Nähe. Günstig im Einstieg, immer gefragt.', preis: 70_000, rendite: 0.055, mu: 0.03, sigma: 0.04, nebenkosten: 0.012, auslastung: 0.96, komfort: 0 },
  wohnung: { name: 'Eigentumswohnung', icon: '🏠', text: 'Solide Kapitalanlage: vermieten und Miete einsammeln.', preis: 160_000, rendite: 0.045, mu: 0.03, sigma: 0.035, nebenkosten: 0.01, auslastung: 0.95, komfort: 0 },
  mfh: { name: 'Mehrfamilienhaus', icon: '🏘️', text: 'Mehrere Mietparteien, hohe Rendite, aber auch mehr Reparaturen.', preis: 650_000, rendite: 0.055, mu: 0.03, sigma: 0.05, nebenkosten: 0.015, auslastung: 0.92, komfort: 0 },
  gewerbe: { name: 'Gewerbeobjekt', icon: '🏬', text: 'Büros und Läden: höchste Miete, aber auch Leerstandsrisiko und Preisschwankungen.', preis: 1_200_000, rendite: 0.065, mu: 0.025, sigma: 0.08, nebenkosten: 0.015, auslastung: 0.88, komfort: 0 },
  ferienhaus: { name: 'Ferienhaus', icon: '🏖️', text: 'Vermietung an Urlauber, und du kannst selbst hin, wenn du magst.', preis: 380_000, rendite: 0.05, mu: 0.035, sigma: 0.07, nebenkosten: 0.02, auslastung: 0.7, komfort: 0.1 },
  bauland: { name: 'Baugrundstück', icon: '🌳', text: 'Keine Miete, keine Arbeit. Du wartest einfach, dass der Wert steigt.', preis: 90_000, rendite: 0, mu: 0.045, sigma: 0.09, nebenkosten: 0.003, auslastung: 1, komfort: 0 },
  eigenheim: { name: 'Eigenheim', icon: '🏡', text: 'Dein Zuhause: Keine Miete mehr, mehr Ruhe, Platz für die Familie.', preis: 450_000, rendite: 0, mu: 0.03, sigma: 0.035, nebenkosten: 0.012, auslastung: 1, wohnsitz: true, komfort: 0.2 },
  villa: { name: 'Luxusvilla', icon: '🏰', text: 'Pool, Kino, Sicherheitsdienst. Das Statussymbol schlechthin.', preis: 3_500_000, rendite: 0, mu: 0.03, sigma: 0.06, nebenkosten: 0.015, auslastung: 1, wohnsitz: true, komfort: 0.35, prestige: 0.05 },
}

export const IMMO_TYP_IDS = Object.keys(IMMO_TYPEN) as ImmoTyp[]

export const IMMO_LAGEN: Record<ImmoLage, { name: string; preis: number; rendite: number; mu: number }> = {
  einfach: { name: 'Einfache Lage', preis: 0.75, rendite: 1.2, mu: -0.01 },
  mittel: { name: 'Gute Lage', preis: 1, rendite: 1, mu: 0 },
  top: { name: 'Top-Lage', preis: 1.4, rendite: 0.8, mu: 0.01 },
}

export const IMMO_STAEDTE = ['Hamburg', 'München', 'Leipzig', 'Köln', 'Wien', 'Zürich', 'Lissabon', 'Porto', 'Valencia', 'Mailand', 'Graz', 'Rotterdam', 'Antwerpen', 'Krakau', 'Prag', 'Kopenhagen', 'Split', 'Málaga']

/** Anteil des Kaufpreises als Kaufnebenkosten (Makler, Notar, Steuer). */
export const IMMO_KAUFNEBENKOSTEN = 0.06
/** Anteil des Verkaufspreises, der als Makler- und Verkaufskosten abgeht. */
export const IMMO_VERKAUFSKOSTEN = 0.06
/** Eigenkapitalanteil bei Finanzierung. */
export const IMMO_EIGENKAPITAL = 0.2
export const IMMO_ZINS = 0.038
/** Jährliche Tilgung in Prozent der Anfangsschuld. */
export const IMMO_TILGUNG = 0.02
