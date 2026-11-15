/**
 * Lastenrad als Tuschezeichnung, fährt nach rechts:
 * Fahrerin am Sattel, Lenker, davor der Korb mit Gebäck über dem Vorderrad.
 */
const RADL_PFADE = (
  <>
    <path className="fahrtstriche" d="M1 38h8M3 46h6" stroke="var(--kuli)" />
    {/* Rahmen, Sattel, Lenker */}
    <path d="M24 54h28l-6-26M46 30l34-2M52 54l28-24M81 28l15 26M40 27h12M80 28l-2-8h-7" />
    {/* Korb vorne über dem Vorderrad */}
    <path d="M86 40l10 14M108 40l-12 14" />
    <rect x="84" y="24" width="28" height="16" rx="2" fill="var(--kruste-hell)" />
    <path d="M84 29.5h28M84 35h28M91 24v16M98 24v16M105 24v16" strokeWidth="1.2" />
    <path d="M88 24q4-9 10-2M99 24q5-10 11-1" fill="var(--kruste)" />
    {/* Fahrerin */}
    <path d="M46 26l14-14M60 12l12 8M46 26l12 12-4 16" stroke="var(--kuli)" />
    <circle cx="63" cy="7" r="4.5" stroke="var(--kuli)" />
    {/* Räder */}
    <g className="rad-dreh"><circle cx="24" cy="54" r="13" /><path d="M24 41v26M11 54h26" /></g>
    <g className="rad-dreh"><circle cx="96" cy="54" r="13" /><path d="M96 41v26M83 54h26" /></g>
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
