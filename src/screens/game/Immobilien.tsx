import { IMMO_EIGENKAPITAL, IMMO_KAUFNEBENKOSTEN, IMMO_LAGEN, IMMO_TYPEN, IMMO_VERKAUFSKOSTEN } from '../../data/immobilien'
import {
  hatWohnsitz, immoAktiv, immoKaufPruefung, immoName, immoNettoErloes, immoNettoWoche, immoSchulden, immoWert, immobilienVon, kreditRahmen, sanierungKosten, sanierungMoeglich,
} from '../../engine/immobilien'
import type { Career, Immobilie } from '../../engine/types'
import { useCareer } from '../../store/careerStore'
import { fmtEuro, fmtKonto } from '../../ui/format'

const proz = (n: number) => `${(n * 100).toFixed(1).replace('.', ',')} %`

function Objekt({ c, i }: { c: Career; i: Immobilie }) {
  const verkaufen = useCareer((s) => s.immoVerkaufen)
  const tilgen = useCareer((s) => s.immoTilgen)
  const sanieren = useCareer((s) => s.immoSanieren)
  const t = IMMO_TYPEN[i.typ]
  const gewinn = i.wert - i.kaufpreis
  const netto = Math.round((i.miete * t.auslastung - i.wert * t.nebenkosten - i.kredit * i.zins) / 52)
  return (
    <section className="card">
      <div className="row">
        <h2 className="grow">{t.icon} {immoName(i)}</h2>
        <span className="risk">{IMMO_LAGEN[i.lage].name}</span>
      </div>
      <div className="grid2">
        <div><span className="muted">Marktwert</span><strong>{fmtKonto(i.wert)}</strong></div>
        <div>
          <span className="muted">Wertentwicklung</span>
          <strong className={gewinn < 0 ? 'neg' : 'pos'}>{gewinn >= 0 ? '+' : '−'}{fmtKonto(Math.abs(gewinn))}</strong>
        </div>
        {i.miete > 0 && <div><span className="muted">Miete</span><strong>{fmtEuro(Math.round((i.miete * t.auslastung) / 12))} / Monat</strong></div>}
        {i.kredit > 0 && <div><span className="muted">Restschuld</span><strong className="neg">{fmtKonto(i.kredit)}</strong></div>}
        <div><span className="muted">Pro Woche (nach Kosten{i.kredit > 0 ? ' und Zinsen' : ''})</span><strong className={netto < 0 ? 'neg' : ''}>{netto >= 0 ? '+' : '−'}{fmtEuro(Math.abs(netto))}</strong></div>
        <div><span className="muted">Verkaufserlös (nach Kosten)</span><strong>{fmtKonto(immoNettoErloes(i))}</strong></div>
      </div>
      <div className="row split">
        {i.kredit > 0 && <button className="btn small-text" disabled={c.spieler.geld < 1} onClick={() => tilgen(i.id)}>Kredit tilgen (Konto)</button>}
        {i.typ !== 'bauland' && (
          <button className="btn small-text" disabled={!sanierungMoeglich(c, i)} onClick={() => sanieren(i.id)}>
            Modernisieren ({fmtKonto(sanierungKosten(i))})
          </button>
        )}
        <button className="btn small-text" onClick={() => confirm(`${immoName(i)} verkaufen? Du bekommst ${fmtKonto(immoNettoErloes(i))} nach Kosten (${proz(IMMO_VERKAUFSKOSTEN)}) und Kredit.`) && verkaufen(i.id)}>Verkaufen</button>
      </div>
    </section>
  )
}

export function Immobilien({ c }: { c: Career }) {
  const kaufen = useCareer((s) => s.immoKaufen)
  const aktiv = immoAktiv(c)
  const verkauft = immobilienVon(c).filter((i) => i.status === 'verkauft').slice(-3).reverse()
  const wochenNetto = Math.round(immoNettoWoche(c))
  return (
    <>
      <p className="muted small">Kaufen mit Eigenkapital oder per Kredit (20 % Eigenanteil, 3,8 % Zinsen). Dazu kommen {proz(IMMO_KAUFNEBENKOSTEN)} Kaufnebenkosten. Mieten laufen jede Woche ein, der Wert schwankt mit dem Markt.</p>

      {aktiv.length > 0 && (
        <section className="card">
          <h2>Dein Portfolio</h2>
          <div className="grid2">
            <div><span className="muted">Objekte</span><strong>{aktiv.length}</strong></div>
            <div><span className="muted">Gesamtwert</span><strong>{fmtKonto(immoWert(c))}</strong></div>
            <div><span className="muted">Kredite</span><strong>{immoSchulden(c) > 0 ? fmtKonto(immoSchulden(c)) : '–'}</strong></div>
            <div><span className="muted">Cashflow pro Woche</span><strong className={wochenNetto < 0 ? 'neg' : 'pos'}>{wochenNetto >= 0 ? '+' : '−'}{fmtEuro(Math.abs(wochenNetto))}</strong></div>
          </div>
        </section>
      )}

      {aktiv.map((i) => <Objekt key={i.id} c={c} i={i} />)}

      <h2 className="section">Marktangebote</h2>
      <p className="muted small">Die Angebote wechseln alle 26 Wochen. Kreditrahmen der Bank: {fmtKonto(kreditRahmen(c))}.</p>
      {(c.immoAngebote ?? []).map((a) => {
        const t = IMMO_TYPEN[a.typ]
        const bar = immoKaufPruefung(c, a, false)
        const fin = immoKaufPruefung(c, a, true)
        const rendite = a.miete > 0 ? a.miete / a.preis : 0
        return (
          <section key={a.id} className={`card${bar && fin ? ' gesperrt' : ''}`}>
            <div className="row">
              <h2 className="grow">{t.icon} {t.name}</h2>
              <span className="risk">{IMMO_LAGEN[a.lage].name}</span>
            </div>
            <p className="muted small">{a.stadt} · {t.text}</p>
            <div className="grid2">
              <div><span className="muted">Kaufpreis</span><strong>{fmtKonto(a.preis)}</strong></div>
              <div><span className="muted">Miete</span><strong>{a.miete > 0 ? `${fmtEuro(Math.round(a.miete / 12))} / Monat (${proz(rendite)})` : t.wohnsitz ? 'Du wohnst selbst darin' : '–'}</strong></div>
              <div><span className="muted">Wertsteigerung (Ø)</span><strong>{proz(a.mu)} / Jahr</strong></div>
              <div><span className="muted">Eigenkapital bei Kredit</span><strong>{fmtKonto(a.preis * (IMMO_EIGENKAPITAL + IMMO_KAUFNEBENKOSTEN))}</strong></div>
            </div>
            {t.wohnsitz && <p className="muted small hinweis">Mehr Privatglück jede Woche{t.prestige ? ' und Prestige' : ''}, keine Mietkosten mehr.</p>}
            <div className="row split">
              <button className="btn small-text" disabled={bar !== null} onClick={() => kaufen(a.id, false)}>Bar kaufen</button>
              <button className="btn small-text" disabled={fin !== null} onClick={() => kaufen(a.id, true)}>Mit Kredit kaufen</button>
            </div>
            {bar && fin && <p className="muted small hinweis">{bar}</p>}
          </section>
        )
      })}
      {(c.immoAngebote ?? []).length === 0 && <p className="muted small">Gerade keine Angebote. In der nächsten Woche gibt es neue.</p>}
      {hatWohnsitz(c) && <p className="muted small">Du wohnst bereits in einem eigenen Zuhause. Ein zweites ist erst nach dem Verkauf möglich.</p>}

      {verkauft.length > 0 && (
        <section className="card">
          <h2>Verkauft</h2>
          <ul className="plain">
            {verkauft.map((i) => <li key={i.id}>{IMMO_TYPEN[i.typ].icon} {immoName(i)}: <span className={i.wert >= i.kaufpreis ? 'pos' : 'neg'}>{fmtKonto(i.wert)}</span> <span className="muted">(Kauf {fmtKonto(i.kaufpreis)})</span></li>)}
          </ul>
        </section>
      )}
    </>
  )
}
