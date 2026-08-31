import type { CSSProperties } from 'react';
import { color, font, radius } from './theme';

// Shared style atoms lifted straight out of the prototype so the built screens
// keep the same rhythm: label above value, mono numerals, hairline separators.

export const label: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: color.textFaint,
};

export const mono: CSSProperties = {
  fontFamily: font.mono,
  fontFeatureSettings: "'tnum' 1, 'zero' 1",
};

export const monoTick: CSSProperties = {
  ...mono,
  fontSize: 10,
  letterSpacing: '.06em',
  color: color.textFaint,
};

export const metricCapture: CSSProperties = {
  ...mono,
  fontSize: 72,
  fontWeight: 700,
  lineHeight: 0.95,
  letterSpacing: '-0.02em',
};

export const metricHero: CSSProperties = { ...mono, fontSize: 44, fontWeight: 600, lineHeight: 1 };
export const metricLarge: CSSProperties = { ...mono, fontSize: 28, fontWeight: 600, lineHeight: 1.1 };
export const metric: CSSProperties = { ...mono, fontSize: 20, fontWeight: 500, lineHeight: 1.2 };
export const tableNum: CSSProperties = { ...mono, fontSize: 13, fontWeight: 400, lineHeight: 1.3 };

export const title: CSSProperties = { fontSize: 20, fontWeight: 600, lineHeight: 1.25 };
export const heading: CSSProperties = { fontSize: 16, fontWeight: 600, lineHeight: 1.3 };
export const body: CSSProperties = { fontSize: 15, fontWeight: 400, lineHeight: 1.45 };
export const caption: CSSProperties = { fontSize: 12, fontWeight: 400, lineHeight: 1.25 };

export const screen: CSSProperties = {
  height: '100%',
  background: color.background,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  paddingTop: 52,
  overflow: 'hidden',
};

export const captureScreen: CSSProperties = {
  ...screen,
  background: color.captureBase,
};

export const scrollArea: CSSProperties = {
  flex: 1,
  overflow: 'auto',
};

export const cardGrid: CSSProperties = {
  display: 'flex',
  gap: 1,
  background: color.dividerHairline,
  border: `1px solid ${color.border}`,
  borderRadius: radius.md,
  overflow: 'hidden',
};

export const cardCell: CSSProperties = {
  flex: 1,
  background: color.surface,
  padding: '10px 11px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

export const sunkWell: CSSProperties = {
  background: color.surfaceSunk,
  borderTop: `1px solid ${color.dividerHairline}`,
  borderBottom: `1px solid ${color.dividerHairline}`,
};

export const linkButton: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontSize: 12,
  fontWeight: 500,
  color: color.accent,
  cursor: 'pointer',
};

export const tableHeaderRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: 28,
  padding: '0 16px',
  background: color.surfaceSunk,
  borderTop: `1px solid ${color.dividerHairline}`,
  borderBottom: `1px solid ${color.dividerHairline}`,
};

export const tableRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: 28,
  padding: '0 16px',
  boxSizing: 'border-box',
  borderBottom: `1px solid ${color.dividerHairline}`,
};

export const listRow: CSSProperties = {
  height: 44,
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  borderTop: `1px solid ${color.dividerHairline}`,
  boxSizing: 'border-box',
};
