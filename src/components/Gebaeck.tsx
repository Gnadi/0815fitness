import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { GebaeckForm } from '../data/produkte'

/** Einmal pro Seite einbinden: macht alle Striche leicht krakelig wie mit der Hand gezeichnet. */
export function KrakelFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <filter id="krakel">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="2.6" />
      </filter>
    </svg>
  )
}

const strich = {
  fill: 'none',
  stroke: 'var(--tusche)',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Linie({ d, i = 0, ...rest }: { d: string; i?: number } & Record<string, unknown>) {
  return (
    <motion.path
      d={d}
      {...strich}
      {...rest}
      variants={{ aus: { pathLength: 0, opacity: 0 }, an: { pathLength: 1, opacity: 1 } }}
      transition={{ duration: 0.9, delay: 0.1 + i * 0.12, ease: 'easeInOut' }}
    />
  )
}

function Flaeche({ children }: { children: ReactNode }) {
  return (
    <motion.g variants={{ aus: { opacity: 0 }, an: { opacity: 1 } }} transition={{ duration: 0.6, delay: 0.5 }}>
      {children}
    </motion.g>
  )
}

const kruste = 'var(--kruste)'
const krusteHell = 'var(--kruste-hell)'

function Motiv({ form }: { form: GebaeckForm }) {
  switch (form) {
    case 'semmel':
      return (
        <>
          <Flaeche><circle cx="50" cy="38" r="25" fill={krusteHell} /></Flaeche>
          <Linie d="M75 38a25 25 0 1 1-50 0a25 25 0 1 1 50 0" />
          {[0, 72, 144, 216, 288].map((w, i) => (
            <Linie key={w} i={i + 1} d="M50 38q-9-9-5-22" transform={`rotate(${w} 50 38)`} />
          ))}
        </>
      )
    case 'dinkel':
      return (
        <>
          <Flaeche>
            <ellipse cx="50" cy="38" rx="34" ry="19" fill={krusteHell} />
            {[[36, 30], [44, 27], [55, 29], [63, 33], [40, 44], [58, 45]].map(([x, y]) => (
              <ellipse key={`${x}${y}`} cx={x} cy={y} rx="2.4" ry="1.3" fill="var(--tusche)" opacity=".55" />
            ))}
          </Flaeche>
          <Linie d="M16 38c0-11 15-19 34-19s34 8 34 19-15 19-34 19-34-8-34-19z" />
          <Linie i={1} d="M28 42q22-14 44-4" />
        </>
      )
    case 'brezel':
      return (
        <>
          <Flaeche>
            <path d="M50 52C38 54 16 50 18 30 20 14 40 14 46 26 52 38 46 50 36 54M50 52c12 2 34-2 32-22-2-16-22-16-28-4-6 12 0 24 10 28" fill="none" stroke={kruste} strokeWidth="9" strokeLinecap="round" />
          </Flaeche>
          <Linie d="M50 52C38 54 16 50 18 30 20 14 40 14 46 26 52 38 46 50 36 54" />
          <Linie i={1} d="M50 52c12 2 34-2 32-22-2-16-22-16-28-4-6 12 0 24 10 28" />
          <Flaeche>
            {[[26, 22], [34, 18], [66, 20], [74, 26], [30, 44], [70, 44]].map(([x, y]) => (
              <rect key={`${x}${y}`} x={x} y={y} width="2.6" height="2.6" fill="#fff" stroke="var(--tusche)" strokeWidth=".6" />
            ))}
          </Flaeche>
        </>
      )
    case 'flesserl':
      return (
        <>
          <Flaeche><ellipse cx="50" cy="38" rx="35" ry="16" fill={krusteHell} /></Flaeche>
          <Linie d="M15 38c0-9 16-16 35-16s35 7 35 16-16 16-35 16-35-7-35-16z" />
          {[24, 36, 48, 60, 72].map((x, i) => (
            <Linie key={x} i={i + 1} d={`M${x} 24q8 7 0 14q-8 7 0 14`} />
          ))}
          <Flaeche>
            {Array.from({ length: 22 }, (_, k) => (
              <circle key={k} cx={22 + ((k * 37) % 56)} cy={28 + ((k * 13) % 20)} r=".9" fill="var(--tusche)" />
            ))}
          </Flaeche>
        </>
      )
    case 'laib':
      return (
        <>
          <Flaeche><path d="M14 52Q12 16 50 13q38 3 36 39z" fill={kruste} opacity=".75" /></Flaeche>
          <Linie d="M14 52Q12 16 50 13q38 3 36 39z" />
          <Linie i={1} d="M30 34q20-12 40 0" />
          <Linie i={2} d="M34 44q16-8 32 0" />
          <Flaeche>
            {[[40, 22], [58, 20], [48, 27], [66, 30], [30, 28]].map(([x, y]) => (
              <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="#fff" opacity=".9" />
            ))}
          </Flaeche>
        </>
      )
    case 'zopf':
      return (
        <>
          <Flaeche>
            {[22, 36, 50, 64, 78].map((x) => (
              <ellipse key={x} cx={x} cy="38" rx="10" ry="14" fill={krusteHell} />
            ))}
          </Flaeche>
          {[22, 36, 50, 64, 78].map((x, i) => (
            <Linie key={x} i={i} d={`M${x - 8} 30q8-12 16 0q2 16-8 22q-10-6-8-22`} />
          ))}
          <Flaeche>
            {[[24, 30], [38, 28], [52, 30], [66, 28], [80, 31], [44, 40], [60, 41]].map(([x, y]) => (
              <circle key={`${x}${y}`} cx={x} cy={y} r="1.5" fill="#fff" stroke="var(--tusche)" strokeWidth=".5" />
            ))}
          </Flaeche>
        </>
      )
    case 'linzer':
      return (
        <>
          <Flaeche>
            <rect x="18" y="24" width="64" height="28" rx="2" fill="var(--ribisel)" opacity=".8" />
            <rect x="18" y="48" width="64" height="5" fill={krusteHell} />
          </Flaeche>
          <Linie d="M18 24h64v29H18z" />
          {[0, 1, 2, 3].map((k) => (
            <Linie key={`a${k}`} i={k + 1} d={`M${22 + k * 16} 24l10 28`} />
          ))}
          {[0, 1, 2, 3].map((k) => (
            <Linie key={`b${k}`} i={k + 2} d={`M${32 + k * 16} 24l-10 28`} />
          ))}
        </>
      )
    case 'schnecke':
      return (
        <>
          <Flaeche><circle cx="50" cy="38" r="24" fill={krusteHell} /></Flaeche>
          <Linie d="M50 38c0-3 5-3 5 1 0 5-8 6-10 1-3-7 5-12 11-9 8 4 7 16-2 18-11 3-18-7-15-16 4-12 21-14 28-4 8 11 1 26-13 27" />
          <Linie i={2} d="M74 38a24 24 0 1 1-48 0a24 24 0 1 1 48 0" />
        </>
      )
  }
}

/** Handgezeichnete Gebäck-Illustration, die sich beim Sichtbarwerden „zeichnet“. */
export function Gebaeck({ form, className }: { form: GebaeckForm; className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 100 70"
      className={className}
      aria-hidden
      initial="aus"
      whileInView="an"
      viewport={{ once: true, margin: '0px 0px -30px 0px' }}
      style={{ filter: 'url(#krakel)' }}
    >
      <Motiv form={form} />
    </motion.svg>
  )
}
