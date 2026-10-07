import type { ReactNode } from 'react'
import { createRng, type Rng } from '../../engine/rng'
import type { ImmoLage, ImmoTyp } from '../../engine/types'

/** Farbwelt je Lage: Himmel, Sonne, Boden und Stimmung der Fenster. */
interface Stimmung {
  himmel: [string, string, string]
  sonne: { x: number; y: number; r: number; farbe: string } | null
  wolke: string
  wiese: string
  wiese2: string
  strasse: string
  fern: string
  licht: boolean
  dunst: number
}
const STIMMUNG: Record<ImmoLage, Stimmung> = {
  einfach: { himmel: ['#8c9eac', '#b9c6cf', '#dde3e7'], sonne: null, wolke: '#c9d1d7', wiese: '#7d9166', wiese2: '#6e8159', strasse: '#6f747a', fern: '#9aa7a3', licht: false, dunst: 0.18 },
  mittel: { himmel: ['#4aa3ea', '#8ccbf4', '#d8effc'], sonne: { x: 262, y: 42, r: 15, farbe: '#fff3b0' }, wolke: '#ffffff', wiese: '#6db35a', wiese2: '#5ea04c', strasse: '#7b8087', fern: '#8fb59a', licht: false, dunst: 0 },
  top: { himmel: ['#4a5fae', '#f0a063', '#ffe0a3'], sonne: { x: 238, y: 112, r: 20, farbe: '#ffd37a' }, wolke: '#ffd2a1', wiese: '#5e9a52', wiese2: '#4f8847', strasse: '#6d6f78', fern: '#7f8f93', licht: true, dunst: 0 },
}

const FASSADEN = ['#e6d5b8', '#d6dfe6', '#e9c9ae', '#cbd8c3', '#efe3cf', '#d9c7bd', '#e4e0d0']
const ZIEGEL = ['#b9654a', '#a85a44', '#c4745a']
const DACH = ['#8a4a3a', '#6e5348', '#4f5b66', '#9a5b3f', '#5d4b44']

const wahl = <T,>(rng: Rng, liste: readonly T[]): T => liste[rng.int(0, liste.length - 1)]

function Wolken({ rng, st }: { rng: Rng; st: Stimmung }) {
  const n = st.sonne ? rng.int(2, 3) : rng.int(3, 4)
  return (
    <g fill={st.wolke} opacity={st.sonne ? 0.92 : 0.8}>
      {Array.from({ length: n }, (_, i) => {
        const x = Math.min(220, 30 + i * (200 / n) + rng.int(-10, 10))
        const y = 22 + rng.int(0, 38)
        const s = 0.7 + rng.next() * 0.7
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cx="0" cy="0" rx="26" ry="8" />
            <ellipse cx="-12" cy="-6" rx="14" ry="9" />
            <ellipse cx="9" cy="-8" rx="16" ry="11" />
          </g>
        )
      })}
    </g>
  )
}

function Stadtsilhouette({ rng, st, y = 150 }: { rng: Rng; st: Stimmung; y?: number }) {
  const bauten: ReactNode[] = []
  let x = -6
  let i = 0
  while (x < 330) {
    const w = 12 + rng.int(0, 22)
    const h = 22 + rng.int(0, 60)
    bauten.push(<rect key={i++} x={x} y={y - h} width={w} height={h} />)
    x += w + rng.int(0, 3)
  }
  return <g fill={st.fern} opacity={0.55}>{bauten}</g>
}

function Huegel({ rng, st, y = 150 }: { rng: Rng; st: Stimmung; y?: number }) {
  const a = 20 + rng.int(0, 16)
  const b = 14 + rng.int(0, 14)
  return (
    <g>
      <path d={`M-10 ${y} C 40 ${y - a - 14}, 100 ${y - a}, 160 ${y - 6} S 280 ${y - b - 18}, 330 ${y - 4} L330 ${y} Z`} fill={st.fern} opacity={0.5} />
      <path d={`M-10 ${y} C 60 ${y - b}, 120 ${y - 4}, 200 ${y - b - 6} S 300 ${y - 4}, 330 ${y - 10} L330 ${y} Z`} fill={st.wiese2} opacity={0.6} />
    </g>
  )
}

function Baum({ x, y, s = 1, laub = '#4e8f4a', rund = true }: { x: number; y: number; s?: number; laub?: string; rund?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1.6" y="-14" width="3.2" height="14" fill="#6b4a33" />
      {rund ? (
        <>
          <circle cx="0" cy="-26" r="13" fill={laub} />
          <circle cx="-8" cy="-19" r="9" fill={laub} opacity="0.92" />
          <circle cx="8" cy="-20" r="10" fill={laub} opacity="0.88" />
        </>
      ) : (
        <ellipse cx="0" cy="-30" rx="7" ry="22" fill={laub} />
      )}
    </g>
  )
}

function Palme({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 C 3 -18, -2 -32, 4 -46" stroke="#7a5a3c" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <g transform="translate(4 -46)" fill="#3f8f4a">
        {[-70, -35, 0, 35, 70].map((w) => (
          <path key={w} transform={`rotate(${w})`} d="M0 0 C 6 -6, 16 -6, 24 0 C 16 -2, 6 -2, 0 0 Z" />
        ))}
        <path transform="rotate(-110)" d="M0 0 C 6 -6, 16 -6, 22 0 C 14 -2, 6 -2, 0 0 Z" />
        <path transform="rotate(110)" d="M0 0 C 6 -6, 16 -6, 22 0 C 14 -2, 6 -2, 0 0 Z" />
      </g>
    </g>
  )
}

/** Raster aus Fenstern; einige leuchten (warm) oder zeigen Himmelsspiegelung. */
function Fenster({ x, y, spalten, zeilen, w, h, dx, dy, rng, licht, glas = '#7fb4d6', rahmen = '#f4f1ea', laden }: {
  x: number; y: number; spalten: number; zeilen: number; w: number; h: number; dx: number; dy: number; rng: Rng; licht: boolean; glas?: string; rahmen?: string; laden?: string
}) {
  const out: ReactNode[] = []
  for (let r = 0; r < zeilen; r++) {
    for (let c = 0; c < spalten; c++) {
      const an = licht && rng.chance(0.5)
      const fx = x + c * dx
      const fy = y + r * dy
      out.push(
        <g key={`${r}-${c}`}>
          {laden && <rect x={fx - 3.5} y={fy} width="3" height={h} fill={laden} />}
          {laden && <rect x={fx + w + 0.5} y={fy} width="3" height={h} fill={laden} />}
          <rect x={fx - 1} y={fy - 1} width={w + 2} height={h + 2} fill={rahmen} />
          <rect x={fx} y={fy} width={w} height={h} fill={an ? '#ffd88a' : glas} />
          <rect x={fx} y={fy} width={w} height={h * 0.45} fill="#fff" opacity={an ? 0.1 : 0.22} />
          <line x1={fx + w / 2} y1={fy} x2={fx + w / 2} y2={fy + h} stroke={rahmen} strokeWidth="0.9" />
        </g>,
      )
    }
  }
  return <g>{out}</g>
}

// ---------------------------------------------------------------- Gebäude

type GebaeudeProps = { rng: Rng; st: Stimmung; lage: ImmoLage }

function Apartment({ rng, st }: GebaeudeProps) {
  const farbe = wahl(rng, FASSADEN)
  return (
    <g>
      <rect x="112" y="60" width="96" height="90" fill={farbe} />
      <rect x="108" y="56" width="104" height="6" fill="#8c8f94" />
      <rect x="136" y="46" width="28" height="12" fill="#a9acb1" />
      <Fenster x={122} y={70} spalten={3} zeilen={4} w={14} h={14} dx={30} dy={19} rng={rng} licht={st.licht} />
      {[0, 1, 2, 3].map((r) => <rect key={r} x="119" y={86 + r * 19} width="62" height="3" fill="#6f7378" opacity="0.55" />)}
      <rect x="148" y="128" width="16" height="22" fill="#4a5560" />
      <rect x="144" y="123" width="24" height="4" fill="#5d636a" />
      <g stroke="#555" strokeWidth="1.2" fill="none">
        <circle cx="196" cy="146" r="3.2" />
        <circle cx="203" cy="146" r="3.2" />
      </g>
      <Baum x={92} y={152} s={0.9} laub="#5aa04e" />
      <Baum x={236} y={152} s={0.8} laub="#4e8f4a" />
    </g>
  )
}

function Wohnung({ rng, st }: GebaeudeProps) {
  const farbe = wahl(rng, FASSADEN)
  return (
    <g>
      <rect x="82" y="56" width="156" height="94" fill={farbe} />
      <rect x="82" y="56" width="156" height="94" fill="#fff" opacity="0.04" />
      <rect x="96" y="40" width="128" height="18" fill={farbe} />
      <rect x="92" y="36" width="136" height="5" fill="#7f8388" />
      <Fenster x={94} y={64} spalten={4} zeilen={4} w={20} h={13} dx={36} dy={20} rng={rng} licht={st.licht} glas="#86bad9" />
      {[0, 1, 2, 3].map((r) => (
        <g key={r}>
          <rect x="90" y={78 + r * 20} width="60" height="2.6" fill="#6f7378" />
          <rect x="162" y={78 + r * 20} width="60" height="2.6" fill="#6f7378" />
          <rect x="90" y={72 + r * 20} width="60" height="6" fill="#9fd0e8" opacity="0.28" />
        </g>
      ))}
      <rect x="100" y="43" width="120" height="11" fill="#9fd0e8" opacity="0.75" />
      <rect x="146" y="128" width="28" height="22" fill="#3f4b57" />
      <rect x="150" y="131" width="9" height="19" fill="#9fd0e8" opacity="0.7" />
      <rect x="161" y="131" width="9" height="19" fill="#9fd0e8" opacity="0.7" />
      <Baum x={66} y={152} s={0.9} laub="#5aa04e" />
      <Baum x={254} y={152} s={1} laub="#4e8f4a" />
      <ellipse cx="206" cy="155" rx="8" ry="3" fill="#3a3f45" opacity="0.2" />
    </g>
  )
}

function Mehrfamilienhaus({ rng, st }: GebaeudeProps) {
  const ziegel = rng.chance(0.4)
  const farbe = ziegel ? wahl(rng, ZIEGEL) : wahl(rng, FASSADEN)
  const dach = wahl(rng, DACH)
  return (
    <g>
      <polygon points="58,80 262,80 232,46 88,46" fill={dach} />
      <polygon points="58,80 262,80 256,84 64,84" fill="#00000022" />
      <rect x="64" y="80" width="192" height="70" fill={farbe} />
      {[110, 210].map((x) => (
        <g key={x}>
          <rect x={x - 11} y="56" width="22" height="22" fill={dach} />
          <polygon points={`${x - 14},58 ${x + 14},58 ${x},46`} fill="#00000030" />
          <rect x={x - 6} y="62" width="12" height="13" fill="#f4f1ea" />
          <rect x={x - 5} y="63" width="10" height="11" fill={st.licht ? '#ffd88a' : '#7fb4d6'} />
        </g>
      ))}
      <rect x="226" y="52" width="10" height="22" fill="#a3978a" />
      <Fenster x={76} y={88} spalten={6} zeilen={2} w={14} h={16} dx={30} dy={30} rng={rng} licht={st.licht} laden={rng.chance(0.5) ? '#4f7a58' : undefined} />
      <rect x="140" y="118" width="14" height="32" fill="#4a3c33" />
      <rect x="166" y="118" width="14" height="32" fill="#4a3c33" />
      <rect x="136" y="145" width="22" height="5" fill="#b8b6b0" />
      <rect x="162" y="145" width="22" height="5" fill="#b8b6b0" />
      <Baum x={46} y={152} s={0.95} laub="#5aa04e" />
      <Baum x={278} y={152} s={0.9} laub="#4e8f4a" />
    </g>
  )
}

function Gewerbe({ rng, st, id }: GebaeudeProps & { id: string }) {
  const glas = `${id}-glas`
  return (
    <g>
      <defs>
        <linearGradient id={glas} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={st.himmel[1]} />
          <stop offset="1" stopColor="#2e5f86" />
        </linearGradient>
      </defs>
      <rect x="124" y="16" width="76" height="136" fill={`url(#${glas})`} />
      {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1="124" x2="200" y1={26 + i * 14} y2={26 + i * 14} stroke="#dbeaf4" strokeWidth="0.9" opacity="0.6" />)}
      {Array.from({ length: 5 }, (_, i) => <line key={`v${i}`} y1="16" y2="150" x1={138 + i * 14} x2={138 + i * 14} stroke="#dbeaf4" strokeWidth="0.9" opacity="0.6" />)}
      {st.licht && Array.from({ length: 12 }, (_, i) => <rect key={i} x={128 + (i % 5) * 14} y={30 + Math.floor(i / 5) * 28 + rng.int(0, 3) * 14} width="9" height="7" fill="#ffd88a" opacity="0.85" />)}
      <rect x="160" y="6" width="2" height="12" fill="#8a8f95" />
      <rect x="64" y="104" width="192" height="46" fill="#cfd3d8" />
      <rect x="64" y="104" width="192" height="8" fill="#3b4652" />
      <rect x="82" y="105" width="64" height="5" fill={st.sonne ? '#ffcf5a' : '#e0e5ea'} opacity="0.95" />
      <rect x="176" y="105" width="64" height="5" fill="#e0e5ea" opacity="0.95" />
      <rect x="74" y="118" width="62" height="32" fill={`url(#${glas})`} />
      <rect x="184" y="118" width="62" height="32" fill={`url(#${glas})`} />
      <rect x="148" y="116" width="24" height="34" fill="#33404c" />
      <line x1="160" y1="116" x2="160" y2="150" stroke="#9fb4c4" strokeWidth="1" />
      <Baum x={50} y={152} s={0.85} laub="#5aa04e" />
      <Baum x={270} y={152} s={0.85} laub="#4e8f4a" />
    </g>
  )
}

function Ferienhaus({ rng, st }: GebaeudeProps) {
  const holz = wahl(rng, ['#b98957', '#c49a68', '#a77a4c'])
  const dach = rng.chance(0.5) ? '#c0623f' : '#8a6a3f'
  return (
    <g>
      <rect x="98" y="100" width="124" height="50" fill={holz} />
      {Array.from({ length: 8 }, (_, i) => <line key={i} x1="98" x2="222" y1={106 + i * 6} y2={106 + i * 6} stroke="#00000022" strokeWidth="1" />)}
      <polygon points="88,100 232,100 204,70 116,70" fill={dach} />
      <polygon points="88,100 232,100 228,104 92,104" fill="#00000025" />
      <rect x="86" y="104" width="52" height="5" fill="#e6d3b0" />
      {[90, 110, 130].map((x) => <rect key={x} x={x} y="109" width="3" height="41" fill="#e6d3b0" />)}
      <rect x="150" y="118" width="22" height="32" fill="#5a3f2a" />
      <Fenster x={186} y={112} spalten={1} zeilen={1} w={24} h={20} dx={0} dy={0} rng={rng} licht={st.licht} rahmen="#f4efe6" />
      <Fenster x={108} y={118} spalten={1} zeilen={1} w={20} h={18} dx={0} dy={0} rng={rng} licht={st.licht} rahmen="#f4efe6" />
      <Palme x={252} y={154} s={1.15} />
      <Palme x={66} y={156} s={0.9} />
      <g transform="translate(205 150)">
        <rect x="0" y="0" width="22" height="4" fill="#f4efe6" transform="skewX(-25)" />
        <rect x="2" y="4" width="2" height="4" fill="#8a8f95" />
        <rect x="16" y="4" width="2" height="4" fill="#8a8f95" />
      </g>
    </g>
  )
}

function Bauland({ st }: GebaeudeProps) {
  return (
    <g>
      <polygon points="96,150 224,150 240,168 80,168" fill="none" stroke="#fff" strokeWidth="1.4" strokeDasharray="5 4" opacity="0.8" />
      <polygon points="122,138 198,138 212,152 108,152" fill={st.wiese2} opacity="0.55" />
      {[78, 108, 140, 172, 204, 236, 262].map((x, i) => (
        <g key={x}>
          <rect x={x} y={128 + (i % 2)} width="2.4" height="22" fill="#9c7a52" />
        </g>
      ))}
      <line x1="76" y1="134" x2="268" y2="134" stroke="#9c7a52" strokeWidth="1.2" />
      <line x1="76" y1="143" x2="268" y2="143" stroke="#9c7a52" strokeWidth="1.2" />
      <g transform="translate(150 104)">
        <rect x="0" y="0" width="3" height="46" fill="#6b4a33" />
        <rect x="-26" y="-4" width="56" height="26" rx="2" fill="#f5f5f2" stroke="#2f6fb5" strokeWidth="2.4" />
        <rect x="-26" y="-4" width="56" height="8" fill="#2f6fb5" />
        <text x="2" y="3" fontSize="6.4" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="system-ui, sans-serif">BAULAND</text>
        <text x="2" y="14" fontSize="5.4" fill="#2a3138" textAnchor="middle" fontFamily="system-ui, sans-serif">Zu verkaufen</text>
        <text x="2" y="20" fontSize="4.6" fill="#5a636b" textAnchor="middle" fontFamily="system-ui, sans-serif">provisionsfrei</text>
      </g>
      {[104, 200, 226].map((x, i) => (
        <g key={x}>
          <rect x={x} y={144 - (i % 2) * 2} width="1.6" height="9" fill="#d9a441" />
          <rect x={x - 1} y={143 - (i % 2) * 2} width="4" height="3" fill="#e5483d" />
        </g>
      ))}
      <Baum x={36} y={146} s={1.2} laub="#4e8f4a" />
      <Baum x={286} y={148} s={1.1} laub="#5aa04e" />
      <Baum x={58} y={142} s={0.8} laub="#4a8545" rund={false} />
      <Baum x={300} y={140} s={0.9} laub="#4a8545" rund={false} />
    </g>
  )
}

function Eigenheim({ rng, st }: GebaeudeProps) {
  const farbe = wahl(rng, FASSADEN)
  const dach = wahl(rng, DACH)
  const laden = wahl(rng, ['#4f7a58', '#3e5a7a', '#8a3f3a'])
  return (
    <g>
      <rect x="208" y="116" width="52" height="34" fill={farbe} />
      <polygon points="204,116 264,116 258,102 210,102" fill={dach} />
      <rect x="216" y="124" width="36" height="26" fill="#cfd3d6" />
      {[0, 1, 2, 3].map((i) => <line key={i} x1="216" x2="252" y1={128 + i * 6} y2={128 + i * 6} stroke="#9ea4a9" strokeWidth="1" />)}
      <rect x="92" y="96" width="116" height="54" fill={farbe} />
      <polygon points="82,98 218,98 150,52" fill={dach} />
      <polygon points="150,52 218,98 210,98 150,57" fill="#00000028" />
      <rect x="172" y="56" width="10" height="26" fill="#a3978a" />
      <Fenster x={104} y={108} spalten={2} zeilen={1} w={16} h={20} dx={60} dy={0} rng={rng} licht={st.licht} laden={laden} />
      <Fenster x={134} y={72} spalten={1} zeilen={1} w={14} h={16} dx={0} dy={0} rng={rng} licht={st.licht} />
      <rect x="142" y="116" width="18" height="34" fill="#5a3f2a" />
      <circle cx="157" cy="134" r="1.2" fill="#e6c36a" />
      <rect x="138" y="148" width="26" height="3" fill="#c9c6bf" />
      <g stroke="#f4f1ea" strokeWidth="1.4">
        {Array.from({ length: 22 }, (_, i) => <line key={i} x1={78 + i * 8} y1="140" x2={78 + i * 8} y2="150" />)}
        <line x1="76" y1="143" x2="256" y2="143" />
      </g>
      <Baum x={64} y={152} s={1.1} laub="#4e8f4a" />
      <Baum x={286} y={152} s={0.95} laub="#5aa04e" />
    </g>
  )
}

function Villa({ st, id }: GebaeudeProps & { id: string }) {
  const glas = `${id}-vglas`
  const wasser = `${id}-wasser`
  return (
    <g>
      <defs>
        <linearGradient id={glas} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={st.himmel[1]} />
          <stop offset="1" stopColor="#35607f" />
        </linearGradient>
        <linearGradient id={wasser} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fd3e8" />
          <stop offset="1" stopColor="#2a9bc4" />
        </linearGradient>
      </defs>
      <rect x="56" y="104" width="170" height="46" fill="#ece8df" />
      <rect x="50" y="98" width="182" height="7" fill="#3a3d42" />
      <rect x="96" y="70" width="156" height="32" fill="#f3f0e8" />
      <rect x="90" y="64" width="168" height="7" fill="#3a3d42" />
      <rect x="104" y="76" width="140" height="22" fill={`url(#${glas})`} />
      {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={127 + i * 23} y1="76" x2={127 + i * 23} y2="98" stroke="#2f3338" strokeWidth="1.4" />)}
      {st.licht && <rect x="104" y="76" width="140" height="22" fill="#ffcf7a" opacity="0.38" />}
      <rect x="64" y="112" width="102" height="34" fill={`url(#${glas})`} />
      {[0, 1, 2, 3].map((i) => <line key={i} x1={89 + i * 25} y1="112" x2={89 + i * 25} y2="146" stroke="#2f3338" strokeWidth="1.4" />)}
      {st.licht && <rect x="64" y="112" width="102" height="34" fill="#ffcf7a" opacity="0.35" />}
      <rect x="178" y="110" width="44" height="40" fill="#8a6a4a" />
      {Array.from({ length: 8 }, (_, i) => <line key={i} x1="178" x2="222" y1={115 + i * 5} y2={115 + i * 5} stroke="#00000030" strokeWidth="1" />)}
      <rect x="196" y="126" width="10" height="24" fill="#2f3338" />
      <polygon points="64,152 214,152 226,172 52,172" fill={`url(#${wasser})`} />
      <polygon points="64,152 214,152 216,154 62,154" fill="#fff" opacity="0.55" />
      <polygon points="70,160 120,160 116,166 66,166" fill="#fff" opacity="0.2" />
      <polygon points="52,172 226,172 232,177 46,177" fill="#e8e1d2" />
      {[236, 252].map((x, i) => <rect key={x} x={x} y={154 + i * 3} width="14" height="3.4" fill="#f4f1ea" transform={`skewX(-25) translate(${i * 4} 0)`} />)}
      <Baum x={28} y={156} s={1.25} laub="#3f7d46" rund={false} />
      <Baum x={296} y={156} s={1.2} laub="#3f7d46" rund={false} />
      <Palme x={264} y={150} s={1.1} />
      <Palme x={34} y={150} s={1} />
    </g>
  )
}

/** Außenansicht eines Objekts als Illustration. */
export function Szene({ typ, lage, seed, titel }: { typ: ImmoTyp; lage: ImmoLage; seed: number; titel?: string }) {
  const rng = createRng(seed)
  const st = STIMMUNG[lage]
  const id = `sz${seed}`
  const himmel = `${id}-h`
  const sonne = `${id}-s`
  const stadt = typ === 'apartment' || typ === 'wohnung' || typ === 'gewerbe' || typ === 'mfh'
  const meer = typ === 'ferienhaus'
  const props: GebaeudeProps = { rng, st, lage }
  const boden = st.wiese
  return (
    <svg viewBox="0 0 320 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label={titel ?? 'Außenansicht'} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={himmel} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={st.himmel[0]} />
          <stop offset="0.55" stopColor={st.himmel[1]} />
          <stop offset="1" stopColor={st.himmel[2]} />
        </linearGradient>
        <radialGradient id={sonne}>
          <stop offset="0" stopColor={st.sonne?.farbe ?? '#fff'} stopOpacity="0.95" />
          <stop offset="1" stopColor={st.sonne?.farbe ?? '#fff'} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${himmel})`} />
      {st.sonne && (
        <g>
          <circle cx={st.sonne.x} cy={st.sonne.y} r={st.sonne.r * 3.2} fill={`url(#${sonne})`} />
          <circle cx={st.sonne.x} cy={st.sonne.y} r={st.sonne.r} fill={st.sonne.farbe} />
        </g>
      )}
      <Wolken rng={rng} st={st} />
      {stadt ? <Stadtsilhouette rng={rng} st={st} /> : <Huegel rng={rng} st={st} />}
      {meer && (
        <g>
          <rect x="0" y="118" width="320" height="34" fill="#3fa7cf" />
          <rect x="0" y="118" width="320" height="3" fill="#fff" opacity="0.6" />
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={20 + i * 52 + (i % 2) * 14} y={126 + (i % 3) * 8} width="22" height="1.6" fill="#fff" opacity="0.55" />)}
        </g>
      )}
      <rect x="0" y="150" width="320" height="50" fill={meer ? '#e9d8a8' : boden} />
      {!meer && <rect x="0" y="150" width="320" height="4" fill={st.wiese2} />}
      {typ !== 'bauland' && typ !== 'ferienhaus' && <rect x="0" y="178" width="320" height="22" fill={st.strasse} />}
      {typ !== 'bauland' && typ !== 'ferienhaus' && <line x1="0" y1="189" x2="320" y2="189" stroke="#fff" strokeWidth="1.6" strokeDasharray="14 10" opacity="0.7" />}
      {typ === 'bauland' && <rect x="0" y="172" width="320" height="28" fill={st.strasse} />}
      <g transform={typ === 'bauland' ? undefined : `translate(160 150) scale(${typ === 'gewerbe' ? 1.05 : 1.14}) translate(-160 -150)`}>
        {typ === 'apartment' && <Apartment {...props} />}
        {typ === 'wohnung' && <Wohnung {...props} />}
        {typ === 'mfh' && <Mehrfamilienhaus {...props} />}
        {typ === 'gewerbe' && <Gewerbe {...props} id={id} />}
        {typ === 'ferienhaus' && <Ferienhaus {...props} />}
        {typ === 'bauland' && <Bauland {...props} />}
        {typ === 'eigenheim' && <Eigenheim {...props} />}
        {typ === 'villa' && <Villa {...props} id={id} />}
      </g>
      {st.dunst > 0 && <rect width="320" height="200" fill="#b7c2c9" opacity={st.dunst * 0.55} />}
      {lage === 'top' && <rect width="320" height="200" fill="#ff9a4a" opacity="0.07" />}
    </svg>
  )
}
