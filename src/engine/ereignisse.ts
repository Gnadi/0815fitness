import { ALLE_EREIGNISSE, EREIGNIS_BY_ID } from '../data/events'
import type { Ausgang, Effekt, EreignisDef, EreignisOption, Txt, Wurf } from '../data/events/types'
import { VEREINE } from '../data/clubs'
import { zufallsName } from '../data/names'
import { applyTraits } from './match'
import { clamp } from './rating'
import { SKILL_KEYS } from './rating'
import type { Rng } from './rng'
import { ANLAGE_INFO, ANLAGEN, auszahlen, depotVon, einzahlen, neuerDeal, skaliere, vcAktiv, vcAufstocken, vcEinsteigen } from './finanzen'
import { erzeugeAngebote, vereinsAngebot } from './wirtschaft'
import { fuehreWechselAus, neueMitarbeiter } from './transfers'
import type { AktionName } from '../data/events/types'
import type { Angebot, Career, Skills, Traits } from './types'

const TRAIT_LABEL: Record<keyof Traits, string> = {
  moral: 'Moral', selbstvertrauen: 'Selbstvertrauen', disziplin: 'Disziplin', professionalitaet: 'Professionalität',
  ehrgeiz: 'Ehrgeiz', ruf: 'Ruf', fanbeliebtheit: 'Fans', trainerBeziehung: 'Trainer', kabine: 'Kabine',
  fitness: 'Fitness', gesundheit: 'Gesundheit', privatglueck: 'Privatglück',
}
const SKILL_LABEL: Record<keyof Skills, string> = {
  tempo: 'Tempo', schuss: 'Schuss', pass: 'Pass', dribbling: 'Dribbling', defensive: 'Defensive',
  physis: 'Physis', technik: 'Technik', positionsspiel: 'Positionsspiel',
}

const euro = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
const vz = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(Math.round(n))}`

/** Setzt Platzhalter im Text ein. */
export function fuelleText(c: Career, t: Txt): string {
  const s = typeof t === 'function' ? t(c) : t
  const p = c.personen
  const m = p.partnerGeschlecht === 'm'
  return s
    .replaceAll('{name}', c.spieler.nachname)
    .replaceAll('{vorname}', c.spieler.vorname)
    .replaceAll('{verein}', c.vereinId ? VEREINE[c.vereinId].name : 'deinem Ex-Verein')
    .replaceAll('{trainer}', p.trainer)
    .replaceAll('{kapitaen}', p.kapitaen)
    .replaceAll('{rivale}', p.rivale)
    .replaceAll('{freund}', p.freund)
    .replaceAll('{berater}', p.berater)
    .replaceAll('{partner}', p.partner ?? 'dein Schatz')
    .replaceAll('{sie}', m ? 'er' : 'sie')
    .replaceAll('{Sie}', m ? 'Er' : 'Sie')
    .replaceAll('{ihr}', m ? 'ihm' : 'ihr')
    .replaceAll('{ihre}', m ? 'seine' : 'ihre')
    .replaceAll('{reporter}', p.reporter)
}

export function erfolgsChance(c: Career, w: Wurf): number {
  if (w.chance) return clamp(w.chance(c), 0.03, 0.97)
  const { skills, traits } = c.spieler
  const avg = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length
  const sm = w.skills?.length ? (avg(w.skills.map((k) => skills[k])) - 50) / 100 : 0
  const tm = w.traits?.length ? (avg(w.traits.map((k) => traits[k])) - 50) / 100 : 0
  return clamp((w.basis ?? 0.5) + sm + tm, 0.05, 0.95)
}

// ---------------------------------------------------------------- Auswahl

export function ereignisVerfuegbar(c: Career, def: EreignisDef): boolean {
  const zuletzt = c.ereignisZeiten[def.id]
  if (zuletzt !== undefined && (def.abstand === undefined || c.wochenGesamt - zuletzt < def.abstand)) return false
  return !def.bedingung || def.bedingung(c)
}

/** Wählt die Ereignisse für die neu begonnene Woche (höchstens eins). */
export function waehleEreignisse(c: Career, rng: Rng): string[] {
  // 1. fällige Folgeereignisse
  const faellig = c.geplant.find((g) => g.ab <= c.wochenGesamt)
  if (faellig) return [faellig.id]
  // 2. Pflichtereignisse
  const pflicht = ALLE_EREIGNISSE.find((e) => e.pflicht && ereignisVerfuegbar(c, e))
  if (pflicht) return [pflicht.id]
  // 3. Zufall
  const slot = c.saison.kalender[c.uhr.woche - 1]
  const p = slot?.t === 'F' ? 0.45 : 0.32
  if (!rng.chance(p)) return []
  const pool = ALLE_EREIGNISSE.filter((e) => e.gewicht > 0 && !e.pflicht && ereignisVerfuegbar(c, e))
  const total = pool.reduce((a, e) => a + e.gewicht, 0)
  if (total <= 0) return []
  let r = rng.next() * total
  for (const e of pool) {
    r -= e.gewicht
    if (r <= 0) return [e.id]
  }
  return []
}

/** Aktiviert das nächste Ereignis der Warteschlange (setzt Phase `ereignis`). */
export function starteEreignis(c: Career, id: string): Career {
  const def = EREIGNIS_BY_ID[id]
  if (!def) return { ...c, ereignisSchlange: c.ereignisSchlange.filter((x) => x !== id) }
  return {
    ...c,
    phase: 'ereignis',
    ereignis: { id, gewaehlt: null, ausgang: null, wirkung: [] },
    geplant: c.geplant.filter((g) => g.id !== id),
    ereignisZeiten: { ...c.ereignisZeiten, [id]: c.wochenGesamt },
  }
}

export const kostenVon = (c: Career, o: EreignisOption): number => (typeof o.kosten === 'function' ? o.kosten(c) : (o.kosten ?? 0))

export function optionVerfuegbar(c: Career, o: EreignisOption): boolean {
  if (kostenVon(c, o) > c.spieler.geld) return false
  return !o.bedingung || o.bedingung(c)
}

// ---------------------------------------------------------------- Wirkung

/** Wendet Effekte an und liefert die Zeilen der Wirkungsanzeige. */
export function wendeEffekteAn(c: Career, effekte: readonly Effekt[], rng: Rng): { c: Career; wirkung: string[] } {
  let next = c
  const wirkung: string[] = []
  for (const e of effekte) {
    switch (e.t) {
      case 'traits': {
        next = { ...next, spieler: { ...next.spieler, traits: applyTraits(next.spieler.traits, e.d) } }
        for (const [k, v] of Object.entries(e.d) as [keyof Traits, number][]) if (v) wirkung.push(`${TRAIT_LABEL[k]} ${vz(v)}`)
        break
      }
      case 'skills': {
        const skills = { ...next.spieler.skills }
        for (const k of SKILL_KEYS) if (e.d[k]) skills[k] = clamp(skills[k] + (e.d[k] ?? 0), 1, 100)
        next = { ...next, spieler: { ...next.spieler, skills } }
        for (const [k, v] of Object.entries(e.d) as [keyof Skills, number][]) if (v) wirkung.push(`${SKILL_LABEL[k]} ${vz(v)}`)
        break
      }
      case 'geld': {
        const d = Math.round(typeof e.d === 'function' ? e.d(next) : e.d)
        next = { ...next, spieler: { ...next.spieler, geld: next.spieler.geld + d } }
        wirkung.push(`${d >= 0 ? '+' : '−'}${euro(Math.abs(d))}`)
        break
      }
      case 'lebensstil':
        next = { ...next, flags: { ...next.flags, lebensstil: Number(next.flags.lebensstil ?? 0) + e.d } }
        break
      case 'depot': {
        const vorher = ANLAGEN.reduce((a, k) => a + depotVon(next)[k].wert, 0)
        next = skaliere(next, e.anlage, e.faktor)
        const nachher = ANLAGEN.reduce((a, k) => a + depotVon(next)[k].wert, 0)
        if (Math.abs(nachher - vorher) >= 1) wirkung.push(`Depot ${nachher >= vorher ? '+' : '−'}${euro(Math.abs(nachher - vorher))}`)
        break
      }
      case 'invest': {
        const betrag = Math.floor(Math.max(0, next.spieler.geld) * e.anteil)
        if (betrag > 0) {
          next = einzahlen(next, e.anlage, betrag)
          wirkung.push(`${euro(betrag)} in ${ANLAGE_INFO[e.anlage].name} angelegt`)
        }
        break
      }
      case 'abheben': {
        let summe = 0
        for (const k of ANLAGEN) {
          if (e.anlage !== 'alle' && e.anlage !== k) continue
          const b = Math.floor(depotVon(next)[k].wert * e.anteil)
          next = auszahlen(next, k, b)
          summe += b
        }
        if (summe > 0) wirkung.push(`${euro(summe)} aufs Konto ausgezahlt`)
        break
      }
      case 'vcEinstieg': {
        const betrag = Math.floor(Math.max(0, next.spieler.geld) * e.anteil)
        if (betrag > 0) {
          const deal = neuerDeal(rng, e.gut)
          next = vcEinsteigen(next, deal, betrag)
          wirkung.push(`${euro(betrag)} in ${deal.name} investiert`)
        }
        break
      }
      case 'vcAufstocken': {
        const ziel = [...vcAktiv(next)].sort((a, b) => b.wert - a.wert)[0]
        const betrag = Math.floor(Math.max(0, next.spieler.geld) * e.anteil)
        if (ziel && betrag > 0) {
          next = vcAufstocken(next, ziel.id, betrag)
          wirkung.push(`${euro(betrag)} in ${ziel.name} nachgelegt`)
        }
        break
      }
      case 'flag':
        next = { ...next, flags: { ...next.flags, [e.k]: e.v ?? true } }
        break
      case 'zaehle':
        next = { ...next, flags: { ...next.flags, [e.k]: Number(next.flags[e.k] ?? 0) + e.d } }
        break
      case 'folge':
        if (e.p === undefined || rng.chance(e.p)) {
          next = { ...next, geplant: [...next.geplant, { id: e.id, ab: next.wochenGesamt + e.wochen }] }
        }
        break
      case 'verletzung':
        if (!next.verletzung) {
          next = { ...next, verletzung: { name: e.name, wochen: e.wochen } }
          wirkung.push(`Verletzung: ${e.name} (${e.wochen} Wochen)`)
        }
        break
      case 'reha':
        if (next.verletzung) {
          const rest = next.verletzung.wochen - e.wochen
          next = { ...next, verletzung: rest <= 0 ? null : { ...next.verletzung, wochen: rest } }
          wirkung.push(`Reha ${e.wochen} Woche${e.wochen === 1 ? '' : 'n'} kürzer`)
        }
        break
      case 'sperre':
        next = { ...next, sperre: next.sperre + e.spiele }
        wirkung.push(`Sperre: ${e.spiele} Spiel${e.spiele === 1 ? '' : 'e'}`)
        break
      case 'schlagzeile':
        next = { ...next, log: [...next.log, `${next.uhr.saison}/${String(next.uhr.saison + 1).slice(2)}: ${fuelleText(next, e.text)}`].slice(-80) }
        break
      case 'aktion': {
        const r = fuehreAktionAus(next, e.name, rng)
        next = r.c
        wirkung.push(...r.wirkung)
        break
      }
    }
  }
  return { c: next, wirkung }
}

function fuehreAktionAus(c: Career, name: AktionName, rng: Rng): { c: Career; wirkung: string[] } {
  const land = c.vereinId ? VEREINE[c.vereinId].land : c.spieler.nationalitaet
  switch (name) {
    case 'berater-wechsel': {
      const guete = clamp(Number(c.flags.beraterGuete ?? 1) + rng.int(-1, 2), 1, 5)
      return {
        c: { ...c, personen: { ...c.personen, berater: zufallsName(land, rng) }, flags: { ...c.flags, beraterGuete: guete } },
        wirkung: [`Neuer Berater: ${guete >= 4 ? 'ein Haifisch' : guete >= 2 ? 'solide' : 'eher ein Amateur'}`],
      }
    }
    case 'berater-upgrade':
      return { c: { ...c, flags: { ...c.flags, beraterGuete: clamp(Number(c.flags.beraterGuete ?? 1) + 1, 1, 5) } }, wirkung: ['Berater wird besser'] }
    case 'verlaengerung-anbieten': {
      if (!c.vertrag || !c.vereinId) return { c, wirkung: [] }
      const angebot: Angebot = vereinsAngebot(c, rng, c.vereinId, 'verlaengerung')
      return { c: { ...c, angebote: [...c.angebote.filter((x) => x.art !== 'verlaengerung'), angebot] }, wirkung: ['Vertragsangebot im Menü „Vertrag“'] }
    }
    case 'nationalspieler':
      return { c: { ...c, flags: { ...c.flags, nationalspieler: true } }, wirkung: ['Nationalspieler!'] }
    case 'laenderspiel': {
      const tore = rng.chance(c.spieler.position === 'ST' ? 0.3 : 0.08) ? 1 : 0
      return {
        c: { ...c, laufbahn: { ...c.laufbahn, laenderspiele: c.laufbahn.laenderspiele + 1, laenderspielTore: c.laufbahn.laenderspielTore + tore } },
        wirkung: [`Länderspiel${tore ? ' mit Tor' : ''}`],
      }
    }
    case 'trainer-wechsel':
      return {
        c: { ...c, personen: neueMitarbeiter(land, rng, c.personen), spieler: { ...c.spieler, traits: applyTraits(c.spieler.traits, { trainerBeziehung: 50 - c.spieler.traits.trainerBeziehung }) } },
        wirkung: ['Neuer Trainer'],
      }
    case 'partner-neu':
    {
      const geschlecht = rng.chance(0.5) ? 'm' : 'w'
      return { c: { ...c, personen: { ...c.personen, partner: zufallsName(c.spieler.nationalitaet, rng, geschlecht), partnerGeschlecht: geschlecht } }, wirkung: [] }
    }
    case 'partner-ende':
      return { c: { ...c, personen: { ...c.personen, partner: null, partnerGeschlecht: undefined } }, wirkung: ['Beziehung vorbei'] }
    case 'wechselwunsch':
      return { c: { ...c, wechselwunsch: true }, wirkung: ['Wechselwunsch hinterlegt'] }
    case 'verein-wechseln-erzwingen': {
      const angebote = erzeugeAngebote(c, rng, { art: 'transfer', anzahl: 1, ausser: [c.vereinId] })
      if (!angebote.length) return { c, wirkung: [] }
      return { c: fuehreWechselAus({ ...c, fenster: null }, rng, angebote[0]), wirkung: [`Wechsel zu ${VEREINE[angebote[0].vereinId].name}`] }
    }
    case 'sponsor-neu':
      return { c: { ...c, flags: { ...c.flags, sponsor: true } }, wirkung: ['Neuer Sponsor'] }
    case 'sponsor-ende':
      return { c: { ...c, flags: { ...c.flags, sponsor: false } }, wirkung: ['Sponsor weg'] }
    case 'skandal':
      return { c: { ...c, laufbahn: { ...c.laufbahn, skandale: c.laufbahn.skandale + 1 } }, wirkung: [] }
    case 'auszeichnung':
      return { c, wirkung: [] }
    case 'gehaltserhoehung':
      if (!c.vertrag) return { c, wirkung: [] }
      return { c: { ...c, vertrag: { ...c.vertrag, gehalt: Math.round((c.vertrag.gehalt * 1.2) / 1000) * 1000 } }, wirkung: ['Gehalt +20 %'] }
    case 'karriereende':
      return { c: { ...c, flags: { ...c.flags, ende: true } }, wirkung: ['Das Ende der Karriere'] }
  }
}

/** Spieler entscheidet im aktuellen Ereignis. */
export function waehleEreignisOption(c: Career, rng: Rng, index: number): Career {
  const z = c.ereignis
  if (!z || z.gewaehlt !== null) return c
  const def = EREIGNIS_BY_ID[z.id]
  const o = def.optionen[index]
  if (!o || !optionVerfuegbar(c, o)) return c

  let next = c
  const kosten = kostenVon(c, o)
  if (kosten) next = { ...next, spieler: { ...next.spieler, geld: next.spieler.geld - kosten } }
  const gelungen = !o.wurf || rng.chance(erfolgsChance(next, o.wurf))
  const ausgang: Ausgang = gelungen ? o.erfolg : (o.misserfolg ?? o.erfolg)
  const r = wendeEffekteAn(next, ausgang.effekte ?? [], rng)
  next = r.c
  const wirkung = kosten ? [`−${euro(kosten)}`, ...r.wirkung] : r.wirkung
  return {
    ...next,
    ereignis: { id: z.id, gewaehlt: index, ausgang: fuelleText(next, ausgang.text), wirkung },
  }
}

/** Schließt das Ereignis ab: nächstes aus der Schlange oder zurück zur Planung. */
export function beendeEreignis(c: Career): Career {
  if (c.phase !== 'ereignis' || !c.ereignis || c.ereignis.gewaehlt === null) return c
  const schlange = c.ereignisSchlange
  return { ...c, ereignis: null, phase: 'planung', ereignisSchlange: schlange }
}
