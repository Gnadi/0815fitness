/**
 * Unser Lastenrad als Tuschezeichnung (kompakter Long John), fährt nach rechts:
 * großes Hinterrad, Sattel, hohe Lenkstange direkt hinter der Ladebox mit Lochblech,
 * Akku unter der Box, Lenkstange unten zum kleinen Vorderrad mit gelber Gabel.
 */
export function RadlZeichnung() {
  return (
    <>
      <defs>
        <pattern id="lochblech" width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r=".55" fill="var(--tusche)" opacity=".35" />
        </pattern>
      </defs>
      <path className="fahrtstriche" d="M0 36h6M1 43h5" stroke="var(--kuli)" />

      {/* Schutzbleche */}
      <path d="M4 47a14.5 14.5 0 0 1 22-9" strokeWidth="2" />
      <path d="M96 47a11.5 11.5 0 0 1 17-2" strokeWidth="2" />

      {/* Räder */}
      <g className="rad-dreh">
        <circle cx="18" cy="52" r="14" strokeWidth="2.6" />
        <path d="M18 39v26M5 52h26M9 43l18 18M27 43L9 61" strokeWidth=".7" />
      </g>
      <g className="rad-dreh">
        <circle cx="105" cy="54" r="10.5" strokeWidth="2.6" />
        <path d="M105 44v20M95 54h20M98 47l14 14M112 47l-14 14" strokeWidth=".7" />
      </g>

      {/* Lenkstange unten zum Vorderrad */}
      <path d="M55 57L101 53" strokeWidth="1.4" />

      {/* Rahmen: mintfarbene Rohre mit Tuschekontur */}
      <g stroke="var(--rad-rahmen)" strokeWidth="5">
        <path d="M18 52L39 54L51 46H96L97 40M18 52L34 36M32 31L57 27M57 46V12" />
      </g>
      <g strokeWidth="1.3">
        <path d="M18 52L39 54L51 46H96L97 40M18 52L34 36M32 31L57 27M57 46V12" />
      </g>
      {/* Sattelstütze und Sattel */}
      <path d="M29 14L39 54" strokeWidth="2.6" />
      <path d="M21 11q8-3 15 0" strokeWidth="3" />
      {/* Lenker */}
      <path d="M57 12l2-3h7" strokeWidth="2.4" />
      {/* gelbe Gabel */}
      <path d="M97 40L105 54" stroke="var(--rad-gabel)" strokeWidth="4.5" />
      <path d="M97 40L105 54" strokeWidth="1.2" />
      <circle cx="98" cy="37" r="1.6" fill="var(--papier)" strokeWidth="1.2" />

      {/* Akku unter der Box */}
      <rect x="50.5" y="33" width="6" height="12" rx="2" fill="var(--rad-stoff)" strokeWidth="1.2" />

      {/* Ladebox: Lochblech, dunkle Stoffseiten, Griff */}
      <rect x="58" y="21" width="38" height="25" rx="1.5" fill="var(--rad-blech)" strokeWidth="1.6" />
      <rect x="58" y="21" width="38" height="25" rx="1.5" fill="url(#lochblech)" stroke="none" />
      <path d="M58 23v22l4-2V25zM96 23v22l-4-2V25z" fill="var(--rad-stoff)" strokeWidth="1" />
      <path d="M57 21h40" strokeWidth="2.2" />
      <path d="M71 24h12l-1 3h-10z" fill="var(--papier)" strokeWidth="1.1" />
      {/* ein bisschen Gebäck schaut raus */}
      <path d="M64 21q4-7 9-1M78 21q5-8 11-1" fill="var(--kruste)" strokeWidth="1.4" />
    </>
  )
}

export function Radl({ className, fahrend = false }: { className?: string; fahrend?: boolean }) {
  return (
    <svg viewBox="-2 0 122 70" className={`radl ${fahrend ? 'fahrend' : ''} ${className ?? ''}`} aria-hidden style={{ filter: 'url(#krakel)' }}>
      <g fill="none" stroke="var(--tusche)" strokeLinecap="round" strokeLinejoin="round">
        <RadlZeichnung />
      </g>
    </svg>
  )
}
