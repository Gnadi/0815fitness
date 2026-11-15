import { AnimatePresence, motion } from 'motion/react'
import { GRATIS_AB, PRODUKT_NACH_ID } from '../data/produkte'
import { euro, summen, type Warenkorb } from '../lib/logik'
import { Mengenwahl } from './Mengenwahl'
import { Zahl } from './Zahl'

interface Props {
  korb: Warenkorb
  setzeMenge: (id: string, menge: number) => void
  weiter?: () => void
  kompakt?: boolean
}

export function Korb({ korb, setzeMenge, weiter, kompakt }: Props) {
  const s = summen(korb)
  const positionen = Object.entries(korb).filter(([id, m]) => m > 0 && PRODUKT_NACH_ID[id])
  const fehlt = GRATIS_AB - s.zwischensumme
  const anteil = Math.min(100, (s.zwischensumme / GRATIS_AB) * 100)

  return (
    <div className="korb">
      <div className="korb-kopf">
        <h2>Dein Sonntagskorb</h2>
        <span className="korb-icon" data-korb-ziel={kompakt ? undefined : ''} aria-hidden>🧺</span>
      </div>
      <AnimatePresence initial={false} mode="popLayout">
        {positionen.length === 0 ? (
          <motion.p key="leer" className="leer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            Noch leer. Leg dir was Gutes für Sonntag rein!
          </motion.p>
        ) : (
          <motion.div key="voll" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ul className="korb-liste">
              <AnimatePresence initial={false}>
                {positionen.map(([id, menge]) => {
                  const p = PRODUKT_NACH_ID[id]
                  return (
                    <motion.li
                      key={id}
                      layout
                      initial={{ opacity: 0, x: 30, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: -30, height: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    >
                      <span className="korb-emoji" aria-hidden>{p.emoji}</span>
                      <span className="korb-name">{p.name}</span>
                      {kompakt ? <span className="korb-menge">{menge}×</span> : <Mengenwahl name={p.name} menge={menge} setze={(m) => setzeMenge(id, m)} />}
                      <span className="korb-preis">{euro(p.preis * menge)}</span>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
            <div className={`gratis-hinweis ${fehlt <= 0 ? 'ok' : ''}`}>
              <div className="balken">
                <motion.div animate={{ width: `${anteil}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}>
                  <span className="balken-rad" aria-hidden>🚲</span>
                </motion.div>
              </div>
              {fehlt > 0 ? <>Noch {euro(fehlt)} bis zur Gratis-Zustellung</> : <>Zustellung gratis!</>}
            </div>
            <dl className="summen">
              <dt>Zwischensumme</dt><dd><Zahl wert={s.zwischensumme} /></dd>
              <dt>Zustellung per Lastenrad</dt><dd>{s.lieferung === 0 ? 'gratis' : euro(s.lieferung)}</dd>
              <dt className="gesamt">Gesamt</dt><dd className="gesamt"><Zahl wert={s.gesamt} /></dd>
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
      {weiter && (
        <motion.button className="knopf breit" disabled={positionen.length === 0} onClick={weiter} whileTap={{ scale: 0.97 }}>
          Weiter zur Lieferung <span className="pfeil" aria-hidden>→</span>
        </motion.button>
      )}
    </div>
  )
}
