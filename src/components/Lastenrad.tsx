/** Illustration: Lastenrad mit Brotkiste. Räder drehen sich per CSS (.speichen). */
export function Lastenrad({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 200" role="img" aria-label="Lastenrad mit Gebäckkiste">
      <ellipse cx="160" cy="186" rx="130" ry="7" fill="var(--schatten)" />
      <g className="ladung">
        <ellipse cx="50" cy="66" rx="20" ry="11" fill="var(--kruste)" />
        <path d="M38 62q12 -6 24 0" stroke="var(--kruste-hell)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="84" cy="62" rx="16" ry="14" fill="var(--kruste-hell)" />
        <path d="M100 70 l26 -30" stroke="var(--kruste)" strokeWidth="9" strokeLinecap="round" />
      </g>
      <rect x="22" y="70" width="112" height="62" rx="10" fill="var(--orange)" />
      <rect x="22" y="70" width="112" height="12" rx="6" fill="var(--orange-dunkel)" />
      <text x="78" y="113" textAnchor="middle" fontFamily="'Bricolage Grotesque Variable', sans-serif" fontWeight="800" fontSize="15" fill="#fff">radlbäckerin</text>
      <g stroke="var(--rahmen)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M60 150 L140 150 L200 92 L236 150 L262 150" />
        <path d="M140 150 L128 132 L22 132" />
        <path d="M200 92 L190 70" />
        <path d="M176 70 h26" />
        <path d="M236 150 L250 84 L240 72" />
        <path d="M228 72 h22" />
      </g>
      <g className="speichen">
        <circle cx="60" cy="152" r="26" fill="none" stroke="var(--reifen)" strokeWidth="8" />
        <path d="M60 128v48M36 152h48M43 135l34 34M77 135l-34 34" stroke="var(--speiche)" strokeWidth="2" />
      </g>
      <g className="speichen">
        <circle cx="262" cy="152" r="30" fill="none" stroke="var(--reifen)" strokeWidth="8" />
        <path d="M262 124v56M234 152h56M242 132l40 40M282 132l-40 40" stroke="var(--speiche)" strokeWidth="2" />
      </g>
      <circle cx="60" cy="152" r="5" fill="var(--rahmen)" />
      <circle cx="262" cy="152" r="5" fill="var(--rahmen)" />
      <circle cx="200" cy="150" r="9" fill="none" stroke="var(--rahmen)" strokeWidth="5" />
    </svg>
  )
}
