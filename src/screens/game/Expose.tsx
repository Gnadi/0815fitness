import { lazy, Suspense, useRef, useState, type ReactNode } from 'react'
import { IMMO_LAGEN, IMMO_TYPEN } from '../../data/immobilien'
import type { Expose, ExposeQuelle } from '../../engine/expose'
import { fmtEuro, fmtKonto } from '../../ui/format'
import { Energieskala } from '../../ui/immo/Energieskala'
import { Grundriss, hatObergeschoss } from '../../ui/immo/Grundriss'
import { KARTEN_LEGENDE, Lagekarte } from '../../ui/immo/Lagekarte'
import { Szene } from '../../ui/immo/Szene'

/** Der 3D-Viewer (Three.js) wird erst beim ersten Öffnen nachgeladen. */
const Villa3D = lazy(() => import('../../ui/immo/villa3d/Villa3DViewer'))

const fl = (n: number): string => `${n.toLocaleString('de-DE')} m²`

/** Alle Bilder eines Exposés: Außenansicht, Grundriss (ggf. Obergeschoss) und Lage. */
function bilder(q: ExposeQuelle, e: Expose): { label: string; node: ReactNode }[] {
  const liste: { label: string; node: ReactNode }[] = [
    { label: 'Außenansicht', node: <Szene typ={q.typ} lage={q.lage} seed={e.seed} titel={e.titel} /> },
    { label: q.typ === 'bauland' ? 'Lageplan' : 'Grundriss', node: <Grundriss typ={q.typ} e={e} /> },
  ]
  if (hatObergeschoss(q.typ, e)) liste.push({ label: 'Obergeschoss', node: <Grundriss typ={q.typ} e={e} ebene="OG" /> })
  liste.push({ label: 'Lage', node: <Lagekarte lage={q.lage} e={e} stadt={q.stadt} /> })
  return liste
}

/** Kurzfakten in einer Zeile: Fläche, Zimmer, Baujahr, Energieklasse. */
export function Fakten({ q, e }: { q: ExposeQuelle; e: Expose }) {
  const t = IMMO_TYPEN[q.typ]
  return (
    <ul className="expose-fakten">
      <li><strong>{fl(e.flaeche)}</strong><span>{q.typ === 'bauland' ? 'Grundstück' : q.typ === 'gewerbe' ? 'Nutzfläche' : 'Wohnfläche'}</span></li>
      {e.zimmer > 0 && <li><strong>{e.zimmer}</strong><span>{e.einheitenName}</span></li>}
      {e.baujahr !== null && <li><strong>{e.baujahr}</strong><span>Baujahr</span></li>}
      {e.energie && <li><strong className={`klasse k${e.energie.replace('+', 'p')}`}>{e.energie}</strong><span>Energie</span></li>}
      {q.typ === 'bauland' && <li><strong>{t.wohnsitz ? '' : 'baureif'}</strong><span>Status</span></li>}
    </ul>
  )
}

/** Titelbild mit Abzeichen und Preis, das beim Antippen das Exposé öffnet. */
export function ExposeHero({ q, e, onOpen, klein = false }: { q: ExposeQuelle; e: Expose; onOpen: () => void; klein?: boolean }) {
  return (
    <button type="button" className={`expose-hero${klein ? ' klein' : ''}`} onClick={onOpen} aria-label={`Exposé öffnen: ${e.titel}`}>
      <Szene typ={q.typ} lage={q.lage} seed={e.seed} titel={e.titel} />
      <span className="expose-badges">{e.badges.slice(0, klein ? 1 : 2).map((b) => <span key={b} className={`badge${b === 'Exklusiv' ? ' gold' : ''}`}>{b}</span>)}</span>
      <span className="expose-preis">{fmtKonto(q.preis)}</span>
      <span className="expose-count">📷 {bilder(q, e).length}</span>
    </button>
  )
}

/** Wischbare Galerie mit Zähler und Beschriftung. */
function Galerie({ q, e, drei }: { q: ExposeQuelle; e: Expose; drei?: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  const liste = bilder(q, e)
  return (
    <div className="gal-box">
      <div
        className="gal"
        ref={ref}
        onScroll={() => {
          const el = ref.current
          if (el) setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
        }}
      >
        {liste.map((b) => <div key={b.label} className="gal-slide">{b.node}</div>)}
      </div>
      {drei && idx === 0 && <button type="button" className="gal-3d" onClick={drei}>🧊 3D-Ansicht</button>}
      <span className="gal-label">{liste[Math.min(idx, liste.length - 1)].label}</span>
      <span className="gal-zaehler">{Math.min(idx, liste.length - 1) + 1} / {liste.length}</span>
      <span className="expose-badges">{e.badges.slice(0, 3).map((b) => <span key={b} className={`badge${b === 'Exklusiv' ? ' gold' : ''}`}>{b}</span>)}</span>
      <div className="gal-punkte" aria-hidden="true">
        {liste.map((b, i) => <i key={b.label} className={i === idx ? 'on' : ''} />)}
      </div>
    </div>
  )
}

export interface FinanzZeile {
  label: string
  wert: string
  ton?: 'pos' | 'neg'
}

/** Vollständiges Exposé wie in einem Immobilienportal. */
export function ExposeDetail({ q, e, finanz, aktionen, hinweis, zurueck }: {
  q: ExposeQuelle
  e: Expose
  finanz: FinanzZeile[]
  aktionen: ReactNode
  hinweis?: ReactNode
  zurueck: () => void
}) {
  const t = IMMO_TYPEN[q.typ]
  const l = IMMO_LAGEN[q.lage]
  const [dreiD, setDreiD] = useState(false)
  const nutz = q.typ === 'gewerbe' ? 'Nutzfläche' : q.typ === 'bauland' ? 'Grundstücksfläche' : 'Wohnfläche'
  const zeilen: [string, string][] = [
    ['Objektart', t.name],
    [nutz, fl(e.flaeche)],
    ...(e.zimmer > 0 ? [[e.einheitenName, String(e.zimmer)] as [string, string]] : []),
    ...(q.typ !== 'bauland' && e.grundstueck > 0 && q.typ !== 'apartment' && q.typ !== 'wohnung' ? [['Grundstück', fl(e.grundstueck)] as [string, string]] : []),
    ...(e.baujahr !== null ? [['Baujahr', String(e.baujahr)] as [string, string]] : []),
    ['Geschoss', e.geschoss],
    ['Preis pro m²', fmtEuro(e.preisProQm)],
    ['Lage', l.name],
  ]
  return (
    <div className="expose-overlay" role="dialog" aria-modal="true" aria-label={`Exposé: ${e.titel}`}>
      <div className="expose-inner">
        <header className="expose-kopf">
          <button type="button" className="btn small-text" onClick={zurueck}>← Zurück</button>
          <span className="muted small">Exposé · {q.stadt}</span>
        </header>

        <Galerie q={q} e={e} drei={q.typ === 'villa' ? () => setDreiD(true) : undefined} />

        <section className="expose-titel">
          <p className="kategorie">{t.icon} {t.name} · {q.stadt}</p>
          <h1>{e.titel}</h1>
          <p className="expose-preis-gross">{fmtKonto(q.preis)}</p>
          <p className="muted small">{fmtEuro(e.preisProQm)} pro m²{q.typ !== 'bauland' ? '' : ' Grundstück'} · Käuferprovision {e.badges.includes('Provisionsfrei') ? 'entfällt' : 'in den Nebenkosten enthalten'}</p>
        </section>

        <Fakten q={q} e={e} />

        <section className="card">
          <h2>Preis und Finanzierung</h2>
          <dl className="eckdaten">
            {finanz.map((z) => <div key={z.label}><dt>{z.label}</dt><dd className={z.ton}>{z.wert}</dd></div>)}
          </dl>
          {hinweis}
        </section>

        <section className="card">
          <h2>Eckdaten</h2>
          <dl className="eckdaten">
            {zeilen.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </section>

        {e.energie && (
          <section className="card">
            <h2>Energieeffizienz</h2>
            <Energieskala klasse={e.energie} kwh={e.energieKwh} />
          </section>
        )}

        <section className="card">
          <h2>Ausstattung</h2>
          <div className="chips">{e.ausstattung.map((a) => <span key={a} className="chip">{a}</span>)}</div>
        </section>

        <section className="card">
          <h2>Objektbeschreibung</h2>
          <p className="expose-text">{e.beschreibung}</p>
        </section>

        <section className="card">
          <h2>Lage</h2>
          <p className="expose-text">{e.lageText}</p>
          <ul className="legende-karte">
            {KARTEN_LEGENDE.map((k) => (
              <li key={k.t}><i style={{ background: k.c }}>{k.t}</i><span>{k.name}</span><strong>{e.lageDaten[k.key]}</strong></li>
            ))}
          </ul>
        </section>

        <section className="card makler">
          <div className="avatar" aria-hidden="true">{e.makler.initialen}</div>
          <div>
            <p className="muted small">Ihr Ansprechpartner</p>
            <strong>{e.makler.name}</strong>
            <p className="muted small">{e.makler.firma}</p>
          </div>
        </section>
        <p className="muted small expose-fuss">Alle Angaben ohne Gewähr. Objekt-ID {q.id.toUpperCase()}.</p>
      </div>
      {dreiD && (
        <Suspense fallback={<div className="viewer3d"><p className="viewer3d-fehler">3D wird geladen …</p></div>}>
          <Villa3D seed={e.seed} lage={q.lage} flaeche={e.flaeche} titel={e.titel} onClose={() => setDreiD(false)} />
        </Suspense>
      )}
      <div className="expose-aktionen"><div className="expose-aktionen-inner">{aktionen}</div></div>
    </div>
  )
}
