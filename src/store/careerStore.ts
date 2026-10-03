import { create } from 'zustand'
import { saves } from '../storage'
import { Aktionen, simuliereWochen } from '../engine/aktionen'
import { createCareer, type NewCareerInput } from '../engine/newCareer'
import type { Anlage, Career, TrainingFocus } from '../engine/types'

interface CareerState {
  career: Career | null
  /** Kurze Rückmeldung (Verhandlung, Speicherfehler …). */
  meldung: string | null
  start(input: NewCareerInput): Career
  open(id: string): boolean
  close(): void
  setzeMeldung(text: string | null): void
  apply(fn: (c: Career) => Career): void
  trainieren(focus: TrainingFocus): void
  simuliere(n: number): void
  waehle(optionIndex: number): void
  weiterImSpiel(): void
  weiter(): void
  ereignisOption(i: number): void
  ereignisWeiter(): void
  naechsteSaison(): void
  beenden(): void
  annehmen(id: string): void
  ablehnen(id: string): void
  verhandeln(id: string, was: 'gehalt' | 'rolle' | 'laufzeit'): void
  leiheAnfragen(): void
  wechselwunsch(): void
  autoSzenen(an: boolean): void
  einzahlen(anlage: Anlage, anteil: number): void
  auszahlen(anlage: Anlage, anteil: number): void
  sparplan(an: boolean): void
}

export const useCareer = create<CareerState>((set, get) => {
  const speichern = (c: Career) => {
    if (!saves.save(c)) set({ meldung: 'Speichern fehlgeschlagen: Der Browser-Speicher ist voll. Exportiere deinen Spielstand!' })
  }
  const apply = (fn: (c: Career) => Career) => {
    const c = get().career
    if (!c) return
    const next = fn(c)
    speichern(next)
    set({ career: next })
  }
  return {
    career: null,
    meldung: null,
    start(input) {
      const career = createCareer(input)
      speichern(career)
      set({ career })
      return career
    },
    open(id) {
      const career = saves.load(id)
      if (career) set({ career })
      return career !== null
    },
    close: () => set({ career: null, meldung: null }),
    setzeMeldung: (text) => set({ meldung: text }),
    apply,
    trainieren: (focus) => apply((c) => Aktionen.trainieren(c, focus)),
    simuliere: (n) => {
      let grund = ''
      apply((c) => {
        const r = simuliereWochen(c, n)
        grund = r.grund
        return r.c
      })
      set({ meldung: grund ? `Simulation gestoppt: ${grund}` : null })
    },
    waehle: (i) => apply((c) => Aktionen.waehle(c, i)),
    weiterImSpiel: () => apply(Aktionen.weiterImSpiel),
    weiter: () => apply(Aktionen.weiter),
    ereignisOption: (i) => apply((c) => Aktionen.ereignisOption(c, i)),
    ereignisWeiter: () => apply(Aktionen.ereignisWeiter),
    naechsteSaison: () => apply(Aktionen.naechsteSaison),
    beenden: () => apply(Aktionen.beenden),
    annehmen: (id) => apply((c) => Aktionen.annehmen(c, id)),
    ablehnen: (id) => apply((c) => Aktionen.ablehnen(c, id)),
    verhandeln: (id, was) => {
      let text = ''
      apply((c) => {
        const r = Aktionen.verhandeln(c, id, was)
        text = r.text
        return r.c
      })
      set({ meldung: text })
    },
    leiheAnfragen: () => apply(Aktionen.leiheAnfragen),
    wechselwunsch: () => apply(Aktionen.wechselwunsch),
    autoSzenen: (an) => apply((c) => Aktionen.einstellung(c, an)),
    einzahlen: (a, p) => apply((c) => Aktionen.einzahlen(c, a, p)),
    auszahlen: (a, p) => apply((c) => Aktionen.auszahlen(c, a, p)),
    sparplan: (an) => apply((c) => Aktionen.sparplan(c, an)),
  }
})
