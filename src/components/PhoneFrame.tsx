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
