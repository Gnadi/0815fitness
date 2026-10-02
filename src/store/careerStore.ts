import { create } from 'zustand'
import { saves } from '../storage'
import { createCareer, type NewCareerInput } from '../engine/newCareer'
import type { Career } from '../engine/types'

interface CareerState {
  career: Career | null
  start(input: NewCareerInput): Career
  open(id: string): boolean
  close(): void
}

export const useCareer = create<CareerState>((set) => ({
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
}))
