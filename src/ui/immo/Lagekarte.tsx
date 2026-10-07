import type { ReactNode } from 'react'
import { createRng } from '../../engine/rng'
import type { Expose } from '../../engine/expose'
import type { ImmoLage } from '../../engine/types'

const FARBE: Record<ImmoLage, { land: string; haus: string }> = {
  einfach: { land: '#e7e8e1', haus: '#d3d1c6' },
  mittel: { land: '#eaefe2', haus: '#d8d5c8' },
  top: { land: '#f0ece0', haus: '#e0d6bf' },
}

/** Stilisierte Straßenkarte mit dem Objekt in der Mitte und den wichtigsten Orten in der Umgebung. */
export function Lagekarte({ lage, e, stadt }: { lage: ImmoLage; e: Expose; stadt: string }) {
  const rng = createRng(e.seed + 7)
  const f = FARBE[lage]
  const nodes: ReactNode[] = []
  // Häuserblöcke im Raster
  for (let gx = 0; gx < 8; gx++) {
    for (let gy = 0; gy < 5; gy++) {
      if (rng.chance(0.18)) continue
      const x = 8 + gx * 40 + rng.int(0, 4)
      const y = 6 + gy * 40 + rng.int(0, 4)
      nodes.push(<rect key={`b${gx}-${gy}`} x={x} y={y} width={rng.int(20, 30)} height={rng.int(18, 28)} rx="2" fill={f.haus} />)
    }
  }
  // Parks und Wasser
  const wasserY = rng.int(110, 150)
  const park = { x: rng.int(14, 44), y: rng.int(10, 22) }
  // Hauptstraßen
  const diag = rng.int(-30, 30)
  return (
    <svg viewBox="0 0 320 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Lage in ${stadt}`} style={{ display: 'block' }}>
      <rect width="320" height="200" fill={f.land} />
      {nodes}
      <path d={`M-10 ${wasserY} C 60 ${wasserY - 24}, 140 ${wasserY + 30}, 220 ${wasserY - 6} S 300 ${wasserY + 24}, 340 ${wasserY - 8} L340 ${wasserY + 18} C 300 ${wasserY + 40}, 220 ${wasserY + 10}, 140 ${wasserY + 46} S 40 ${wasserY + 4}, -10 ${wasserY + 24} Z`} fill="#a8d4ec" />
      <ellipse cx={park.x + 24} cy={park.y + 16} rx="34" ry="22" fill="#b9dba3" />
      {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={park.x + 8 + i * 9} cy={park.y + 12 + (i % 2) * 10} r="3.6" fill="#8fc27a" />)}
      <g stroke="#fff" fill="none" strokeLinecap="round">
        <line x1="-10" y1="62" x2="330" y2="70" strokeWidth="9" />
        <line x1="150" y1="-10" x2={160 + diag} y2="210" strokeWidth="9" />
        <line x1="-10" y1="138" x2="330" y2="128" strokeWidth="6" />
        <line x1="60" y1="-10" x2="70" y2="210" strokeWidth="5" />
        <line x1="250" y1="-10" x2="244" y2="210" strokeWidth="5" />
      </g>
      <g stroke="#d6d2c4" strokeWidth="0.8" fill="none">
        <line x1="-10" y1="62" x2="330" y2="70" /><line x1="150" y1="-10" x2={160 + diag} y2="210" />
      </g>
      {/* Orte in der Umgebung */}
      {[
        { x: 104, y: 96, t: 'B', c: '#2f6fb5' },
        { x: 262, y: 28, t: 'S', c: '#d9822b' },
        { x: 268, y: 102, t: 'E', c: '#c0423f' },
        { x: park.x + 24, y: park.y + 16, t: 'P', c: '#3f9a52' },
        { x: 52, y: 150, t: 'Z', c: '#7a4fb5' },
      ].map((p) => (
        <g key={p.t}>
          <circle cx={p.x} cy={p.y} r="9" fill={p.c} stroke="#fff" strokeWidth="2" />
          <text x={p.x} y={p.y + 3.6} fontSize="10" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="system-ui, sans-serif">{p.t}</text>
        </g>
      ))}
      <circle cx="160" cy="100" r="22" fill="#e5483d" opacity="0.16" />
      <circle cx="160" cy="100" r="12" fill="#e5483d" opacity="0.2" />
      <path d="M160 112 C 148 96, 146 88, 146 83 a 14 14 0 1 1 28 0 c 0 5, -2 13, -14 29 Z" fill="#e5483d" stroke="#fff" strokeWidth="2" />
      <circle cx="160" cy="83" r="5" fill="#fff" />
      <rect x="206" y="178" width="106" height="16" rx="8" fill="#ffffffd9" />
      <text x="259" y="189.5" fontSize="8.4" fontWeight="700" textAnchor="middle" fill="#2d2a26" fontFamily="system-ui, sans-serif">{stadt}</text>
    </svg>
  )
}

export const KARTEN_LEGENDE: { t: string; c: string; name: string; key: 'bahn' | 'schule' | 'einkauf' | 'park' | 'zentrum' }[] = [
  { t: 'B', c: '#2f6fb5', name: 'Bahnhof / Haltestelle', key: 'bahn' },
  { t: 'S', c: '#d9822b', name: 'Schule / Kita', key: 'schule' },
  { t: 'E', c: '#c0423f', name: 'Einkaufen', key: 'einkauf' },
  { t: 'P', c: '#3f9a52', name: 'Park', key: 'park' },
  { t: 'Z', c: '#7a4fb5', name: 'Stadtzentrum', key: 'zentrum' },
]
