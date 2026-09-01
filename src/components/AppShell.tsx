import type { ReactNode } from 'react';
import { color } from '../theme';

/** The app is a phone app, but it is not a picture of a phone: it fills whatever
 *  viewport it is given, edge to edge, with no frame or letterbox around it. On a wide
 *  screen the content settles into a comfortable column — the page behind it carries the
 *  same background, so the column has no visible edge and nothing reads as a device
 *  pasted onto a desktop. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        height: '100dvh',
        background: color.background,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        className="ct-app"
        style={{
          width: '100%',
          maxWidth: 560,
          height: '100dvh',
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
