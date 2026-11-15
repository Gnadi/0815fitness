import { GRATIS_AB, PRODUKT_NACH_ID } from '../data/produkte'
import { euro, summen, type Warenkorb } from '../lib/logik'
import { Mengenwahl } from './Mengenwahl'

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

  return (
    <div className="korb">
      <h2>Dein Sonntagskorb</h2>
      {positionen.length === 0 ? (
        <p className="leer">Noch leer. Leg dir was Gutes für Sonntag rein!</p>
      ) : (
        <>
          <ul className="korb-liste">
            {positionen.map(([id, menge]) => {
              const p = PRODUKT_NACH_ID[id]
              return (
                <li key={id}>
                  <span className="korb-emoji" aria-hidden>{p.emoji}</span>
                  <span className="korb-name">{p.name}</span>
                  {kompakt ? <span className="korb-menge">{menge}×</span> : <Mengenwahl name={p.name} menge={menge} setze={(m) => setzeMenge(id, m)} />}
                  <span className="korb-preis">{euro(p.preis * menge)}</span>
                </li>
              )
            })}
          </ul>
          {fehlt > 0 ? (
            <div className="gratis-hinweis">
              <div className="balken"><div style={{ width: `${Math.min(100, (s.zwischensumme / GRATIS_AB) * 100)}%` }} /></div>
              Noch {euro(fehlt)} bis zur Gratis-Zustellung
            </div>
          ) : (
            <div className="gratis-hinweis ok">🚲 Zustellung gratis!</div>
          )}
          <dl className="summen">
            <dt>Zwischensumme</dt><dd>{euro(s.zwischensumme)}</dd>
            <dt>Zustellung per Lastenrad</dt><dd>{s.lieferung === 0 ? 'gratis' : euro(s.lieferung)}</dd>
            <dt className="gesamt">Gesamt</dt><dd className="gesamt">{euro(s.gesamt)}</dd>
          </dl>
        </>
      )}
      {weiter && (
        <button className="knopf breit" disabled={positionen.length === 0} onClick={weiter}>
          Weiter zur Lieferung
        </button>
      )}
    </div>
  )
}
