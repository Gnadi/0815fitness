import { useNavigate } from 'react-router-dom'
import { ERFOLGE } from '../../engine/erfolge'
import { legende } from '../../engine/legende'
import { alleStats, gesamtStats } from '../../engine/statistik'
import type { Career } from '../../engine/types'
import { useCareer } from '../../store/careerStore'
import { fmtGeld, saisonLabel } from '../../ui/format'

export function CareerEnd({ c }: { c: Career }) {
  const navigate = useNavigate()
  const close = useCareer((s) => s.close)
  const g = gesamtStats(c)
  const l = legende(c)
  const stats = alleStats(c)
  const erste = stats[0]?.saison ?? c.uhr.saison
  const letzte = stats[stats.length - 1]?.saison ?? c.uhr.saison
  const gebrochen = c.flags.ende === true

  return (
    <>
      <section className="card outcome">
        <p className="kategorie">{gebrochen ? 'Karriere beendet' : 'Karriereende'}</p>
        <h2>{c.spieler.vorname} {c.spieler.nachname}</h2>
        <p className="score">{l.klasse}</p>
        <p className="muted">{l.beschreibung}</p>
        <p>{l.punkte} Ruhm-Punkte</p>
      </section>

      <section className="card">
        <h2>Die Zahlen</h2>
        <div className="grid2">
          <div><span className="muted">Zeitraum</span><strong>{saisonLabel(erste)} – {saisonLabel(letzte)}</strong></div>
          <div><span className="muted">Spiele</span><strong>{g.spiele}</strong></div>
          <div><span className="muted">Tore</span><strong>{g.tore}</strong></div>
          <div><span className="muted">Vorlagen</span><strong>{g.vorlagen}</strong></div>
          <div><span className="muted">Länderspiele</span><strong>{c.laufbahn.laenderspiele} ({c.laufbahn.laenderspielTore} Tore)</strong></div>
          <div><span className="muted">Vereine</span><strong>{g.vereine}</strong></div>
          <div><span className="muted">Vermögen</span><strong>{fmtGeld(c.spieler.geld)}</strong></div>
          <div><span className="muted">Max. Marktwert</span><strong>{fmtGeld(c.laufbahn.hoechsterMarktwert)}</strong></div>
        </div>
      </section>

      <section className="card">
        <h2>Titel &amp; Ehrungen</h2>
        {c.laufbahn.titel.length + c.laufbahn.auszeichnungen.length === 0 ? <p className="muted">Keine. Aber du hast gespielt!</p> : (
          <ul className="plain">
            {[...c.laufbahn.titel, ...c.laufbahn.auszeichnungen].sort((a, b) => a.saison - b.saison).map((t, i) => (
              <li key={i}>🏆 {t.name} <span className="muted">({saisonLabel(t.saison)}, {t.verein})</span></li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Erfolge ({c.erfolge.length}/{ERFOLGE.length})</h2>
        <p className="muted">{ERFOLGE.filter((e) => c.erfolge.includes(e.id)).map((e) => e.name).join(' · ') || 'Keine'}</p>
      </section>

      <button className="btn primary" onClick={() => { close(); navigate('/neu') }}>Neue Karriere starten</button>
      <button className="btn" onClick={() => { close(); navigate('/') }}>Zum Hauptmenü</button>
    </>
  )
}
