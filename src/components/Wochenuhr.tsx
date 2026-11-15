import { motion } from 'motion/react'
import type { Phase } from '../lib/woche'

const ABSCHNITTE: { phase: Phase; breite: number; titel: string; zeit: string }[] = [
  { phase: 'offen', breite: 40, titel: 'Zettel offen', zeit: 'Mo – Fr 20 Uhr' },
  { phase: 'zu', breite: 20, titel: 'Teig ruht', zeit: 'Fr 20 – So 4' },
  { phase: 'ofen', breite: 12, titel: 'Ofen', zeit: 'So 4 – 7' },
  { phase: 'rad', breite: 14, titel: 'Radl', zeit: 'So 7 – 10' },
  { phase: 'rueckblick', breite: 14, titel: 'Danke', zeit: 'ab 10' },
]

/** Wo in der Woche wir gerade stehen – von Montag bis Sonntagmittag. */
function position(jetzt: Date, phase: Phase): number {
  const tag = (jetzt.getDay() + 6) % 7 // Mo = 0
  const h = tag * 24 + jetzt.getHours() + jetzt.getMinutes() / 60
  const grenzen: Record<Phase, [number, number]> = {
    offen: [0, 4 * 24 + 20],
    zu: [4 * 24 + 20, 6 * 24 + 4],
    ofen: [6 * 24 + 4, 6 * 24 + 7],
    rad: [6 * 24 + 7, 6 * 24 + 10],
    rueckblick: [6 * 24 + 10, 7 * 24],
  }
  let start = 0
  for (const a of ABSCHNITTE) {
    if (a.phase === phase) {
      const [von, bis] = grenzen[phase]
      const anteil = Math.min(1, Math.max(0, (h - von) / (bis - von)))
      return start + anteil * a.breite
    }
    start += a.breite
  }
  return 0
}

export function Wochenuhr({ jetzt, phase }: { jetzt: Date; phase: Phase }) {
  const x = position(jetzt, phase)
  return (
    <div className="wochenuhr" aria-label="Wochenablauf">
      <div className="wochenuhr-spur">
        {ABSCHNITTE.map((a) => (
          <div key={a.phase} className={`abschnitt ${a.phase === phase ? 'jetzt' : ''}`} style={{ width: `${a.breite}%` }}>
            <span className="abschnitt-titel">{a.titel}</span>
            <span className="abschnitt-zeit">{a.zeit}</span>
          </div>
        ))}
        <motion.div className="wochenuhr-zeiger" initial={false} animate={{ left: `${x}%` }} transition={{ type: 'spring', stiffness: 80, damping: 16 }}>
          <span className="zeiger-text">du bist hier</span>
        </motion.div>
      </div>
    </div>
  )
}
