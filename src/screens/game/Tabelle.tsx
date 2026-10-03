import { Fragment } from 'react'
import { LAENDER, LIGEN, VEREINE } from '../../data/clubs'
import type { Career } from '../../engine/types'
import { rangliste } from '../../engine/welt'

/** Ligatabelle mit Hervorhebung des eigenen Vereins. `kompakt` zeigt nur Spitze, Umfeld des eigenen Vereins und Tabellenende. */
export function TabellenKarte({ c, kompakt = false }: { c: Career; kompakt?: boolean }) {
  const s = c.saison
  const rang = rangliste(s.tabelle, s.teams)
  const liga = LIGEN[s.ligaId]
  const eigen = rang.findIndex((r) => r.id === c.vereinId)
  const europa = LAENDER[liga.land].europa
  const europaPlaetze = europa[0] + europa[1] + europa[2]

  const sichtbar = (i: number) =>
    !(kompakt || rang.length > 20) ||
    i < (kompakt ? 3 : 5) ||
    i >= rang.length - (kompakt ? 2 : 5) ||
    Math.abs(i - eigen) <= (kompakt ? 2 : 3)

  return (
    <section className="card">
      <h2>{s.jugend ? 'U19-Liga' : liga.name}</h2>
      <p className="muted">
        {s.jugend ? 'Jugendliga mit Vereinsmannschaften (ohne Auf- und Abstieg). ' : ''}
        {eigen >= 0 ? `Dein Verein: Platz ${eigen + 1} von ${rang.length}.` : ''}
      </p>
      <div className="table-scroll">
        <table className="tabelle">
          <thead>
            <tr><th>#</th><th>Verein</th><th>Sp</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th>Pkt</th></tr>
          </thead>
          <tbody>
            {rang.map((r, i) => {
              if (!sichtbar(i)) return null
              const luecke = i > 0 && !sichtbar(i - 1) && sichtbar(i)
              const zone = !s.jugend && liga.ebene === 1 && i < europaPlaetze ? 'europa'
                : !s.jugend && liga.ab > 0 && i >= rang.length - liga.ab ? 'ab' : ''
              return (
                <Fragment key={r.id}>
                  {luecke && <tr className="luecke"><td colSpan={8}>…</td></tr>}
                  <tr className={`${r.id === c.vereinId ? 'me' : ''} ${zone}`}>
                    <td>{i + 1}</td>
                    <td>{VEREINE[r.id].name}</td>
                    <td>{r.zeile[0]}</td><td>{r.zeile[1]}</td><td>{r.zeile[2]}</td><td>{r.zeile[3]}</td>
                    <td>{r.zeile[4]}:{r.zeile[5]}</td>
                    <td><strong>{r.pkt}</strong></td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {!s.jugend && <p className="muted small">Grün: Europapokal · Rot: Abstieg</p>}
    </section>
  )
}
