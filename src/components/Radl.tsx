/** Kleines Lastenrad als Tuschezeichnung. */
export function Radl({ className, fahrend = false }: { className?: string; fahrend?: boolean }) {
  return (
    <svg viewBox="0 0 120 70" className={`radl ${fahrend ? 'fahrend' : ''} ${className ?? ''}`} aria-hidden style={{ filter: 'url(#krakel)' }}>
      <g fill="none" stroke="var(--tusche)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="22" width="40" height="22" rx="2" fill="var(--kruste-hell)" />
        <path d="M14 22q4-8 10-2M28 22q5-9 11-1" />
        <path d="M22 56h30l20-22 12 22h10M52 56l-4-12H8M72 34l-3-8h9M84 56l5-26-4-4h8" />
        <g className="rad-dreh"><circle cx="22" cy="56" r="10" /><path d="M22 46v20M12 56h20" /></g>
        <g className="rad-dreh"><circle cx="94" cy="56" r="11" /><path d="M94 45v22M83 56h22" /></g>
      </g>
    </svg>
  )
}
