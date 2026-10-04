import { LIGEN, VEREINE } from '../data/clubs'
import { SKILL_KEYS, alter, clamp, overall } from './rating'
import { createRng, type Rng } from './rng'
import { bilanzVon, natVon } from './nationalteam'
import { baueSaison, istJugend } from './saisonAufbau'
import { jugendGehalt } from './wirtschaft'
import { rangliste, schliesseWeltAb } from './welt'
import { betreteWoche } from './week'
import type { Career, Player, SeasonStats } from './types'

export function neueSaisonStats(spieler: Player, saison: number, vereinId: string, liga: string): SeasonStats {
  const ov = overall(spieler)
  return {
    saison,
    alter: alter(spieler.geburtsdatum, saison),
    verein: VEREINE[vereinId]?.name ?? 'Vereinslos',
    vereinId,
    spiele: 0, startelf: 0, minuten: 0, tore: 0, vorlagen: 0, notenSumme: 0,
    gelb: 0, rot: 0, siege: 0, remis: 0, niederlagen: 0,
    overallStart: ov,
    overallEnde: ov,
    skillsStart: { ...spieler.skills },
    platz: 0,
    liga,
  }
}

/** Alterung am Saisonende, Weltabschluss, Saisonbilanz und Wechsel in die Phase `saisonende`. */
export function beendeSaison(c: Career, rng: Rng): Career {
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

  // Welt abschließen
  const welt = structuredClone(c.welt)
  const s = c.saison
  const rang = rangliste(s.tabelle, s.teams)
  const platz = rang.findIndex((r) => r.id === c.vereinId) + 1
  const liga = LIGEN[s.ligaId]
  schliesseWeltAb(welt, c.uhr.saison, s.jugend ? null : { id: s.ligaId, rang }, rng)

  const titel: string[] = []
  const laufbahnTitel = [...c.laufbahn.titel]
  const vname = VEREINE[c.vereinId]?.name ?? c.saisonStats.verein
  if (!s.jugend && platz > 0) {
    if (liga.ebene === 1 && platz === 1) {
      titel.push(`${liga.name}-Meister`)
      laufbahnTitel.push({ saison: c.uhr.saison, name: `Meister ${liga.name}`, verein: vname })
    } else if (liga.ebene > 1 && platz <= LIGEN[`${liga.land}${liga.ebene - 1}`].ab) {
      hinweise.push(`Aufstieg! ${vname} spielt nächste Saison in der ${LIGEN[`${liga.land}${liga.ebene - 1}`].name}.`)
    } else if (liga.ab > 0 && platz > rang.length - liga.ab) {
      hinweise.push(`Abstieg: ${vname} muss runter in die ${LIGEN[`${liga.land}${liga.ebene + 1}`].name}.`)
    }
  }
  if (s.jugend && platz === 1) hinweise.push(`U19-Meister mit ${vname}!`)
  const flags = { ...c.flags }
  if (hinweise.some((h) => h.startsWith('Aufstieg'))) flags.aufstieg = true

  // Auszeichnungen für herausragende Saisons
  const auszeichnungen = [...c.laufbahn.auszeichnungen]
  const gesamtSpiele = [...c.historie.filter((h) => h.saison === c.uhr.saison), c.saisonStats].reduce((a, h) => a + h.spiele, 0)
  const gesamtNote = [...c.historie.filter((h) => h.saison === c.uhr.saison), c.saisonStats].reduce((a, h) => a + h.notenSumme, 0)
  const schnitt = gesamtSpiele ? gesamtNote / gesamtSpiele : 0
  if (!s.jugend && gesamtSpiele >= 20) {
    const ov = overall(spieler)
    const titelDieseSaison = titel.length + c.laufbahn.titel.filter((t) => t.saison === c.uhr.saison).length
    if (ov >= 86 && schnitt >= 7.2 && rng.chance(Math.min(0.7, 0.2 + 0.1 * titelDieseSaison))) {
      auszeichnungen.push({ saison: c.uhr.saison, name: 'Weltfußballer', verein: vname })
      titel.push('Weltfußballer')
    } else if (ov >= 78 && schnitt >= 7.0 && liga.ebene === 1 && rng.chance(0.3)) {
      auszeichnungen.push({ saison: c.uhr.saison, name: `Spieler des Jahres (${liga.name})`, verein: vname })
      titel.push(`Spieler des Jahres (${liga.name})`)
    }
  }

  // Nationalmannschaft: Turnier-Bilanz festhalten
  let nationalteam = c.nationalteam
  if (s.turnier) {
    const b = bilanzVon(c.uhr.saison, s.turnier)
    nationalteam = { ...natVon(c), turniere: [...natVon(c).turniere, b] }
    hinweise.push(`${s.turnier.name}: ${b.ergebnis}${b.einsaetze ? ` (${b.einsaetze} Einsätze, ${b.tore} Tore)` : ' (ohne Einsatz)'}.`)
  } else if (s.turnierInfo) {
    nationalteam = { ...natVon(c), turniere: [...natVon(c).turniere, { saison: c.uhr.saison, name: s.turnierInfo.name, ergebnis: s.turnierInfo.ergebnis, einsaetze: 0, tore: 0 }] }
    hinweise.push(s.turnierInfo.text)
  }

  const geschlossen: SeasonStats = { ...c.saisonStats, overallEnde: overall(spieler), platz, liga: liga.name }
  const dieseSaison = [...c.historie.filter((h) => h.saison === c.uhr.saison), geschlossen]
  const start = dieseSaison[0]
  const deltas = SKILL_KEYS.map((k) => ({ skill: k, delta: skills[k] - start.skillsStart[k] }))

  return {
    ...c,
    spieler,
    welt,
    saisonStats: geschlossen,
    historie: [...c.historie, geschlossen],
    nationalteam,
    flags,
    laufbahn: { ...c.laufbahn, titel: laufbahnTitel, auszeichnungen },
    saisonBericht: {
      stats: dieseSaison,
      deltas,
      hinweise,
      titel: [
        ...titel,
        ...c.laufbahn.titel.filter((t) => t.saison === c.uhr.saison).map((t) => t.name),
      ],
      tabelle: rang.map((r) => ({ id: r.id, name: VEREINE[r.id].name, zeile: r.zeile })),
    },
    phase: 'saisonende',
  }
}

export function naechsteSaison(c: Career, rngState?: number): Career {
  if (c.phase !== 'saisonende') return c
  const saison = c.uhr.saison + 1
  const a = alter(c.spieler.geburtsdatum, saison)
  if (a >= 40) return { ...c, phase: 'karriereende' }
  const rng = createRng(rngState ?? c.rngState)
  const jugend = istJugend(c, saison)
  const basis: Career = { ...c, uhr: { saison, woche: 1 } }
  const neueSaison = baueSaison(basis, rng, jugend)
  const next: Career = {
    ...basis,
    saison: neueSaison,
    saisonStats: neueSaisonStats(c.spieler, saison, c.vereinId, neueSaison.ligaId),
    saisonBericht: null,
    vertrag: jugend && c.vertrag ? { ...c.vertrag, gehalt: Math.max(c.vertrag.gehalt, jugendGehalt(c.vereinId)) } : c.vertrag,
    phase: 'planung',
    bericht: null,
  }
  const nachricht = neueSaison.turnier
    ? `${neueSaison.turnier.name}: ${neueSaison.turnier.quali}. Du stehst im Turnierkader (${neueSaison.turnier.kader}).`
    : neueSaison.turnierInfo?.text
  if (nachricht) next.log = [...next.log, `${saison}/${String(saison + 1).slice(2)}: ${nachricht}`].slice(-80)
  const out = betreteWoche(next, rng)
  return { ...out, rngState: rng.state() }
}
