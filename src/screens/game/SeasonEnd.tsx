import { SKILL_LABELS } from '../../engine/rating'
import type { Career } from '../../engine/types'
import { useCareer } from '../../store/careerStore'
import { fmtDelta, saisonLabel } from '../../ui/format'
import { alter } from '../../engine/rating'

export function SeasonEnd({ c }: { c: Career }) {
  const naechste = useCareer((s) => s.naechsteSaison)
  const beenden = useCareer((s) => s.beenden)
  const r = c.saisonBericht!
  const saison = r.stats[r.stats.length - 1].saison
  const sum = (f: (s: (typeof r.stats)[number]) => number) => r.stats.reduce((a, s) => a + f(s), 0)
  const spiele = sum((s) => s.spiele)
  const alt = alter(c.spieler.geburtsdatum, c.uhr.saison)
  const start = r.stats[0]
  const ende = r.stats[r.stats.length - 1]
  const eigeneId = c.vereinId
  const platz = r.tabelle.findIndex((t) => t.id === ende.vereinId) + 1

  return (
    <>
      <section className="card">
        <h2>Saison {saisonLabel(saison)} beendet</h2>
        <p>
          {spiele} Spiele · {sum((s) => s.tore)} Tore · {sum((s) => s.vorlagen)} Vorlagen
          {spiele > 0 && <> · Ø-Note {(sum((s) => s.notenSumme) / spiele).toFixed(1).replace('.', ',')}</>}
        </p>
        <p className="muted">{sum((s) => s.siege)} S · {sum((s) => s.remis)} U · {sum((s) => s.niederlagen)} N · {sum((s) => s.gelb)} Gelb · {sum((s) => s.rot)} Rot</p>
        <p>Gesamtstärke: {Math.round(start.overallStart)} → <strong>{Math.round(ende.overallEnde)}</strong></p>
        {platz > 0 && <p>Abschlussplatzierung {ende.verein}: <strong>Platz {platz}</strong> ({ende.liga})</p>}
      </section>

      {r.titel.length > 0 && (
        <section className="card outcome">
          <h2>Titel &amp; Ehrungen</h2>
          <ul className="plain">{r.titel.map((t, i) => <li key={i}>🏆 {t}</li>)}</ul>
        </section>
      )}

      {r.hinweise.length > 0 && (
        <section className="card">
          {r.hinweise.map((h, i) => <p key={i} className="muted">{h}</p>)}
        </section>
      )}

      <section className="card">
        <h2>Entwicklung</h2>
        <ul className="news">
          {r.deltas.map((d) => <li key={d.skill}>{SKILL_LABELS[d.skill]} {fmtDelta(d.delta)}</li>)}
        </ul>
      </section>

      <section className="card">
        <h2>Tabelle</h2>
        <div className="table-scroll">
          <table className="tabelle">
            <thead><tr><th>#</th><th>Verein</th><th>S</th><th>U</th><th>N</th><th>Tore</th></tr></thead>
            <tbody>
              {r.tabelle.slice(0, 6).map((t, i) => (
                <tr key={t.id} className={t.id === eigeneId ? 'me' : ''}>
                  <td>{i + 1}</td><td>{t.name}</td><td>{t.zeile[1]}</td><td>{t.zeile[2]}</td><td>{t.zeile[3]}</td><td>{t.zeile[4]}:{t.zeile[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <button className="btn primary" onClick={naechste}>Nächste Saison ({saisonLabel(saison + 1)})</button>
      {alt >= 30 && (
        <button className="btn danger" onClick={() => confirm('Karriere wirklich beenden?') && beenden()}>
          Karriere beenden
        </button>
      )}
    </>
  )
}
