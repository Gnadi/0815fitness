import { SKILL_LABELS } from '../../engine/rating'
import type { Career } from '../../engine/types'
import { useCareer } from '../../store/careerStore'
import { fmtDelta, fmtGeld, fmtNote } from '../../ui/format'

export function Report({ c }: { c: Career }) {
  const weiter = useCareer((s) => s.weiter)
  const b = c.bericht!
  const e = b.ergebnis
  const einsatzText = { startelf: 'Startelf', einwechslung: 'Eingewechselt', 'nicht-eingesetzt': 'Nicht eingesetzt' } as const

  return (
    <>
      {e && (
        <section className="card result">
          <p className="muted">{e.label} · {e.heim ? 'Heim' : 'Auswärts'} · {einsatzText[e.einsatz]}</p>
          <p className="score">{e.heim ? `${e.tore} : ${e.gegentore}` : `${e.gegentore} : ${e.tore}`}</p>
          <p>{e.heim ? `Dein Team – ${e.gegner}` : `${e.gegner} – Dein Team`}</p>
          {e.elfmeter && <p className="muted">Nach Elfmeterschießen: {e.elfmeter === 'gewonnen' ? 'Weiter!' : 'Aus.'}</p>}
          {e.note !== null && (
            <p>
              Note <strong>{fmtNote(e.note)}</strong>
              {e.spielerTore > 0 && <> · ⚽ {e.spielerTore}</>}
              {e.vorlagen > 0 && <> · 🅰️ {e.vorlagen}</>}
              {e.gelb && <> · 🟨</>}
              {e.rot && <> · 🟥</>}
            </p>
          )}
        </section>
      )}

      {b.schlagzeile && <p className="headline">📰 {b.schlagzeile}</p>}

      {b.szenenLog.length > 0 && (
        <section className="card">
          <h2>Schlüsselszenen</h2>
          <ul className="news">{b.szenenLog.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </section>
      )}

      <section className="card">
        <h2>{b.trainingText}</h2>
        {b.deltas.length > 0 ? (
          <ul className="news">
            {b.deltas.slice(0, 4).map((d) => (
              <li key={d.skill}>{SKILL_LABELS[d.skill]} {fmtDelta(d.delta)}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">Kein Skill-Zuwachs, dafür Erholung.</p>
        )}
        {b.einkommen !== 0 && <p className="muted small">Wochenverdienst (netto): {fmtGeld(b.einkommen)}</p>}
        {b.hinweise.map((h, i) => <p key={i} className={h.startsWith('🏆') ? 'achievement' : 'alert'}>{h}</p>)}
      </section>

      <button className="btn primary" onClick={weiter}>Weiter</button>
    </>
  )
}
