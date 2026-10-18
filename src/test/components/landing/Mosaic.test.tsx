import { describe, it, expect } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { drawMosaic, SERIES_ODDS } from '../../../components/landing/drawMosaic'
import { COVER_POOL } from '../../../components/landing/fixture'
import Mosaic from '../../../components/landing/Mosaic'

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

const covers = (rows: ReturnType<typeof drawMosaic>) => rows.flat().map((t) => t.cover).filter((c) => c !== null)

describe('drawMosaic', () => {
  it('never shows one cover twice', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const shown = covers(drawMosaic(COVER_POOL, 2540, seeded(seed))).map((c) => c.cover)
      expect(new Set(shown).size).toBe(shown.length)
    }
  })

  it('reaches from the band edge to the middle of the screen, seven rows of at least six', () => {
    expect(drawMosaic(COVER_POOL, 2540, seeded(1)).map((r) => r.length)).toEqual(Array(7).fill(9))
    expect(drawMosaic(COVER_POOL, 500, seeded(1)).map((r) => r.length)).toEqual(Array(7).fill(6))
  })

  it('holds a second entry of a series back when the draw is above the odds', () => {
    const above = () => SERIES_ODDS + 0.5
    const families = covers(drawMosaic(COVER_POOL, 2540, above)).map((c) => c.family)
    expect(new Set(families).size).toBe(families.length)
  })

  it('lets a second entry of a series through when the draw is within the odds', () => {
    const within = () => SERIES_ODDS / 2
    const families = covers(drawMosaic(COVER_POOL, 2540, within)).map((c) => c.family)
    expect(new Set(families).size).toBeLessThan(families.length)
  })
})

describe('Mosaic', () => {
  it('leaves the gradient tile when a cover fails to load', () => {
    const { container } = render(<Mosaic />)
    const tile = container.querySelector('.tile img')!.closest('.tile') as HTMLElement
    expect(tile.querySelector('.tone')).not.toBeNull()
    fireEvent.error(tile.querySelector('img')!)
    expect(tile.querySelector('img')).toBeNull()
    expect(tile.querySelector('.tone')).toBeNull()
    expect(tile.style.getPropertyValue('--a')).toMatch(/^var\(--s\d\)$/)
  })
})
