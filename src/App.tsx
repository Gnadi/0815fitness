import { useEffect, useState } from 'react'
import { Bestaetigung } from './components/Bestaetigung'
import { Countdown, useJetzt } from './components/Countdown'
import { Kasse, type Lieferdaten } from './components/Kasse'
import { Korb } from './components/Korb'
import { Lastenrad } from './components/Lastenrad'
import { Sortiment } from './components/Sortiment'
import { GRATIS_AB, LIEFERGEBIET, LIEFERGEBUEHR } from './data/produkte'
import { bestellnummer, euro, lieferSonntag, summen, type Warenkorb } from './lib/logik'

const SPEICHER = 'radlbaeckerin-korb'

function ladeKorb(): Warenkorb {
  try {
    return JSON.parse(localStorage.getItem(SPEICHER) ?? '{}') as Warenkorb
  } catch {
    return {}
  }
}

type Schritt = { art: 'shop' } | { art: 'kasse' } | { art: 'fertig'; nummer: string; daten: Lieferdaten; korb: Warenkorb }

export default function App() {
  const jetzt = useJetzt()
  const sonntag = lieferSonntag(jetzt)
  const [korb, setKorb] = useState<Warenkorb>(ladeKorb)
  const [schritt, setSchritt] = useState<Schritt>({ art: 'shop' })
  const [korbOffen, setKorbOffen] = useState(false)

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
      <div className="mockup-band">Mockup · keine echten Bestellungen</div>
      <header className="kopf">
        <button className="logo" onClick={() => setSchritt({ art: 'shop' })}>
          <img src="./icon.svg" alt="" width={36} height={36} />
          <span>Die Radlbäckerin<small>Linz</small></span>
        </button>
        {schritt.art === 'shop' && (
          <nav>
            <a href="#sortiment">Sortiment</a>
            <a href="#so-gehts">So geht's</a>
            <a href="#liefergebiet">Liefergebiet</a>
          </nav>
        )}
      </header>

      {schritt.art === 'shop' && (
        <main>
          <section className="held">
            <div className="held-text">
              <p className="eyebrow">Sonntagsgebäck aus Linz</p>
              <h1>Frisch gebacken. <em>Mit dem Lastenrad</em> an deine Tür.</h1>
              <p className="lead">Bis Freitag bestellen, Sonntag früh ausschlafen – wir läuten zwischen 7 und 10 Uhr mit Semmeln, Brot und Linzer Schnitten.</p>
              <Countdown jetzt={jetzt} />
              <a href="#sortiment" className="knopf gross">Jetzt vorbestellen</a>
            </div>
            <Lastenrad className="rad" />
          </section>

          <section id="so-gehts" className="schritte">
            <h2>So geht's</h2>
            <ol>
              <li><span>1</span><h3>Bis Freitag 20 Uhr bestellen</h3><p>Korb zusammenstellen, Zeitfenster für Sonntag wählen.</p></li>
              <li><span>2</span><h3>Sonntag früh backen wir</h3><p>Ab 3 Uhr in der Backstube – nur was bestellt ist, kein Abfall.</p></li>
              <li><span>3</span><h3>Wir radeln zu dir</h3><p>Emissionsfrei per Lastenrad, Sackerl an die Tür oder persönlich.</p></li>
            </ol>
          </section>

          <div className="shop-raster">
            <Sortiment korb={korb} setzeMenge={setzeMenge} />
            <aside className="seiten-korb"><Korb korb={korb} setzeMenge={setzeMenge} weiter={zurKasse} /></aside>
          </div>

          <section id="liefergebiet" className="gebiet">
            <div>
              <h2>Liefergebiet</h2>
              <p>Wir fahren alles, was sich vor dem Frühstück gut radeln lässt. Zustellung {euro(LIEFERGEBUEHR)}, ab {euro(GRATIS_AB)} gratis.</p>
            </div>
            <ul>
              {LIEFERGEBIET.map((g) => <li key={g.plz}><strong>{g.plz}</strong>{g.ort}</li>)}
            </ul>
          </section>
        </main>
      )}

      {schritt.art === 'kasse' && (
        <main>
          <Kasse
            korb={korb}
            sonntag={sonntag}
            zurueck={() => setSchritt({ art: 'shop' })}
            absenden={(daten) => {
              setSchritt({ art: 'fertig', nummer: bestellnummer(), daten, korb })
              setKorb({})
            }}
          />
        </main>
      )}

      {schritt.art === 'fertig' && (
        <main>
          <Bestaetigung nummer={schritt.nummer} korb={schritt.korb} daten={schritt.daten} sonntag={sonntag} neu={() => setSchritt({ art: 'shop' })} />
        </main>
      )}

      <footer className="fuss">
        <p><strong>Die Radlbäckerin</strong> · Backstube in Linz · Lieferung sonntags 7–10 Uhr</p>
        <p className="kleingedruckt">Klick-Mockup. Alle Inhalte, Preise und Daten sind Platzhalter.</p>
      </footer>

      {schritt.art === 'shop' && s.stueck > 0 && (
        <button className="korb-leiste" onClick={() => setKorbOffen(true)}>
          <span>🧺 {s.stueck} Stück</span>
          <strong>{euro(s.gesamt)} · Korb ansehen</strong>
        </button>
      )}

      {korbOffen && schritt.art === 'shop' && (
        <div className="blatt-hintergrund" onClick={() => setKorbOffen(false)}>
          <div className="blatt" role="dialog" aria-modal="true" aria-label="Warenkorb" onClick={(e) => e.stopPropagation()}>
            <button className="blatt-zu" onClick={() => setKorbOffen(false)} aria-label="Schließen">×</button>
            <Korb korb={korb} setzeMenge={setzeMenge} weiter={zurKasse} />
          </div>
        </div>
      )}
    </>
  )
}
