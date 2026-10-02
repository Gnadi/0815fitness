import { useState } from 'react'
import { FOCUS_LIST } from '../../engine/training'
import { SPIELTAGE } from '../../engine/match'
import { SKILL_KEYS, SKILL_LABELS, alter } from '../../engine/rating'
import type { Career, TrainingFocus } from '../../engine/types'
import { useCareer } from '../../store/careerStore'
import { Status } from './Header'

export function Plan({ c }: { c: Career }) {
  const trainieren = useCareer((s) => s.trainieren)
  const beenden = useCareer((s) => s.beenden)
  const [focus, setFocus] = useState<TrainingFocus>(c.training)
  const verletzt = c.verletzung !== null
  const matchtag = c.uhr.woche <= SPIELTAGE
  const s = c.saisonStats
  const alt = alter(c.spieler.geburtsdatum, c.uhr.saison)

  return (
    <>
      <Status c={c} />

      <section className="card">
        <h2>Diese Woche</h2>
        <p className="muted">
          {verletzt
            ? 'Du bist verletzt und machst Reha.'
            : matchtag
              ? `Spieltag ${c.uhr.woche} von ${SPIELTAGE}.`
              : 'Spielfreie Zeit, Sommerpause.'}
        </p>
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
          {verletzt ? 'Reha machen' : matchtag ? 'Woche starten' : 'Training absolvieren'}
        </button>
      </section>

      <section className="card">
        <h2>Attribute</h2>
        {SKILL_KEYS.map((k) => (
          <div key={k} className="stat">
            <span>{SKILL_LABELS[k]}</span>
            <div className="bar"><div style={{ width: `${c.spieler.skills[k]}%` }} /></div>
            <span className="num">{Math.round(c.spieler.skills[k])}</span>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Saison-Bilanz</h2>
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

      {alt >= 30 && (
        <button className="btn danger" onClick={() => confirm('Karriere wirklich beenden?') && beenden()}>
          Karriere beenden
        </button>
      )}
    </>
  )
}
