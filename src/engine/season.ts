import { SKILL_KEYS, alter, clamp, overall } from './rating'
import type { Career, ClubRef, Player, SeasonStats } from './types'

export function neueSaisonStats(spieler: Player, saison: number, verein: ClubRef): SeasonStats {
  const ov = overall(spieler)
  return {
    saison,
    alter: alter(spieler.geburtsdatum, saison),
    verein: verein.name,
    spiele: 0, startelf: 0, minuten: 0, tore: 0, vorlagen: 0, notenSumme: 0,
    gelb: 0, rot: 0, siege: 0, remis: 0, niederlagen: 0,
    overallStart: ov,
    overallEnde: ov,
    skillsStart: { ...spieler.skills },
  }
}

/** Alterung am Saisonende, Saisonbilanz und Wechsel in die Phase `saisonende`. */
export function beendeSaison(c: Career): Career {
  const a = alter(c.spieler.geburtsdatum, c.uhr.saison)
  const skills = { ...c.spieler.skills }
  const hinweise: string[] = []

  if (a >= 29) {
    const d = (a - 28) * 0.55 * (1.15 - c.spieler.traits.professionalitaet / 200)
    skills.tempo -= d * 1.2
    skills.physis -= d
    skills.dribbling -= d * 0.6
    if (a >= 32) skills.schuss -= d * 0.2
    if (a >= 33) {
      skills.pass -= d * 0.1
      skills.positionsspiel -= d * 0.1
    }
    hinweise.push('Der Körper lässt nach: Tempo und Athletik gehen langsam zurück.')
  }
  for (const k of SKILL_KEYS) skills[k] = clamp(skills[k], 1, 100)

  const spieler = { ...c.spieler, skills }
  const stats = { ...c.saisonStats, overallEnde: overall(spieler) }
  const deltas = SKILL_KEYS.map((k) => ({ skill: k, delta: skills[k] - stats.skillsStart[k] }))

  return {
    ...c,
    spieler,
    saisonStats: stats,
    historie: [...c.historie, stats],
    saisonBericht: { stats, deltas, hinweise },
    phase: 'saisonende',
  }
}

export function naechsteSaison(c: Career): Career {
  if (c.phase !== 'saisonende') return c
  const saison = c.uhr.saison + 1
  const spieler = c.spieler
  const zuAlt = alter(spieler.geburtsdatum, saison) >= 40
  return {
    ...c,
    uhr: { saison, woche: 1 },
    saisonStats: neueSaisonStats(spieler, saison, c.verein),
    saisonBericht: null,
    phase: zuAlt ? 'karriereende' : 'planung',
  }
}
