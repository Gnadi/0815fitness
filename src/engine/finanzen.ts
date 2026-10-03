import { gauss } from './welt'
import type { Rng } from './rng'
import type { Anlage, Beteiligung, Career, Deal, Depot, VcPhase } from './types'

export const ANLAGEN: readonly Anlage[] = ['tagesgeld', 'etf', 'krypto']

export const ANLAGE_INFO: Record<Anlage, { name: string; text: string; risiko: 'sicher' | 'mittel' | 'riskant' }> = {
  tagesgeld: { name: 'Tagesgeld', text: 'Sicher, ca. 2,5 % Zinsen pro Jahr.', risiko: 'sicher' },
  etf: { name: 'Aktien-ETF', text: 'Ø ca. 7 % pro Jahr, schwankt spürbar.', risiko: 'mittel' },
  krypto: { name: 'Krypto', text: 'Kann sich verdoppeln oder halbieren. Nur mit Spielgeld.', risiko: 'riskant' },
}

/** Jahresrendite (mu) und Schwankung (sigma) je Anlage. */
const MARKT: Record<Anlage, { mu: number; sigma: number; min: number; max: number }> = {
  tagesgeld: { mu: 0.025, sigma: 0, min: 0, max: 1 },
  etf: { mu: 0.07, sigma: 0.16, min: -0.12, max: 0.12 },
  krypto: { mu: 0.12, sigma: 0.75, min: -0.4, max: 0.5 },
}

export const leeresDepot = (): Depot => ({
  tagesgeld: { wert: 0, eingezahlt: 0 },
  etf: { wert: 0, eingezahlt: 0 },
  krypto: { wert: 0, eingezahlt: 0 },
})

export const depotVon = (c: Pick<Career, 'depot'>): Depot => c.depot ?? leeresDepot()

export const depotGesamt = (c: Pick<Career, 'depot'>): number => ANLAGEN.reduce((a, k) => a + depotVon(c)[k].wert, 0)

export const vermoegen = (c: Pick<Career, 'depot' | 'spieler' | 'beteiligungen'>): number =>
  c.spieler.geld + depotGesamt(c) + (c.beteiligungen ?? []).reduce((a, b) => a + (b.status === 'aktiv' ? b.wert : 0), 0)

/** Legt `betrag` vom Konto in der Anlage an (begrenzt auf den Kontostand). */
export function einzahlen(c: Career, anlage: Anlage, betrag: number): Career {
  const b = Math.min(Math.floor(betrag), Math.floor(c.spieler.geld))
  if (b <= 0) return c
  const d = depotVon(c)
  const p = d[anlage]
  return {
    ...c,
    spieler: { ...c.spieler, geld: c.spieler.geld - b },
    depot: { ...d, [anlage]: { wert: p.wert + b, eingezahlt: p.eingezahlt + b } },
  }
}

/** Zahlt `betrag` aus der Anlage aufs Konto aus (begrenzt auf den Wert). */
export function auszahlen(c: Career, anlage: Anlage, betrag: number): Career {
  const d = depotVon(c)
  const p = d[anlage]
  const b = Math.min(Math.floor(betrag), Math.floor(p.wert))
  if (b <= 0) return c
  const rest = p.wert - b
  const anteil = p.wert > 0 ? rest / p.wert : 0
  return {
    ...c,
    spieler: { ...c.spieler, geld: c.spieler.geld + b },
    depot: { ...d, [anlage]: { wert: rest, eingezahlt: p.eingezahlt * anteil } },
  }
}

/** Multipliziert den Wert einer Anlage (Ereignisse wie Börsencrash). */
export function skaliere(c: Career, anlage: Anlage | 'alle', faktor: number): Career {
  const d = { ...depotVon(c) }
  for (const k of ANLAGEN) if (anlage === 'alle' || anlage === k) d[k] = { ...d[k], wert: d[k].wert * faktor }
  return { ...c, depot: d }
}

/** Wöchentliche Kursentwicklung aller Anlagen. */
export function marktWoche(c: Career, rng: Rng): Career {
  const d = depotVon(c)
  if (depotGesamt(c) <= 0) return c
  const neu = { ...d }
  for (const k of ANLAGEN) {
    const m = MARKT[k]
    const r = Math.max(m.min, Math.min(m.max, m.mu / 52 + (m.sigma / Math.sqrt(52)) * gauss(rng)))
    neu[k] = { ...d[k], wert: d[k].wert * (1 + r) }
  }
  return { ...c, depot: neu }
}

/** Anteil des Wochenverdiensts im Sparplan in Prozent (Standard 30, einstellbar 5–100). */
export function sparplanProzent(c: Pick<Career, 'flags'>): number {
  const p = Number(c.flags.sparplanProzent ?? 30)
  return Number.isFinite(p) ? Math.max(5, Math.min(100, Math.round(p))) : 30
}

/** Sparplan: ein Teil des Wochenverdiensts fließt automatisch in den ETF. */
export function sparplan(c: Career, einkommen: number): Career {
  if (c.flags.sparplan !== true || einkommen <= 0) return c
  return einzahlen(c, 'etf', (einkommen * sparplanProzent(c)) / 100)
}

// ---------------------------------------------------------------- Venture Capital

const VC_VORNAME = ['Kick', 'Goal', 'Fan', 'Scout', 'Match', 'Pitch', 'Strike', 'Derby', 'Flank', 'Press', 'Libero', 'Nutmeg', 'Bolt', 'Sprint']
const VC_NACHNAME = ['ly', 'ify', 'hub', 'ora', 'io', 'works', 'labs', 'base', 'wave', 'box', 'ster', 'loop']
export const BRANCHEN = ['SportTech', 'FinTech', 'Gesundheit', 'Gaming', 'KI', 'Food', 'Mode', 'Mobilität', 'Bildung'] as const

const VC_TEXTE = [
  'Eine App, die Hobbyvereine digital organisiert.',
  'Ein Marktplatz für gebrauchte Sportausrüstung mit Garantie.',
  'Wearables, die Verletzungen vorhersagen sollen.',
  'Ein Streaming-Dienst für Amateur-Fußball.',
  'Eine Plattform, die Nachwuchstalente und Scouts zusammenbringt.',
  'Ein Bezahldienst für Vereinsbeiträge und Fan-Shops.',
  'Gesunde Snacks, die direkt an Sportler geliefert werden.',
  'Ein KI-Coach für individuelles Training.',
]

const neueVcId = (rng: Rng): string => `vc${rng.int(0, 2 ** 30).toString(36)}`

function zufallsName(rng: Rng): string {
  return `${rng.pick(VC_VORNAME)}${rng.pick(VC_NACHNAME)}`
}

export const VC_PHASEN: readonly VcPhase[] = ['Seed', 'Serie A', 'Serie B', 'Serie C']

/** Je später die Runde, desto sicherer, schneller liquide und weniger Hebel. */
export interface PhasenProfil {
  /** Wöchentliche Wahrscheinlichkeiten (vor Qualitätsfaktor). */
  pleite: number
  exit: number
  hoch: number
  runter: number
  /** Frühestens so viele Wochen nach dem Einstieg ist ein Exit möglich. */
  minAlter: number
  /** Exit-Aufschlag auf den Buchwert: 1 + Zufall × exitSpanne. */
  exitSpanne: number
  /** Chance auf Börsengang beim Exit und dessen Aufschlag (min + Zufall × spanne). */
  ipo: number
  ipoMin: number
  ipoSpanne: number
  /** Mindestticket und Kontostand, ab dem Deals dieser Runde angeboten werden. */
  minTicket: number
  minGeld: number
  info: string
}

export const PHASEN: Record<VcPhase, PhasenProfil> = {
  Seed: { pleite: 0.003, exit: 0.0045, hoch: 0.01, runter: 0.004, minAlter: 80, exitSpanne: 0.6, ipo: 0.04, ipoMin: 2, ipoSpanne: 2, minTicket: 100, minGeld: 5_000, info: 'Frühphase: höchstes Risiko, höchste Chance.' },
  'Serie A': { pleite: 0.0017, exit: 0.005, hoch: 0.008, runter: 0.004, minAlter: 60, exitSpanne: 0.5, ipo: 0.05, ipoMin: 1.8, ipoSpanne: 1.4, minTicket: 5_000, minGeld: 25_000, info: 'Das Produkt läuft, Umsätze wachsen. Weniger Pleiten, weniger Hebel.' },
  'Serie B': { pleite: 0.0009, exit: 0.006, hoch: 0.006, runter: 0.004, minAlter: 40, exitSpanne: 0.4, ipo: 0.07, ipoMin: 1.5, ipoSpanne: 1.0, minTicket: 25_000, minGeld: 100_000, info: 'Skalierung: solide Firma, Pleite eher selten, Exit bald möglich.' },
  'Serie C': { pleite: 0.0004, exit: 0.008, hoch: 0, runter: 0.002, minAlter: 26, exitSpanne: 0.5, ipo: 0.12, ipoMin: 1.4, ipoSpanne: 1.0, minTicket: 100_000, minGeld: 500_000, info: 'Spätphase vor dem Exit: sicher, aber kaum noch Hebel.' },
}

export function neuerDeal(rng: Rng, gut = false, phase: VcPhase = 'Seed'): Deal {
  const q = Math.max(0.5, Math.min(1.5, (gut ? 1.15 : 1) + gauss(rng) * 0.25))
  return { id: neueVcId(rng), name: zufallsName(rng), branche: rng.pick(BRANCHEN), text: rng.pick(VC_TEXTE), qualitaet: q, phase }
}

/** Das Scouting-Urteil ist bewusst unscharf: Sterne mit Rauschen. */
export function dealSterne(d: Deal): string {
  const n = Math.max(1, Math.min(5, Math.round(d.qualitaet * 3 + (d.id.length % 3) - 1)))
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

export const beteiligungenVon = (c: Pick<Career, 'beteiligungen'>): Beteiligung[] => c.beteiligungen ?? []
export const vcAktiv = (c: Pick<Career, 'beteiligungen'>): Beteiligung[] => beteiligungenVon(c).filter((b) => b.status === 'aktiv')
export const vcBuchwert = (c: Pick<Career, 'beteiligungen'>): number => vcAktiv(c).reduce((a, b) => a + b.wert, 0)

/** Steigt mit `betrag` vom Konto bei einem Deal ein. */
export function vcEinsteigen(c: Career, deal: Deal, betrag: number): Career {
  const b = Math.min(Math.floor(betrag), Math.floor(c.spieler.geld))
  if (b < 1) return c
  const neu: Beteiligung = {
    id: deal.id, name: deal.name, branche: deal.branche, eingezahlt: b, wert: b, phase: deal.phase ?? 'Seed',
    seit: c.wochenGesamt, qualitaet: deal.qualitaet, status: 'aktiv',
  }
  return {
    ...c,
    spieler: { ...c.spieler, geld: c.spieler.geld - b },
    beteiligungen: [...beteiligungenVon(c), neu],
    deals: (c.deals ?? []).filter((d) => d.id !== deal.id),
  }
}

/** Legt Geld in einer bestehenden aktiven Beteiligung nach (zum aktuellen Buchwert-Verhältnis). */
export function vcAufstocken(c: Career, id: string, betrag: number): Career {
  const b = Math.min(Math.floor(betrag), Math.floor(c.spieler.geld))
  if (b < 1) return c
  return {
    ...c,
    spieler: { ...c.spieler, geld: c.spieler.geld - b },
    beteiligungen: beteiligungenVon(c).map((x) => (x.id === id && x.status === 'aktiv' ? { ...x, eingezahlt: x.eingezahlt + b, wert: x.wert + b } : x)),
  }
}

/** Verkauf am Zweitmarkt: sofort Geld, aber nur 60 % des Buchwerts. */
export function vcVerkaufen(c: Career, id: string): Career {
  const x = vcAktiv(c).find((b) => b.id === id)
  if (!x) return c
  const erloes = Math.floor(x.wert * 0.6)
  return {
    ...c,
    spieler: { ...c.spieler, geld: c.spieler.geld + erloes },
    beteiligungen: beteiligungenVon(c).map((b) => (b.id === id ? { ...b, status: 'verkauft' as const, wert: erloes } : b)),
  }
}

const NAECHSTE_PHASE: Record<string, Beteiligung['phase']> = { Seed: 'Serie A', 'Serie A': 'Serie B', 'Serie B': 'Serie C', 'Serie C': 'Serie C' }

export interface VcErgebnis {
  c: Career
  meldungen: string[]
}

const euroText = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

/** Wöchentliche Entwicklung aller Beteiligungen: Finanzierungsrunden, Pleiten, Exits. */
export function vcWoche(c: Career, rng: Rng): VcErgebnis {
  const liste = beteiligungenVon(c)
  if (!liste.some((b) => b.status === 'aktiv')) return { c, meldungen: [] }
  const meldungen: string[] = []
  let geld = c.spieler.geld
  const neu = liste.map((b) => {
    if (b.status !== 'aktiv') return b
    const q = b.qualitaet
    const alter = c.wochenGesamt - b.seit
    const r = rng.next()
    const p = PHASEN[b.phase]
    const pleite = p.pleite / q
    const exit = p.exit * q
    const hoch = p.hoch * q
    const runter = p.runter / q
    if (r < pleite) {
      meldungen.push(`💥 ${b.name} ist pleite. Dein Einsatz von ${euroText(b.eingezahlt)} ist weg.`)
      return { ...b, status: 'pleite' as const, wert: 0 }
    }
    if (alter > p.minAlter && r >= pleite && r < pleite + exit) {
      const ipo = rng.chance(p.ipo)
      const faktor = ipo ? p.ipoMin + rng.next() * p.ipoSpanne : 1 + rng.next() * p.exitSpanne
      const erloes = Math.round(b.wert * faktor)
      geld += erloes
      meldungen.push(`${ipo ? '🚀 Börsengang' : '🤝 Exit'}: ${b.name} wird ${ipo ? 'an die Börse gebracht' : 'verkauft'}. Du bekommst ${euroText(erloes)} (Einsatz ${euroText(b.eingezahlt)}).`)
      return { ...b, status: 'exit' as const, wert: erloes }
    }
    if (b.phase !== 'Serie C' && r >= pleite + exit && r < pleite + exit + hoch) {
      const faktor = 1.5 + rng.next() * 0.9
      meldungen.push(`📈 ${b.name}: neue Finanzierungsrunde (${NAECHSTE_PHASE[b.phase]}), Bewertung steigt auf das ${faktor.toFixed(1).replace('.', ',')}-Fache.`)
      return { ...b, wert: b.wert * faktor, phase: NAECHSTE_PHASE[b.phase] }
    }
    if (r >= pleite + exit + hoch && r < pleite + exit + hoch + runter) {
      meldungen.push(`📉 ${b.name}: Down-Round, die Bewertung fällt um 40 %.`)
      return { ...b, wert: b.wert * 0.6 }
    }
    return b
  })
  const log = meldungen.length ? [...c.log, ...meldungen.map((m) => `${c.uhr.saison}/${String(c.uhr.saison + 1).slice(2)}: ${m}`)].slice(-80) : c.log
  return { c: { ...c, spieler: { ...c.spieler, geld }, beteiligungen: neu, log }, meldungen }
}

/** Neue Deals alle 13 Wochen (nur wenn genug Geld da ist). */
export function dealsAktualisieren(c: Career, rng: Rng): Career {
  if (c.spieler.geld < 5_000) return c
  if (c.deals && c.wochenGesamt % 13 !== 0) return c
  const deals = [neuerDeal(rng), neuerDeal(rng), neuerDeal(rng, rng.chance(0.3))]
  for (const phase of VC_PHASEN.slice(1)) {
    if (c.spieler.geld >= PHASEN[phase].minGeld) deals.push(neuerDeal(rng, rng.chance(0.3), phase))
  }
  return { ...c, deals }
}

// ---------------------------------------------------------------- Entscheidungen als Investor

/** Das Start-up, um das es in einem Investoren-Ereignis gerade geht (wechselt mit der Woche). */
export function vcZiel(c: Career): Beteiligung | undefined {
  const aktiv = [...vcAktiv(c)].sort((a, b) => a.id.localeCompare(b.id))
  return aktiv.length ? aktiv[c.wochenGesamt % aktiv.length] : undefined
}

const aendere = (c: Career, id: string, f: (b: Beteiligung) => Beteiligung): Career => ({
  ...c,
  beteiligungen: beteiligungenVon(c).map((b) => (b.id === id && b.status === 'aktiv' ? f(b) : b)),
})

/** Bewertung ändert sich (z. B. durch Strategie-Entscheidung). */
export const vcWertAendern = (c: Career, id: string, faktor: number): Career => aendere(c, id, (b) => ({ ...b, wert: b.wert * faktor }))

/** Neue Finanzierungsrunde: nächste Phase und Bewertungssprung (in Serie C nur der Sprung). */
export const vcRunde = (c: Career, id: string, faktor: number): Career =>
  aendere(c, id, (b) => ({ ...b, wert: b.wert * faktor, phase: NAECHSTE_PHASE[b.phase] }))

export const vcPleite = (c: Career, id: string): Career => aendere(c, id, (b) => ({ ...b, status: 'pleite' as const, wert: 0 }))

/** Verkauf der Anteile zum Buchwert mal `faktor` (z. B. Übernahmeangebot). Gibt den Erlös mit zurück. */
export function vcAusstieg(c: Career, id: string, faktor: number): { c: Career; erloes: number } {
  const x = vcAktiv(c).find((b) => b.id === id)
  if (!x) return { c, erloes: 0 }
  const erloes = Math.round(x.wert * faktor)
  return {
    c: { ...aendere(c, id, (b) => ({ ...b, status: 'exit' as const, wert: erloes })), spieler: { ...c.spieler, geld: c.spieler.geld + erloes } },
    erloes,
  }
}
