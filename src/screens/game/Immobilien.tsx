import { useState } from 'react'
import { IMMO_EIGENKAPITAL, IMMO_KAUFNEBENKOSTEN, IMMO_LAGEN, IMMO_TILGUNG, IMMO_TYPEN, IMMO_VERKAUFSKOSTEN, IMMO_ZINS } from '../../data/immobilien'
import { exposeVon, type Expose, type ExposeQuelle } from '../../engine/expose'
import {
  hatWohnsitz, immoAktiv, immoKaufPruefung, immoName, immoNettoErloes, immoNettoWoche, immoSchulden, immoWert, immobilienVon, kreditRahmen, sanierungKosten, sanierungMoeglich,
} from '../../engine/immobilien'
import type { Career, ImmoAngebot, Immobilie } from '../../engine/types'
import { useCareer } from '../../store/careerStore'
import { fmtEuro, fmtKonto } from '../../ui/format'
import { ExposeDetail, ExposeHero, Fakten, type FinanzZeile } from './Expose'

const proz = (n: number) => `${(n * 100).toFixed(1).replace('.', ',')} %`

/** Exposé-Daten eines Marktangebots. */
const quelleAngebot = (a: ImmoAngebot): ExposeQuelle => ({ id: a.id, typ: a.typ, lage: a.lage, stadt: a.stadt, preis: a.preis })
/** Exposé-Daten eines gekauften Objekts (gleiche ID wie das Angebot, daher gleiches Aussehen). */
const quelleObjekt = (i: Immobilie): ExposeQuelle => ({ id: i.id, typ: i.typ, lage: i.lage, stadt: i.stadt, preis: i.kaufpreis, saniert: i.saniert > 0 })

type Offen = { art: 'markt' | 'eigen'; id: string } | null

function Objekt({ c, i, oeffne }: { c: Career; i: Immobilie; oeffne: () => void }) {
  const verkaufen = useCareer((s) => s.immoVerkaufen)
  const tilgen = useCareer((s) => s.immoTilgen)
  const sanieren = useCareer((s) => s.immoSanieren)
  const t = IMMO_TYPEN[i.typ]
  const q = quelleObjekt(i)
  const e = exposeVon(q)
  const gewinn = i.wert - i.kaufpreis
  const netto = Math.round((i.miete * t.auslastung - i.wert * t.nebenkosten - i.kredit * i.zins) / 52)
  return (
    <section className="card expose-karte">
      <ExposeHero q={q} e={e} onOpen={oeffne} klein />
      <div className="row">
        <h2 className="grow">{t.icon} {immoName(i)}</h2>
        <span className="risk">{IMMO_LAGEN[i.lage].name}</span>
      </div>
      <Fakten q={q} e={e} />
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
        <button className="btn small-text" onClick={oeffne}>Exposé ansehen</button>
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

/** Zeilen der Preisbox eines Angebots: Kaufpreis, Nebenkosten, Finanzierung und Ertrag. */
function finanzAngebot(c: Career, a: ImmoAngebot): FinanzZeile[] {
  const t = IMMO_TYPEN[a.typ]
  const kredit = a.preis * (1 - IMMO_EIGENKAPITAL)
  const rate = (kredit * (IMMO_ZINS + IMMO_TILGUNG)) / 12
  const zeilen: FinanzZeile[] = [
    { label: 'Kaufpreis', wert: fmtKonto(a.preis) },
    { label: `Kaufnebenkosten (${proz(IMMO_KAUFNEBENKOSTEN)})`, wert: fmtKonto(a.preis * IMMO_KAUFNEBENKOSTEN) },
    { label: 'Gesamtkosten bei Barkauf', wert: fmtKonto(a.preis * (1 + IMMO_KAUFNEBENKOSTEN)) },
    { label: `Eigenkapital bei Kredit (${proz(IMMO_EIGENKAPITAL)} + Nebenkosten)`, wert: fmtKonto(a.preis * (IMMO_EIGENKAPITAL + IMMO_KAUFNEBENKOSTEN)) },
    { label: `Kredit (${proz(IMMO_ZINS)} Zinsen, ${proz(IMMO_TILGUNG)} Tilgung)`, wert: fmtKonto(kredit) },
    { label: 'Monatliche Rate (Anfang)', wert: fmtEuro(Math.round(rate)) },
    { label: 'Kreditrahmen der Bank', wert: fmtKonto(kreditRahmen(c)) },
  ]
  if (a.miete > 0) {
    zeilen.push({ label: 'Miete', wert: `${fmtEuro(Math.round((a.miete * t.auslastung) / 12))} / Monat` })
    zeilen.push({ label: 'Mietrendite (brutto)', wert: proz(a.miete / a.preis), ton: 'pos' })
  } else if (t.wohnsitz) zeilen.push({ label: 'Nutzung', wert: 'Du wohnst selbst darin' })
  zeilen.push({ label: 'Nebenkosten und Instandhaltung', wert: `${fmtEuro(Math.round(a.preis * t.nebenkosten))} / Jahr` })
  zeilen.push({ label: 'Wertsteigerung (Ø)', wert: `${proz(a.mu)} / Jahr`, ton: a.mu >= 0 ? 'pos' : 'neg' })
  return zeilen
}

function finanzObjekt(i: Immobilie): FinanzZeile[] {
  const t = IMMO_TYPEN[i.typ]
  const gewinn = i.wert - i.kaufpreis
  const zeilen: FinanzZeile[] = [
    { label: 'Kaufpreis', wert: fmtKonto(i.kaufpreis) },
    { label: 'Aktueller Marktwert', wert: fmtKonto(i.wert) },
    { label: 'Wertentwicklung', wert: `${gewinn >= 0 ? '+' : '−'}${fmtKonto(Math.abs(gewinn))}`, ton: gewinn < 0 ? 'neg' : 'pos' },
  ]
  if (i.kredit > 0) zeilen.push({ label: 'Restschuld', wert: fmtKonto(i.kredit), ton: 'neg' })
  if (i.miete > 0) zeilen.push({ label: 'Miete', wert: `${fmtEuro(Math.round((i.miete * t.auslastung) / 12))} / Monat` })
  zeilen.push({ label: 'Verkaufserlös (nach Kosten)', wert: fmtKonto(immoNettoErloes(i)) })
  return zeilen
}

export function Immobilien({ c }: { c: Career }) {
  const kaufen = useCareer((s) => s.immoKaufen)
  const verkaufen = useCareer((s) => s.immoVerkaufen)
  const tilgen = useCareer((s) => s.immoTilgen)
  const sanieren = useCareer((s) => s.immoSanieren)
  const [offen, setOffen] = useState<Offen>(null)
  const aktiv = immoAktiv(c)
  const verkauft = immobilienVon(c).filter((i) => i.status === 'verkauft').slice(-3).reverse()
  const wochenNetto = Math.round(immoNettoWoche(c))
  const angebote = c.immoAngebote ?? []

  // Exposé-Ansicht, falls ein Objekt geöffnet ist (verschwindet das Objekt, schließt sie sich von selbst)
  let detail = null
  if (offen?.art === 'markt') {
    const a = angebote.find((x) => x.id === offen.id)
    if (a) {
      const bar = immoKaufPruefung(c, a, false)
      const fin = immoKaufPruefung(c, a, true)
      detail = (
        <ExposeDetail
          q={quelleAngebot(a)} e={exposeVon(quelleAngebot(a))} finanz={finanzAngebot(c, a)} zurueck={() => setOffen(null)}
          hinweis={bar && fin ? <p className="muted small hinweis">{bar}</p> : undefined}
          aktionen={(
            <>
              <button className="btn primary" disabled={bar !== null} onClick={() => { kaufen(a.id, false); setOffen(null) }}>Bar kaufen</button>
              <button className="btn" disabled={fin !== null} onClick={() => { kaufen(a.id, true); setOffen(null) }}>Mit Kredit kaufen</button>
            </>
          )}
        />
      )
    }
  } else if (offen?.art === 'eigen') {
    const i = aktiv.find((x) => x.id === offen.id)
    if (i) {
      detail = (
        <ExposeDetail
          q={quelleObjekt(i)} e={exposeVon(quelleObjekt(i))} finanz={finanzObjekt(i)} zurueck={() => setOffen(null)}
          aktionen={(
            <>
              {i.kredit > 0 && <button className="btn small-text" disabled={c.spieler.geld < 1} onClick={() => tilgen(i.id)}>Kredit tilgen</button>}
              {i.typ !== 'bauland' && <button className="btn small-text" disabled={!sanierungMoeglich(c, i)} onClick={() => sanieren(i.id)}>Modernisieren</button>}
              <button className="btn small-text" onClick={() => { if (confirm(`${immoName(i)} verkaufen? Du bekommst ${fmtKonto(immoNettoErloes(i))} nach Kosten (${proz(IMMO_VERKAUFSKOSTEN)}) und Kredit.`)) { verkaufen(i.id); setOffen(null) } }}>Verkaufen</button>
            </>
          )}
        />
      )
    }
  }

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

      {aktiv.map((i) => <Objekt key={i.id} c={c} i={i} oeffne={() => setOffen({ art: 'eigen', id: i.id })} />)}

      <h2 className="section">Marktangebote</h2>
      <p className="muted small">Die Angebote wechseln alle 26 Wochen. Kreditrahmen der Bank: {fmtKonto(kreditRahmen(c))}.</p>
      {angebote.map((a) => {
        const t = IMMO_TYPEN[a.typ]
        const q = quelleAngebot(a)
        const e: Expose = exposeVon(q)
        const bar = immoKaufPruefung(c, a, false)
        const fin = immoKaufPruefung(c, a, true)
        const rendite = a.miete > 0 ? a.miete / a.preis : 0
        return (
          <section key={a.id} className={`card expose-karte${bar && fin ? ' gesperrt' : ''}`}>
            <ExposeHero q={q} e={e} onOpen={() => setOffen({ art: 'markt', id: a.id })} />
            <div>
              <p className="kategorie">{t.icon} {t.name} · {a.stadt} · {IMMO_LAGEN[a.lage].name}</p>
              <h3>{e.titel}</h3>
            </div>
            <Fakten q={q} e={e} />
            <div className="expose-zeile"><span className="muted">{fmtEuro(e.preisProQm)} pro m²</span><span>{a.miete > 0 ? `Rendite ${proz(rendite)}` : t.wohnsitz ? 'Zum Selbstwohnen' : 'Wertanlage'}</span></div>
            {t.wohnsitz && <p className="muted small hinweis">Mehr Privatglück jede Woche{t.prestige ? ' und Prestige' : ''}, keine Mietkosten mehr.</p>}
            <div className="row split">
              <button className="btn small-text" onClick={() => setOffen({ art: 'markt', id: a.id })}>Exposé ansehen</button>
              <button className="btn small-text" disabled={bar !== null} onClick={() => kaufen(a.id, false)}>Bar kaufen</button>
              <button className="btn small-text" disabled={fin !== null} onClick={() => kaufen(a.id, true)}>Mit Kredit kaufen</button>
            </div>
            {bar && fin && <p className="muted small hinweis">{bar}</p>}
          </section>
        )
      })}
      {angebote.length === 0 && <p className="muted small">Gerade keine Angebote. In der nächsten Woche gibt es neue.</p>}
      {hatWohnsitz(c) && <p className="muted small">Du wohnst bereits in einem eigenen Zuhause. Ein zweites ist erst nach dem Verkauf möglich.</p>}

      {verkauft.length > 0 && (
        <section className="card">
          <h2>Verkauft</h2>
          <ul className="plain">
            {verkauft.map((i) => <li key={i.id}>{IMMO_TYPEN[i.typ].icon} {immoName(i)}: <span className={i.wert >= i.kaufpreis ? 'pos' : 'neg'}>{fmtKonto(i.wert)}</span> <span className="muted">(Kauf {fmtKonto(i.kaufpreis)})</span></li>)}
          </ul>
        </section>
      )}
      {detail}
    </>
  )
}
