export const wenigBewegung = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Lässt ein Gebäck-Emoji im Bogen vom Knopf in den Warenkorb fliegen. */
export function fliegZumKorb(von: HTMLElement, emoji: string) {
  if (wenigBewegung()) return
  const ziel = Array.from(document.querySelectorAll<HTMLElement>('[data-korb-ziel]')).find((e) => e.getClientRects().length > 0)
  if (!ziel) return
  const a = von.getBoundingClientRect()
  const b = ziel.getBoundingClientRect()
  const x0 = a.left + a.width / 2
  const y0 = a.top + a.height / 2
  const dx = b.left + b.width / 2 - x0
  const dy = b.top + b.height / 2 - y0

  const el = document.createElement('span')
  el.className = 'flieger'
  el.textContent = emoji
  el.style.left = `${x0}px`
  el.style.top = `${y0}px`
  document.body.appendChild(el)

  const anim = el.animate(
    [
      { transform: 'translate(-50%, -50%) scale(.6) rotate(0deg)', opacity: 0.4 },
      { transform: `translate(calc(-50% + ${dx * 0.45}px), calc(-50% + ${dy * 0.45 - 140}px)) scale(1.5) rotate(160deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.35) rotate(340deg)`, opacity: 0.9 },
    ],
    { duration: 800, easing: 'cubic-bezier(.45,0,.35,1)' },
  )
  anim.onfinish = () => {
    el.remove()
    ziel.classList.remove('hupf')
    void ziel.offsetWidth
    ziel.classList.add('hupf')
  }
}
