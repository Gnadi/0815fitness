import { m } from 'motion/react'

/** Die Plätze im Ofen als Sackerl: vergebene gefüllt, freie nur skizziert, das eigene in Kuli-Blau. */
export function Ofen({ kapazitaet, vergeben, eigenes }: { kapazitaet: number; vergeben: number; eigenes: boolean }) {
  const frei = kapazitaet - vergeben - (eigenes ? 1 : 0)
  return (
    <div className="ofen">
      <div className="sackerl-raster" role="img" aria-label={`${vergeben} von ${kapazitaet} Sackerl vergeben`}>
        {Array.from({ length: kapazitaet }, (_, i) => {
          const art = i < vergeben ? 'voll' : i === vergeben && eigenes ? 'deins' : 'frei'
          return (
            <m.svg
              key={i}
              viewBox="0 0 20 24"
              className={`sackerl ${art}`}
              initial={{ opacity: 0, y: -6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.012 }}
            >
              <path d="M3 6h14l-1 16H4z" />
              <path d="M3 6l2-4h10l2 4" />
            </m.svg>
          )
        })}
      </div>
      <p className="ofen-text">
        <strong>{frei}</strong> von {kapazitaet} Sackerl noch frei
        {eigenes && <span className="hand kuli"> – eins ist schon deins!</span>}
      </p>
    </div>
  )
}
