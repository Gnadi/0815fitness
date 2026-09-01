import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { UnitsContext } from './useUnits';
import { makeUnits } from '../lib/units';
import type { Units } from '../types';

export function UnitsProvider({ units, children }: { units: Units; children: ReactNode }) {
  const value = useMemo(() => makeUnits(units), [units]);
  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}
