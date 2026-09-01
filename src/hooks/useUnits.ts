import { createContext, useContext } from 'react';
import { METRIC, type UnitFormat } from '../lib/units';

/** The unit formatter is context rather than a prop because every screen shows a
 *  distance and none of them decides what unit it is in. The provider that fills it
 *  from settings lives next door, in `UnitsProvider`. */
export const UnitsContext = createContext<UnitFormat>(METRIC);

export function useUnits(): UnitFormat {
  return useContext(UnitsContext);
}
