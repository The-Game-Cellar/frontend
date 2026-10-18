import { describe, it, expect } from 'vitest'
import { columnsOf, dustyFill, fitRoom, recommendFit } from '../../../components/landing/fit'

describe('fitRoom', () => {
  it('scales the room so its own height fills the frame', () => {
    const fit = fitRoom('library', 1100, 450)!
    expect(fit.k).toBeCloseTo(0.75)
    expect(fit.width).toBeCloseTo(1100 / 0.75)
    expect(fit.height).toBeCloseTo(600)
  })

  it('grows the room past 1600 px of width instead of widening it', () => {
    const fit = fitRoom('explore', 2000, 300)!
    expect(fit.k).toBeCloseTo(0.8)
    expect(fit.width).toBeCloseTo(2500)
  })

  it('keeps the scale between 0.4 and 0.8', () => {
    expect(fitRoom('recommend', 300, 100)!.k).toBe(0.4)
    expect(fitRoom('recommend', 3000, 1000)!.k).toBe(0.8)
  })

  it('does not fit a screen that has no size yet', () => {
    expect(fitRoom('dusty', 0, 400)).toBeNull()
    expect(fitRoom('dusty', 400, 0)).toBeNull()
  })
})

describe('the shelf sizes a fit gives', () => {
  it('counts the cards across a shelf, at least two', () => {
    expect(columnsOf(1401.7)).toBe(6)
    expect(columnsOf(2565)).toBe(13)
    expect(columnsOf(200)).toBe(2)
  })

  it('fills the Dusty wall to one row more than the screen shows', () => {
    // 6 columns of about 206 px, cards about 321 px tall: 456 px below the bars hold 2 rows, so 3 are drawn
    expect(dustyFill({ k: 0.75, width: 1400, height: 600 })).toBe(18)
  })

  it('caps Recommend\'s row at fifteen cards', () => {
    expect(recommendFit(4000)).toBe(15)
    expect(recommendFit(1500)).toBe(7)
  })
})
