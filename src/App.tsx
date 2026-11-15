import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'
import { Bestaetigung } from './components/Bestaetigung'
import { Countdown, useJetzt } from './components/Countdown'
import { Kasse, type Lieferdaten } from './components/Kasse'
import { Korb } from './components/Korb'
import { Lastenrad } from './components/Lastenrad'
import { Reveal } from './components/Reveal'
import { Sortiment } from './components/Sortiment'
import { Stempel } from './components/Stempel'
import { Zahl } from './components/Zahl'
import { GRATIS_AB, KAPAZITAET, LIEFERGEBIET, LIEFERGEBUEHR } from './data/produkte'
import { bestellnummer, euro, lieferSonntag, summen, vergebeneKoerbe, type Warenkorb } from './lib/logik'

const SPEICHER = 'radlbaeckerin-korb'

function ladeKorb(): Warenkorb {
  try {
    return JSON.parse(localStorage.getItem(SPEICHER) ?? '{}') as Warenkorb
  } catch {
    return {}
  }
}

type Schritt = { art: 'shop' } | { art: 'kasse' } | { art: 'fertig'; nummer: string; daten: Lieferdaten; korb: Warenkorb }

const ZEILEN: { t: string; cls?: string }[] = [
  { t: 'frisches' },
  { t: 'sonntags', cls: 'box lime' },
  { t: 'gebäck,' },
  { t: 'per radl', cls: 'box pink' },
  { t: 'an die tür.' },
]
const LAUFBAND = ['Frisch gebacken', 'Sonntag 7–10 Uhr', 'Per Lastenrad', 'Bestellschluss Freitag 20 Uhr', 'Aus Linz', 'Kein Abfall']
const SCHWEBER = [
  { e: '🥐', x: '8%', y: '12%', d: 0 },
  { e: '🥨', x: '82%', y: '6%', d: 0.8 },
  { e: '🍞', x: '88%', y: '58%', d: 1.6 },
  { e: '🥯', x: '4%', y: '62%', d: 2.4 },
  { e: '🍓', x: '48%', y: '0%', d: 1.2 },
]

const seite = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] as const } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.2 } },
}

function Held({ jetzt }: { jetzt: Date }) {
  const { scrollY } = useScroll()
  const radY = useTransform(scrollY, [0, 600], [0, 120])
  const radX = useTransform(scrollY, [0, 600], [0, 80])
  const schwebY = useTransform(scrollY, [0, 600], [0, -160])

  return (
    <section className="held">
      <div className="blob blob-1" aria-hidden />
      <div className="blob blob-2" aria-hidden />
      <div className="held-text">
        <motion.p className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <span className="live-punkt" /> Linz · Sonntags 7–10 Uhr
        </motion.p>
        <h1 className="mega" aria-label="Frisches Sonntagsgebäck, per Radl an die Tür.">
          {ZEILEN.map((z, i) => (
            <span className="zeile" key={z.t} aria-hidden>
              <motion.span
                className={z.cls}
                initial={{ y: '115%', rotate: 4 }}
                animate={{ y: 0, rotate: z.cls ? (i % 2 ? -2 : 2) : 0 }}
                transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 110, damping: 15 }}
              >
                {z.t}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p className="lead" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          Bis Freitag bestellen, Sonntag ausschlafen. Wir läuten zwischen 7 und 10 Uhr mit ofenfrischen Semmeln, Brot und Linzer Schnitten.
        </motion.p>
        <motion.div className="held-aktionen" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
          <motion.a href="#sortiment" className="knopf gross" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            Jetzt vorbestellen <span className="pfeil" aria-hidden>→</span>
          </motion.a>
          <a href="#so-gehts" className="knopf geist gross">So funktioniert's</a>
        </motion.div>
        <Kapazitaet jetzt={jetzt} />
      </div>

      <div className="held-bild">
        <motion.div className="stempel-huelle" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 1, type: 'spring', stiffness: 160, damping: 12 }}>
          <Stempel text="ofenfrisch ✺ sonntags ✺ per lastenrad ✺ aus linz ✺ " mitte="🥐" />
        </motion.div>
        <motion.div className="schweber" style={{ y: schwebY }} aria-hidden>
          {SCHWEBER.map((s) => (
            <motion.span
              key={s.e}
              style={{ left: s.x, top: s.y }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, y: [0, -14, 0], rotate: [0, 8, 0] }}
              transition={{ opacity: { delay: 0.6 + s.d * 0.2 }, scale: { delay: 0.6 + s.d * 0.2, type: 'spring' }, y: { duration: 4, repeat: Infinity, delay: s.d, ease: 'easeInOut' }, rotate: { duration: 5, repeat: Infinity, delay: s.d, ease: 'easeInOut' } }}
            >
              {s.e}
            </motion.span>
          ))}
        </motion.div>
        <motion.div style={{ y: radY, x: radX }} className="rad-huelle">
          <motion.div initial={{ x: '-120%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 50, damping: 13, delay: 0.3 }}>
            <Lastenrad className="rad faehrt" />
          </motion.div>
          <div className="strasse" aria-hidden />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: -2 }} transition={{ delay: 0.9, type: 'spring', stiffness: 120 }}>
          <Countdown jetzt={jetzt} />
        </motion.div>
      </div>
    </section>
  )
}

function Kapazitaet({ jetzt }: { jetzt: Date }) {
  const vergeben = vergebeneKoerbe(jetzt, KAPAZITAET)
  const frei = KAPAZITAET - vergeben
  return (
    <motion.div className="kapazitaet" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
      <div className="kapazitaet-text">
        <span><strong>{vergeben}</strong>/{KAPAZITAET} Körbe vergeben</span>
        <span className="kapazitaet-frei">noch {frei} frei</span>
      </div>
      <div className="kapazitaet-balken">
        <motion.div initial={{ width: 0 }} animate={{ width: `${(vergeben / KAPAZITAET) * 100}%` }} transition={{ delay: 1.1, duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }} />
      </div>
      <p>Wir backen zuhause in einem Ofen – wenn er voll ist, ist er voll.</p>
    </motion.div>
  )
}

function Laufband() {
  const inhalt = [...LAUFBAND, ...LAUFBAND]
  return (
    <div className="laufband-huelle" aria-hidden>
      <div className="laufband">
        <div className="laufband-spur">
          {inhalt.map((t, i) => (
            <span key={i}>{t}<em>✺</em></span>
          ))}
        </div>
      </div>
    </div>
  )
}

function SoGehts() {
  const schritte = [
    { n: '01', e: '📱', t: 'Bis Freitag bestellen', p: 'Korb zusammenstellen, Zeitfenster für Sonntag wählen. Bestellschluss Freitag 20 Uhr.' },
    { n: '02', e: '🔥', t: 'Sonntag früh backen', p: 'Ab 4 Uhr läuft der Ofen – gebacken wird nur, was bestellt ist. Kein Abfall.' },
    { n: '03', e: '🚲', t: 'Wir radeln zu dir', p: 'Emissionsfrei per Lastenrad. Sackerl an die Tür oder persönlich überreicht.' },
  ]
  return (
    <section id="so-gehts" className="schritte">
      <Reveal className="sektion-kopf">
        <div>
          <p className="eyebrow">So geht's</p>
          <h2>Drei Schritte zum Sonntagsfrühstück.</h2>
        </div>
      </Reveal>
      <div className="schritte-raster">
        <svg className="route" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden>
          <motion.path
            d="M20 30 C 200 -10, 300 70, 500 30 S 800 -10, 980 30"
            fill="none"
            stroke="var(--orange)"
            strokeWidth="3"
            strokeDasharray="1 12"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
          />
        </svg>
        {schritte.map((s, i) => (
          <Reveal key={s.n} className="schritt" delay={i * 150}>
            <div className="schritt-kopf">
              <span className="schritt-n">{s.n}</span>
              <motion.span className="schritt-e" whileHover={{ rotate: [0, -15, 15, 0], scale: 1.2 }}>{s.e}</motion.span>
            </div>
            <h3>{s.t}</h3>
            <p>{s.p}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Liefergebiet() {
  return (
    <Reveal id="liefergebiet" className="gebiet">
      <div className="gebiet-text">
        <p className="eyebrow hell">Liefergebiet</p>
        <h2>Von unserer Küche in dein Grätzl.</h2>
        <p>Wir radeln nur so weit, wie das Gebäck noch warm ankommt. Zustellung {euro(LIEFERGEBUEHR)}, ab {euro(GRATIS_AB)} gratis.</p>
        <ul>
          {LIEFERGEBIET.map((g, i) => (
            <motion.li key={g.plz} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.08 }}>
              <strong>{g.plz}</strong>{g.ort}
            </motion.li>
          ))}
        </ul>
      </div>
      <div className="radar" aria-hidden>
        <span className="ring r1" /><span className="ring r2" /><span className="ring r3" />
        <span className="radar-arm" />
        <span className="radar-haus">🏠</span>
        <span className="radar-punkt p1">🥐</span>
        <span className="radar-punkt p2">🥨</span>
        <span className="radar-punkt p3">🍞</span>
      </div>
    </Reveal>
  )
}

export default function App() {
  const jetzt = useJetzt()
  const sonntag = lieferSonntag(jetzt)
  const [korb, setKorb] = useState<Warenkorb>(ladeKorb)
  const [schritt, setSchritt] = useState<Schritt>({ art: 'shop' })
  const [korbOffen, setKorbOffen] = useState(false)
  const [gescrollt, setGescrollt] = useState(false)
  const { scrollY, scrollYProgress } = useScroll()
  useMotionValueEvent(scrollY, 'change', (y) => setGescrollt(y > 24))

  useEffect(() => {
    try { localStorage.setItem(SPEICHER, JSON.stringify(korb)) } catch { /* egal im Mockup */ }
  }, [korb])

  useEffect(() => { window.scrollTo({ top: 0 }) }, [schritt.art])

  const setzeMenge = (id: string, menge: number) =>
    setKorb((k) => {
      const neu = { ...k }
      if (menge <= 0) delete neu[id]
      else neu[id] = menge
      return neu
    })

  const s = summen(korb)
  const zurKasse = () => { setKorbOffen(false); setSchritt({ art: 'kasse' }) }

  return (
    <>
      <motion.div className="fortschritt" style={{ scaleX: scrollYProgress }} aria-hidden />
      <div className="mockup-band">Mockup · keine echten Bestellungen</div>
      <header className={`kopf ${gescrollt ? 'klein' : ''}`}>
        <button className="logo" onClick={() => setSchritt({ art: 'shop' })}>
          <img src="./icon.svg" alt="" width={38} height={38} />
          <span>radlbäckerin<small>Linz</small></span>
        </button>
        {schritt.art === 'shop' && (
          <nav>
            <a href="#sortiment">Sortiment</a>
            <a href="#so-gehts">So geht's</a>
            <a href="#liefergebiet">Liefergebiet</a>
          </nav>
        )}
      </header>

      <AnimatePresence mode="wait">
        {schritt.art === 'shop' && (
          <motion.main key="shop" {...seite}>
            <Held jetzt={jetzt} />
            <Laufband />
            <div className="inhalt">
              <SoGehts />
              <div className="shop-raster">
                <Sortiment korb={korb} setzeMenge={setzeMenge} />
                <aside className="seiten-korb"><Korb korb={korb} setzeMenge={setzeMenge} weiter={zurKasse} /></aside>
              </div>
              <Liefergebiet />
            </div>
          </motion.main>
        )}

        {schritt.art === 'kasse' && (
          <motion.main key="kasse" className="inhalt" {...seite}>
            <Kasse
              korb={korb}
              sonntag={sonntag}
              zurueck={() => setSchritt({ art: 'shop' })}
              absenden={(daten) => {
                setSchritt({ art: 'fertig', nummer: bestellnummer(), daten, korb })
                setKorb({})
              }}
            />
          </motion.main>
        )}

        {schritt.art === 'fertig' && (
          <motion.main key="fertig" className="inhalt" {...seite}>
            <Bestaetigung nummer={schritt.nummer} korb={schritt.korb} daten={schritt.daten} sonntag={sonntag} neu={() => setSchritt({ art: 'shop' })} />
          </motion.main>
        )}
      </AnimatePresence>

      <footer className="fuss">
        <div className="fuss-marke">radlbäckerin</div>
        <p>Backen in Linz · Liefern sonntags 7–10 Uhr · Per Lastenrad</p>
        <p className="kleingedruckt">Klick-Mockup. Alle Inhalte, Preise und Daten sind Platzhalter.</p>
      </footer>

      <AnimatePresence>
        {schritt.art === 'shop' && s.stueck > 0 && !korbOffen && (
          <motion.button
            className="korb-leiste"
            onClick={() => setKorbOffen(true)}
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="leiste-links">
              <span className="leiste-icon" data-korb-ziel="">🧺</span>
              <motion.span key={s.stueck} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="leiste-zahl">{s.stueck}</motion.span>
            </span>
            <strong><Zahl wert={s.gesamt} /> · Korb ansehen</strong>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {korbOffen && schritt.art === 'shop' && (
          <motion.div className="blatt-hintergrund" onClick={() => setKorbOffen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="blatt"
              role="dialog"
              aria-modal="true"
              aria-label="Warenkorb"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) setKorbOffen(false) }}
            >
              <div className="blatt-griff" aria-hidden />
              <button className="blatt-zu" onClick={() => setKorbOffen(false)} aria-label="Schließen">×</button>
              <Korb korb={korb} setzeMenge={setzeMenge} weiter={zurKasse} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
