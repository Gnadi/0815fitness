import { createSaveStorage } from './saves'

/** Browser-Spielstände (localStorage). */
export const saves = createSaveStorage(window.localStorage)
import { createHofStorage } from './hof'

/** Hall of Fame: archivierte, beendete Karrieren (localStorage). */
export const hof = createHofStorage(window.localStorage)
