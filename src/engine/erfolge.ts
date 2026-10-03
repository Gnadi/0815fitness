import { LAENDER, VEREINE } from '../data/clubs'
import { depotGesamt } from './finanzen'
import { alter, overall } from './rating'
import { gesamtStats } from './statistik'
import { marktwert } from './wirtschaft'
import type { Career } from './types'

export interface ErfolgDef {
  id: string
  name: string
  text: string
  check: (c: Career) => boolean
}

const POKALE = new Set(Object.values(LAENDER).map((l) => l.pokal))
const hatTitel = (c: Career, f: (name: string) => boolean) => c.laufbahn.titel.some((t) => f(t.name))
const flag = (c: Career, k: string) => c.flags[k] === true

export const ERFOLGE: ErfolgDef[] = [
  { id: 'debuet', name: 'Das erste Mal', text: 'Erstes Pflichtspiel absolviert.', check: (c) => gesamtStats(c).spiele >= 1 },
  { id: 'erstes-tor', name: 'Torjäger in spe', text: 'Erstes Tor erzielt.', check: (c) => gesamtStats(c).tore >= 1 },
  { id: 'hattrick', name: 'Hattrick!', text: 'Drei Tore in einem Spiel.', check: (c) => flag(c, 'hattrick') },
  { id: 'tore-25', name: 'Treffsicher', text: '25 Tore in der Karriere.', check: (c) => gesamtStats(c).tore >= 25 },
  { id: 'tore-100', name: 'Hundertschaft', text: '100 Tore in der Karriere.', check: (c) => gesamtStats(c).tore >= 100 },
  { id: 'tore-250', name: 'Torfabrik', text: '250 Tore in der Karriere.', check: (c) => gesamtStats(c).tore >= 250 },
  { id: 'spiele-100', name: 'Stammgast', text: '100 Pflichtspiele.', check: (c) => gesamtStats(c).spiele >= 100 },
  { id: 'spiele-300', name: 'Dauerbrenner', text: '300 Pflichtspiele.', check: (c) => gesamtStats(c).spiele >= 300 },
  { id: 'spiele-600', name: 'Eisenfuß', text: '600 Pflichtspiele.', check: (c) => gesamtStats(c).spiele >= 600 },
  { id: 'profi', name: 'Profi!', text: 'Der erste Profivertrag.', check: (c) => !c.saison.jugend && c.vertrag !== null && c.vertrag.rolle !== 'Jugend' },
  { id: 'erster-titel', name: 'Silberware', text: 'Der erste Titel.', check: (c) => c.laufbahn.titel.length >= 1 },
  { id: 'meister', name: 'Meister!', text: 'Eine Meisterschaft gewonnen.', check: (c) => hatTitel(c, (n) => n.startsWith('Meister')) },
  { id: 'pokalsieger', name: 'Pokalheld', text: 'Einen nationalen Pokal gewonnen.', check: (c) => hatTitel(c, (n) => POKALE.has(n)) },
  { id: 'europapokal', name: 'Europas Beste', text: 'Einen Europapokal gewonnen.', check: (c) => hatTitel(c, (n) => n.includes('League')) },
  { id: 'champions-league', name: 'Henkelpott', text: 'Die Champions League gewonnen.', check: (c) => hatTitel(c, (n) => n === 'Champions League') },
  { id: 'turniersieger', name: 'Weltmeister-Gefühl', text: 'Ein Turnier mit der Nationalmannschaft gewonnen.', check: (c) => hatTitel(c, (n) => n.startsWith('WM') || n.startsWith('EM')) },
  { id: 'nationalspieler', name: 'Für Fahne und Hymne', text: 'Erstes Länderspiel.', check: (c) => c.laufbahn.laenderspiele >= 1 },
  { id: 'laenderspiele-50', name: 'Nationalheld', text: '50 Länderspiele.', check: (c) => c.laufbahn.laenderspiele >= 50 },
  { id: 'u-nationalspieler', name: 'Juniorennationalspieler', text: 'Für eine Jugendnationalmannschaft nominiert.', check: (c) => flag(c, 'u-nationalspieler') },
  { id: 'millionaer', name: 'Millionär', text: 'Eine Million Euro auf dem Konto.', check: (c) => c.spieler.geld >= 1_000_000 },
  { id: 'multimillionaer', name: 'Multimillionär', text: '10 Millionen Euro auf dem Konto.', check: (c) => c.spieler.geld >= 10_000_000 },
  { id: 'topclub', name: 'Der große Sprung', text: 'Bei einem Spitzenklub unterschrieben (Stärke 85+).', check: (c) => (c.welt.staerke[c.vereinId] ?? 0) >= 85 },
  { id: 'ausland', name: 'Auslandserfahrung', text: 'Ins Ausland gewechselt.', check: (c) => flag(c, 'ausland') },
  { id: 'weltenbummler', name: 'Weltenbummler', text: 'Für sechs verschiedene Vereine gespielt.', check: (c) => gesamtStats(c).vereine >= 6 },
  { id: 'vereinsikone', name: 'Vereinsikone', text: 'Zehn Saisons für denselben Verein.', check: (c) => Object.values(c.historie.reduce<Record<string, number>>((m, s) => ({ ...m, [s.vereinId]: (m[s.vereinId] ?? 0) + 1 }), {})).some((n) => n >= 10) },
  { id: 'kapitaen', name: 'Der Kapitän', text: 'Kapitänsbinde getragen.', check: (c) => flag(c, 'kapitaen') },
  { id: 'verheiratet', name: 'Ja, ich will', text: 'Geheiratet.', check: (c) => flag(c, 'verheiratet') },
  { id: 'familie', name: 'Familienmensch', text: 'Zwei Kinder.', check: (c) => Number(c.flags.kinder ?? 0) >= 2 },
  { id: 'skandal', name: 'Skandalnudel', text: 'Zwei Skandale in der Karriere.', check: (c) => c.laufbahn.skandale >= 2 },
  { id: 'saubermann', name: 'Saubermann', text: 'Mindestens 30 Jahre alt, 300 Spiele, kein Skandal.', check: (c) => alter(c.spieler.geburtsdatum, c.uhr.saison) >= 30 && gesamtStats(c).spiele >= 300 && c.laufbahn.skandale === 0 },
  { id: 'comeback', name: 'Comeback-Kid', text: 'Nach einem Kreuzbandriss zurückgekehrt.', check: (c) => flag(c, 'comeback') },
  { id: 'aufstieg', name: 'Aufstiegsheld', text: 'Mit dem Verein aufgestiegen.', check: (c) => flag(c, 'aufstieg') },
  { id: 'weltfussballer', name: 'Weltfußballer', text: 'Zum Weltfußballer gewählt.', check: (c) => c.laufbahn.auszeichnungen.some((a) => a.name === 'Weltfußballer') },
  { id: 'wert-50', name: 'Marktwert-Rakete', text: 'Marktwert über 50 Millionen Euro.', check: (c) => c.laufbahn.hoechsterMarktwert >= 50_000_000 },
  { id: 'overall-80', name: 'Weltklasse', text: 'Gesamtstärke 80 erreicht.', check: (c) => overall(c.spieler) >= 80 },
  { id: 'overall-90', name: 'Jahrhunderttalent', text: 'Gesamtstärke 90 erreicht.', check: (c) => overall(c.spieler) >= 90 },
  { id: 'kleinanleger', name: 'Kleinanleger', text: 'Ein Depot mit mindestens 10.000 Euro Wert.', check: (c) => depotGesamt(c) >= 10_000 },
  { id: 'vermoegensaufbau', name: 'Vermögensaufbau', text: 'Ein Depot mit mindestens 1 Million Euro Wert.', check: (c) => depotGesamt(c) >= 1_000_000 },
  { id: 'vermieter', name: 'Vermieter', text: 'Mieteinnahmen aus einer Immobilie.', check: (c) => Number(c.flags.mieteinnahmen ?? 0) > 0 },
  { id: 'sponsor', name: 'Werbegesicht', text: 'Einen Sponsorenvertrag unterschrieben.', check: (c) => c.flags.sponsor === true },
  { id: 'doku', name: 'Streaming-Star', text: 'Eine Doku über dich gedreht.', check: (c) => flag(c, 'doku') },
  { id: 'haus', name: 'Eigenheim', text: 'Ein Haus gekauft.', check: (c) => flag(c, 'haus') },
  { id: 'lizenz', name: 'Plan B', text: 'Trainerlizenz oder Studium gestartet.', check: (c) => flag(c, 'trainerlizenz') || flag(c, 'studium') },
]

export const ERFOLG_BY_ID: Record<string, ErfolgDef> = Object.fromEntries(ERFOLGE.map((e) => [e.id, e]))

/** Prüft alle Erfolge und schaltet neue frei (mit Meldung im Wochenbericht und Log). */
export function pruefeErfolge(c: Career): Career {
  const wert = marktwert(c.spieler, c.uhr.saison)
  let next = wert > c.laufbahn.hoechsterMarktwert ? { ...c, laufbahn: { ...c.laufbahn, hoechsterMarktwert: wert } } : c
  const neu = ERFOLGE.filter((e) => !next.erfolge.includes(e.id) && e.check(next))
  if (!neu.length) return next
  next = {
    ...next,
    erfolge: [...next.erfolge, ...neu.map((e) => e.id)],
    log: [...next.log, ...neu.map((e) => `Erfolg: ${e.name}`)].slice(-80),
    bericht: next.bericht
      ? { ...next.bericht, hinweise: [...next.bericht.hinweise, ...neu.map((e) => `🏆 Erfolg freigeschaltet: ${e.name}`)] }
      : next.bericht,
  }
  return next
}

export const vereinsLand = (id: string) => VEREINE[id]?.land
