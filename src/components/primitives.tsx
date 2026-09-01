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
  style,
}: {
  elevations: number[];
  width?: number;
  height?: number;
  fill?: string;
  /** Overrides the drawn size — `width: '100%'` stretches the shape across its row,
   *  which is what the session cards on the Overview do with it. */
  style?: CSSProperties;
}) {
  const profile = resample(elevations, Math.min(48, Math.max(2, elevations.length)));
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ flex: 'none', ...style }}>
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

/** The header every screen below the Overview shares: back, title, and one optional
 *  action on the right. */
export function ScreenHeader({ title, onBack, right }: { title: ReactNode; onBack: () => void; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 16px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <button
          onClick={onBack}
          aria-label="Back"
          style={{ background: 'none', border: 'none', color: color.textFaint, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 6px 0 0' }}
        >
          ‹
        </button>
        <span style={{ ...S.title, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

/** A row of mutually exclusive choices, used wherever a setting has three or fewer. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: 'flex', gap: 4 }}>
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            aria-pressed={on}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: font.mono,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '.04em',
              ...(on
                ? { background: color.accentWash, color: color.accent, border: `1px solid ${color.accent}` }
                : { background: color.surface, color: color.textMuted, border: `1px solid ${color.border}` }),
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** A labelled text or number field, in the same well the save screen's title sits in. */
export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Label>{label}</Label>
      {children}
      {hint && <span style={{ fontSize: 12, lineHeight: 1.4, color: color.textFaint }}>{hint}</span>}
    </div>
  );
}

/** A button that reads as an action rather than a link: bordered, quiet, full width. */
export function ActionButton({
  onClick,
  children,
  tone = 'neutral',
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'critical';
  disabled?: boolean;
}) {
  const stroke = tone === 'accent' ? color.accent : tone === 'critical' ? color.critical : color.border;
  const text = tone === 'accent' ? color.accent : tone === 'critical' ? color.critical : color.text;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        height: 44,
        borderRadius: 6,
        background: 'none',
        border: `1px solid ${stroke}`,
        color: text,
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
