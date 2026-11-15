import { AnimatePresence, m } from 'motion/react'
import { useEffect, useState, type FormEvent } from 'react'
import { Abriss } from './components/Abriss'
import { AppHinweis, OfflineHinweis } from './components/AppHinweis'
import { Bestellliste } from './components/Bestellliste'
import { KrakelFilter } from './components/Gebaeck'
import { Kalenderwochen } from './components/Kalenderwochen'
import { Haken } from './components/Kreis'
import { LEERE_LIEFERDATEN, Lieferung, type Lieferdaten } from './components/Lieferung'
import { Ofen } from './components/Ofen'
import { Radl } from './components/Radl'
import { Runde } from './components/Runde'
import { Stempel } from './components/Stempel'
import { Wochenuhr } from './components/Wochenuhr'
import { Zahl } from './components/Zahl'
import { ZEITPUNKTE, Zeitmaschine } from './components/Zeitmaschine'
import { ARCHIV, GRATIS_AB, KAPAZITAET, LETZTE_WOCHE, SCHON_SPENDIERT, SPENDE } from './data/produkte'
import { bestellnummer, bestellschluss, euro, restzeit, summen, vergebeneKoerbe, type Warenkorb } from './lib/logik'
import { ausgabeNr, backFortschritt, kalenderwoche, plusWochen, rundenFortschritt, wochenStand, type Phase } from './lib/woche'

function useJetzt(intervallMs = 30_000) {
  const [jetzt, setJetzt] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setJetzt(new Date()), intervallMs)
    return () => clearInterval(t)
  }, [intervallMs])
  return jetzt
}

const kurz = (d: Date) => d.toLocaleDateString('de-AT', { weekday: 'short', day: 'numeric', month: 'numeric' })

const TITEL: Record<Phase, string> = {
  offen: 'Sonntag früh kommt das Radl.',
  zu: 'Der Teig ruht.',
  ofen: 'Der Ofen läuft.',
  rad: 'Das Radl ist unterwegs.',
  rueckblick: 'Danke, Grätzl!',
}

function notiz(phase: Phase, jetzt: Date, naechster: Date): string {
  switch (phase) {
    case 'offen':
      return 'Neu: Zimtschnecken! Die waren in zwei Tagen weg – nächste Woche back ich mehr.'
    case 'zu':
      return `Zettel ist zu, ich kauf ein. Wer jetzt bestellt, ist am ${kurz(naechster)} dabei.`
    case 'ofen':
      return `Seit 4 Uhr wach, ${Math.round(backFortschritt(jetzt) * 100)} % sind gebacken. Riecht schon nach Sonntag.`
    case 'rad':
      return 'Bin unterwegs! Wenn\'s läutet, bin das ich.'
    case 'rueckblick':
      return '41 Sackerl, keins ist übrig geblieben. Danke! Der nächste Zettel ist schon offen.'
  }
}

type Stand = { art: 'zettel' } | { art: 'abgegeben'; nummer: string; korb: Warenkorb; spende: boolean; daten: Lieferdaten; sonntag: Date }

export default function App() {
  const echt = useJetzt()
  const [zeitId, setZeitId] = useState('jetzt')
  const jetzt = ZEITPUNKTE.find((z) => z.id === zeitId)?.zeit(echt) ?? echt
  const [wochenIndex, setWochenIndex] = useState(0)
  const stand0 = wochenStand(jetzt)
  const vorbestellt = wochenIndex > 0
  // Für spätere Wochen ist der Zettel einfach offen; die Phasen gelten nur für den nächsten Sonntag.
  const woche = vorbestellt
    ? { ...stand0, phase: 'offen' as Phase, bestellSonntag: plusWochen(stand0.bestellSonntag, wochenIndex) }
    : stand0
  const nr = ausgabeNr(woche.bestellSonntag)
  const schluss = bestellschluss(woche.bestellSonntag)
  // Mockup: für spätere Wochen sind erst die Abo-Sackerl vergeben
  const anteil = vorbestellt ? 0.3 / wochenIndex : 1

  const [korb, setKorb] = useState<Warenkorb>({})
  const [spende, setSpende] = useState(false)
  const [daten, setDaten] = useState<Lieferdaten>(LEERE_LIEFERDATEN)
  const [stand, setStand] = useState<Stand>({ art: 'zettel' })
  const [hinweis, setHinweis] = useState(false)

  const setzeMenge = (id: string, menge: number) =>
    setKorb((k) => {
      const neu = { ...k }
      if (menge <= 0) delete neu[id]
      else neu[id] = menge
      return neu
    })
  const setze = <K extends keyof Lieferdaten>(k: K, v: Lieferdaten[K]) => setDaten((d) => ({ ...d, [k]: v }))

  const s = summen(korb)
  const gesamt = s.gesamt + (spende ? SPENDE : 0)
  const vergeben = vorbestellt ? Math.max(6, Math.round(vergebeneKoerbe(jetzt, KAPAZITAET) * anteil)) : vergebeneKoerbe(jetzt, KAPAZITAET)

  const abgeben = (e: FormEvent) => {
    e.preventDefault()
    if (s.stueck === 0) {
      setHinweis(true)
      document.getElementById('was')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setStand({ art: 'abgegeben', nummer: `${nr}-${bestellnummer().slice(3)}`, korb, spende, daten, sonntag: woche.bestellSonntag })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const neu = () => {
    setKorb({})
    setSpende(false)
    setDaten(LEERE_LIEFERDATEN)
    setStand({ art: 'zettel' })
  }

  return (
    <>
      <KrakelFilter />
      <OfflineHinweis />

      <main className="tisch">
        {stand.art === 'zettel' && (
          <Kalenderwochen ersterSonntag={stand0.bestellSonntag} gewaehlt={wochenIndex} waehle={(i) => { setWochenIndex(i); setHinweis(false) }} />
        )}
        <AnimatePresence mode="wait" initial={false}>
          {stand.art === 'zettel' ? (
            <m.form
              key="zettel"
              className="zettel"
              onSubmit={abgeben}
              initial={{ opacity: 0, y: 30, rotate: 0.6 }}
              animate={{ opacity: 1, y: 0, rotate: -0.4 }}
              exit={{ opacity: 0, y: 260, rotate: 8, scaleY: 0.4, transition: { duration: 0.6, ease: [0.5, 0, 0.8, 0.4] } }}
              transition={{ type: 'spring', stiffness: 70, damping: 16 }}
            >
              <span className="klebestreifen links" aria-hidden />
              <span className="klebestreifen rechts" aria-hidden />

              <header className="zettel-kopf">
                <div className="kopf-zeile">
                  <div className="marke">
                    <Radl className="marke-radl" fahrend={woche.phase === 'rad'} />
                    <span>Die Radl&shy;bäckerin</span>
                  </div>
                  <div className="ausgabe">
                    <span>Sonntagszettel</span>
                    <strong>KW {kalenderwoche(woche.bestellSonntag)}</strong>
                  </div>
                </div>

                <h1>{TITEL[woche.phase]}</h1>
                <p className="unterzeile">
                  Gebäck aus unserer Küche, mit dem Lastenrad an deine Tür – nur in unseren paar Gassen.
                  Dieser Zettel ist für <strong>{woche.bestellSonntag.toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>.
                </p>

                {!vorbestellt && (woche.phase === 'zu' || woche.phase === 'ofen' || woche.phase === 'rad') && (
                  <Stempel className="phasen-stempel" drehung={-7}>Zettel für {kurz(woche.dieserSonntag)} ist zu</Stempel>
                )}

                <m.p key={`${woche.phase}-${wochenIndex}`} className="notiz hand" initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }} animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}>
                  {vorbestellt
                    ? `Schon für KW ${kalenderwoche(woche.bestellSonntag)} vormerken? Gern! Ändern geht bis zum Freitag davor.`
                    : notiz(woche.phase, jetzt, woche.bestellSonntag)}
                  <span className="unterschrift">– eure Radlbäckerin</span>
                </m.p>

                {!vorbestellt && <Wochenuhr jetzt={jetzt} phase={woche.phase} />}
                <p className="schluss">
                  Abgeben bis <strong>{schluss.toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'numeric' })}, 20 Uhr</strong>
                  <span className="hand kuli"> noch {restzeit(jetzt, schluss)}</span>
                </p>
              </header>

              <section id="was" className="abschnitt-zettel">
                <div className="abschnitt-kopf">
                  <h2><span className="nr">1</span> Was darf's sein?</h2>
                  <button type="button" className="letzte-woche" onClick={() => { setKorb(LETZTE_WOCHE); setHinweis(false) }}>
                    <span className="hand">↻ wie letzte Woche</span>
                    <small>4 Semmeln, 1 Bauernbrot, 2 Linzer (Demo)</small>
                  </button>
                </div>
                <AnimatePresence>
                  {hinweis && s.stueck === 0 && (
                    <m.p className="hand kuli hinweis" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      Erst was aussuchen – dann kann der Zettel abgegeben werden.
                    </m.p>
                  )}
                </AnimatePresence>
                <Bestellliste korb={korb} anteil={anteil} setzeMenge={(id, m) => { setzeMenge(id, m); setHinweis(false) }} />
              </section>

              <section className="abschnitt-zettel">
                <div className="abschnitt-kopf">
                  <h2>Plätze im Ofen</h2>
                  <p className="randnotiz hand">ein Ofen, ein Radl – wenn's voll ist, ist's voll</p>
                </div>
                <Ofen kapazitaet={KAPAZITAET} vergeben={vergeben} eigenes={s.stueck > 0} />
              </section>

              <section className="abschnitt-zettel">
                <div className="abschnitt-kopf">
                  <h2><span className="nr">2</span> Wohin & wann?</h2>
                </div>
                <Lieferung d={daten} setze={setze} />
              </section>

              <section className="abschnitt-zettel">
                <div className="abschnitt-kopf">
                  <h2><span className="nr">3</span> Für die Nachbarschaft</h2>
                </div>
                <label className="ankreuzen spende">
                  <input type="checkbox" checked={spende} onChange={(e) => setSpende(e.target.checked)} />
                  <Haken an={spende} />
                  <span>
                    <strong>+1 Sackerl spendieren ({euro(SPENDE)})</strong> – wir bringen es jemandem im Grätzl, dem's grad nicht so gut geht.
                    <em> Diese Woche schon {SCHON_SPENDIERT + (spende ? 1 : 0)}× spendiert.</em>
                  </span>
                </label>
              </section>

              <section className="abschnitt-zettel rechnung">
                <dl>
                  <dt>Gebäck</dt><dd><Zahl wert={s.zwischensumme} /></dd>
                  <dt>Radl {s.stueck > 0 && s.zwischensumme < GRATIS_AB && <em>(ab {euro(GRATIS_AB)} gratis)</em>}</dt>
                  <dd>{s.stueck > 0 && s.lieferung === 0 ? 'gratis' : <Zahl wert={s.lieferung} />}</dd>
                  {spende && (<><dt>Spende</dt><dd>{euro(SPENDE)}</dd></>)}
                  <dt className="gesamt">Zusammen</dt><dd className="gesamt hand kuli"><Zahl wert={gesamt} /></dd>
                </dl>
                <m.button type="submit" className="abgeben" whileTap={{ scale: 0.97 }}>
                  Zettel abgeben
                  <small>für {kurz(woche.bestellSonntag)}</small>
                </m.button>
                <p className="kleingedruckt">Mockup – es wird nichts bestellt und nichts verschickt.</p>
              </section>
              <div className="perforation" aria-hidden />
            </m.form>
          ) : (
            <Abriss key="abriss" nummer={stand.nummer} korb={stand.korb} spende={stand.spende} daten={stand.daten} sonntag={stand.sonntag} neu={neu} />
          )}
        </AnimatePresence>

        <div className="beiblaetter">
          <AppHinweis />
          <section className="blatt runde-blatt">
            <h2>Unsere Runde</h2>
            <Runde fortschritt={rundenFortschritt(jetzt)} unterwegs={woche.phase === 'rad'} />
          </section>

          <section className="blatt wer">
            <div className="polaroid" aria-label="Platzhalter für ein Foto aus der Küche">
              <div className="polaroid-bild"><span className="hand">Foto aus der Küche folgt</span></div>
              <span className="hand">Sonntag, 4:10 Uhr</span>
            </div>
            <div>
              <h2>Wer backt hier?</h2>
              <p>Wir backen bei uns zuhause, in einem Ofen, für die paar Gassen rundherum. Kein Laden, keine Filiale – nur ein Zettel pro Woche und ein Lastenrad.</p>
              <p className="hand kuli">Sauerteig heißt übrigens Herbert.</p>
            </div>
          </section>

          <section className="blatt fragen">
            <h2>Fragen am Rand</h2>
            <details>
              <summary>Was ist, wenn ich nicht da bin?</summary>
              <p>Dann hängt das Sackerl an deiner Tür. Schreib's einfach in die Notiz fürs Radl.</p>
            </details>
            <details>
              <summary>Allergene?</summary>
              <p>Alles enthält Gluten. Milch und Ei: Zopf, Linzer, Zimtschnecke. Sesam und Nüsse kommen in unserer Küche vor.</p>
            </details>
            <details>
              <summary>Warum nur so wenig?</summary>
              <p>Ein Ofen schafft nur so viel. Dafür ist alles am Sonntag früh frisch und es bleibt nichts übrig.</p>
            </details>
            <details>
              <summary>Kann ich mein Abo pausieren?</summary>
              <p>Jederzeit bis Freitag 20 Uhr – ein Klick, oder sag's uns einfach beim Läuten.</p>
            </details>
          </section>

          <section className="blatt archiv">
            <h2>Frühere Zettel</h2>
            <ul>
              {ARCHIV.map((a) => (
                <li key={a.nr}>
                  <span className="archiv-nr">KW {kalenderwoche(plusWochen(stand0.bestellSonntag, a.nr))}</span>
                  <span className="hand">{a.notiz}</span>
                  <span className="archiv-zahl">{a.sackerl} Sackerl{a.neu && ` · neu: ${a.neu}`}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <footer className="fuss">
        <p><strong>Die Radlbäckerin</strong> · Gebäck aus unserer Küche, sonntags 7–10 Uhr per Lastenrad</p>
        <p className="kleingedruckt">Klick-Mockup. Gassen, Preise und Zahlen sind Platzhalter.</p>
        <Zeitmaschine aktiv={zeitId} waehle={(id) => { setZeitId(id); setWochenIndex(0) }} />
      </footer>

      <AnimatePresence>
        {stand.art === 'zettel' && s.stueck > 0 && (
          <m.a
            href="#abgeben-ziel"
            className="leiste"
            onClick={(e) => { e.preventDefault(); document.querySelector('.rechnung')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <span>{s.stueck} Stück · <Zahl wert={gesamt} /></span>
            <strong>zum Abgeben ↓</strong>
          </m.a>
        )}
      </AnimatePresence>
    </>
  )
}
