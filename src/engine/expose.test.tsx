import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { IMMO_LAGEN, IMMO_STAEDTE, IMMO_TYP_IDS, IMMO_TYPEN } from '../data/immobilien'
import { ENERGIEKLASSEN, exposeVon, type ExposeQuelle } from './expose'
import { immoAngeboteAktualisieren, immoKaufen } from './immobilien'
import { createCareer } from './newCareer'
import { createRng } from './rng'
import { spieleSaisons } from './sim'
import { Energieskala } from '../ui/immo/Energieskala'
import { Grundriss, hatObergeschoss } from '../ui/immo/Grundriss'
import { Lagekarte } from '../ui/immo/Lagekarte'
import { Szene } from '../ui/immo/Szene'
import { ExposeDetail } from '../screens/game/Expose'
import type { ImmoLage, ImmoTyp } from './types'

const LAGEN: ImmoLage[] = ['einfach', 'mittel', 'top']
const quelle = (typ: ImmoTyp, lage: ImmoLage, i = 0, extra: Partial<ExposeQuelle> = {}): ExposeQuelle => ({
  id: `t${typ}${lage}${i}`, typ, lage, stadt: IMMO_STAEDTE[i % IMMO_STAEDTE.length], preis: Math.round(IMMO_TYPEN[typ].preis * IMMO_LAGEN[lage].preis), ...extra,
})

describe('Exposé-Daten', () => {
  it('sind aus der ID abgeleitet und damit reproduzierbar', () => {
    const q = quelle('wohnung', 'mittel')
    expect(exposeVon(q)).toEqual(exposeVon({ ...q }))
    expect(exposeVon(q)).not.toEqual(exposeVon({ ...q, id: 'anderes-objekt' }))
  })

  it('sind für alle Objektarten, Lagen und Städte plausibel', () => {
    for (const typ of IMMO_TYP_IDS) {
      for (const lage of LAGEN) {
        for (let i = 0; i < IMMO_STAEDTE.length; i++) {
          const q = quelle(typ, lage, i)
          const e = exposeVon(q)
          const was = `${typ} ${lage} ${q.stadt}`
          expect(e.flaeche, was).toBeGreaterThan(10)
          expect(Number.isFinite(e.preisProQm), was).toBe(true)
          expect(e.preisProQm, was).toBe(Math.round(q.preis / e.flaeche))
          expect(e.titel.length, was).toBeGreaterThan(10)
          expect(e.beschreibung, was).not.toMatch(/\{|NaN|undefined/)
          expect(e.lageText, was).not.toMatch(/\{|NaN|undefined/)
          expect(e.ausstattung.length, was).toBeGreaterThanOrEqual(2)
          expect(e.makler.initialen.length, was).toBe(2)
          if (typ === 'bauland') {
            expect(e.zimmer).toBe(0)
            expect(e.baujahr).toBeNull()
            expect(e.energie).toBeNull()
          } else {
            expect(e.zimmer, was).toBeGreaterThanOrEqual(1)
            expect(e.baujahr, was).toBeGreaterThanOrEqual(1890)
            expect(ENERGIEKLASSEN).toContain(e.energie)
          }
        }
      }
    }
  })

  it('Fläche steigt mit dem Preis', () => {
    const q = quelle('wohnung', 'mittel')
    expect(exposeVon({ ...q, preis: q.preis * 2 }).flaeche).toBeGreaterThanOrEqual(exposeVon(q).flaeche)
  })

  it('Neubauten sind energieeffizienter als Altbauten, Modernisierung verbessert die Klasse', () => {
    const idx = (k: ReturnType<typeof exposeVon>['energie']) => ENERGIEKLASSEN.indexOf(k!)
    let neu = 0, nNeu = 0, alt = 0, nAlt = 0
    for (let i = 0; i < 400; i++) {
      const e = exposeVon(quelle('eigenheim', 'mittel', i, { id: `serie-${i}` }))
      if (e.baujahr! >= 2014) { neu += idx(e.energie); nNeu++ } else if (e.baujahr! < 1960) { alt += idx(e.energie); nAlt++ }
      const saniert = exposeVon(quelle('eigenheim', 'mittel', i, { id: `serie-${i}`, saniert: true }))
      expect(idx(saniert.energie)).toBeLessThanOrEqual(idx(e.energie))
      expect(saniert.badges).toContain('Saniert')
    }
    expect(neu / nNeu).toBeLessThan(alt / nAlt)
  })
})

describe('Illustrationen', () => {
  it('alle Szenen, Grundrisse und Karten lassen sich ohne Fehlwerte zeichnen', () => {
    for (const typ of IMMO_TYP_IDS) {
      for (const lage of LAGEN) {
        const q = quelle(typ, lage, 3)
        const e = exposeVon(q)
        const teile = [<Szene key="s" typ={typ} lage={lage} seed={e.seed} />, <Grundriss key="g" typ={typ} e={e} />, <Lagekarte key="l" lage={lage} e={e} stadt={q.stadt} />]
        if (hatObergeschoss(typ, e)) teile.push(<Grundriss key="o" typ={typ} e={e} ebene="OG" />)
        for (const t of teile) {
          const html = renderToStaticMarkup(t)
          expect(html, `${typ} ${lage}`).toMatch(/^<svg/)
          expect(html, `${typ} ${lage}`).not.toMatch(/NaN|undefined|Infinity/)
        }
      }
    }
  })

  it('Szenen sind pro Objekt gleich, zwischen Objekten verschieden', () => {
    const a = renderToStaticMarkup(<Szene typ="eigenheim" lage="mittel" seed={5} />)
    expect(renderToStaticMarkup(<Szene typ="eigenheim" lage="mittel" seed={5} />)).toBe(a)
    expect(renderToStaticMarkup(<Szene typ="eigenheim" lage="mittel" seed={6} />)).not.toBe(a)
    expect(renderToStaticMarkup(<Szene typ="eigenheim" lage="top" seed={5} />)).not.toBe(a)
  })

  it('Energieskala markiert die Klasse', () => {
    const html = renderToStaticMarkup(<Energieskala klasse="C" kwh={90} />)
    expect(html).toContain('energie-stufe aktiv')
    expect(html).toContain('Klasse C')
  })
})

describe('Immobilien-Ansicht mit Exposé', () => {
  it('zeigt Marktangebote und Portfolio als Exposé-Karten', async () => {
    const g = globalThis as unknown as Record<string, unknown>
    g.window = g
    g.localStorage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined }
    const { Immobilien } = await import('../screens/game/Immobilien')
    let c = spieleSaisons(createCareer({ vorname: 'A', nachname: 'B', nationalitaet: 'DE', vereinId: 'DE.fc-bayern-muenchen', position: 'ST', fuss: 'rechts', hintergrund: 'arbeiterfamilie', archetyp: 'akademietalent', seed: 3 }), 2)
    c = { ...c, spieler: { ...c.spieler, geld: 9_000_000 } }
    c = immoAngeboteAktualisieren({ ...c, immoAngebote: undefined, wochenGesamt: 26 }, createRng(11))
    const erstes = c.immoAngebote![0]
    c = immoKaufen(c, erstes.id, false).c
    c = immoAngeboteAktualisieren({ ...c, immoAngebote: undefined, wochenGesamt: 52 }, createRng(21))
    const html = renderToStaticMarkup(<Immobilien c={c} />)
    expect(html).toContain('Exposé ansehen')
    expect(html).toContain('expose-hero')
    expect(html).toContain('Dein Portfolio')
    expect(html).not.toMatch(/NaN|undefined/)
    expect((html.match(/expose-hero/g) ?? []).length).toBeGreaterThanOrEqual(c.immoAngebote!.length + 1)
  })
})

describe('3D-Ansicht im Exposé', () => {
  const detail = (typ: ImmoTyp) => {
    const q = quelle(typ, 'top', 1)
    return renderToStaticMarkup(<ExposeDetail q={q} e={exposeVon(q)} finanz={[]} aktionen={null} zurueck={() => undefined} />)
  }
  it('nur Villa und Eigenheim bieten den 3D-Knopf an', () => {
    for (const t of ['villa', 'eigenheim'] as const) expect(detail(t)).toContain('3D-Ansicht')
    for (const t of IMMO_TYP_IDS.filter((x) => x !== 'villa' && x !== 'eigenheim')) expect(detail(t)).not.toContain('3D-Ansicht')
  })
})
