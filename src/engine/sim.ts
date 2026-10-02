import { createCareer, type NewCareerInput } from './newCareer'
import { alter, overall } from './rating'
import { beendeKarriere, startWeek, waehle, weiter, weiterImSpiel } from './week'
import { naechsteSaison } from './season'
import type { Career, TrainingFocus } from './types'

/** Spielt automatisch (nur für Tests und Balancing): wählt immer die erste Option. */
export function spieleSaison(c: Career, focus: TrainingFocus = 'ausgewogen', pick = 0): Career {
  let guard = 0
  while (guard++ < 10_000) {
    if (c.phase === 'planung') {
      const regen = c.spieler.traits.fitness < 55 && c.verletzung === null
      c = startWeek(c, regen ? 'regeneration' : focus)
    } else if (c.phase === 'szene') {
      c = c.match!.ausgang === null ? waehle(c, pick) : weiterImSpiel(c)
    } else if (c.phase === 'bericht') {
      c = weiter(c)
    } else return c
  }
  throw new Error('Endlosschleife')
}

export function spieleKarriere(input: NewCareerInput, jahre: number, focus: TrainingFocus = 'ausgewogen', pick = 0) {
  let c = createCareer(input)
  const verlauf: { alter: number; overall: number; spiele: number; tore: number; note: number }[] = []
  for (let i = 0; i < jahre; i++) {
    c = spieleSaison(c, focus, pick)
    if (c.phase === 'karriereende') break
    const s = c.saisonStats
    verlauf.push({ alter: alter(c.spieler.geburtsdatum, c.uhr.saison), overall: overall(c.spieler), spiele: s.spiele, tore: s.tore, note: s.spiele ? s.notenSumme / s.spiele : 0 })
    if (c.phase === 'saisonende') c = naechsteSaison(c)
  }
  return { career: c, verlauf, beendet: beendeKarriere }
}
