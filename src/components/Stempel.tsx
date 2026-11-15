/** Runder, rotierender Sticker mit Text im Kreis. */
export function Stempel({ text, mitte, className }: { text: string; mitte: string; className?: string }) {
  return (
    <div className={`stempel ${className ?? ''}`} aria-hidden>
      <svg viewBox="0 0 200 200" className="stempel-ring">
        <defs>
          <path id="stempel-kreis" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
        </defs>
        <text>
          <textPath href="#stempel-kreis" startOffset="0">{text}</textPath>
        </text>
      </svg>
      <span className="stempel-mitte">{mitte}</span>
    </div>
  )
}
