import { m } from 'motion/react'
import type { ReactNode } from 'react'

/** Roter Gummistempel, der mit einem kleinen Ruck aufs Papier kommt. */
export function Stempel({ children, className = '', drehung = -6, verzoegerung = 0.2 }: { children: ReactNode; className?: string; drehung?: number; verzoegerung?: number }) {
  return (
    <m.span
      className={`stempel ${className}`}
      initial={{ scale: 1.8, opacity: 0, rotate: drehung - 8 }}
      animate={{ scale: 1, opacity: 1, rotate: drehung }}
      transition={{ delay: verzoegerung, type: 'spring', stiffness: 420, damping: 18 }}
    >
      {children}
    </m.span>
  )
}
