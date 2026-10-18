import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { prefersReducedMotion } from '../public/usePublicPageMotion'

// A room is drawn when its window is a quarter visible, so its cards rise and its signs light up as the
// visitor sees them; under reduced motion, or without IntersectionObserver, it is drawn at once.
export function useStartWhenSeen(targetRef: RefObject<HTMLElement | null>, start: () => void): void {
  const startRef = useRef(start)
  useLayoutEffect(() => {
    startRef.current = start
  })

  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      startRef.current()
      return
    }
    const seen = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          seen.disconnect()
          startRef.current()
        }
      },
      { threshold: 0.25 },
    )
    seen.observe(el)
    return () => seen.disconnect()
  }, [targetRef])
}

// A card rises when it mounts and loses the class at its screen's next change, as the room re-renders.
export function useIsNew(version: number): boolean {
  const [mountedAt] = useState(version)
  return version === mountedAt
}
