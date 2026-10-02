import { SKILL_LABELS } from '../../engine/rating'
import type { Career } from '../../engine/types'
import { useCareer } from '../../store/careerStore'
import { fmtDelta, saisonLabel } from '../../ui/format'

export function SeasonEnd({ c }: { c: Career }) {
  const naechste = useCareer((s) => s.naechsteSaison)
  const beenden = useCareer((s) => s.beenden)
  const r = c.saisonBericht!
  const s = r.stats
  const alt = s.alter

  return (
    <>
      <section className="card">
        <h2>Saison {saisonLabel(s.saison)} beendet</h2>
        <p>
          {s.spiele} Spiele · {s.tore} Tore · {s.vorlagen} Vorlagen
          {s.spiele > 0 && <> · Ø-Note {(s.notenSumme / s.spiele).toFixed(1).replace('.', ',')}</>}
        </p>
        <p className="muted">{s.siege} S · {s.remis} U · {s.niederlagen} N · {s.gelb} Gelb · {s.rot} Rot</p>
        <p>Gesamtstärke: {Math.round(s.overallStart)} → <strong>{Math.round(s.overallEnde)}</strong></p>
      </section>

      <section className="card">
        <h2>Entwicklung</h2>
        <ul className="news">
          {r.deltas.map((d) => <li key={d.skill}>{SKILL_LABELS[d.skill]} {fmtDelta(d.delta)}</li>)}
        </ul>
        {r.hinweise.map((h, i) => <p key={i} className="muted">{h}</p>)}
      </section>

      <button className="btn primary" onClick={naechste}>Nächste Saison ({saisonLabel(s.saison + 1)})</button>
      {alt >= 30 && (
        <button className="btn danger" onClick={() => confirm('Karriere wirklich beenden?') && beenden()}>
          Karriere beenden
        </button>
      )}
    </>
  )
}
