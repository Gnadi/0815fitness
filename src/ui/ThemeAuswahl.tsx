import { useState } from 'react'
import { THEMES, gespeichertesTheme, wendeThemeAn } from './theme'

export function ThemeAuswahl() {
  const [aktiv, setAktiv] = useState(gespeichertesTheme)
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
            onClick={() => { setAktiv(t.id); wendeThemeAn(t.id) }}
          >
            <span className="punkt" style={{ background: t.farbe }} />
            {t.name}
          </button>
        ))}
      </div>
    </section>
  )
}
