import { AnimatePresence, motion } from 'motion/react'
import { useState, type CSSProperties } from 'react'
import { KATEGORIEN, PRODUKTE, type Kategorie, type Produkt } from '../data/produkte'
import { fliegZumKorb } from '../lib/animation'
import { euro, type Warenkorb } from '../lib/logik'
import { Mengenwahl } from './Mengenwahl'
import { Reveal } from './Reveal'

const KAT_FARBE: Record<Kategorie, string> = { gebaeck: 'var(--butter)', brot: 'var(--orange-hell)', suesses: 'var(--pink)' }

interface Props {
  korb: Warenkorb
  setzeMenge: (id: string, menge: number) => void
}

function ProduktKarte({ p, i, menge, setzeMenge }: { p: Produkt; i: number; menge: number; setzeMenge: Props['setzeMenge'] }) {
  return (
    <motion.li
      layout
      className={`produkt ${menge > 0 ? 'im-korb' : ''}`}
      style={{ '--farbe': KAT_FARBE[p.kategorie] } as CSSProperties}
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ type: 'spring', stiffness: 140, damping: 18, delay: (i % 3) * 0.08 }}
      whileHover={{ y: -6 }}
    >
      <div className="produkt-bild" aria-hidden>
        <span className="produkt-emoji">{p.emoji}</span>
        {p.hinweis && <em className="badge">{p.hinweis}</em>}
        <AnimatePresence>
          {menge > 0 && (
            <motion.span key="badge" className="menge-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
              <motion.span key={menge} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{menge}</motion.span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="produkt-text">
        <h3>{p.name}</h3>
        <p>{p.beschreibung}</p>
      </div>
      <div className="produkt-fuss">
        <span className="preis">{euro(p.preis)}</span>
        {menge === 0 ? (
          <button
            className="knopf klein"
            onClick={(e) => {
              const btn = e.currentTarget
              setzeMenge(p.id, 1)
              requestAnimationFrame(() => fliegZumKorb(btn, p.emoji))
            }}
          >
            <span className="plus" aria-hidden>+</span> In den Korb
          </button>
        ) : (
          <Mengenwahl
            name={p.name}
            menge={menge}
            setze={(m, el) => {
              setzeMenge(p.id, m)
              if (m > menge && el) fliegZumKorb(el, p.emoji)
            }}
          />
        )}
      </div>
    </motion.li>
  )
}

export function Sortiment({ korb, setzeMenge }: Props) {
  const [filter, setFilter] = useState<Kategorie | 'alle'>('alle')
  const liste = filter === 'alle' ? PRODUKTE : PRODUKTE.filter((p) => p.kategorie === filter)

  return (
    <section id="sortiment" className="sortiment">
      <Reveal className="sektion-kopf">
        <div>
          <p className="eyebrow">Das Sortiment</p>
          <h2>Was darf's am <span className="box lime">Sonntag</span> sein?</h2>
        </div>
        <div className="filter" role="tablist" aria-label="Kategorie">
          {KATEGORIEN.map((k) => (
            <button key={k.id} role="tab" aria-selected={filter === k.id} className={filter === k.id ? 'aktiv' : ''} onClick={() => setFilter(k.id)}>
              {filter === k.id && <motion.span layoutId="filter-pille" className="filter-pille" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="filter-text">{k.label}</span>
            </button>
          ))}
        </div>
      </Reveal>
      <motion.ul className="produkte" layout>
        <AnimatePresence>
          {liste.map((p, i) => (
            <ProduktKarte key={p.id} p={p} i={i} menge={korb[p.id] ?? 0} setzeMenge={setzeMenge} />
          ))}
        </AnimatePresence>
      </motion.ul>
    </section>
  )
}
