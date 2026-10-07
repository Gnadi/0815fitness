import { describe, expect, it } from 'vitest'
import { ALLE_EREIGNISSE, EREIGNIS_BY_ID } from '../data/events'
import { Aktionen } from './aktionen'
import { beendeSaison } from './season'
import { fuelleText, ereignisVerfuegbar, wendeEffekteAn } from './ereignisse'
import { createCareer, type NewCareerInput } from './newCareer'
import { createRng } from './rng'
import { spieleSaisons } from './sim'
import type { Career } from './types'

const input: NewCareerInput = {
  vorname: 'Max', nachname: 'Muster', nationalitaet: 'DE', vereinId: 'DE.hannover-96', position: 'ST',
  fuss: 'rechts', hintergrund: 'arbeiterfamilie', archetyp: 'strassenfussballer', seed: 7,
}

const NEU = ['s-', 'l-', 'so-', 'vd-', 'la-', 'tr-', 'vl-', 'nt-', 'rv-', 'sk-']
const neueEreignisse = ALLE_EREIGNISSE.filter((e) => NEU.some((p) => e.id.startsWith(p)))

describe('Ereignis-Pakete (Saison, Lebensphasen, Social, Vereinsleben)', () => {
  it('bringt mindestens 110 neue Ereignisse mit', () => {
    expect(neueEreignisse.length).toBeGreaterThanOrEqual(110)
  })

  it('Texte, Titel und Bedingungen laufen in jeder Lage ohne Fehler', () => {
    let c: Career = createCareer(input)
    for (let s = 0; s < 6; s++) {
      for (const e of neueEreignisse) {
        expect(() => ereignisVerfuegbar(c, e), e.id).not.toThrow()
        expect(fuelleText(c, e.titel).length, e.id).toBeGreaterThan(0)
        expect(fuelleText(c, e.text).length, e.id).toBeGreaterThan(20)
        for (const o of e.optionen) {
          expect(fuelleText(c, o.erfolg.text).length, e.id).toBeGreaterThan(0)
          if (o.misserfolg) expect(fuelleText(c, o.misserfolg.text).length, e.id).toBeGreaterThan(0)
        }
      }
      c = spieleSaisons(c, 1)
    }
  })

  it('Effekt „Vereinsstärke“ verändert nur den eigenen Verein und bleibt im Rahmen', () => {
    const c = createCareer(input)
    const vorher = c.welt.staerke[c.vereinId]
    const r = wendeEffekteAn(c, [{ t: 'vereinsstaerke', d: 3 }], createRng(1))
    expect(r.c.welt.staerke[c.vereinId]).toBe(vorher + 3)
    expect(r.wirkung.join()).toContain('Vereinsstärke')
    const tief = wendeEffekteAn(c, [{ t: 'vereinsstaerke', d: -500 }], createRng(1))
    expect(tief.c.welt.staerke[c.vereinId]).toBeGreaterThanOrEqual(20)
  })

  it('ein Trainerwechsel setzt einen Trainertyp', () => {
    const c = createCareer(input)
    const r = wendeEffekteAn(c, [{ t: 'aktion', name: 'trainer-wechsel' }], createRng(3))
    expect(['motivator', 'taktiker', 'diktator', 'altmeister', 'jugendfoerderer']).toContain(r.c.flags.trainerTyp)
  })

  it('Folgeereignisse für Hochzeit, Baby und Insolvenz sind verdrahtet', () => {
    const ziele = (id: string) => EREIGNIS_BY_ID[id].optionen.flatMap((o) => [...(o.erfolg.effekte ?? []), ...(o.misserfolg?.effekte ?? [])]).filter((e) => e.t === 'folge').map((e) => (e as { id: string }).id)
    expect(ziele('p-heiratsantrag')).toContain('l-hochzeit')
    expect(ziele('p-baby')).toContain('l-neugeborenes')
    expect(ziele('v-finanzkrise')).toContain('vd-insolvenz')
    expect(ziele('t-trainerwechsel')).toContain('s-neuer-trainer')
  })

  it('Saisonende plant Meisterfeier, verspielten Titel und Rettung', () => {
    const profi = spieleSaisons(createCareer({ ...input, vereinId: 'DE.fc-bayern-muenchen' }), 2)
    expect(profi.saison.jugend).toBe(false)
    const ligaTeams = profi.saison.teams
    const setze = (c: Career, zeile: [number, number, number, number, number, number], flags: Career['flags'] = {}) => ({
      ...c,
      flags: { ...c.flags, ...flags },
      geplant: [],
      saison: { ...c.saison, tabelle: Object.fromEntries(ligaTeams.map((id) => [id, id === c.vereinId ? zeile : ([34, 10, 10, 14, 40, 50] as typeof zeile)])) },
    })
    const meister = beendeSaison(setze(profi, [34, 34, 0, 0, 100, 5]), createRng(1))
    expect(meister.geplant.map((g) => g.id)).toContain('s-meisterkorso')
    const rivale = ligaTeams.find((id) => id !== profi.vereinId)!
    const zweiter = setze(profi, [34, 20, 10, 4, 70, 30], { titelkampf: true })
    zweiter.saison.tabelle[rivale] = [34, 30, 4, 0, 90, 10]
    const verspielt = beendeSaison(zweiter, createRng(1))
    expect(verspielt.geplant.map((g) => g.id)).toContain('s-titel-verspielt')
    expect(verspielt.flags.titelkampf).toBeUndefined()
  })

  it('nach langer Reha wird das Comeback-Ereignis geplant', () => {
    const profi = spieleSaisons(createCareer({ ...input, vereinId: 'DE.fc-bayern-muenchen' }), 2)
    const verletzt: Career = { ...profi, phase: 'planung', ereignis: null, verletzung: { name: 'Zerrung', wochen: 1 }, flags: { ...profi.flags, rehaWochen: 4 }, geplant: [] }
    const nach = Aktionen.trainieren(verletzt, 'ausgewogen')
    expect(nach.verletzung).toBeNull()
    expect(nach.geplant.map((g) => g.id)).toContain('vl-comeback')
    expect(nach.flags.rehaWochen).toBe(0)
  })
})
