import { applyTraits } from './match'
import { clamp, overall } from './rating'
import type { Rng } from './rng'
import type { Career, Traits } from './types'

/** Einstellungen für die Social-Media-Kanäle (liegen als Flags im Spielstand). */
export type SocialKey = 'streamRate' | 'streamInhalt' | 'postRate' | 'socialTon' | 'socialWerbung'

type Opt = readonly (readonly [string, string])[]

export const STREAM_RATEN: Opt = [['aus', 'Pause'], ['wenig', '1× / Woche'], ['normal', '3× / Woche'], ['viel', 'Täglich']]
export const STREAM_INHALTE: Opt = [['gaming', 'Gaming'], ['talk', 'Talk'], ['fussball', 'Fußball'], ['irl', 'Alltag (IRL)']]
export const POST_RATEN: Opt = [['aus', 'Pause'], ['normal', 'Normal'], ['viel', 'Täglich']]
export const TOENE: Opt = [['brav', 'Brav'], ['frech', 'Frech'], ['provokant', 'Provokant']]
export const WERBUNG: Opt = [['keine', 'Keine'], ['wenig', 'Wenig'], ['viel', 'Viel']]

export const SOCIAL_OPTIONEN: Record<SocialKey, Opt> = {
  streamRate: STREAM_RATEN, streamInhalt: STREAM_INHALTE, postRate: POST_RATEN, socialTon: TOENE, socialWerbung: WERBUNG,
}
const STANDARD: Record<SocialKey, string> = { streamRate: 'wenig', streamInhalt: 'gaming', postRate: 'normal', socialTon: 'frech', socialWerbung: 'wenig' }

const STREAMS: Record<string, number> = { aus: 0, wenig: 1, normal: 3, viel: 6 }
const POSTS: Record<string, number> = { aus: 0, normal: 1, viel: 3 }
const INHALT_WACHSTUM: Record<string, number> = { gaming: 1.2, talk: 1, fussball: 0.9, irl: 1.1 }
const TON_WACHSTUM: Record<string, number> = { brav: 0.8, frech: 1, provokant: 1.3 }
/** Wöchentliche Chance auf einen kleinen Shitstorm je nach Ton. */
const TON_RISIKO: Record<string, number> = { brav: 0, frech: 0.012, provokant: 0.05 }
const WERBE_FAKTOR: Record<string, number> = { keine: 0.5, wenig: 1, viel: 1.6 }

export const einstellung = (c: Pick<Career, 'flags'>, k: SocialKey): string => {
  const v = c.flags[k]
  return typeof v === 'string' && SOCIAL_OPTIONEN[k].some(([id]) => id === v) ? v : STANDARD[k]
}
const zahl = (c: Pick<Career, 'flags'>, k: string): number => Math.max(0, Number(c.flags[k] ?? 0))

export interface Kanaele {
  insta: boolean
  twitch: boolean
  youtube: boolean
}
export const kanaele = (c: Pick<Career, 'flags'>): Kanaele => ({
  insta: c.flags.insta === true,
  twitch: c.flags.twitchKanal === true,
  youtube: c.flags.youtube === true,
})
export const hatKanal = (c: Pick<Career, 'flags'>): boolean => Object.values(kanaele(c)).some(Boolean)

/** Erwartete Einnahmen (€) und Belastung pro Woche aus den aktuellen Einstellungen. */
export function socialRechnung(c: Pick<Career, 'flags'>): { euro: number; fitness: number; privat: number; fans: number } {
  const k = kanaele(c)
  const streams = k.twitch ? STREAMS[einstellung(c, 'streamRate')] : 0
  const posts = k.insta || k.youtube ? POSTS[einstellung(c, 'postRate')] : 0
  const w = WERBE_FAKTOR[einstellung(c, 'socialWerbung')]
  const werbung = einstellung(c, 'socialWerbung')
  const euro =
    (k.insta && posts > 0 ? zahl(c, 'follower') * 1 * w : 0) +
    (k.twitch && streams > 0 ? zahl(c, 'twitch') * streams * 0.9 * w : 0) +
    (k.youtube && posts > 0 ? zahl(c, 'abos') * 1.5 * w : 0)
  const inhalt = einstellung(c, 'streamInhalt')
  return {
    euro: Math.round(euro),
    fitness: -(streams * 0.8 + posts * 0.15 + (inhalt === 'gaming' ? streams * 0.2 : 0)),
    privat: -((streams >= 6 ? 0.8 : streams >= 3 ? 0.15 : 0) + (posts >= 3 ? 0.2 : 0) + (inhalt === 'irl' ? streams * 0.1 : 0)),
    fans: werbung === 'viel' ? -0.15 : werbung === 'keine' ? 0.05 : 0,
  }
}

/** Bekanntheit 0–1 aus Ruf, Fans, Spielstärke und Verein: bestimmt, wie groß ein Kanal werden kann. */
export function bekanntheit(c: Career): number {
  const t = c.spieler.traits
  const verein = c.vereinId ? (c.welt.staerke[c.vereinId] ?? 50) : 40
  return clamp(0.15 * (t.ruf / 100) + 0.05 * (t.fanbeliebtheit / 100) + 0.3 * clamp((overall(c.spieler) - 45) / 40, 0, 1) + 0.5 * clamp((verein - 40) / 50, 0, 1), 0, 1)
}

/** Obergrenze der Reichweite je Kanal (in Tausend). Die Kanäle wachsen darauf zu, statt unbegrenzt zu explodieren. */
export const REICHWEITE_MAX: Record<'follower' | 'twitch' | 'abos', (f: number) => number> = {
  follower: (f) => 10 + 200 * (f / 0.5) ** 6.8,
  twitch: (f) => 5 + 80 * (f / 0.5) ** 6.8,
  abos: (f) => 5 + 60 * (f / 0.5) ** 6.8,
}
/** Anteil der Lücke zur Obergrenze, der pro Beitrag bzw. Stream und Woche geschlossen wird. */
const WACHSTUMSRATE = { follower: 0.006, twitch: 0.0035, abos: 0.004 }

const MEILENSTEINE = [10, 50, 100, 500, 1000]
const KANAL_NAME: Record<string, string> = { follower: 'Instagram', twitch: 'Twitch', abos: 'YouTube' }

/** Wöchentliche Wirkung der Social-Media-Kanäle: Wachstum, Einnahmen, Belastung, gelegentlich Aufregung. */
export function socialWoche(c: Career, rng: Rng): Career {
  const k = kanaele(c)
  if (!hatKanal(c)) return c
  const t = c.spieler.traits
  const ruhm = bekanntheit(c)
  const ton = einstellung(c, 'socialTon')
  const inhalt = einstellung(c, 'streamInhalt')
  const streams = k.twitch ? STREAMS[einstellung(c, 'streamRate')] : 0
  const posts = POSTS[einstellung(c, 'postRate')]
  const zufall = () => 0.7 + rng.next() * 0.6

  const flags = { ...c.flags }
  const log = [...c.log]
  const wachse = (key: string, delta: number) => {
    const alt = zahl(c, key)
    const neu = Math.max(0, Math.round((alt + delta) * 100) / 100)
    flags[key] = neu
    for (const m of MEILENSTEINE) {
      if (alt < m && neu >= m) log.push(`${c.uhr.saison}/${String(c.uhr.saison + 1).slice(2)}: ${KANAL_NAME[key]}: ${m >= 1000 ? `${m / 1000} Mio.` : `${m} Tsd.`} Follower`)
    }
  }
  // Wachstum auf die Obergrenze zu; ohne Aktivität schrumpft die Reichweite langsam
  const fuer = (key: 'follower' | 'twitch' | 'abos', aktivitaet: number, mult: number) => {
    const alt = zahl(c, key)
    const lucke = REICHWEITE_MAX[key](ruhm) - alt
    const ueber = lucke < 0 ? lucke * 0.03 : 0 // Ereignisse können über die Grenze hinausschießen, dann pendelt es sich wieder ein
    wachse(key, (aktivitaet > 0 ? lucke * WACHSTUMSRATE[key] * aktivitaet * mult * zufall() + aktivitaet * 0.2 : -alt * 0.003) + ueber)
  }
  if (k.insta) fuer('follower', posts, TON_WACHSTUM[ton])
  if (k.twitch) fuer('twitch', streams, INHALT_WACHSTUM[inhalt] * TON_WACHSTUM[ton])
  if (k.youtube) fuer('abos', posts, TON_WACHSTUM[ton])

  const r = socialRechnung(c)
  const delta: Partial<Traits> = { fitness: r.fitness, privatglueck: r.privat, fanbeliebtheit: r.fans }
  if (streams > 0) {
    if (inhalt === 'fussball') { delta.fanbeliebtheit = (delta.fanbeliebtheit ?? 0) + 0.15; delta.ruf = 0.05 }
    if (inhalt === 'irl') delta.fanbeliebtheit = (delta.fanbeliebtheit ?? 0) + 0.1
    if (inhalt === 'gaming') delta.moral = 0.1
    if (inhalt === 'talk') delta.ruf = 0.05
  }
  let traits = applyTraits(t, delta)

  // Gelegentlich Aufregung im Netz (hängt vom Ton ab)
  if ((streams > 0 || posts > 0) && rng.chance(TON_RISIKO[ton])) {
    traits = applyTraits(traits, { fanbeliebtheit: -2, moral: -1 })
    log.push(`${c.uhr.saison}/${String(c.uhr.saison + 1).slice(2)}: Netz-Aufregung um einen Beitrag von ${c.spieler.nachname}`)
  }

  // Einnahmen: alle vier Wochen als Hinweis im Wochenbericht
  flags.socialEinnahmen = zahl(c, 'socialEinnahmen') + r.euro
  let bericht = c.bericht
  if (c.wochenGesamt % 4 === 0 && zahl(c, 'socialEinnahmen') + r.euro > 0 && bericht) {
    bericht = { ...bericht, hinweise: [...bericht.hinweise, `Social Media: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(flags.socialEinnahmen))} Einnahmen in den letzten Wochen.`] }
    flags.socialEinnahmen = 0
  }
  return { ...c, flags, log: log.slice(-80), bericht, spieler: { ...c.spieler, traits, geld: c.spieler.geld + r.euro } }
}

/** Ändert eine Einstellung, falls der Wert erlaubt ist. */
export function socialSetzen(c: Career, key: SocialKey, wert: string): Career {
  if (!SOCIAL_OPTIONEN[key]?.some(([id]) => id === wert)) return c
  return { ...c, flags: { ...c.flags, [key]: wert } }
}
