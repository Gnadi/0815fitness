import { VEREINE } from '../data/clubs'
import { SCENE_BY_ID } from '../data/scenes'
import type { Rng } from './rng'
import { Aktionen, ereignisOptionen } from './aktionen'
import { createCareer, type NewCareerInput } from './newCareer'
import { alter, overall } from './rating'
import type { Career, TrainingFocus } from './types'

export interface BotOptionen {
  /** Wenn gesetzt, entscheidet der Bot zufällig (Fuzzing). */
  zufall?: Rng
  focus?: TrainingFocus
  /** Index der Szenen-Option (0 = erste). */
  szenenWahl?: number
  /** Soll der Bot Wechselangebote annehmen? */
  wechseln?: boolean
}

/** Spielt Schritt für Schritt automatisch (für Tests und Balancing). */
export function bot(c: Career, o: BotOptionen = {}): Career {
  const z = o.zufall
  switch (c.phase) {
    case 'planung': {
      if (z && c.fenster === 'sommer' && c.vertrag === null && !c.saison.jugend && c.flags.pausenjahrWunsch !== true && z.chance(0.15)) return Aktionen.pausenjahr(c)
      if (z && c.fenster && c.angebote.length && z.chance(0.7)) {
        const a = z.pick(c.angebote)
        const r = z.next()
        if (r < 0.45) return Aktionen.annehmen(c, a.id)
        if (r < 0.65) return Aktionen.verhandeln(c, a.id, z.pick(['gehalt', 'rolle', 'laufzeit'] as const)).c
        return Aktionen.ablehnen(c, a.id)
      }
      if (z && c.fenster && z.chance(0.03)) return Aktionen.leiheAnfragen(c)
      if (z && z.chance(0.01)) return Aktionen.wechselwunsch(c)
      if (z && z.chance(0.02) && c.vertrag) return Aktionen.beenden(c)
      if (z && z.chance(0.3)) {
        const fokus = z.pick(['ausgewogen', 'technik', 'schuss', 'physis', 'defensive', 'extraschicht', 'regeneration'] as const)
        return Aktionen.trainieren(c, fokus)
      }
      if (c.fenster && c.angebote.length && o.wechseln !== false) {
        const bestes = [...c.angebote]
          .filter((a) => a.art !== 'leihe')
          .sort((a, b) => score(c, b) - score(c, a))[0]
        const aktuell = c.vereinId ? c.welt.staerke[c.vereinId] : 0
        if (bestes && (c.vertrag === null || c.saison.jugend || c.welt.staerke[bestes.vereinId] > aktuell + 4)) return Aktionen.annehmen(c, bestes.id)
        if (!c.vertrag || c.saison.jugend) return Aktionen.annehmen(c, c.angebote[0].id)
        return Aktionen.ablehnen(c, c.angebote[0].id)
      }
      const regen = c.spieler.traits.fitness < 55 && c.verletzung === null
      return Aktionen.trainieren(c, regen ? 'regeneration' : (o.focus ?? 'ausgewogen'))
    }
    case 'szene': {
      if (c.match!.ausgang !== null) return Aktionen.weiterImSpiel(c)
      const n = SCENE_BY_ID[c.match!.szenen[c.match!.index]].optionen.length
      return Aktionen.waehle(c, z ? z.int(0, n - 1) : (o.szenenWahl ?? 0))
    }
    case 'bericht':
      return Aktionen.weiter(c)
    case 'ereignis': {
      const z = c.ereignis!
      if (z.gewaehlt === null) {
        const ok = ereignisOptionen(c).filter((x) => x.ok)
        const opt = zufallOpt(ok, o) ?? ok[0]
        return Aktionen.ereignisOption(c, opt ? opt.index : 0)
      }
      return Aktionen.ereignisWeiter(c)
    }
    case 'saisonende':
      return Aktionen.naechsteSaison(c)
    case 'karriereende':
      return c
  }
}

function zufallOpt<T>(liste: T[], o: BotOptionen): T | undefined {
  return o.zufall && liste.length ? o.zufall.pick(liste) : undefined
}

function score(c: Career, a: Career['angebote'][number]): number {
  const bonus = a.rolle === 'Stammspieler' ? 6 : a.rolle === 'Rotation' ? 2 : 0
  return c.welt.staerke[a.vereinId] + bonus
}

/** Spielt `saisons` Saisons (oder bis zum Karriereende). */
export function spieleSaisons(c: Career, saisons: number, o: BotOptionen = {}): Career {
  const ziel = c.uhr.saison + saisons
  let guard = 0
  while (c.phase !== 'karriereende' && !(c.uhr.saison >= ziel) && guard++ < 200_000) c = bot(c, o)
  if (guard >= 200_000) throw new Error('Endlosschleife im Bot')
  return c
}

export function spieleKarriere(input: NewCareerInput, jahre: number, o: BotOptionen = {}) {
  let c = createCareer(input)
  const verlauf: { alter: number; overall: number; spiele: number; tore: number; verein: string; staerke: number }[] = []
  let guard = 0
  const ende = c.uhr.saison + jahre
  while (c.phase !== 'karriereende' && c.uhr.saison < ende && guard++ < 400_000) {
    const vorher = c.uhr.saison
    c = bot(c, o)
    if (c.phase === 'saisonende' && c.uhr.saison === vorher) {
      verlauf.push({
        alter: alter(c.spieler.geburtsdatum, c.uhr.saison),
        overall: overall(c.spieler),
        spiele: c.saisonStats.spiele,
        tore: c.saisonStats.tore,
        verein: VEREINE[c.vereinId]?.name ?? '-',
        staerke: c.welt.staerke[c.vereinId] ?? 0,
      })
    }
  }
  return { career: c, verlauf }
}
