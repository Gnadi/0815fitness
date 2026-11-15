import { LIEFERGEBIET } from '../data/produkte'
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

export function Bestaetigung({ nummer, korb, daten, sonntag, neu }: Props) {
  const s = summen(korb)
  const ort = LIEFERGEBIET.find((g) => g.plz === daten.plz)
  return (
    <div className="bestaetigung">
      <Lastenrad className="rad fahrend" />
      <h1>Danke, {daten.name.split(' ')[0] || 'du'}!</h1>
      <p className="lead">Deine Bestellung <strong>{nummer}</strong> ist eingegangen. Am Sonntag früh wird gebacken – und dann geht's aufs Radl.</p>
      <div className="karte-info">
        <div><span>Lieferung</span><strong>{datumLang(sonntag)}</strong><small>{daten.zeitfenster} Uhr</small></div>
        <div><span>Adresse</span><strong>{daten.strasse}</strong><small>{daten.plz} {ort?.ort}</small></div>
        <div><span>Betrag</span><strong>{euro(s.gesamt)}</strong><small>{s.stueck} Stück · {daten.zahlung === 'online' ? 'bezahlt' : daten.zahlung === 'bar' ? 'bar bei Lieferung' : 'Karte bei Lieferung'}</small></div>
      </div>
      {daten.abo && <p className="abo-info">🔁 Sonntags-Abo aktiv – wir kommen jede Woche wieder.</p>}
      <p className="kleingedruckt">Mockup: Es wurde nichts bestellt und keine Daten verschickt.</p>
      <button className="knopf" onClick={neu}>Neue Bestellung</button>
    </div>
  )
}
