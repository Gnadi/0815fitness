import type { CSSProperties, ReactNode } from 'react';
import { color, font } from '../theme';
import * as S from '../styles';
import { silhouettePath, resample } from '../lib/geo';

export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ ...S.label, ...style }}>{children}</span>;
}

/** The atom from the brief: uppercase label above, mono value below, unit in
 *  text-muted at ~60% of the value size. */
export function DataField({
  label,
  value,
  unit,
  valueStyle,
  sub,
}: {
  label: string;
  value: string;
  unit?: string;
  valueStyle?: CSSProperties;
  sub?: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Label>{label}</Label>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ ...S.metricHero, color: color.textCapture, ...valueStyle }}>{value}</span>
        {unit && <span style={{ fontFamily: font.mono, fontSize: 15, color: color.textMuted }}>{unit}</span>}
      </div>
      {sub}
    </div>
  );
}

export type ChipState = 'connected' | 'searching' | 'absent';

export function SensorChip({
  name,
  state,
  onClick,
  detail,
  disabled,
}: {
  name: string;
  state: ChipState;
  onClick: () => void;
  detail?: string;
  disabled?: boolean;
}) {
  const dot = state === 'connected' ? color.positive : state === 'searching' ? color.warning : color.textFaint;
  const stateLabel = detail ?? (state === 'connected' ? '' : state === 'searching' ? 'pairing' : 'not paired');
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 34,
        padding: '0 13px',
        borderRadius: 999,
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 13,
        background: 'none',
        opacity: disabled ? 0.55 : 1,
        border: state === 'absent' ? `1px dashed ${color.borderStrong}` : `1px solid ${color.border}`,
        color: state === 'absent' ? color.textFaint : color.text,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          flex: 'none',
          background: dot,
          animation: state === 'searching' ? 'ctSearch 1.6s ease-in-out infinite' : undefined,
        }}
      />
      <span>{name}</span>
      {stateLabel && (
        <span style={{ fontSize: 12, color: state === 'searching' ? color.warning : color.textFaint }}>{stateLabel}</span>
      )}
    </button>
  );
}

/** The signature element: an activity's elevation profile as a small filled form. */
export function RouteSilhouette({
  elevations,
  width = 88,
  height = 20,
  fill = color.metricElevation,
}: {
  elevations: number[];
  width?: number;
  height?: number;
  fill?: string;
}) {
  const profile = resample(elevations, Math.min(48, Math.max(2, elevations.length)));
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ flex: 'none' }}>
      <path d={silhouettePath(profile, width, height)} fill={fill} />
    </svg>
  );
}

export function EmptyState({ line, action }: { line: string; action?: ReactNode }) {
  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ ...S.body, color: color.textMuted, textWrap: 'pretty' }}>{line}</span>
      {action}
    </div>
  );
}

export function SectionHeader({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px' }}>
      <Label>{children}</Label>
      {right}
    </div>
  );
}
