import { motion } from 'motion/react'
import { kalenderwoche, plusWochen } from '../lib/woche'

/** Registerreiter oben am Zettel: für welchen Sonntag wird bestellt? */
export function Kalenderwochen({ ersterSonntag, gewaehlt, waehle, anzahl = 4 }: { ersterSonntag: Date; gewaehlt: number; waehle: (i: number) => void; anzahl?: number }) {
  return (
    <div className="reiter" role="tablist" aria-label="Für welchen Sonntag bestellen?">
      {Array.from({ length: anzahl }, (_, i) => {
        const so = plusWochen(ersterSonntag, i)
        const aktiv = i === gewaehlt
        return (
          <button key={i} type="button" role="tab" aria-selected={aktiv} className={`reiter-tab ${aktiv ? 'aktiv' : ''}`} onClick={() => waehle(i)}>
            {aktiv && <motion.span layoutId="reiter-papier" className="reiter-papier" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
            <span className="reiter-kw">KW {kalenderwoche(so)}</span>
            <span className="reiter-datum">So {so.toLocaleDateString('de-AT', { day: 'numeric', month: 'numeric' })}</span>
          </button>
        )
      })}
    </div>
  )
}
