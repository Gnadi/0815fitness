import { motion } from 'motion/react'
import { PRODUKT_NACH_ID, SPENDE } from '../data/produkte'
import { datumLang, euro, summen, type Warenkorb } from '../lib/logik'
import type { Lieferdaten } from './Lieferung'
import { Radl } from './Radl'
import { Stempel } from './Stempel'

interface Props {
  nummer: string
  korb: Warenkorb
  spende: boolean
  daten: Lieferdaten
  sonntag: Date
  neu: () => void
}

function kalender(sonntag: Date, zeit: string, nummer: string): string {
  const [h, m] = zeit.split(':').map(Number)
  const start = new Date(sonntag)
  start.setHours(h, m, 0, 0)
  const ende = new Date(start.getTime() + 30 * 60_000)
  const f = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//radlbaeckerin//mockup//DE', 'BEGIN:VEVENT', `UID:${nummer}@radlbaeckerin`, `DTSTART:${f(start)}`, `DTEND:${f(ende)}`, 'SUMMARY:Das Radl kommt mit dem Gebäck', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}

/** Der abgerissene Abschnitt, den man nach dem Abgeben behält. */
export function Abriss({ nummer, korb, spende, daten, sonntag, neu }: Props) {
  const s = summen(korb)
  const gesamt = s.gesamt + (spende ? SPENDE : 0)
  return (
    <motion.section
      className="abriss"
      initial={{ y: 80, opacity: 0, rotate: 3 }}
      animate={{ y: 0, opacity: 1, rotate: -1 }}
      transition={{ type: 'spring', stiffness: 90, damping: 14, delay: 0.2 }}
      aria-live="polite"
    >
      <div className="abriss-kopf">
        <span className="abriss-label">Dein Abschnitt</span>
        <span className="abriss-nr">{nummer}</span>
      </div>
      <Stempel drehung={-8} verzoegerung={0.9}>angenommen</Stempel>
      <p className="hand gross-hand">Danke, {daten.name.split(' ')[0] || 'Nachbar:in'}! Sonntag läutet's.</p>
      <dl className="abriss-daten">
        <dt>Wann</dt><dd>{datumLang(sonntag)}, ab {daten.zeit} Uhr</dd>
        <dt>Wohin</dt><dd>{daten.strasse} {daten.hausnummer}{daten.stock && `, ${daten.stock}`}</dd>
        <dt>Was</dt>
        <dd>
          {Object.entries(korb).map(([id, m]) => `${m}× ${PRODUKT_NACH_ID[id]?.name}`).join(', ')}
          {spende && ', +1 Sackerl spendiert'}
        </dd>
        <dt>Zahlen</dt><dd>{euro(gesamt)} · {daten.zahlung === 'karte' ? 'Karte an der Tür' : daten.zahlung === 'bar' ? 'bar an der Tür' : 'vorab überweisen'}</dd>
        {daten.abo && (<><dt>Abo</dt><dd>jeden Sonntag wieder</dd></>)}
      </dl>
      <ol className="abriss-ablauf">
        <li><strong>Fr 20 Uhr</strong> Zettel zu, wir kaufen ein</li>
        <li><strong>Sa</strong> Teig ruht über Nacht</li>
        <li><strong>So 4 Uhr</strong> Ofen an</li>
        <li><strong>So {daten.zeit}</strong> Radl läutet bei dir</li>
      </ol>
      <div className="abriss-aktionen">
        <a className="knopf" href={kalender(sonntag, daten.zeit, nummer)} download="radlbaeckerin.ics">In den Kalender</a>
        <button className="knopf leise" onClick={neu}>Neuen Zettel ausfüllen</button>
      </div>
      <Radl className="abriss-radl" fahrend />
      <p className="kleingedruckt">Mockup – es wurde nichts bestellt und nichts verschickt.</p>
    </motion.section>
  )
}
