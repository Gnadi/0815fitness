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
} as const;

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
export const ZONE_NAMES = ['Z1 recov', 'Z2 aerob', 'Z3 tempo', 'Z4 thresh', 'Z5 vo₂max'];
