import { ERFOLGE } from '../../engine/erfolge'
import { legende } from '../../engine/legende'
import { alleStats, gesamtStats } from '../../engine/statistik'
import type { Career } from '../../engine/types'
import { fmtGeld, saisonLabel } from '../../ui/format'

export function KarriereTab({ c }: { c: Career }) {
  const g = gesamtStats(c)
  const l = legende(c)
  const stats = alleStats(c).filter((s) => s.spiele > 0 || s.saison === c.uhr.saison)
  return (
    <>
      <section className="card">
        <h2>Karriere-Bilanz</h2>
        <div className="grid2">
          <div><span className="muted">Spiele</span><strong>{g.spiele}</strong></div>
          <div><span className="muted">Tore</span><strong>{g.tore}</strong></div>
          <div><span className="muted">Vorlagen</span><strong>{g.vorlagen}</strong></div>
          <div><span className="muted">Ø-Note</span><strong>{g.schnitt ? g.schnitt.toFixed(2).replace('.', ',') : '–'}</strong></div>
          <div><span className="muted">Länderspiele</span><strong>{c.laufbahn.laenderspiele} ({c.laufbahn.laenderspielTore} Tore)</strong></div>
          <div><span className="muted">Höchster Marktwert</span><strong>{fmtGeld(c.laufbahn.hoechsterMarktwert)}</strong></div>
        </div>
        <p className="muted">Ruhm: {l.punkte} Punkte, aktuell „{l.klasse}“.</p>
      </section>

      <section className="card">
        <h2>Titel &amp; Auszeichnungen</h2>
        {c.laufbahn.titel.length + c.laufbahn.auszeichnungen.length === 0 ? <p className="muted">Noch nichts im Schrank.</p> : (
          <ul className="plain">
            {[...c.laufbahn.titel, ...c.laufbahn.auszeichnungen].sort((a, b) => b.saison - a.saison).map((t, i) => (
              <li key={i}>🏆 {t.name} <span className="muted">({saisonLabel(t.saison)}, {t.verein})</span></li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Saisons</h2>
        <div className="table-scroll">
          <table className="tabelle">
            <thead><tr><th>Saison</th><th>Verein</th><th>Sp</th><th>T</th><th>V</th><th>Ø</th></tr></thead>
            <tbody>
              {[...stats].reverse().map((s, i) => (
                <tr key={i}>
                  <td>{saisonLabel(s.saison)}</td>
                  <td>{s.verein}</td>
                  <td>{s.spiele}</td><td>{s.tore}</td><td>{s.vorlagen}</td>
                  <td>{s.spiele ? (s.notenSumme / s.spiele).toFixed(1).replace('.', ',') : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {c.laufbahn.transfers.length > 0 && (
        <section className="card">
          <h2>Transfers</h2>
          <ul className="plain">
            {[...c.laufbahn.transfers].reverse().map((t, i) => (
              <li key={i}><span className="muted">{saisonLabel(t.saison)}:</span> {t.von} → {t.zu}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Erfolge ({c.erfolge.length}/{ERFOLGE.length})</h2>
        <ul className="plain erfolge">
          {ERFOLGE.map((e) => {
            const da = c.erfolge.includes(e.id)
            return (
              <li key={e.id} className={da ? '' : 'locked'}>
                <strong>{da ? '🏆' : '🔒'} {e.name}</strong>
                <span className="muted small">{e.text}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </>
  )
}
