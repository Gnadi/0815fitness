import { STRASSEN, ZEITFENSTER } from '../data/produkte'
import { Haken, Kreis } from './Kreis'

export interface Lieferdaten {
  name: string
  strasse: string
  hausnummer: string
  hinweis: string
  zeit: string
  zahlung: 'karte' | 'bar' | 'vorab'
  abo: boolean
}

export const LEERE_LIEFERDATEN: Lieferdaten = { name: '', strasse: STRASSEN[0], hausnummer: '', hinweis: '', zeit: '8:00', zahlung: 'karte', abo: false }

const ZAHLUNG: [Lieferdaten['zahlung'], string][] = [['karte', 'Karte an der Tür'], ['bar', 'bar an der Tür'], ['vorab', 'vorab überweisen']]

export function Lieferung({ d, setze }: { d: Lieferdaten; setze: <K extends keyof Lieferdaten>(k: K, v: Lieferdaten[K]) => void }) {
  return (
    <div className="lieferung">
      <div className="feld-reihe">
        <label className="feld breit">
          <span>Name an der Klingel</span>
          <input required autoComplete="name" value={d.name} onChange={(e) => setze('name', e.target.value)} />
        </label>
      </div>
      <div className="feld-reihe">
        <label className="feld">
          <span>Gasse</span>
          <select value={d.strasse} onChange={(e) => setze('strasse', e.target.value)}>
            {STRASSEN.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="feld schmal">
          <span>Nr. / Tür</span>
          <input required value={d.hausnummer} onChange={(e) => setze('hausnummer', e.target.value)} inputMode="text" />
        </label>
      </div>
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
