import { motion } from 'motion/react'
import type { ReactNode } from 'react'

export const einblenden = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
}

export function Reveal({ children, className, delay = 0, id }: { children: ReactNode; className?: string; delay?: number; id?: string }) {
  return (
    <motion.div
      id={id}
      className={className}
      variants={einblenden}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ type: 'spring', stiffness: 120, damping: 20, delay: delay / 1000 }}
    >
      {children}
    </motion.div>
  )
}
