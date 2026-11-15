import { m } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { STRASSEN } from '../data/produkte'

const ROUTE = 'M60 150 C 90 150, 110 110, 150 105 S 220 70, 260 80 S 330 130, 360 120 S 420 60, 450 70 S 520 150, 480 180 S 360 200, 300 190 S 150 210, 110 180 S 50 170, 60 150'
const STRASSEN_LINIEN = [
  { d: 'M20 150 H 500', x: 300, y: 145 },
  { d: 'M150 30 C 150 90, 150 160, 160 220', x: 162, y: 60 },
  { d: 'M260 20 C 255 80, 270 140, 260 230', x: 272, y: 40 },
  { d: 'M380 20 C 370 90, 400 160, 390 230', x: 402, y: 200 },
  { d: 'M40 210 C 160 200, 340 220, 520 190', x: 60, y: 224 },
]

/** Die Sonntagsrunde durchs Grätzl – mit Rad, das am Sonntag die Route abfährt. */
export function Runde({ fortschritt, unterwegs }: { fortschritt: number; unterwegs: boolean }) {
  const pfad = useRef<SVGPathElement>(null)
  const [punkt, setPunkt] = useState({ x: 60, y: 150 })

  useEffect(() => {
    const p = pfad.current
    if (!p) return
    const pt = p.getPointAtLength(p.getTotalLength() * (unterwegs ? fortschritt : 0))
    setPunkt({ x: pt.x, y: pt.y })
  }, [fortschritt, unterwegs])

  const i = Math.min(STRASSEN.length - 1, Math.floor(fortschritt * STRASSEN.length))
  const strasse = STRASSEN[i]
  const wo = strasse.startsWith('Am ') ? strasse : strasse.endsWith('weg') ? `im ${strasse}` : `in der ${strasse}`

  return (
    <div className="runde">
      <svg viewBox="0 0 540 240" className="runde-karte" style={{ filter: 'url(#krakel)' }} aria-label="Karte der Sonntagsrunde">
        {STRASSEN_LINIEN.map((s, i) => (
          <g key={i}>
            <path d={s.d} className="strasse-linie" />
            <text x={s.x} y={s.y} className="strasse-name">{STRASSEN[i]}</text>
          </g>
        ))}
        <m.path
          ref={pfad}
          d={ROUTE}
          className="route-linie"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.2, ease: 'easeInOut' }}
        />
        <g transform="translate(46 128)">
          <path d="M0 18 L14 6 L28 18 V34 H0 Z" className="haus" />
          <text x="14" y="50" textAnchor="middle" className="strasse-name hand-svg">unser Ofen</text>
        </g>
        <m.g animate={{ x: punkt.x - 14, y: punkt.y - 22 }} transition={{ type: 'spring', stiffness: 60, damping: 14 }}>
          <circle cx="14" cy="14" r="15" className="rad-punkt" />
          <g fill="none" stroke="var(--papier)" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="8" cy="18" r="3.5" /><circle cx="21" cy="18" r="3.5" />
            <path d="M8 18h7l4-7M5 11h7v4" />
          </g>
        </m.g>
      </svg>
      <p className="runde-text">
        {unterwegs ? (
          <>Das Radl ist gerade <strong>{wo}</strong> – {Math.round(fortschritt * 100)} % der Runde geschafft.</>
        ) : (
          <>Sonntag zwischen 7 und 10 Uhr fährt das Radl diese Runde. Nicht dabei? Schreib uns – vielleicht wird die Runde größer.</>
        )}
      </p>
    </div>
  )
}
