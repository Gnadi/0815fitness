import { motion } from 'motion/react'
import { useMemo, type CSSProperties } from 'react'
import { LIEFERGEBIET, PRODUKT_NACH_ID } from '../data/produkte'
import { datumLang, euro, summen, type Warenkorb } from '../lib/logik'
import type { Lieferdaten } from './Kasse'
import { Lastenrad } from './Lastenrad'

interface Props {
  nummer: string
  korb: Warenkorb
  daten: Lieferdaten
  sonntag: Date
  neu: () => void
}

const kind = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 140, damping: 18 } },
}

export function Bestaetigung({ nummer, korb, daten, sonntag, neu }: Props) {
  const s = summen(korb)
  const ort = LIEFERGEBIET.find((g) => g.plz === daten.plz)
  const konfetti = useMemo(() => {
    const emojis = Object.keys(korb).map((id) => PRODUKT_NACH_ID[id]?.emoji).filter(Boolean) as string[]
    const quelle = emojis.length ? emojis : ['🥐']
    return Array.from({ length: 28 }, (_, i) => ({
      e: quelle[i % quelle.length],
      links: Math.random() * 100,
      verzoegerung: Math.random() * 0.8,
      dauer: 2.2 + Math.random() * 1.6,
      drehung: (Math.random() - 0.5) * 720,
      groesse: 1.2 + Math.random() * 1.4,
    }))
  }, [korb])

  return (
    <div className="bestaetigung">
      <div className="konfetti" aria-hidden>
        {konfetti.map((k, i) => (
          <span key={i} style={{ left: `${k.links}%`, animationDelay: `${k.verzoegerung}s`, animationDuration: `${k.dauer}s`, fontSize: `${k.groesse}rem`, '--dreh': `${k.drehung}deg` } as CSSProperties}>{k.e}</span>
        ))}
      </div>
      <motion.div initial={{ x: '-70vw' }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 60, damping: 14 }}>
        <Lastenrad className="rad faehrt" />
      </motion.div>
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } } }}>
        <motion.p variants={kind} className="eyebrow">Bestellung {nummer}</motion.p>
        <motion.h1 variants={kind}>Danke, {daten.name.split(' ')[0] || 'du'}!</motion.h1>
        <motion.p variants={kind} className="lead">Am Sonntag früh wird gebacken – und dann geht's aufs Radl.</motion.p>
        <motion.div variants={kind} className="karte-info">
          <div><span>Lieferung</span><strong>{datumLang(sonntag)}</strong><small>{daten.zeitfenster} Uhr</small></div>
          <div><span>Adresse</span><strong>{daten.strasse}</strong><small>{daten.plz} {ort?.ort}</small></div>
          <div><span>Betrag</span><strong>{euro(s.gesamt)}</strong><small>{s.stueck} Stück · {daten.zahlung === 'online' ? 'bezahlt' : daten.zahlung === 'bar' ? 'bar bei Lieferung' : 'Karte bei Lieferung'}</small></div>
        </motion.div>
        {daten.abo && <motion.p variants={kind} className="abo-info">🔁 Sonntags-Abo aktiv – wir kommen jede Woche wieder.</motion.p>}
        <motion.p variants={kind} className="kleingedruckt">Mockup: Es wurde nichts bestellt und keine Daten verschickt.</motion.p>
        <motion.div variants={kind}><button className="knopf" onClick={neu}>Neue Bestellung</button></motion.div>
      </motion.div>
    </div>
  )
}
