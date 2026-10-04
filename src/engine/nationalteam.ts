import { LAENDER } from '../data/clubs'
import { COUNTRIES } from '../data/countries'
import { WM_GAESTE, nationen, type Nation } from '../data/nationen'
import { turnierName } from './kalender'
import { clamp, overall } from './rating'
import type { Rng } from './rng'
import { leereZeile, rangliste, simuliereTore, tabelleEintragen } from './welt'
import type { Career, NatRolle, NatSpiel, Nationalteam, Saison, Turnier, TurnierBilanz, TurnierGruppe, TurnierTeam } from './types'

export const natVon = (c: Pick<Career, 'nationalteam'>): Nationalteam =>
  c.nationalteam ?? { trainer: 'Nationaltrainer', vertrauen: 50, kapitaen: false, spiele: [], turniere: [], minuten: 0, notenSumme: 0, notenAnzahl: 0 }

export const istNationalspieler = (c: Pick<Career, 'flags'>): boolean => c.flags.nationalspieler === true

export const natStaerke = (c: Pick<Career, 'spieler'>): number => LAENDER[c.spieler.nationalitaet]?.national ?? 50

export const nationName = (id: string): string => COUNTRIES.find((x) => x.id === id)?.name ?? WM_GAESTE.find((x) => x.id === id)?.name ?? id

/** Stärke, die der Nationaltrainer dir zuschreibt: etwas Vertrauen wirkt wie Stärke. */
const effektiv = (c: Career): number => overall(c.spieler) + (natVon(c).vertrauen - 50) / 6

/** Geschätzter Rang im 23-Mann-Kader (1 = bester). */
export function kaderRang(c: Career): number {
  const pBesser = 1 / (1 + Math.exp((effektiv(c) - natStaerke(c)) / 3.5))
  return clamp(1 + Math.round(22 * pBesser), 1, 23)
}

export function natRolle(c: Career): NatRolle {
  if (overall(c.spieler) < natStaerke(c) - 14) return 'Außenseiter'
  const r = kaderRang(c)
  return r <= 11 ? 'Stammspieler' : r <= 17 ? 'Rotation' : 'Ergänzungsspieler'
}

const ROLLEN_BONUS: Record<NatRolle, number> = { Stammspieler: 3, Rotation: 0, Ergänzungsspieler: -3, Außenseiter: -6 }

/** Einsatzchancen im Nationalteam: Rolle statt Vereinsrolle, Vertrauen statt Trainerbeziehung. */
export const natEinsatz = (c: Career): { bonus: number; vertrauen: number } => ({ bonus: ROLLEN_BONUS[natRolle(c)], vertrauen: natVon(c).vertrauen })

/** Vertrauen nähert sich wöchentlich einem Zielwert aus Stärke, Form und Ruf. */
export function natDrift(c: Career): Career {
  if (!istNationalspieler(c)) return c
  const t = c.spieler.traits
  const ziel = clamp(50 + (overall(c.spieler) - natStaerke(c)) * 3 + (c.form - 50) * 0.3 + (t.ruf - 50) * 0.15, 5, 95)
  const nt = natVon(c)
  return { ...c, nationalteam: { ...nt, vertrauen: clamp(nt.vertrauen + (ziel - nt.vertrauen) * 0.04) } }
}

/** Trägt ein Länderspiel (auch im Turnier) ein: Protokoll, Minuten, Noten, Vertrauen. */
export function natSpielVerbuchen(nt: Nationalteam, spiel: NatSpiel, minuten: number): Nationalteam {
  const gespielt = spiel.einsatz !== 'nicht-eingesetzt'
  const delta = gespielt && spiel.note !== null ? (spiel.note - 6) * 2.5 + (spiel.einsatz === 'startelf' ? 1 : 0) : -0.5
  return {
    ...nt,
    vertrauen: clamp(nt.vertrauen + delta),
    spiele: [...nt.spiele, spiel].slice(-15),
    minuten: nt.minuten + minuten,
    notenSumme: nt.notenSumme + (gespielt && spiel.note !== null ? spiel.note : 0),
    notenAnzahl: nt.notenAnzahl + (gespielt && spiel.note !== null ? 1 : 0),
  }
}

// ---------------------------------------------------------------- Turnier

const RUNDEN: Record<string, string> = { achtel: 'Achtelfinale', viertel: 'Viertelfinale', halb: 'Halbfinale', finale: 'Finale' }
export const turnierRunde = (status: string): string => RUNDEN[status] ?? status

/** Auslosung: eine Nation aus jedem Drittel der Stärkerangliste. */
function neueGruppe(c: Career, rng: Rng, wm: boolean): TurnierGruppe {
  const eigen: TurnierTeam = { id: c.spieler.nationalitaet, name: nationName(c.spieler.nationalitaet), staerke: natStaerke(c) }
  const pool = nationen(wm, c.spieler.nationalitaet).sort((a, b) => b.staerke - a.staerke)
  const drittel = Math.ceil(pool.length / 3)
  const gegner: Nation[] = [0, 1, 2].map((i) => {
    const teil = pool.slice(i * drittel, (i + 1) * drittel)
    return teil[rng.int(0, teil.length - 1)]
  })
  // Gegner in zufälliger Reihenfolge, damit nicht immer zuerst der stärkste kommt
  const teams = [eigen, ...gegner.sort(() => rng.next() - 0.5)]
  const tabelle: Record<string, ReturnType<typeof leereZeile>> = {}
  for (const t of teams) tabelle[t.id] = leereZeile()
  return { teams, tabelle, ergebnisse: [] }
}

/** Entscheidet über Qualifikation und Nominierung und baut ggf. das Turnier. */
export function baueTurnier(c: Career, rng: Rng): Pick<Saison, 'turnier' | 'turnierInfo'> {
  const name = turnierName(c.uhr.saison)
  const daten = LAENDER[c.spieler.nationalitaet]
  if (!name || !istNationalspieler(c) || daten.gesperrt) return { turnier: null }
  const pQuali = clamp((daten.national - 50) / 30, 0.15, 0.97)
  if (!rng.chance(pQuali)) {
    return { turnier: null, turnierInfo: { name, ergebnis: 'Qualifikation verpasst', text: `${name}: Die Nationalmannschaft hat die Qualifikation verpasst. Ein Turnier ohne dich und deine Teamkollegen.` } }
  }
  const quali = rng.chance(0.65) ? 'Als Gruppenerster der Qualifikation qualifiziert' : 'Über die Playoffs qualifiziert'
  const nt = natVon(c)
  const pNominiert = clamp((nt.vertrauen - 10) / 55, 0.1, 0.98)
  if (overall(c.spieler) < daten.national - 10 || !rng.chance(pNominiert)) {
    return { turnier: null, turnierInfo: { name, ergebnis: 'Nicht nominiert', text: `${name}: Dein Land ist dabei, aber der Nationaltrainer hat dich nicht in den Turnierkader berufen.` } }
  }
  const turnier: Turnier = {
    name, status: 'gruppe', punkte: 0, spiele: 0, quali, kader: natRolle(c),
    gruppe: neueGruppe(c, rng, name.startsWith('WM')), verlauf: [], einsaetze: 0, tore: 0, vorlagen: 0,
  }
  return { turnier }
}

/** Nächster Gegner im Turnier (für Vorschau und Tab), oder null. */
export function turnierNaechster(c: Career): { runde: string; gegner: string } | null {
  const t = c.saison.turnier
  if (!t || t.status === 'aus' || t.status === 'sieger') return null
  if (t.status === 'gruppe') {
    const g = t.gruppe?.teams[t.spiele + 1]
    return { runde: `Gruppenspiel ${t.spiele + 1}`, gegner: g?.name ?? 'Gegner' }
  }
  return { runde: turnierRunde(t.status), gegner: 'noch offen' }
}

/** Simuliert das Parallelspiel eines Gruppenspieltags nach dem Spiel des Spielers. */
export function gruppeParallelspiel(g: TurnierGruppe, tag: number, rng: Rng): void {
  const [, a, b, d] = g.teams
  const paar = tag === 1 ? [b, d] : tag === 2 ? [a, d] : [a, b]
  const [th, ta] = simuliereTore(paar[0].staerke, paar[1].staerke, rng, 0)
  tabelleEintragen(g.tabelle, paar[0].id, paar[1].id, th, ta)
  g.ergebnisse.push({ tag, heim: paar[0].id, aus: paar[1].id, th, ta })
}

/** Platz in der Gruppe (1–4) und Punkte des Spielers. */
export function gruppenPlatz(g: TurnierGruppe): { platz: number; pkt: number } {
  const r = rangliste(g.tabelle, g.teams.map((t) => t.id))
  const i = r.findIndex((x) => x.id === g.teams[0].id)
  return { platz: i + 1, pkt: r[i].pkt }
}

/** Ergebnis des Turniers als Text für Historie und Saisonbericht. */
export function turnierErgebnis(t: Turnier): string {
  if (t.status === 'sieger') return 'Turniersieger'
  const letzte = t.verlauf?.[t.verlauf.length - 1]
  if (t.status === 'aus') {
    if (!letzte) return 'Aus in der Gruppenphase'
    return letzte.runde === 'Finale' ? 'Finalniederlage (Vizemeister)' : `Aus im ${letzte.runde}`
  }
  return 'Turnier läuft'
}

export function bilanzVon(saison: number, t: Turnier): TurnierBilanz {
  return { saison, name: t.name, ergebnis: turnierErgebnis(t), einsaetze: t.einsaetze ?? 0, tore: t.tore ?? 0 }
}

/** Jahre bis zum nächsten Turnier (0 = in dieser Saison), höchstens 4. */
export function naechstesTurnier(c: Career): { name: string; in: number } | null {
  for (let i = 0; i <= 4; i++) {
    const n = turnierName(c.uhr.saison + i)
    if (n) return { name: n, in: i }
  }
  return null
}
