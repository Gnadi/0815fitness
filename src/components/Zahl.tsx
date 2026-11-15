import { animate, useMotionValue, useTransform, motion } from 'motion/react'
import { useEffect } from 'react'
import { euro } from '../lib/logik'

/** Euro-Betrag, der weich zum neuen Wert hochzählt. */
export function Zahl({ wert }: { wert: number }) {
  const mv = useMotionValue(wert)
  const text = useTransform(mv, (v) => euro(Math.round(v * 100) / 100))
  useEffect(() => {
    const c = animate(mv, wert, { duration: 0.5, ease: 'easeOut' })
    return () => c.stop()
  }, [mv, wert])
  return <motion.span>{text}</motion.span>
}
