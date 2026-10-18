import type { PoolCover } from './fixture'
import { shuffle } from './demo'
import type { Random } from './demo'

export interface Tile {
  a: string
  b: string
  opacity: string
  cover: PoolCover | null
}

// Once a series holds a tile, another entry from it only gets through at these odds, so repeats of one
// franchise are rare rather than impossible.
export const SERIES_ODDS = 0.15
const ROWS = 7
const TILE_W = 150
const GAP = 18
const PAIRS: readonly [string, string][] = [['s1', 's3'], ['s2', 's4'], ['s3', 's5'], ['s1', 's5'], ['s4', 's2'], ['s5', 's1'], ['s2', 's3'], ['s3', 's1']]

// Each load draws a different subset of the pool. The band's left edge sits 20 % of the viewport off-screen,
// so a row holds enough tiles to reach the middle from there. Every visible cover is unique: once the pool is
// spent a tile stays a gradient rather than repeat one.
export function drawMosaic(pool: readonly PoolCover[], viewportWidth: number, random: Random): Tile[][] {
  const picked: PoolCover[] = []
  const held: PoolCover[] = []
  const seen = new Set<string>()
  shuffle(pool, random).forEach((cv) => {
    if (seen.has(cv.family) && random() > SERIES_ODDS) {
      held.push(cv)
      return
    }
    seen.add(cv.family)
    picked.push(cv)
  })
  const order = picked.concat(held)
  const perRow = Math.max(6, Math.round((viewportWidth * 0.62) / (TILE_W + GAP)))
  let slot = 0
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: perRow }, (_, c) => {
      const [a, b] = PAIRS[(r * 5 + c * 3) % PAIRS.length]
      const cover = slot < order.length ? order[slot++] : null
      return { a, b, opacity: (0.22 + ((r * 7 + c * 11) % 9) * 0.03).toFixed(2), cover }
    }),
  )
}
