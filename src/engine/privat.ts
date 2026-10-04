import { IMMO_TYPEN } from '../data/immobilien'
import { PRIVAT, PRIVAT_BY_ID, type PrivatPosten } from '../data/privat'
import { immoAktiv, hatWohnsitz } from './immobilien'
import { applyTraits } from './match'
import type { Career, PrivatZustand, Traits } from './types'

export const privatVon = (c: Pick<Career, 'privat'>): PrivatZustand => c.privat ?? { besitz: {}, zeiten: {} }
export const hatBesitz = (c: Pick<Career, 'privat'>, id: string): boolean => id in privatVon(c).besitz

const euroText = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

/** Gekaufter Besitz, der gerade wirkt (Miete zählt nicht, wenn man ein Eigenheim hat). */
export function aktiverBesitz(c: Career): PrivatPosten[] {
  const eigen = hatWohnsitz(c)
  return Object.keys(privatVon(c).besitz)
    .map((id) => PRIVAT_BY_ID[id])
    .filter((p): p is PrivatPosten => !!p && !(eigen && p.gruppe === 'wohnen'))
}

/** Laufende Kosten pro Jahr aus Privatbesitz. */
export const privatLaufend = (c: Career): number => aktiverBesitz(c).reduce((a, p) => a + (p.laufend ?? 0), 0)

/** Summe der Wochenwirkung aus Besitz und selbst genutzten Immobilien. */
export function privatPassiv(c: Career): Partial<Traits> {
  const out: Partial<Traits> = {}
  const add = (d: Partial<Traits> | undefined) => {
    if (d) for (const [k, v] of Object.entries(d) as [keyof Traits, number][]) out[k] = (out[k] ?? 0) + v
  }
  for (const p of aktiverBesitz(c)) add(p.passiv)
  for (const i of immoAktiv(c)) {
    const t = IMMO_TYPEN[i.typ]
    if (t.komfort || t.prestige) add({ privatglueck: t.komfort, ruf: t.prestige ?? 0 })
  }
  return out
}

/** Wochen bis die Aktivität wieder möglich ist (0 = sofort). */
export function wartezeit(c: Career, p: PrivatPosten): number {
  const letzte = privatVon(c).zeiten[p.id]
  return letzte === undefined ? 0 : Math.max(0, (p.abkuehlung ?? 0) - (c.wochenGesamt - letzte))
}

/** Grund, warum nicht möglich (oder null). */
export function privatPruefung(c: Career, p: PrivatPosten): string | null {
  if (p.braucht === 'partner' && c.personen.partner === null) return 'Du hast keine Partnerin bzw. keinen Partner.'
  if (p.braucht === 'kinder' && Number(c.flags.kinder ?? 0) <= 0) return 'Du hast keine Kinder.'
  if (p.braucht === 'profi' && (c.saison.jugend || c.vereinId === '')) return 'Erst als Profi bei einem Verein.'
  if (p.art === 'besitz' && hatBesitz(c, p.id)) return 'Schon vorhanden.'
  const w = wartezeit(c, p)
  if (w > 0) return `Wieder möglich in ${w} Woche${w === 1 ? '' : 'n'}.`
  if (p.kosten > c.spieler.geld) return 'Zu wenig Geld.'
  return null
}

/** Wirkungstext für die Rückmeldung. */
function wirkungText(d: Partial<Traits> | undefined): string {
  const NAMEN: Record<keyof Traits, string> = {
    moral: 'Moral', selbstvertrauen: 'Selbstvertrauen', disziplin: 'Disziplin', professionalitaet: 'Professionalität', ehrgeiz: 'Ehrgeiz', ruf: 'Ruf',
    fanbeliebtheit: 'Fans', trainerBeziehung: 'Trainer', kabine: 'Kabine', fitness: 'Fitness', gesundheit: 'Gesundheit', privatglueck: 'Privatglück',
  }
  return Object.entries(d ?? {}).filter(([, v]) => v).map(([k, v]) => `${NAMEN[k as keyof Traits]} ${v! >= 0 ? '+' : '−'}${Math.abs(v!)}`).join(', ')
}

/** Nutzt eine Aktivität bzw. kauft einen Besitz. */
export function privatAktion(c: Career, id: string): { c: Career; text: string } {
  const p = PRIVAT_BY_ID[id]
  if (!p) return { c, text: '' }
  const grund = privatPruefung(c, p)
  if (grund) return { c, text: grund }
  const st = privatVon(c)
  let geld = c.spieler.geld - p.kosten
  let besitz = st.besitz
  let rueckgabe = 0
  if (p.art === 'besitz') {
    besitz = { ...besitz }
    if (p.gruppe) {
      for (const alt of Object.keys(besitz)) {
        const a = PRIVAT_BY_ID[alt]
        if (a?.gruppe === p.gruppe) {
          delete besitz[alt]
          if (p.gruppe === 'auto') rueckgabe += Math.round(a.kosten * 0.5)
        }
      }
    }
    besitz[p.id] = c.wochenGesamt
    geld += rueckgabe
  }
  const zeiten = p.art === 'aktion' ? { ...st.zeiten, [p.id]: c.wochenGesamt } : st.zeiten
  const out: Career = {
    ...c,
    spieler: { ...c.spieler, geld, traits: applyTraits(c.spieler.traits, p.sofort) },
    privat: { besitz, zeiten },
  }
  const wirkung = wirkungText(p.sofort)
  const text = `${p.name}: −${euroText(p.kosten)}${rueckgabe ? `, Verkauf des alten Wagens +${euroText(rueckgabe)}` : ''}${wirkung ? ` · ${wirkung}` : ''}`
  return { c: out, text }
}

/** Beendet ein laufendes Abo bzw. eine Miete (nur Besitz mit laufenden Kosten). */
export function privatKuendigen(c: Career, id: string): { c: Career; text: string } {
  const p = PRIVAT_BY_ID[id]
  if (!p || !hatBesitz(c, id) || !p.laufend) return { c, text: '' }
  const besitz = { ...privatVon(c).besitz }
  delete besitz[id]
  return { c: { ...c, privat: { ...privatVon(c), besitz } }, text: `${p.name} gekündigt.` }
}

/** Beschreibung des aktuellen Privatglücks. */
export function glueckStufe(v: number): { text: string; ton: 'gut' | 'mittel' | 'schlecht' } {
  if (v >= 80) return { text: 'Rundum glücklich', ton: 'gut' }
  if (v >= 60) return { text: 'Zufrieden', ton: 'gut' }
  if (v >= 40) return { text: 'Es könnte besser laufen', ton: 'mittel' }
  if (v >= 20) return { text: 'Angespannt', ton: 'schlecht' }
  return { text: 'Ausgebrannt', ton: 'schlecht' }
}

export { PRIVAT }
