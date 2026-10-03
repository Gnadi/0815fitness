import { ANLAGEN, ANLAGE_INFO, depotGesamt, depotVon, vermoegen } from '../../engine/finanzen'
import type { Anlage, Career } from '../../engine/types'
import { wochenEinkommen } from '../../engine/wirtschaft'
import { useCareer } from '../../store/careerStore'
import { fmtEuro, fmtKonto } from '../../ui/format'

const proz = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n * 100).toFixed(1).replace('.', ',')} %`

function Posten({ c, k }: { c: Career; k: Anlage }) {
  const einzahlen = useCareer((s) => s.einzahlen)
  const auszahlen = useCareer((s) => s.auszahlen)
  const p = depotVon(c)[k]
  const info = ANLAGE_INFO[k]
  const gewinn = p.wert - p.eingezahlt
  const rendite = p.eingezahlt > 0 ? gewinn / p.eingezahlt : 0
  const geld = Math.floor(c.spieler.geld)
  return (
    <section className="card">
      <div className="row">
        <h2 className="grow">{info.name}</h2>
        <span className={`risk ${info.risiko}`}>{info.risiko === 'sicher' ? 'Sicher' : info.risiko === 'mittel' ? 'Mittel' : 'Riskant'}</span>
      </div>
      <p className="muted small">{info.text}</p>
      <div className="grid2">
        <div><span className="muted">Wert</span><strong>{fmtKonto(p.wert)}</strong></div>
        <div>
          <span className="muted">Gewinn/Verlust</span>
          <strong className={gewinn < -1 ? 'neg' : gewinn > 1 ? 'pos' : ''}>
            {p.eingezahlt > 0 ? `${gewinn >= 0 ? '+' : '−'}${fmtKonto(Math.abs(gewinn))} (${proz(rendite)})` : '–'}
          </strong>
        </div>
      </div>
      <p className="muted small">Einzahlen (vom Konto)</p>
      <div className="row split three">
        {[0.1, 0.25, 0.5].map((a) => (
          <button key={a} className="btn small-text" disabled={geld * a < 1} onClick={() => einzahlen(k, a)}>{a * 100} %</button>
        ))}
      </div>
      <p className="muted small">Auszahlen (aufs Konto)</p>
      <div className="row split three">
        {[0.25, 0.5, 1].map((a) => (
          <button key={a} className="btn small-text" disabled={p.wert < 1} onClick={() => auszahlen(k, a)}>{a === 1 ? 'Alles' : `${a * 100} %`}</button>
        ))}
      </div>
    </section>
  )
}

export function FinanzenTab({ c }: { c: Career }) {
  const sparplan = useCareer((s) => s.sparplan)
  const miete = Number(c.flags.mieteinnahmen ?? 0)
  return (
    <>
      <section className="card">
        <h2>Vermögen</h2>
        <div className="grid2">
          <div><span className="muted">Kontostand</span><strong>{fmtKonto(c.spieler.geld)}</strong></div>
          <div><span className="muted">Depot</span><strong>{fmtKonto(depotGesamt(c))}</strong></div>
          <div><span className="muted">Gesamtvermögen</span><strong>{fmtKonto(vermoegen(c))}</strong></div>
          <div><span className="muted">Netto pro Woche</span><strong>{c.vertrag ? fmtEuro(wochenEinkommen(c)) : '–'}</strong></div>
          {miete > 0 && <div><span className="muted">Mieteinnahmen</span><strong>{fmtEuro(miete)} / Jahr</strong></div>}
          {c.flags.versicherung === true && <div><span className="muted">Versicherung</span><strong>Sportinvalidität ✓</strong></div>}
        </div>
      </section>

      <section className="card">
        <h2>Sparplan</h2>
        <label className="check">
          <input type="checkbox" checked={c.flags.sparplan === true} onChange={(e) => sparplan(e.target.checked)} />
          <span>30 % deines Wochenverdiensts automatisch in den Aktien-ETF investieren</span>
        </label>
      </section>

      {ANLAGEN.map((k) => <Posten key={k} c={c} k={k} />)}
      <p className="muted small">Kurse ändern sich jede Woche. Rendite und Risiko sind frei erfunden, aber realistisch angelehnt.</p>
    </>
  )
}
