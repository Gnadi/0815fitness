import { create } from 'zustand'
import { saves } from '../storage'
import { createCareer, type NewCareerInput } from '../engine/newCareer'
import { naechsteSaison } from '../engine/season'
import { beendeKarriere, startWeek, waehle, weiter, weiterImSpiel } from '../engine/week'
import type { Career, TrainingFocus } from '../engine/types'

interface CareerState {
  career: Career | null
  start(input: NewCareerInput): Career
  open(id: string): boolean
  close(): void
  /** Wendet eine Engine-Funktion an und speichert den neuen Stand. */
  apply(fn: (c: Career) => Career): void
  trainieren(focus: TrainingFocus): void
  waehle(optionIndex: number): void
  weiterImSpiel(): void
  weiter(): void
  naechsteSaison(): void
  beenden(): void
}

export const useCareer = create<CareerState>((set, get) => {
  const apply = (fn: (c: Career) => Career) => {
    const c = get().career
    if (!c) return
    const next = fn(c)
    saves.save(next)
    set({ career: next })
  }
  return {
    career: null,
    start(input) {
      const career = createCareer(input)
      saves.save(career)
      set({ career })
      return career
    },
    open(id) {
      const career = saves.load(id)
      if (career) set({ career })
      return career !== null
    },
    close: () => set({ career: null }),
    apply,
    trainieren: (focus) => apply((c) => startWeek(c, focus)),
    waehle: (i) => apply((c) => waehle(c, i)),
    weiterImSpiel: () => apply(weiterImSpiel),
    weiter: () => apply(weiter),
    naechsteSaison: () => apply(naechsteSaison),
    beenden: () => apply(beendeKarriere),
  }
})
