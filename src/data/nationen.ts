import { LAENDER } from './clubs'
import { COUNTRIES } from './countries'

export interface Nation {
  id: string
  name: string
  staerke: number
}

/** Nicht-europäische Nationen, die nur bei einer WM vorkommen. */
export const WM_GAESTE: readonly Nation[] = [
  { id: 'AR', name: 'Argentinien', staerke: 88 },
  { id: 'BR', name: 'Brasilien', staerke: 87 },
  { id: 'UY', name: 'Uruguay', staerke: 78 },
  { id: 'CO', name: 'Kolumbien', staerke: 78 },
  { id: 'MA', name: 'Marokko', staerke: 76 },
  { id: 'SN', name: 'Senegal', staerke: 72 },
  { id: 'JP', name: 'Japan', staerke: 74 },
  { id: 'KR', name: 'Südkorea', staerke: 70 },
  { id: 'US', name: 'USA', staerke: 72 },
  { id: 'MX', name: 'Mexiko', staerke: 70 },
  { id: 'EC', name: 'Ecuador', staerke: 68 },
  { id: 'NG', name: 'Nigeria', staerke: 68 },
  { id: 'EG', name: 'Ägypten', staerke: 66 },
  { id: 'AU', name: 'Australien', staerke: 64 },
]

export function nationen(wm: boolean, ausser: string): Nation[] {
  const europa = COUNTRIES.filter((c) => !LAENDER[c.id].gesperrt && c.id !== ausser).map((c) => ({
    id: c.id,
    name: c.name,
    staerke: LAENDER[c.id].national,
  }))
  return wm ? [...europa, ...WM_GAESTE] : europa
}
