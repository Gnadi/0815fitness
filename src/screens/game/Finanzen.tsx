import { ANLAGEN, ANLAGE_INFO, PHASEN, sparplanProzent, beteiligungenVon, dealSterne, depotGesamt, depotVon, vcAktiv, vermoegen } from '../../engine/finanzen'
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

function VcBereich({ c }: { c: Career }) {
  const einsteigen = useCareer((s) => s.vcEinsteigen)
  const verkaufen = useCareer((s) => s.vcVerkaufen)
  const aufstocken = useCareer((s) => s.vcAufstocken)
  const aktiv = vcAktiv(c)
  const abgeschlossen = beteiligungenVon(c).filter((b) => b.status !== 'aktiv').slice(-5).reverse()
  const geld = Math.floor(c.spieler.geld)
  const deals = geld >= 5_000 ? (c.deals ?? []) : []
  const STATUS = { exit: 'Exit', pleite: 'Pleite', verkauft: 'Verkauft' } as const
  return (
    <>
      <h2 className="section">Start-ups (Venture Capital)</h2>
      <p className="muted small">Geld ist bis zum Exit gebunden. Verkaufen vorab geht nur mit 40 % Abschlag. Je später die Runde (Seed, Serie A, B, C), desto höher das Mindestticket, desto sicherer das Start-up – und desto kleiner der Hebel. Ab und zu musst du als Investor selbst entscheiden.</p>

      {aktiv.map((b) => (
        <section key={b.id} className="card">
          <div className="row">
            <h2 className="grow">{b.name}</h2>
            <span className="risk">{b.phase}</span>
          </div>
          <p className="muted small">{b.branche} · seit {Math.max(1, Math.round((c.wochenGesamt - b.seit) / 52))} Jahr(en) dabei</p>
          <div className="grid2">
            <div><span className="muted">Einsatz</span><strong>{fmtKonto(b.eingezahlt)}</strong></div>
            <div><span className="muted">Buchwert</span><strong className={b.wert >= b.eingezahlt ? 'pos' : 'neg'}>{fmtKonto(b.wert)} (×{(b.wert / b.eingezahlt).toFixed(2).replace('.', ',')})</strong></div>
          </div>
          <p className="muted small">Nachlegen vom Konto:</p>
          <div className="row split three">
            {[0.05, 0.1, 0.25].map((a) => (
              <button key={a} className="btn small-text" disabled={geld * a < 100} onClick={() => aufstocken(b.id, a)}>{a * 100} %</button>
            ))}
          </div>
          <button className="btn small-text" onClick={() => confirm(`${b.name} am Zweitmarkt für ${fmtKonto(b.wert * 0.6)} verkaufen?`) && verkaufen(b.id)}>Am Zweitmarkt verkaufen (−40 %)</button>
        </section>
      ))}

      {deals.length > 0 && <h2 className="section">Aktuelle Deals</h2>}
      {deals.map((d) => (
        <section key={d.id} className="card">
          <div className="row">
            <h2 className="grow">{d.name}</h2>
            <span className="risk">{d.phase ?? 'Seed'}</span>
            <span className="muted small" title="Scouting-Einschätzung des Teams">{dealSterne(d)}</span>
          </div>
          <p className="muted small">{d.branche} · Mindestticket {fmtKonto(PHASEN[d.phase ?? 'Seed'].minTicket)}</p>
          <p className="muted small">{PHASEN[d.phase ?? 'Seed'].info}</p>
          <p>{d.text}</p>
          <p className="muted small">Einsteigen mit … vom Konto</p>
          <div className="row split three">
            {[0.05, 0.1, 0.25, 0.5].map((a) => (
              <button key={a} className="btn small-text" disabled={geld * a < PHASEN[d.phase ?? 'Seed'].minTicket} onClick={() => einsteigen(d.id, a)}>{a * 100} %</button>
            ))}
          </div>
        </section>
      ))}
      {geld < 5_000 && aktiv.length === 0 && <p className="muted small">Ab 5.000 € auf dem Konto bekommst du Start-up-Deals angeboten.</p>}

      {abgeschlossen.length > 0 && (
        <section className="card">
          <h2>Bisherige Ergebnisse</h2>
          <ul className="plain">
            {abgeschlossen.map((b) => (
              <li key={b.id}>
                {b.status === 'pleite' ? '💥' : b.status === 'exit' ? '🤝' : '↩️'} {b.name} · {STATUS[b.status as keyof typeof STATUS]}:{' '}
                <span className={b.wert >= b.eingezahlt ? 'pos' : 'neg'}>{fmtKonto(b.wert)}</span>
                <span className="muted"> (Einsatz {fmtKonto(b.eingezahlt)})</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

export function FinanzenTab({ c }: { c: Career }) {
  const sparplan = useCareer((s) => s.sparplan)
  const setProzent = useCareer((s) => s.sparplanProzent)
  const prozent = sparplanProzent(c)
  const miete = Number(c.flags.mieteinnahmen ?? 0)
  return (
    <>
      <section className="card">
        <h2>Vermögen</h2>
        <div className="grid2">
          <div><span className="muted">Kontostand</span><strong>{fmtKonto(c.spieler.geld)}</strong></div>
          <div><span className="muted">Depot</span><strong>{fmtKonto(depotGesamt(c))}</strong></div>
          {vcAktiv(c).length > 0 && <div><span className="muted">Start-up-Beteiligungen</span><strong>{fmtKonto(vcAktiv(c).reduce((a, b) => a + b.wert, 0))}</strong></div>}
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
          <span>{prozent} % deines Wochenverdiensts automatisch in den Aktien-ETF investieren</span>
        </label>
        {c.flags.sparplan === true && (
          <>
            <input type="range" min={5} max={100} step={5} value={prozent} onChange={(e) => setProzent(Number(e.target.value))} aria-label="Sparrate in Prozent des Wochenverdiensts" />
            <div className="row split three">
              {[30, 50, 75, 100].map((p) => (
                <button key={p} className="btn small-text" disabled={p === prozent} onClick={() => setProzent(p)}>{p} %</button>
              ))}
            </div>
            {c.vertrag && <p className="muted small">Das sind aktuell ca. {fmtEuro((wochenEinkommen(c) * prozent) / 100)} pro Woche.</p>}
          </>
        )}
      </section>

      {ANLAGEN.map((k) => <Posten key={k} c={c} k={k} />)}
      <VcBereich c={c} />
      <p className="muted small">Kurse ändern sich jede Woche. Rendite und Risiko sind frei erfunden, aber realistisch angelehnt.</p>
    </>
  )
}
