// Contour design system — ported from the design brief (uploads/fitness-app-design-brief.md).
// Dark-only. Colour is a finite budget spent almost entirely on data; chrome gets one hue.
import type { CSSProperties } from 'react';

export const color = {
  background: '#0B0C0D',
  surface: '#141618',
  surfaceRaised: '#1C1F22',
  surfaceSunk: '#08090A',
  captureBase: '#000000',
  border: '#26292D',
  borderStrong: '#3A3E43',
  dividerHairline: '#1E2124',

  text: '#F2F4F5',
  textMuted: '#9BA1A6',
  textFaint: '#6B7176',
  textCapture: '#FFFFFF',

  accent: '#8B84F7',
  accentPressed: '#7570E8',
  accentWash: 'rgba(139, 132, 247, 0.14)',
  onAccent: '#0B0C0D',

  positive: '#4F9E6A',
  warning: '#C9903C',
  critical: '#C1544B',

  zone1: '#4A5560',
  zone2: '#356B8C',
  zone3: '#42855A',
  zone4: '#A87A32',
  zone5: '#A6473F',
  zoneBandOpacity: 0.22,

  metricPace: '#E8EAEB',
  metricGap: '#E8EAEB',
  metricHr: '#E06C60',
  metricPower: '#E8B84B',
  metricCadence: '#4FB3A8',
  metricSpeed: '#6FA3D8',
  metricElevation: '#2E353B',

  chartGrid: '#1E2124',
  chartAxis: '#2A2E32',
  scrubLine: '#F2F4F5',
  pbMarker: '#4F9E6A',

  // Medals. Three metals, desaturated far enough to sit in a dark palette without
  // turning the screen into a trophy cabinet — they mark data, like everything else
  // that is allowed colour here.
  medalGold: '#D6A63C',
  medalSilver: '#A7B0B6',
  medalBronze: '#B0733F',

  // The pace ramp the track is drawn in: this session's slowest stretches through its
  // typical ones to its fastest. Relative to the session, so the colours say where the
  // hill was rather than what shape you are in.
  paceSlow: '#4F7CA6',
  paceMid: '#E4E7E9',
  paceFast: '#4FB3A8',

  mapInk: '#0A0B0C',
} as const;

function mix(from: string, to: string, f: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const at = (i: number) => Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * f);
  return `rgb(${at(0)}, ${at(1)}, ${at(2)})`;
}

/** The colour of a stretch of track that was `tone` fast — 0 the slowest of the
 *  session, 1 the fastest. Two stops rather than a rainbow: the eye reads one hue
 *  moving through neutral far better than it reads five, and the map has medals and
 *  markers on it that need to stay the loudest things there. */
export function paceColor(tone: number): string {
  const t = Math.max(0, Math.min(1, tone));
  return t < 0.5 ? mix(color.paceSlow, color.paceMid, t * 2) : mix(color.paceMid, color.paceFast, (t - 0.5) * 2);
}

export const medalColor: Record<'gold' | 'silver' | 'bronze', string> = {
  gold: color.medalGold,
  silver: color.medalSilver,
  bronze: color.medalBronze,
};

export const zoneColors = [color.zone1, color.zone2, color.zone3, color.zone4, color.zone5];

export const font = {
  mono: "'IBM Plex Mono', 'SF Mono', ui-monospace, Menlo, monospace",
  sans: "'IBM Plex Sans', -apple-system, system-ui, Roboto, sans-serif",
};

export const tnum: CSSProperties = {
  fontFeatureSettings: "'tnum' 1, 'zero' 1",
};

export const spacing = {
  base: 4,
  scale: [4, 8, 12, 16, 20, 24, 32, 48],
  screenGutter: 16,
  sectionGap: 24,
};

export const density = {
  listRow: 44,
  tableRow: 28,
  touchTargetMin: 44,
  captureControl: 88,
  chartHeightPrimary: 200,
  chartHeightSecondary: 120,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  sheet: 20,
  pill: 999,
};

export const motion = {
  instant: 0,
  fast: 120,
  base: 200,
  slow: 320,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
};

// HR zones as % of max HR — used to bucket real BLE heart-rate samples.
export const HR_ZONE_BOUNDS = [0, 0.6, 0.7, 0.8, 0.9, 1.2];

// The same five zones cut against lactate threshold heart rate instead. Threshold is
// the intensity the zones are actually *about*, and it moves with fitness while max
// heart rate barely does — so anyone who knows theirs gets a truer distribution here.
export const LTHR_ZONE_BOUNDS = [0, 0.81, 0.9, 0.94, 1.0, 1.3];

export const ZONE_NAMES = ['Z1 recov', 'Z2 aerob', 'Z3 tempo', 'Z4 thresh', 'Z5 vo₂max'];

// Power zones as % of FTP, on the same five-band shape as the heart-rate zones.
export const POWER_ZONE_BOUNDS = [0, 0.55, 0.75, 0.9, 1.05, 2.5];
