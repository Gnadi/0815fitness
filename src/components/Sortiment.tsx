import { useState } from 'react'
import { KATEGORIEN, PRODUKTE, type Kategorie } from '../data/produkte'
import { euro, type Warenkorb } from '../lib/logik'
import { Mengenwahl } from './Mengenwahl'

interface Props {
  korb: Warenkorb
  setzeMenge: (id: string, menge: number) => void
}

export function Sortiment({ korb, setzeMenge }: Props) {
  const [filter, setFilter] = useState<Kategorie | 'alle'>('alle')
  const liste = filter === 'alle' ? PRODUKTE : PRODUKTE.filter((p) => p.kategorie === filter)

  return (
    <section id="sortiment" className="sortiment">
      <div className="sektion-kopf">
        <h2>Sonntagssortiment</h2>
        <div className="filter" role="tablist" aria-label="Kategorie">
          {KATEGORIEN.map((k) => (
            <button key={k.id} role="tab" aria-selected={filter === k.id} className={filter === k.id ? 'aktiv' : ''} onClick={() => setFilter(k.id)}>
              {k.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="produkte">
        {liste.map((p) => {
          const menge = korb[p.id] ?? 0
          return (
            <li key={p.id} className={`produkt ${menge > 0 ? 'im-korb' : ''}`}>
              <div className="produkt-bild" style={{ background: p.farbe }} aria-hidden>
                <span>{p.emoji}</span>
                {p.hinweis && <em className="badge">{p.hinweis}</em>}
              </div>
              <div className="produkt-text">
                <h3>{p.name}</h3>
                <p>{p.beschreibung}</p>
              </div>
              <div className="produkt-fuss">
                <span className="preis">{euro(p.preis)}</span>
                {menge === 0 ? (
                  <button className="knopf klein" onClick={() => setzeMenge(p.id, 1)}>In den Korb</button>
                ) : (
                  <Mengenwahl name={p.name} menge={menge} setze={(m) => setzeMenge(p.id, m)} />
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
