import { AnimatePresence, motion } from 'motion/react'

/** Ein mit dem Kuli gezogener Kreis um die Auswahl. */
export function Kreis({ an }: { an: boolean }) {
  return (
    <AnimatePresence>
      {an && (
        <motion.svg className="kreis" viewBox="0 0 120 50" preserveAspectRatio="none" aria-hidden exit={{ opacity: 0 }}>
          <motion.path
            d="M14 26C10 12 44 5 70 6c26 1 44 8 42 20-2 13-34 19-62 18C24 43 8 36 12 24c3-8 20-13 40-15"
            fill="none"
            stroke="var(--kuli)"
            strokeWidth="2.6"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  )
}

/** Ein mit dem Kuli gesetztes Häkchen. */
export function Haken({ an }: { an: boolean }) {
  return (
    <span className="haken-box" aria-hidden>
      <AnimatePresence>
        {an && (
          <motion.svg viewBox="0 0 30 30" exit={{ opacity: 0 }}>
            <motion.path d="M4 16l7 8L27 3" fill="none" stroke="var(--kuli)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
          </motion.svg>
        )}
      </AnimatePresence>
    </span>
  )
}
