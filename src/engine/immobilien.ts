import { IMMO_EIGENKAPITAL, IMMO_KAUFNEBENKOSTEN, IMMO_LAGEN, IMMO_STAEDTE, IMMO_TILGUNG, IMMO_TYPEN, IMMO_TYP_IDS, IMMO_VERKAUFSKOSTEN, IMMO_ZINS } from '../data/immobilien'
import { depotGesamt } from './finanzen'
import { gauss } from './welt'
import type { Rng } from './rng'
import type { Career, ImmoAngebot, ImmoLage, ImmoTyp, Immobilie } from './types'

const euroText = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export const immobilienVon = (c: Pick<Career, 'immobilien'>): Immobilie[] => c.immobilien ?? []
export const immoAktiv = (c: Pick<Career, 'immobilien'>): Immobilie[] => immobilienVon(c).filter((i) => i.status === 'aktiv')
export const immoWert = (c: Pick<Career, 'immobilien'>): number => immoAktiv(c).reduce((a, i) => a + i.wert, 0)
export const immoSchulden = (c: Pick<Career, 'immobilien'>): number => immoAktiv(c).reduce((a, i) => a + i.kredit, 0)
export const hatWohnsitz = (c: Pick<Career, 'immobilien'>): boolean => immoAktiv(c).some((i) => IMMO_TYPEN[i.typ].wohnsitz)

/** Name des Objekts für Anzeige und Meldungen. */
export const immoName = (i: Pick<Immobilie, 'typ' | 'stadt'>): string => `${IMMO_TYPEN[i.typ].name} in ${i.stadt}`

/** Tilgung pro Woche (begrenzt auf die Restschuld). */
const tilgungWoche = (i: Immobilie): number => Math.min(i.kredit, (i.kreditStart * IMMO_TILGUNG) / 52)

/** Zahlungsstrom pro Woche: Miete abzüglich Nebenkosten, Zinsen und Tilgung. */
export function immoNettoWoche(c: Pick<Career, 'immobilien'>): number {
  let summe = 0
  for (const i of immoAktiv(c)) {
    const t = IMMO_TYPEN[i.typ]
    summe += (i.miete * t.auslastung - i.wert * t.nebenkosten - i.kredit * i.zins) / 52 - tilgungWoche(i)
  }
  return summe
}

/** Nur die Mieteinnahmen (netto der Auslastung) pro Jahr. */
export const immoMieteJahr = (c: Pick<Career, 'immobilien'>): number => immoAktiv(c).reduce((a, i) => a + i.miete * IMMO_TYPEN[i.typ].auslastung, 0)

// ---------------------------------------------------------------- Markt

function neuesAngebot(rng: Rng, typ: ImmoTyp): ImmoAngebot {
  const t = IMMO_TYPEN[typ]
  const lage: ImmoLage = rng.pick(['einfach', 'mittel', 'mittel', 'top'] as const)
  const l = IMMO_LAGEN[lage]
  const preis = Math.round((t.preis * l.preis * (0.92 + rng.next() * 0.16)) / 1000) * 1000
  const miete = Math.round((preis * t.rendite * l.rendite) / 100) * 100
  return { id: `im${rng.int(0, 2 ** 30).toString(36)}`, typ, lage, stadt: rng.pick(IMMO_STAEDTE), preis, miete, mu: t.mu + l.mu }
}

/** Alle 26 Wochen frische Marktangebote; mindestens ein Wohnobjekt ist dabei. */
export function immoAngeboteAktualisieren(c: Career, rng: Rng): Career {
  if (c.immoAngebote && c.wochenGesamt % 26 !== 0) return c
  const typen = [...IMMO_TYP_IDS]
  const gewaehlt: ImmoTyp[] = [rng.pick(typen.filter((t) => IMMO_TYPEN[t].wohnsitz))]
  const rest = typen.filter((t) => !gewaehlt.includes(t))
  while (gewaehlt.length < 5 && rest.length) gewaehlt.push(rest.splice(rng.int(0, rest.length - 1), 1)[0])
  return { ...c, immoAngebote: gewaehlt.map((t) => neuesAngebot(rng, t)) }
}

/** Wie viel Kredit die Bank gibt: abhängig von Einkommen und Depot. */
export const kreditRahmen = (c: Career): number => Math.max(0, (c.vertrag?.gehalt ?? 0) * 8 + depotGesamt(c) * 0.5 - immoSchulden(c))

/** Grund, warum der Kauf nicht geht (oder null). */
export function immoKaufPruefung(c: Career, a: ImmoAngebot, finanziert: boolean): string | null {
  const t = IMMO_TYPEN[a.typ]
  const nk = a.preis * IMMO_KAUFNEBENKOSTEN
  if (t.wohnsitz && hatWohnsitz(c)) return 'Du besitzt schon ein Zuhause. Verkaufe es zuerst.'
  if (finanziert) {
    const kredit = a.preis * (1 - IMMO_EIGENKAPITAL)
    if (c.spieler.geld < a.preis * IMMO_EIGENKAPITAL + nk) return 'Zu wenig Eigenkapital (20 % plus Nebenkosten).'
    if (kredit > kreditRahmen(c)) return 'Die Bank gibt dir dafür keinen Kredit.'
    return null
  }
  return c.spieler.geld < a.preis + nk ? 'Zu wenig Geld auf dem Konto.' : null
}

export function immoKaufen(c: Career, angebotId: string, finanziert: boolean): { c: Career; text: string } {
  const a = (c.immoAngebote ?? []).find((x) => x.id === angebotId)
  if (!a) return { c, text: 'Das Angebot gibt es nicht mehr.' }
  const grund = immoKaufPruefung(c, a, finanziert)
  if (grund) return { c, text: grund }
  const t = IMMO_TYPEN[a.typ]
  const kredit = finanziert ? Math.round(a.preis * (1 - IMMO_EIGENKAPITAL)) : 0
  const kosten = a.preis - kredit + a.preis * IMMO_KAUFNEBENKOSTEN
  const neu: Immobilie = {
    id: a.id, typ: a.typ, lage: a.lage, stadt: a.stadt, kaufpreis: a.preis, wert: a.preis, kredit, kreditStart: kredit,
    zins: IMMO_ZINS, miete: a.miete, mu: a.mu, sigma: t.sigma, seit: c.wochenGesamt, saniert: 0, status: 'aktiv',
  }
  return {
    c: {
      ...c,
      spieler: { ...c.spieler, geld: c.spieler.geld - Math.round(kosten) },
      immobilien: [...immobilienVon(c), neu],
      immoAngebote: (c.immoAngebote ?? []).filter((x) => x.id !== a.id),
      flags: t.wohnsitz ? { ...c.flags, haus: true } : c.flags,
    },
    text: `${immoName(neu)} gekauft für ${euroText(a.preis)}${finanziert ? ` (Kredit ${euroText(kredit)})` : ''}.`,
  }
}

/** Erlös nach Abzug der Verkaufskosten und der Restschuld. */
export const immoNettoErloes = (i: Immobilie): number => Math.round(i.wert * (1 - IMMO_VERKAUFSKOSTEN) - i.kredit)

export function immoVerkaufen(c: Career, id: string): { c: Career; text: string } {
  const i = immoAktiv(c).find((x) => x.id === id)
  if (!i) return { c, text: '' }
  const erloes = immoNettoErloes(i)
  if (c.spieler.geld + erloes < 0) return { c, text: 'Der Erlös deckt die Restschuld nicht, und dein Konto reicht nicht zum Ausgleich.' }
  return {
    c: {
      ...c,
      spieler: { ...c.spieler, geld: c.spieler.geld + erloes },
      immobilien: immobilienVon(c).map((x) => (x.id === id ? { ...x, status: 'verkauft' as const, wert: erloes, kredit: 0 } : x)),
    },
    text: `${immoName(i)} verkauft: ${euroText(erloes)} nach Kosten und Kredit.`,
  }
}

/** Zahlt so viel Restschuld zurück, wie das Konto hergibt. */
export function immoTilgen(c: Career, id: string): { c: Career; text: string } {
  const i = immoAktiv(c).find((x) => x.id === id)
  if (!i || i.kredit <= 0) return { c, text: '' }
  const b = Math.min(Math.floor(c.spieler.geld), Math.ceil(i.kredit))
  if (b < 1) return { c, text: 'Kein Geld auf dem Konto.' }
  return {
    c: {
      ...c,
      spieler: { ...c.spieler, geld: c.spieler.geld - b },
      immobilien: immobilienVon(c).map((x) => (x.id === id ? { ...x, kredit: Math.max(0, x.kredit - b) } : x)),
    },
    text: `${euroText(b)} Kredit getilgt.`,
  }
}

export const sanierungKosten = (i: Immobilie): number => Math.round((i.wert * 0.06) / 100) * 100
export const sanierungMoeglich = (c: Career, i: Immobilie): boolean => i.typ !== 'bauland' && (i.saniert === 0 || c.wochenGesamt - i.saniert >= 52) && c.spieler.geld >= sanierungKosten(i)

/** Modernisierung: kostet 6 % des Werts, steigert Wert und Miete um 9 % (einmal pro Jahr). */
export function immoSanieren(c: Career, id: string): { c: Career; text: string } {
  const i = immoAktiv(c).find((x) => x.id === id)
  if (!i || !sanierungMoeglich(c, i)) return { c, text: '' }
  return {
    c: {
      ...c,
      spieler: { ...c.spieler, geld: c.spieler.geld - sanierungKosten(i) },
      immobilien: immobilienVon(c).map((x) => (x.id === id ? { ...x, wert: x.wert * 1.09, miete: x.miete * 1.09, saniert: c.wochenGesamt } : x)),
    },
    text: `${immoName(i)} modernisiert: Wert und Miete steigen um 9 %.`,
  }
}

// ---------------------------------------------------------------- Wochenentwicklung

/** Wertentwicklung, Tilgung, Reparaturen und Mietausfälle. */
export function immoWoche(c: Career, rng: Rng): { c: Career; meldungen: string[] } {
  if (!immoAktiv(c).length) return { c, meldungen: [] }
  const meldungen: string[] = []
  let geld = c.spieler.geld
  const neu = immobilienVon(c).map((i) => {
    if (i.status !== 'aktiv') return i
    const r = Math.max(-0.06, Math.min(0.06, i.mu / 52 + (i.sigma / Math.sqrt(52)) * gauss(rng)))
    let wert = i.wert * (1 + r)
    const kredit = Math.max(0, i.kredit - tilgungWoche(i))
    if (rng.chance(0.012)) {
      const kosten = Math.round((wert * (0.004 + rng.next() * 0.01)) / 10) * 10
      geld -= kosten
      meldungen.push(`🔧 ${immoName(i)}: Reparatur für ${euroText(kosten)}.`)
    }
    if (i.miete > 0 && rng.chance(0.006)) {
      const ausfall = Math.round(((i.miete / 52) * (4 + rng.int(0, 8))) / 10) * 10
      geld -= ausfall
      meldungen.push(`🚪 ${immoName(i)}: Mieter ausgezogen oder zahlungsunfähig, ${euroText(ausfall)} Ausfall.`)
    }
    wert = Math.max(1_000, wert)
    return { ...i, wert, kredit }
  })
  const log = meldungen.length ? [...c.log, ...meldungen.map((m) => `${c.uhr.saison}/${String(c.uhr.saison + 1).slice(2)}: ${m}`)].slice(-80) : c.log
  return { c: { ...c, spieler: { ...c.spieler, geld }, immobilien: neu, log }, meldungen }
}

/** Marktereignisse: Preise aller aktiven Immobilien um einen Faktor verändern. */
export function immoSkalieren(c: Career, faktor: number): Career {
  if (!immoAktiv(c).length) return c
  return { ...c, immobilien: immobilienVon(c).map((i) => (i.status === 'aktiv' ? { ...i, wert: i.wert * faktor } : i)) }
}
