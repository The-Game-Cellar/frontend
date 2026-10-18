import type { CSSProperties } from 'react'
import type { Fit } from './fit'

export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ')
}

// The scale and the unscaled size the fit gives a room; before the first measure the CSS default scale stands.
export function fitStyle(fit: Fit | null): CSSProperties | undefined {
  if (!fit) return undefined
  return { '--k': fit.k.toFixed(3), width: `${fit.width.toFixed(1)}px`, height: `${fit.height.toFixed(1)}px` } as CSSProperties
}
