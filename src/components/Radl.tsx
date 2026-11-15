/**
 * Lastenrad (Long John) als Tuschezeichnung, fährt nach rechts:
 * Hinterrad – Sattel – Lenker – Korb mit Gebäck – kleines Vorderrad.
 */
const RADL_PFADE = (
  <>
    <path className="fahrtstriche" d="M1 40h9M3 48h7" stroke="var(--kuli)" />
    <rect x="66" y="26" width="38" height="20" rx="2" fill="var(--kruste-hell)" />
    <path d="M73 26q4-9 11-2M86 26q5-10 12-1" fill="var(--kruste)" />
    <path d="M22 56h24l14-10h46M102 46l-4 12M46 56l-6-26M34 30h12M41 34l18-4M61 46l-3-20M53 24l5 2 4-3" />
    <g className="rad-dreh"><circle cx="22" cy="56" r="11" /><path d="M22 45v22M11 56h22" /></g>
    <g className="rad-dreh"><circle cx="98" cy="58" r="8" /><path d="M98 50v16M90 58h16" /></g>
  </>
)

export function Radl({ className, fahrend = false }: { className?: string; fahrend?: boolean }) {
  return (
    <svg viewBox="0 0 120 70" className={`radl ${fahrend ? 'fahrend' : ''} ${className ?? ''}`} aria-hidden style={{ filter: 'url(#krakel)' }}>
      <g fill="none" stroke="var(--tusche)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {RADL_PFADE}
      </g>
    </svg>
  )
}
