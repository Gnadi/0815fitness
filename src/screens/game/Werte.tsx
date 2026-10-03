import { SKILL_KEYS, SKILL_LABELS } from '../../engine/rating'
import type { Career, Traits } from '../../engine/types'

function Zeile({ label, value, titel }: { label: string; value: number; titel?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="meter kompakt" title={titel}>
      <span>{label}</span>
      <div className="bar"><div style={{ width: `${v}%` }} /></div>
      <span className="num">{Math.round(v)}</span>
    </div>
  )
}

const GRUPPEN: { titel: string; werte: [keyof Traits | 'form', string][] }[] = [
  { titel: 'Körper & Kopf', werte: [['fitness', 'Fitness'], ['gesundheit', 'Gesundheit'], ['form', 'Form'], ['selbstvertrauen', 'Selbstvertr.'], ['moral', 'Moral']] },
  { titel: 'Umfeld', werte: [['trainerBeziehung', 'Trainer'], ['kabine', 'Kabine'], ['fanbeliebtheit', 'Fans'], ['ruf', 'Ruf']] },
  { titel: 'Charakter', werte: [['disziplin', 'Disziplin'], ['professionalitaet', 'Einstellung'], ['ehrgeiz', 'Ehrgeiz'], ['privatglueck', 'Privatglück']] },
]

/** Kompakte Übersicht aller Werte, die sich durch Spiele, Training und Ereignisse verändern. */
export function WerteKarte({ c }: { c: Career }) {
  const t = c.spieler.traits
  const wert = (k: keyof Traits | 'form') => (k === 'form' ? c.form : t[k])
  return (
    <details className="card werte" open>
      <summary><h2>Alle Werte</h2></summary>
      {GRUPPEN.map((g) => (
        <div key={g.titel}>
          <p className="muted small gruppe">{g.titel}</p>
          <div className="meters2">
            {g.werte.map(([k, l]) => <Zeile key={k} label={l} value={wert(k)} />)}
          </div>
        </div>
      ))}
      <p className="muted small gruppe">Fähigkeiten</p>
      <div className="meters2">
        {SKILL_KEYS.map((k) => <Zeile key={k} label={k === 'positionsspiel' ? 'Position' : SKILL_LABELS[k]} value={c.spieler.skills[k]} titel={SKILL_LABELS[k]} />)}
      </div>
    </details>
  )
}
