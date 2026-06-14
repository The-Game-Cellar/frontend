import { useCallback, useEffect, useState, type RefObject } from 'react'

interface GridPageSizeOptions {
  cardWidth?: number
  cardHeight?: number
  gap?: number
  chromeHeight?: number
  min?: number
  max?: number
}

// Computes pageSize so cols × rows aligns with the grid's actual rendered cols. ResizeObserver
// reads the container's exact content width, so the floor() here matches CSS
// `repeat(auto-fill, minmax(cardWidth, 1fr))`. Falls back to window.innerWidth on the very first
// render before the ref attaches.
// Backend caps both endpoints at pageSize=100, so max defaults to 100.
export function useGridPageSize(
  containerRef: RefObject<HTMLElement | null>,
  opts: GridPageSizeOptions = {}
): number {
  const {
    cardWidth = 176,
    cardHeight = 300,
    gap = 16,
    chromeHeight = 320,
    min = 20,
    max = 100,
  } = opts

  // pageSize is always cols × rows so the rendered grid has no half-empty trailing row.
  // min/max clamps are honoured by bumping rows up or down, never by adding loose remainder.
  const compute = useCallback((width: number, height: number): number => {
    const cols = Math.max(1, Math.floor((width + gap) / (cardWidth + gap)))
    const usableHeight = Math.max(0, height - chromeHeight)
    const naturalRows = Math.max(1, Math.floor((usableHeight + gap) / (cardHeight + gap)))
    const minRows = Math.max(1, Math.ceil(min / cols))
    const maxRows = Math.max(1, Math.floor(max / cols))
    const rows = Math.max(minRows, Math.min(naturalRows, maxRows))
    return cols * rows
  }, [cardWidth, cardHeight, gap, chromeHeight, min, max])

  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window === 'undefined') return min
    return compute(window.innerWidth, window.innerHeight)
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const update = (width: number) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setPageSize(compute(width, window.innerHeight)), 200)
    }

    update(el.getBoundingClientRect().width)

    let obs: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      obs = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry) update(entry.contentRect.width)
      })
      obs.observe(el)
    }

    // Window resize handles vertical viewport changes that ResizeObserver does not signal
    // when the container width stays constant.
    const onResize = () => update(el.getBoundingClientRect().width)
    window.addEventListener('resize', onResize)

    return () => {
      obs?.disconnect()
      window.removeEventListener('resize', onResize)
      if (timer) clearTimeout(timer)
    }
  }, [containerRef, compute])

  return pageSize
}
