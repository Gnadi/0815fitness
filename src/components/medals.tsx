import type { CSSProperties } from 'react';
import { color, font, medalColor } from '../theme';
import * as S from '../styles';
import type { Medal, MedalTier } from '../lib/medals';

/** A medal, drawn rather than set in an emoji: the app has one type family and one
 *  palette, and a system emoji would be neither. Ribbon, disc, rim — small enough to
 *  read at 14 px on a list row, and the same shape at 28 px on a session. */
export function MedalIcon({ tier, size = 18 }: { tier: MedalTier; size?: number }) {
  const fill = medalColor[tier];
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden style={{ display: 'block', flex: 'none' }}>
      <path d="M4.2 1.2 L7.4 7.2 M13.8 1.2 L10.6 7.2" stroke={fill} strokeWidth={2.1} strokeLinecap="round" opacity={0.55} />
      <circle cx={9} cy={11.6} r={5.4} fill={fill} />
      <circle cx={9} cy={11.6} r={5.4} fill="none" stroke="rgba(11,12,13,0.55)" strokeWidth={1} />
      <circle cx={9} cy={11.6} r={2.4} fill="none" stroke="rgba(11,12,13,0.45)" strokeWidth={1.1} />
    </svg>
  );
}

/** The count, the way the header of a session carries it: one icon per tier that was
 *  actually won, and the total beside them. */
export function MedalTally({ medals, size = 18 }: { medals: Medal[]; size?: number }) {
  const tiers: MedalTier[] = ['gold', 'silver', 'bronze'];
  const won = tiers.filter((tier) => medals.some((m) => m.tier === tier));
  if (medals.length === 0) return null;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {won.map((tier) => (
        <MedalIcon key={tier} tier={tier} size={size} />
      ))}
      <span style={{ ...S.metric, fontWeight: 600, color: color.text, marginLeft: 2 }}>{medals.length}</span>
    </span>
  );
}

/** The badge a list row or a card carries: the best tier won, and how many there were. */
export function MedalBadge({ medals, style }: { medals: Medal[]; style?: CSSProperties }) {
  if (medals.length === 0) return null;
  const best: MedalTier = medals.some((m) => m.tier === 'gold') ? 'gold' : medals.some((m) => m.tier === 'silver') ? 'silver' : 'bronze';
  return (
    <span
      title={`${medals.length} ${medals.length === 1 ? 'achievement' : 'achievements'}`}
      style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 'none', ...style }}
    >
      <MedalIcon tier={best} size={13} />
      <span style={{ fontFamily: font.mono, fontSize: 11, color: medalColor[best] }}>{medals.length}</span>
    </span>
  );
}

/** One medal, said in full: what it was won at, and what it beat. */
export function MedalRow({ medal }: { medal: Medal }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0' }}>
      <MedalIcon tier={medal.tier} size={20} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: color.text }}>{medal.label}</span>
        <span style={{ ...S.caption, color: color.textMuted, lineHeight: 1.4, textWrap: 'pretty' }}>{medal.detail}</span>
      </div>
    </div>
  );
}
