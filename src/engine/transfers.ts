import { VEREINE } from '../data/clubs'
import { zufallsName } from '../data/names'
import { applyTraits } from './match'
import { alter, overall } from './rating'
import { ligaVonVerein } from './welt'
import type { Rng } from './rng'
import { aktuelleLiga, baueSaison } from './saisonAufbau'
import { simuliereSpieltag } from './welt'
import { jugendGehalt, erzeugeAngebote, marktwert, notAngebot, vereinsAngebot, verhandle } from './wirtschaft'
import type { Angebot, Career, Personen, SeasonStats } from './types'

const fmtLog = (c: Career, text: string) => `${c.uhr.saison}/${String(c.uhr.saison + 1).slice(2)}: ${text}`

export function neueMitarbeiter(land: string, rng: Rng, alt?: Personen): Personen {
  return {
    trainer: zufallsName(land, rng),
    kapitaen: zufallsName(land, rng),
    rivale: zufallsName(land, rng),
    freund: alt?.freund ?? zufallsName(land, rng),
    berater: alt?.berater ?? zufallsName(land, rng),
    partner: alt?.partner ?? null,
    reporter: alt?.reporter ?? zufallsName(land, rng),
  }
}

/** Ohne Vertrag oder am Ende der Jugendzeit muss im Sommerfenster ein (Profi-)Vertrag her. */
export const brauchtVertrag = (c: Career): boolean =>
  c.fenster === 'sommer' && (c.vertrag === null || (c.vertrag.rolle === 'Jugend' && c.saison.jugend && alter(c.spieler.geburtsdatum, c.uhr.saison + 1) >= 18))

export const schliesseStats = (c: Career): SeasonStats => ({ ...c.saisonStats, overallEnde: overall(c.spieler) })

// ---------------------------------------------------------------- Fenster

/** Öffnet ein Transferfenster und erzeugt Angebote. */
export function oeffneFenster(c: Career, rng: Rng, fenster: 'sommer' | 'winter'): Career {
  let next: Career = { ...c, fenster, angebote: [] }
  const hinweise: string[] = []
  const ausser = [c.vereinId, ...(c.leihe ? [c.leihe.vonVerein] : [])].filter(Boolean)
  const wunsch = c.wechselwunsch ? 2 : 0

  if (fenster === 'winter') {
    if (!c.saison.jugend && !c.leihe && c.vertrag) {
      next.angebote = erzeugeAngebote(next, rng, { art: 'transfer', anzahl: rng.int(0, 2) + wunsch, ausser })
    } else if (!c.saison.jugend && !c.vertrag && !c.vereinId) {
      // Pausenjahr: Wer ohne Verein dasteht, bekommt im Winter vielleicht doch noch Angebote
      next.angebote = erzeugeAngebote(next, rng, { art: 'vereinslos', anzahl: rng.int(0, 2), ausser: [] })
      if (next.angebote.length) next.log = [...next.log, fmtLog(c, 'Im Winter melden sich Vereine beim vereinslosen Spieler.')]
    }
    return next
  }

  // Sommer: Leihe endet, Vertrag läuft aus, Jugend wird Profi
  if (c.leihe) {
    next = { ...next, vereinId: c.leihe.vonVerein, vertrag: c.leihe.vertrag, leihe: null }
    hinweise.push(`Leihe beendet: Rückkehr zu ${VEREINE[next.vereinId].name}.`)
  }
  const jugendEnde = c.saison.jugend && alter(c.spieler.geburtsdatum, c.uhr.saison + 1) >= 18
  if (jugendEnde) {
    const heimat = VEREINE[next.vereinId]
    const wert = marktwert(c.spieler, c.uhr.saison)
    const eigenes: Angebot = {
      id: `h${c.wochenGesamt}`,
      art: 'profivertrag',
      vereinId: heimat.id,
      gehalt: Math.max(30_000, Math.round(wert * 0.12 / 1000) * 1000),
      jahre: 3,
      rolle: overall(c.spieler) + 6 >= c.welt.staerke[heimat.id] ? 'Rotation' : 'Perspektive',
      ablose: 0,
      verhandelt: 0,
    }
    next.angebote = [
      eigenes,
      ...erzeugeAngebote(next, rng, { art: 'profivertrag', anzahl: rng.int(0, 3) + wunsch, ausser: [heimat.id] }),
    ]
    hinweise.push('Die Jugendzeit endet: Zeit für den ersten Profivertrag.')
  } else if (next.vertrag && next.vertrag.endeSaison <= c.uhr.saison) {
    const alt = next.vereinId
    next = { ...next, vertrag: null, vereinId: '', flags: { ...next.flags, pausenLiga: ligaVonVerein(next.welt, alt) ?? VEREINE[alt].ligaStart } }
    next.angebote = [
      ...erzeugeAngebote(next, rng, { art: 'vereinslos', anzahl: rng.int(2, 4) + wunsch, ausser: [alt] }),
    ]
    if (rng.chance(0.6)) next.angebote.push(vereinsAngebot(next, rng, alt, 'vereinslos'))
    hinweise.push(`Dein Vertrag bei ${VEREINE[alt].name} ist ausgelaufen. Du bist vereinslos.`)
  } else if (next.vertrag && !c.saison.jugend) {
    next.angebote = erzeugeAngebote(next, rng, { art: 'transfer', anzahl: rng.int(0, 3) + wunsch, ausser: [next.vereinId] })
  } else if (!next.vertrag && !next.vereinId && !c.saison.jugend) {
    // Ende des Pausenjahres: ein neuer Anlauf auf dem Markt
    next.angebote = erzeugeAngebote(next, rng, { art: 'vereinslos', anzahl: rng.int(0, 3), ausser: [] })
    hinweise.push('Nach einem Jahr ohne Verein sondiert dein Berater den Markt.')
  }
  if (c.flags.leiheWunsch === true && next.vertrag && !next.leihe && !c.saison.jugend) {
    const ov = overall(next.spieler)
    const leihen = erzeugeAngebote(next, rng, { art: 'leihe', anzahl: 2, ausser: [next.vereinId], maxStaerke: Math.max(ov + 2, 35), minStaerke: ov - 12 })
    next.angebote = [...next.angebote, ...leihen]
    next.flags = { ...next.flags, leiheWunsch: false }
  }
  if (hinweise.length) next.log = [...next.log, ...hinweise.map((h) => fmtLog(c, h))]
  return next
}

/** Schließt das Fenster. Ohne Vertrag wird automatisch das beste Angebot angenommen. */
export function schliesseFenster(c: Career, rng: Rng): Career {
  let next = c
  if (c.fenster === 'sommer') {
    const beliebig = c.angebote.filter((a) => a.art === 'vereinslos' || a.art === 'profivertrag' || a.art === 'transfer')
    if (brauchtVertrag(c) && c.vertrag === null && !c.saison.jugend && (c.flags.pausenjahrWunsch === true || (beliebig.length === 0 && keinInteresse(c)))) {
      next = pausenjahrStarten(c, c.flags.pausenjahrWunsch === true)
    } else if (brauchtVertrag(c)) {
      const bestes = [...beliebig].sort((a, b) => b.gehalt * (b.rolle === 'Stammspieler' ? 1.3 : 1) - a.gehalt * (a.rolle === 'Stammspieler' ? 1.3 : 1))[0]
      const a = bestes ?? notAngebot(c, rng, c.vertrag ? 'profivertrag' : 'vereinslos')
      next = fuehreWechselAus(c, rng, a)
      next = { ...next, log: [...next.log, fmtLog(c, `Unterschrift bei ${VEREINE[a.vereinId].name}: ${a.rolle}, ${a.jahre} Jahre.`)] }
    }
  }
  return { ...next, fenster: null, angebote: [], wechselwunsch: false }
}

// ---------------------------------------------------------------- Pausenjahr

/** Kein Verein will den Spieler: er ist zu schwach für den Markt oder zu alt. Nur beim ersten Mal automatisch. */
function keinInteresse(c: Career): boolean {
  if (Number(c.flags.pausenjahre ?? 0) >= 1) return false
  const schwaechster = Math.min(...Object.values(VEREINE).filter((v) => v.land === c.spieler.nationalitaet).map((v) => c.welt.staerke[v.id]))
  return alter(c.spieler.geburtsdatum, c.uhr.saison + 1) >= 32 || overall(c.spieler) < schwaechster - 6
}

/** Der Spieler bleibt ein Jahr ohne Verein (Training, Privatleben, keine Spiele). */
function pausenjahrStarten(c: Career, gewollt: boolean): Career {
  const text = gewollt ? 'Du bleibst ein Jahr ohne Verein.' : 'Kein Verein will dich unter Vertrag nehmen. Dir bleibt ein Jahr ohne Verein.'
  return {
    ...c,
    spieler: { ...c.spieler, traits: applyTraits(c.spieler.traits, { moral: gewollt ? -2 : -6, ruf: gewollt ? -1 : -3, fanbeliebtheit: -4 }) },
    flags: { ...c.flags, pausenjahre: Number(c.flags.pausenjahre ?? 0) + 1, pausenjahrWunsch: false },
    geplant: [...c.geplant, { id: 'pj-start', ab: c.wochenGesamt + 1 }],
    log: [...c.log, fmtLog(c, text)],
  }
}

/** Schaltet um, ob der Spieler im Sommer ein Jahr ohne Verein bleiben will. Nur ohne Vertrag im Sommerfenster. */
export function pausenjahrUmschalten(c: Career): Career {
  if (c.fenster !== 'sommer' || c.vertrag !== null || c.saison.jugend) return c
  return { ...c, flags: { ...c.flags, pausenjahrWunsch: c.flags.pausenjahrWunsch !== true } }
}

// ---------------------------------------------------------------- Wechsel

/** Wickelt einen Vereinswechsel ab (Transfer, Profivertrag, Vereinslos). */
export function fuehreWechselAus(c: Career, rng: Rng, a: Angebot): Career {
  const neu = VEREINE[a.vereinId]
  const alt = c.vereinId ? VEREINE[c.vereinId].name : 'vereinslos'
  // Wer im Pausenjahr mitten in der Saison unterschreibt, wird wie ein Winterwechsel behandelt
  const winter = c.fenster === 'winter' || (c.vereinId === '' && c.fenster !== 'sommer' && c.vertrag === null && !c.saison.jugend)
  const endeSaison = winter ? c.uhr.saison + a.jahre - 1 : c.uhr.saison + a.jahre

  let next: Career = {
    ...c,
    vereinId: a.vereinId,
    vertrag: { gehalt: a.gehalt, endeSaison, rolle: a.rolle },
    leihe: null,
    personen: a.vereinId === c.vereinId ? c.personen : neueMitarbeiter(neu.land, rng, c.personen),
    laufbahn: {
      ...c.laufbahn,
      transfers: a.vereinId === c.vereinId ? c.laufbahn.transfers : [...c.laufbahn.transfers, { saison: c.uhr.saison, von: alt, zu: neu.name, ablose: a.ablose }],
    },
  }
  if (a.vereinId !== c.vereinId) {
    next.spieler = {
      ...next.spieler,
      traits: applyTraits(next.spieler.traits, {
        trainerBeziehung: 50 - next.spieler.traits.trainerBeziehung,
        kabine: 45 - next.spieler.traits.kabine,
        fanbeliebtheit: -next.spieler.traits.fanbeliebtheit * 0.5,
        moral: 6,
      }),
    }
    next.log = [...next.log, fmtLog(c, `Wechsel: ${alt} → ${neu.name}.`)]
    if (c.vereinId && VEREINE[c.vereinId].land !== neu.land) next.flags = { ...next.flags, ausland: true }
  }

  if (winter && c.vereinId !== a.vereinId) next = wechselLigaMitten(c, next, rng)
  return next
}

/** Winterwechsel: alte Statistik schließen, neue Liga mitten in der Saison betreten. */
function wechselLigaMitten(alt: Career, next: Career, rng: Rng): Career {
  const gespielt = alt.saison.kalender.slice(0, alt.uhr.woche).filter((s) => s.t === 'L').length
  const stats: SeasonStats[] = [schliesseStats(alt)]
  const neueStats: SeasonStats = {
    ...next.saisonStats,
    verein: VEREINE[next.vereinId].name,
    vereinId: next.vereinId,
    spiele: 0, startelf: 0, minuten: 0, tore: 0, vorlagen: 0, notenSumme: 0, gelb: 0, rot: 0,
    siege: 0, remis: 0, niederlagen: 0,
    overallStart: overall(next.spieler),
    skillsStart: { ...next.spieler.skills },
    liga: aktuelleLiga(next),
  }
  const saison = baueSaison(next, rng, false)
  // Neue Liga bis zum aktuellen Spieltag nachsimulieren
  const tage = saison.kalender.filter((s) => s.t === 'L').length
  const stand = Math.min(gespielt, tage)
  for (let t = 1; t <= stand; t++) simuliereSpieltag(saison, next.welt, t, rng)
  const idx = saison.kalender.findIndex((s) => s.t === 'L' && s.n > stand)
  const woche = idx >= 0 ? idx + 1 : saison.kalender.findIndex((s) => s.t === 'F' && s.fenster === 'sommer') + 1
  return {
    ...next,
    historie: [...alt.historie, ...stats],
    saisonStats: neueStats,
    saison: {
      ...saison,
      pokal: { ...saison.pokal, status: 'ausgeschieden' },
      europa: { ...saison.europa, wb: null, status: 'aus' },
      turnier: alt.saison.turnier,
    },
    uhr: { ...next.uhr, woche: Math.max(1, woche) },
  }
}

export function leiheAnfragen(c: Career, rng: Rng): Career {
  if (!c.fenster || c.leihe || !c.vertrag || c.saison.jugend) return c
  const ov = overall(c.spieler)
  const angebote = erzeugeAngebote(c, rng, {
    art: 'leihe', anzahl: 3, ausser: [c.vereinId],
    maxStaerke: Math.max(ov + 2, 35), minStaerke: ov - 12,
  })
  return { ...c, angebote: [...c.angebote.filter((a) => a.art !== 'leihe'), ...angebote] }
}

/** Nimmt ein Angebot an. */
export function nimmAn(c: Career, rng: Rng, angebotId: string): Career {
  const a = c.angebote.find((x) => x.id === angebotId)
  if (!a) return c
  let next: Career
  if (a.art === 'leihe') {
    if (!c.vertrag) return c
    const winter = c.fenster === 'winter'
    next = {
      ...c,
      leihe: { vonVerein: c.vereinId, vertrag: c.vertrag },
      vereinId: a.vereinId,
      vertrag: { gehalt: c.vertrag.gehalt, endeSaison: c.uhr.saison + (winter ? 0 : 1), rolle: 'Stammspieler' },
      personen: neueMitarbeiter(VEREINE[a.vereinId].land, rng, c.personen),
      log: [...c.log, fmtLog(c, `Leihe zu ${VEREINE[a.vereinId].name}.`)],
    }
    if (winter) next = wechselLigaMitten(c, next, rng)
  } else if (a.art === 'verlaengerung') {
    next = {
      ...c,
      vertrag: { gehalt: a.gehalt, endeSaison: c.uhr.saison + a.jahre, rolle: a.rolle },
      log: [...c.log, fmtLog(c, `Vertrag bei ${VEREINE[a.vereinId].name} verlängert (${a.jahre} Jahre).`)],
    }
  } else {
    next = fuehreWechselAus(c, rng, a)
    if (a.art === 'transfer' && rng.chance(0.25)) next = { ...next, geplant: [...next.geplant, { id: 'tr-medizincheck', ab: next.wochenGesamt + 1 }] }
  }
  return { ...next, angebote: [], wechselwunsch: false, flags: { ...next.flags, pausenjahrWunsch: false } }
}

export function lehneAb(c: Career, angebotId: string): Career {
  return { ...c, angebote: c.angebote.filter((a) => a.id !== angebotId) }
}

export function verhandleAngebot(c: Career, rng: Rng, angebotId: string, was: 'gehalt' | 'rolle' | 'laufzeit'): { c: Career; text: string } {
  const a = c.angebote.find((x) => x.id === angebotId)
  if (!a || a.verhandelt >= 2) return { c, text: 'Hier ist nichts mehr zu holen.' }
  const r = verhandle(c, rng, a, was)
  const angebote = r.angebot ? c.angebote.map((x) => (x.id === a.id ? r.angebot! : x)) : c.angebote.filter((x) => x.id !== a.id)
  return { c: { ...c, angebote }, text: r.text }
}

export function wechselwunschUmschalten(c: Career): Career {
  const t = c.spieler.traits
  const an = !c.wechselwunsch
  return {
    ...c,
    wechselwunsch: an,
    spieler: an ? { ...c.spieler, traits: applyTraits(t, { trainerBeziehung: -8, moral: -2, kabine: -3 }) } : c.spieler,
  }
}

export const jugendVertrag = (vereinId: string, saison: number) => ({
  gehalt: jugendGehalt(vereinId),
  endeSaison: saison + 1,
  rolle: 'Jugend' as const,
})

