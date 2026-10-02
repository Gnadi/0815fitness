import { useState } from 'react'
import { VEREINE } from '../../data/clubs'
import { FOCUS_LIST } from '../../engine/training'
import type { Career, TrainingFocus } from '../../engine/types'
import { useCareer } from '../../store/careerStore'
import { Status } from './Header'

/** Beschreibt, was in der aktuellen Woche ansteht. */
export function vorschau(c: Career): string {
  const slot = c.saison.kalender[c.uhr.woche - 1]
  if (!slot) return ''
  if (c.verletzung) return 'Du bist verletzt und machst Reha.'
  switch (slot.t) {
    case 'L': {
      const tag = c.saison.spielplan[slot.n - 1]
      const idx = c.saison.teams.indexOf(c.vereinId)
      const spiel = tag?.find(([h, a]) => h === idx || a === idx)
      if (!spiel) return `Spieltag ${slot.n}: spielfrei.`
      const heim = spiel[0] === idx
      const gegner = VEREINE[c.saison.teams[heim ? spiel[1] : spiel[0]]]?.name ?? '?'
      return `Spieltag ${slot.n}: ${heim ? 'Heimspiel' : 'Auswärtsspiel'} gegen ${gegner}${c.saison.jugend ? ' U19' : ''}.`
    }
    case 'P': return c.saison.pokal.status === 'aktiv' && c.saison.pokal.runde === slot.n ? 'Pokalspiel!' : 'Spielfreie Woche (Pokal).'
    case 'E': return c.saison.europa.wb ? 'Europapokal-Woche.' : 'Spielfreie Woche.'
    case 'T': return c.saison.turnier ? `${c.saison.turnier.name}: Spieltag mit der Nationalmannschaft.` : 'Spielfreie Woche.'
    case 'F': return slot.fenster === 'winter' ? 'Winterpause. Das Transferfenster ist offen.' : 'Sommerpause. Das Transferfenster ist offen.'
  }
}

export function Woche({ c, zuVertrag }: { c: Career; zuVertrag: () => void }) {
  const trainieren = useCareer((s) => s.trainieren)
  const simuliere = useCareer((s) => s.simuliere)
  const autoSzenen = useCareer((s) => s.autoSzenen)
  const [focus, setFocus] = useState<TrainingFocus>(c.training)
  const verletzt = c.verletzung !== null
  const s = c.saisonStats

  return (
    <>
      <Status c={c} />

      {c.fenster && (
        <button className="banner" onClick={zuVertrag}>
          🔁 Transferfenster offen · {c.angebote.length} Angebot{c.angebote.length === 1 ? '' : 'e'}
          {c.vertrag === null || (c.saison.jugend && c.fenster === 'sommer') ? ' · Vertrag nötig!' : ''}
        </button>
      )}

      <section className="card">
        <h2>Diese Woche</h2>
        <p className="muted">{vorschau(c)}</p>
        <div className="focus">
          {FOCUS_LIST.map((f) => (
            <label key={f.id} className={`choice card${focus === f.id && !verletzt ? ' on' : ''}${verletzt ? ' disabled' : ''}`}>
              <input type="radio" name="focus" disabled={verletzt} checked={focus === f.id} onChange={() => setFocus(f.id)} />
              <strong>{f.name}</strong>
            </label>
          ))}
        </div>
        <p className="muted">{verletzt ? 'Reha ersetzt dein Training, bis du wieder fit bist.' : FOCUS_LIST.find((f) => f.id === focus)?.beschreibung}</p>
        <button className="btn primary" onClick={() => trainieren(focus)}>
          {verletzt ? 'Reha machen' : 'Woche starten'}
        </button>
        <div className="row split">
          <button className="btn" onClick={() => simuliere(4)}>4 Wochen ⏩</button>
          <button className="btn" onClick={() => simuliere(12)}>12 Wochen ⏩</button>
        </div>
        <label className="check">
          <input type="checkbox" checked={c.einstellungen.autoSzenen} onChange={(e) => autoSzenen(e.target.checked)} />
          <span>Schlüsselszenen bei Simulation automatisch (sichere Option)</span>
        </label>
      </section>

      <section className="card">
        <h2>Bilanz {c.saisonStats.verein}</h2>
        <p>
          {s.spiele} Spiele ({s.startelf}× Startelf) · {s.tore} Tore · {s.vorlagen} Vorlagen
          {s.spiele > 0 && <> · Ø-Note {(s.notenSumme / s.spiele).toFixed(1).replace('.', ',')}</>}
        </p>
        <p className="muted">{s.siege} S · {s.remis} U · {s.niederlagen} N · {s.gelb} Gelb · {s.rot} Rot</p>
      </section>

      {c.log.length > 0 && (
        <section className="card">
          <h2>Schlagzeilen</h2>
          <ul className="news">
            {c.log.slice(-5).reverse().map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </section>
      )}
    </>
  )
}
