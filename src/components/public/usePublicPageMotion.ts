import { useEffect } from 'react'
import type { RefObject } from 'react'

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface Options {
  // The front page scrolls instantly under reduced motion; the privacy page has always scrolled smoothly.
  smoothUnderReducedMotion?: boolean
}

// Smooth in-page scrolling while a public page is mounted, and its SMIL gradients paused under
// reduced motion, since they ignore the CSS motion reset.
export default function usePublicPageMotion(
  rootRef: RefObject<HTMLElement | null>,
  { smoothUnderReducedMotion = true }: Options = {},
) {
  useEffect(() => {
    const root = document.documentElement
    const reduced = prefersReducedMotion()
    if (smoothUnderReducedMotion || !reduced) root.style.scrollBehavior = 'smooth'

    if (reduced) {
      rootRef.current?.querySelectorAll('svg').forEach((svg) => svg.pauseAnimations?.())
    }

    return () => {
      root.style.scrollBehavior = ''
    }
  }, [rootRef, smoothUnderReducedMotion])
}
