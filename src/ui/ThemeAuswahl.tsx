import { useState } from 'react'
import { useCareer } from '../store/careerStore'
import { THEMES, gespeichertesTheme, wendeThemeAn } from './theme'

export function ThemeAuswahl() {
  const [aktiv, setAktiv] = useState(gespeichertesTheme)
  const vereinId = useCareer((s) => s.career?.vereinId)
  const info = THEMES.find((t) => t.id === aktiv)?.info
  return (
    <section className="card">
      <h2>Design</h2>
      <div className="themes" role="radiogroup" aria-label="Farbschema">
        {THEMES.map((t) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={aktiv === t.id}
            className={`theme${aktiv === t.id ? ' on' : ''}`}
            onClick={() => { setAktiv(t.id); wendeThemeAn(t.id, { vereinId: vereinId || undefined }) }}
          >
            <span className="punkt" style={{ background: t.farbe }} />
            {t.name}
          </button>
        ))}
      </div>
      {info && <p className="muted small">{info}{aktiv === 'verein' && !vereinId ? ' Sobald du spielst, erscheinen die Farben deines Vereins.' : ''}</p>}
    </section>
  )
}
