import { createSaveStorage } from './saves'

/** Browser-Spielstände (localStorage). */
export const saves = createSaveStorage(window.localStorage)
