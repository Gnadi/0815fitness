import { motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { LIEFERGEBIET, ZEITFENSTER } from '../data/produkte'
import { datumLang, euro, summen, type Warenkorb } from '../lib/logik'
import { Korb } from './Korb'

export interface Lieferdaten {
  name: string
  strasse: string
  plz: string
  hinweis: string
  telefon: string
  zeitfenster: string
  zahlung: 'bar' | 'karte' | 'online'
  abo: boolean
}

interface Props {
  korb: Warenkorb
  sonntag: Date
  zurueck: () => void
  absenden: (daten: Lieferdaten) => void
}

export function Kasse({ korb, sonntag, zurueck, absenden }: Props) {
  const [d, setD] = useState<Lieferdaten>({
    name: '', strasse: '', plz: '4020', hinweis: '', telefon: '', zeitfenster: ZEITFENSTER[2], zahlung: 'karte', abo: false,
  })
  const feld = <K extends keyof Lieferdaten>(k: K, v: Lieferdaten[K]) => setD((alt) => ({ ...alt, [k]: v }))

  const senden = (e: FormEvent) => {
    e.preventDefault()
    absenden(d)
  }

  return (
    <div className="kasse">
      <button className="link-zurueck" onClick={zurueck}>← Zurück zum Sortiment</button>
      <p className="eyebrow">Schritt 2 von 2 · Lieferung</p>
      <h1>Sonntag, wir kommen.<span className="h1-sub">{datumLang(sonntag)}</span></h1>
      <div className="kasse-raster">
        <form className="formular" onSubmit={senden}>
          <fieldset>
            <legend>Wohin radeln wir?</legend>
            <label>Name<input required autoComplete="name" value={d.name} onChange={(e) => feld('name', e.target.value)} placeholder="Maria Musterfrau" /></label>
            <label>Straße & Hausnummer<input required autoComplete="street-address" value={d.strasse} onChange={(e) => feld('strasse', e.target.value)} placeholder="Hauptplatz 1/3" /></label>
            <label>Postleitzahl
              <select value={d.plz} onChange={(e) => feld('plz', e.target.value)}>
                {LIEFERGEBIET.map((g) => <option key={g.plz} value={g.plz}>{g.plz} · {g.ort}</option>)}
              </select>
            </label>
            <label>Hinweis für die Zustellung <span className="optional">optional</span>
              <textarea rows={2} value={d.hinweis} onChange={(e) => feld('hinweis', e.target.value)} placeholder="z. B. Sackerl an die Wohnungstür hängen, 2. Stock" />
            </label>
            <label>Telefon <span className="optional">für Rückfragen</span><input type="tel" autoComplete="tel" value={d.telefon} onChange={(e) => feld('telefon', e.target.value)} placeholder="+43 …" /></label>
          </fieldset>

          <fieldset>
            <legend>Wann soll's läuten?</legend>
            <div className="zeitfenster">
              {ZEITFENSTER.map((z) => (
                <label key={z} className={`chip ${d.zeitfenster === z ? 'aktiv' : ''}`}>
                  <input type="radio" name="zeit" value={z} checked={d.zeitfenster === z} onChange={() => feld('zeitfenster', z)} />
                  {d.zeitfenster === z && <motion.span layoutId="zeit-pille" className="chip-pille" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                  <span className="chip-text">{z}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Bezahlung</legend>
            <div className="zahlung">
              {([
                ['karte', 'Karte bei Lieferung', 'Kontaktlos direkt am Radl'],
                ['bar', 'Bar bei Lieferung', 'Bitte möglichst passend'],
                ['online', 'Vorab online', 'Mockup – keine echte Zahlung'],
              ] as const).map(([wert, titel, sub]) => (
                <label key={wert} className={`option ${d.zahlung === wert ? 'aktiv' : ''}`}>
                  <input type="radio" name="zahlung" checked={d.zahlung === wert} onChange={() => feld('zahlung', wert)} />
                  {d.zahlung === wert && <motion.span layoutId="zahl-rahmen" className="option-rahmen" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                  <span><strong>{titel}</strong><small>{sub}</small></span>
                </label>
              ))}
            </div>
            <label className="abo">
              <input type="checkbox" checked={d.abo} onChange={(e) => feld('abo', e.target.checked)} />
              <span><strong>Jeden Sonntag wiederholen</strong><small>Sonntags-Abo, jederzeit bis Freitag pausierbar</small></span>
            </label>
          </fieldset>

          <motion.button className="knopf breit gross" type="submit" whileTap={{ scale: 0.97 }}>Verbindlich vorbestellen · {euro(summen(korb).gesamt)}</motion.button>
          <p className="kleingedruckt">Das ist ein Mockup – es wird keine echte Bestellung ausgelöst.</p>
        </form>
        <aside className="kasse-korb"><Korb korb={korb} setzeMenge={() => {}} kompakt /></aside>
      </div>
    </div>
  )
}
