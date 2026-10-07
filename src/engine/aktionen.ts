import { EREIGNIS_BY_ID } from '../data/events'
import { SCENE_BY_ID } from '../data/scenes'
import { optionVerfuegbar, waehleEreignisOption } from './ereignisse'
import { auszahlen, depotVon, einzahlen, vcEinsteigen, vcVerkaufen } from './finanzen'
import { immoKaufen, immoSanieren, immoTilgen, immoVerkaufen } from './immobilien'
import { privatAktion, privatKuendigen } from './privat'
import { brauchtVertrag, leiheAnfragen, lehneAb, nimmAn, pausenjahrUmschalten, verhandleAngebot, wechselwunschUmschalten } from './transfers'
import { naechsteSaison } from './season'
import { socialSetzen, type SocialKey } from './social'
import { startWeek, waehle, weiter, weiterImSpiel, ereignisWeiter, withRng, beendeKarriere } from './week'
import type { Anlage, Career, TrainingFocus } from './types'

/** Alle Spieleraktionen als reine Funktionen auf dem Spielstand (nutzen den gespeicherten Zufallszustand). */
export const Aktionen = {
  trainieren: (c: Career, focus: TrainingFocus) => startWeek(c, focus),
  waehle: (c: Career, i: number) => waehle(c, i),
  weiterImSpiel: (c: Career) => weiterImSpiel(c),
  weiter: (c: Career) => weiter(c),
  ereignisOption: (c: Career, i: number) => withRng(c, (rng) => waehleEreignisOption(c, rng, i)),
  ereignisWeiter: (c: Career) => ereignisWeiter(c),
  naechsteSaison: (c: Career) => naechsteSaison(c),
  beenden: (c: Career) => beendeKarriere(c),
  annehmen: (c: Career, id: string) => withRng(c, (rng) => nimmAn(c, rng, id)),
  ablehnen: (c: Career, id: string) => lehneAb(c, id),
  verhandeln: (c: Career, id: string, was: 'gehalt' | 'rolle' | 'laufzeit'): { c: Career; text: string } => {
    let text = ''
    const out = withRng(c, (rng) => {
      const r = verhandleAngebot(c, rng, id, was)
      text = r.text
      return r.c
    })
    return { c: out, text }
  },
  leiheAnfragen: (c: Career) => withRng(c, (rng) => leiheAnfragen(c, rng)),
  wechselwunsch: (c: Career) => wechselwunschUmschalten(c),
  pausenjahr: (c: Career) => pausenjahrUmschalten(c),
  social: (c: Career, key: SocialKey, wert: string) => socialSetzen(c, key, wert),
  einzahlen: (c: Career, anlage: Anlage, anteil: number) => einzahlen(c, anlage, c.spieler.geld * anteil),
  auszahlen: (c: Career, anlage: Anlage, anteil: number) => auszahlen(c, anlage, depotVon(c)[anlage].wert * anteil),
  vcEinsteigen: (c: Career, dealId: string, anteil: number): Career => {
    const d = c.deals?.find((x) => x.id === dealId)
    return d ? vcEinsteigen(c, d, c.spieler.geld * anteil) : c
  },
  vcVerkaufen: (c: Career, id: string) => vcVerkaufen(c, id),
  immoKaufen: (c: Career, id: string, finanziert: boolean) => immoKaufen(c, id, finanziert),
  immoVerkaufen: (c: Career, id: string) => immoVerkaufen(c, id),
  immoTilgen: (c: Career, id: string) => immoTilgen(c, id),
  immoSanieren: (c: Career, id: string) => immoSanieren(c, id),
  privat: (c: Career, id: string) => privatAktion(c, id),
  privatKuendigen: (c: Career, id: string) => privatKuendigen(c, id),
  sparplan: (c: Career, an: boolean): Career => ({ ...c, flags: { ...c.flags, sparplan: an } }),
  einstellung: (c: Career, autoSzenen: boolean): Career => ({ ...c, einstellungen: { ...c.einstellungen, autoSzenen } }),
}

export function ereignisOptionen(c: Career): { index: number; ok: boolean }[] {
  const z = c.ereignis
  if (!z) return []
  return EREIGNIS_BY_ID[z.id].optionen.map((o, index) => ({ index, ok: optionVerfuegbar(c, o) }))
}

export interface SimErgebnis {
  c: Career
  wochen: number
  grund: string
}

/** Wählt in Schlüsselszenen automatisch die „sichere“ (bzw. erste) Option. */
function autoSzene(c: Career): Career {
  const m = c.match!
  if (m.ausgang !== null) return weiterImSpiel(c)
  const szene = SCENE_BY_ID[m.szenen[m.index]]
  const sicher = szene.optionen.findIndex((o) => o.risiko === 'sicher')
  return waehle(c, sicher >= 0 ? sicher : 0)
}

/**
 * Simuliert bis zu `n` Wochen mit dem zuletzt gewählten Training (bei Müdigkeit Regeneration).
 * Hält an bei Ereignissen, Saisonende, offenem Transferfenster mit Angeboten, Verletzungen.
 */
export function simuliereWochen(c: Career, n: number): SimErgebnis {
  let wochen = 0
  let grund = ''
  let guard = 0
  const fensterBeiStart = c.fenster
  while (wochen < n && guard++ < 2000) {
    if (c.phase === 'planung') {
      if (c.fenster && c.fenster !== fensterBeiStart && c.angebote.length > 0) { grund = 'Transferangebote'; break }
      if (c.fenster === 'sommer' && c.fenster !== fensterBeiStart && brauchtVertrag(c)) { grund = 'Vertrag nötig'; break }
      const fokus: TrainingFocus = c.spieler.traits.fitness < 50 && !c.verletzung ? 'regeneration' : c.training
      const hadVerletzung = c.verletzung !== null
      c = startWeek(c, fokus)
      wochen++
      if (!hadVerletzung && c.verletzung) { grund = 'Verletzung'; }
    } else if (c.phase === 'szene') {
      c = autoSzene(c)
    } else if (c.phase === 'bericht') {
      const neu = c.verletzung && grund === 'Verletzung'
      c = weiter(c)
      if (neu) break
    } else {
      grund = c.phase === 'ereignis' ? 'Ereignis' : c.phase === 'saisonende' ? 'Saisonende' : 'Karriereende'
      break
    }
  }
  if (!grund && c.phase === 'ereignis') grund = 'Ereignis'
  if (!grund && c.phase === 'saisonende') grund = 'Saisonende'
  return { c, wochen, grund }
}
