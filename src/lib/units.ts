import type { Units } from '../types';

const M_PER_MILE = 1609.344;
const M_PER_FOOT = 0.3048;

/** Formats every distance, pace, speed and altitude the app shows.
 *
 *  Everything is *stored* in metres and seconds — a log recorded in Vienna and read in
 *  Boston is the same log — and only converted on its way to the screen, so switching
 *  units rewrites no history and loses no precision. */
export interface UnitFormat {
  units: Units;
  distanceUnit: string;
  paceUnit: string;
  speedUnit: string;
  elevationUnit: string;
  /** Metres in the display unit, as a number, for charts and axes. */
  distance(metres: number): number;
  fmtDistance(metres: number, digits?: number): string;
  /** Seconds per stored kilometre, shown per display unit. */
  fmtPace(secPerKm: number): string;
  paceSecPerUnit(secPerKm: number): number;
  fmtSpeed(mps: number): string;
  elevation(metres: number): number;
  fmtElevation(metres: number): string;
  /** A distance typed in the display unit, back in metres. */
  toMetres(display: number): number;
  /** The length of one split, in metres — a kilometre, or a mile. */
  splitM: number;
}

function fmtClockPace(secPerUnit: number): string {
  if (!isFinite(secPerUnit) || secPerUnit <= 0) return '—:—';
  const total = Math.round(secPerUnit);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function makeUnits(units: Units): UnitFormat {
  const metric = units === 'metric';
  const perDistance = metric ? 1000 : M_PER_MILE;
  return {
    units,
    distanceUnit: metric ? 'km' : 'mi',
    paceUnit: metric ? '/km' : '/mi',
    speedUnit: metric ? 'km/h' : 'mph',
    elevationUnit: metric ? 'm' : 'ft',
    distance: (metres) => metres / perDistance,
    fmtDistance: (metres, digits = 2) => (metres / perDistance).toFixed(digits),
    paceSecPerUnit: (secPerKm) => (metric ? secPerKm : secPerKm * (M_PER_MILE / 1000)),
    fmtPace: (secPerKm) => fmtClockPace(metric ? secPerKm : secPerKm * (M_PER_MILE / 1000)),
    fmtSpeed: (mps) => ((mps * 3600) / perDistance).toFixed(1),
    elevation: (metres) => (metric ? metres : metres / M_PER_FOOT),
    fmtElevation: (metres) => String(Math.round(metric ? metres : metres / M_PER_FOOT)),
    toMetres: (display) => display * perDistance,
    splitM: perDistance,
  };
}

export const METRIC = makeUnits('metric');
