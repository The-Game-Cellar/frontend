import { createContext, useContext, useEffect, useState } from 'react'
import type { RefObject } from 'react'

interface Revealed {
  all: boolean
  keys: ReadonlySet<string>
}

export const RevealContext = createContext<Revealed>({ all: true, keys: new Set() })

// Elements marked data-reveal rise into place the first time a fifth of them is on screen; without
// IntersectionObserver they stand in place from the start.
export function useRevealObserver(rootRef: RefObject<HTMLElement | null>): Revealed {
  const [revealed, setRevealed] = useState<Revealed>(() => ({ all: typeof IntersectionObserver === 'undefined', keys: new Set() }))

  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        const shown = entries.filter((en) => en.isIntersecting).map((en) => en.target as HTMLElement)
        if (!shown.length) return
        shown.forEach((el) => io.unobserve(el))
        setRevealed((prev) => {
          const keys = new Set(prev.keys)
          shown.forEach((el) => keys.add(el.dataset.reveal ?? ''))
          return { all: prev.all, keys }
        })
      },
      { threshold: 0.18 },
    )
    root.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [rootRef])

  return revealed
}

// The class list a revealing element carries: reveal, plus in once it has been seen.
export function useRevealClass(): (key: string) => string {
  const { all, keys } = useContext(RevealContext)
  return (key) => (all || keys.has(key) ? 'reveal in' : 'reveal')
}
