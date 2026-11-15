import { AnimatePresence, motion } from 'motion/react'
import { STRASSEN, ZEITFENSTER } from '../data/produkte'
import { Haken, Kreis } from './Kreis'

export interface Lieferdaten {
  name: string
  strasse: string
  hausnummer: string
  stock: string
  hinweis: string
  zeit: string
  zahlung: 'karte' | 'bar' | 'vorab'
  abo: boolean
}

export const LEERE_LIEFERDATEN: Lieferdaten = { name: '', strasse: '', hausnummer: '', stock: '', hinweis: '', zeit: '8:00', zahlung: 'karte', abo: false }

const ZAHLUNG: [Lieferdaten['zahlung'], string][] = [['karte', 'Karte an der Tür'], ['bar', 'bar an der Tür'], ['vorab', 'vorab überweisen']]

/** Liegt die eingegebene Straße auf unserer Sonntagsrunde? (nur ein Hinweis, keine Sperre) */
export function aufDerRunde(strasse: string): boolean {
  const s = strasse.trim().toLowerCase().replace(/str\.?(?=\s|$)/, 'straße')
  return STRASSEN.some((r) => s.startsWith(r.toLowerCase()))
}

export function Lieferung({ d, setze }: { d: Lieferdaten; setze: <K extends keyof Lieferdaten>(k: K, v: Lieferdaten[K]) => void }) {
  return (
    <div className="lieferung">
      <div className="feld-reihe">
        <label className="feld breit">
          <span>Name an der Klingel</span>
          <input required autoComplete="name" value={d.name} onChange={(e) => setze('name', e.target.value)} />
        </label>
      </div>
      <div className="feld-reihe adresse">
        <label className="feld">
          <span>Straße</span>
          <input required autoComplete="address-line1" list="runde-strassen" value={d.strasse} onChange={(e) => setze('strasse', e.target.value)} placeholder="z. B. Kirchengasse" />
          <datalist id="runde-strassen">
            {STRASSEN.map((s) => <option key={s} value={s} />)}
          </datalist>
        </label>
        <label className="feld klein">
          <span>Nr.</span>
          <input required value={d.hausnummer} onChange={(e) => setze('hausnummer', e.target.value)} autoComplete="off" />
        </label>
        <label className="feld klein">
          <span>Stock/Tür</span>
          <input value={d.stock} onChange={(e) => setze('stock', e.target.value)} placeholder="2/7" autoComplete="off" />
        </label>
      </div>
      <AnimatePresence>
        {d.strasse.trim().length > 3 && !aufDerRunde(d.strasse) && (
          <motion.p className="hand kuli runde-hinweis" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            Die liegt nicht auf unserer Runde – bestell trotzdem, wir melden uns, ob wir's schaffen.
          </motion.p>
        )}
      </AnimatePresence>
      <label className="feld breit">
        <span>Notiz fürs Radl <em>(optional)</em></span>
        <input value={d.hinweis} onChange={(e) => setze('hinweis', e.target.value)} placeholder="z. B. Sackerl an die Tür, Hund bellt nur" />
      </label>

      <fieldset className="kreis-gruppe">
        <legend>Wann soll's läuten? <em>(ab … für eine halbe Stunde)</em></legend>
        <div className="kreis-optionen">
          {ZEITFENSTER.map((z) => (
            <label key={z} className="kreis-option zeit">
              <input type="radio" name="zeit" checked={d.zeit === z} onChange={() => setze('zeit', z)} />
              <span>{z}</span>
              <Kreis an={d.zeit === z} />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="kreis-gruppe">
        <legend>Bezahlen</legend>
        <div className="kreis-optionen">
          {ZAHLUNG.map(([wert, text]) => (
            <label key={wert} className="kreis-option">
              <input type="radio" name="zahlung" checked={d.zahlung === wert} onChange={() => setze('zahlung', wert)} />
              <span>{text}</span>
              <Kreis an={d.zahlung === wert} />
            </label>
          ))}
        </div>
      </fieldset>

      <label className="ankreuzen">
        <input type="checkbox" checked={d.abo} onChange={(e) => setze('abo', e.target.checked)} />
        <Haken an={d.abo} />
        <span>Jeden Sonntag wieder so – bis ich's abbestelle. <em>Pausieren geht immer bis Freitag.</em></span>
      </label>
    </div>
  )
}
