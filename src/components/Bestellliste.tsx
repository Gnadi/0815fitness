import { AnimatePresence, motion } from 'motion/react'
import { PRODUKTE } from '../data/produkte'
import { euro, type Warenkorb } from '../lib/logik'
import { Gebaeck } from './Gebaeck'
import { Stempel } from './Stempel'

interface Props {
  korb: Warenkorb
  setzeMenge: (id: string, menge: number) => void
}

export function Bestellliste({ korb, setzeMenge }: Props) {
  return (
    <ol className="liste">
      {PRODUKTE.map((p) => {
        const menge = korb[p.id] ?? 0
        const rest = p.kontingent - p.vergeben
        const aus = rest <= 0
        return (
          <li key={p.id} className={`zeile ${aus ? 'aus' : ''} ${menge > 0 ? 'gewaehlt' : ''}`}>
            <Gebaeck form={p.form} className="zeile-bild" />
            <div className="zeile-text">
              <span className="zeile-name">{p.name}</span>
              <span className="zeile-notiz">{p.notiz}</span>
              <span className="zeile-rest">
                <span className="rest-preis">{euro(p.preis)} · </span>
                {aus ? 'diese Woche weg' : rest <= 10 ? `nur noch ${rest}` : `noch ${rest}`}
              </span>
            </div>
            <span className="zeile-preis">{euro(p.preis)}</span>
            {aus ? (
              <div className="zeile-aus">
                <Stempel drehung={-10} verzoegerung={0}>aus!</Stempel>
              </div>
            ) : (
              <div className="zaehler" role="group" aria-label={`Anzahl ${p.name}`}>
                <button type="button" onClick={() => setzeMenge(p.id, menge - 1)} disabled={menge === 0} aria-label={`${p.name} weniger`}>−</button>
                <span className="zaehler-feld">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {menge > 0 && (
                      <motion.span
                        key={menge}
                        className="hand kuli"
                        initial={{ opacity: 0, y: -8, rotate: -12, scale: 1.4 }}
                        animate={{ opacity: 1, y: 0, rotate: -4, scale: 1 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      >
                        {menge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <button type="button" onClick={() => setzeMenge(p.id, Math.min(menge + 1, rest))} disabled={menge >= rest} aria-label={`${p.name} mehr`}>+</button>
              </div>
            )}
            {aus && <motion.span className="durchgestrichen" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} aria-hidden />}
          </li>
        )
      })}
    </ol>
  )
}
