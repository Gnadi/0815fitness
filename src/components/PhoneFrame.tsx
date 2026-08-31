import type { ReactNode } from 'react';
import { color } from '../theme';

/** The design is drawn for a 390×844 handset. On a phone-sized browser the app just
 *  fills the viewport; on anything wider it sits in a centred device-sized frame so the
 *  capture screens keep the proportions they were designed at. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0F1011',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      <div
        className="ct-device"
        style={{
          width: '100%',
          maxWidth: 390,
          height: '100dvh',
          maxHeight: 844,
          position: 'relative',
          overflow: 'hidden',
          background: color.background,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Status-bar-height spacer plus the clock, matching the device chrome the prototype
 *  drew inside its iOS frame. Real browsers paint their own chrome, so this is a thin
 *  in-app header rather than a fake system bar. */
export function StatusStrip({ dark = false }: { dark?: boolean }) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 12,
        letterSpacing: '.06em',
        color: dark ? '#FFFFFF' : color.textFaint,
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      <span>{time}</span>
      <span style={{ fontWeight: 600, letterSpacing: '.14em', color: color.accent }}>CONTOUR</span>
    </div>
  );
}
