import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render } from '@testing-library/react'
import { DemoCellar } from '../../../components/landing/cellar'
import type { CellarSnapshot } from '../../../components/landing/cellar'
import LibraryScreen from '../../../components/landing/LibraryScreen'

function counts(snap: CellarSnapshot): Record<string, number> {
  const n: Record<string, number> = {}
  snap.entries.forEach((e) => {
    n[e.status] = (n[e.status] ?? 0) + 1
  })
  return n
}

const statusOf = (snap: CellarSnapshot, id: number) => snap.entries.find((e) => e.game.id === id)?.status

// A random source that walks a fixed sequence, so every pick is known.
function sequence(...values: number[]) {
  let i = 0
  return () => values[i++ % values.length]
}

describe('DemoCellar, the library the Library and Dusty screens share', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('fills each shelf to the rows its screen shows: Playing one, Backlog and Completed two', () => {
    const cellar = new DemoCellar(sequence(0))
    cellar.setFill('library', 6)
    cellar.setFill('dusty', 18)
    vi.advanceTimersByTime(60)
    expect(counts(cellar.getSnapshot())).toEqual({ PLAYING: 6, BACKLOG: 12, WISHLIST: 5, DUSTY: 18, COMPLETED: 12, DROPPED: 6 })
  })

  it('rebuilds once a screen reports a different size', () => {
    const cellar = new DemoCellar(sequence(0))
    cellar.setFill('library', 4)
    vi.advanceTimersByTime(59)
    expect(counts(cellar.getSnapshot()).PLAYING).toBe(6)
    vi.advanceTimersByTime(1)
    expect(counts(cellar.getSnapshot()).PLAYING).toBe(4)
  })

  it('makes a Library step a swap with Playing, both cards ringed while they move', () => {
    const cellar = new DemoCellar(sequence(0))
    cellar.start('library', false)
    const before = counts(cellar.getSnapshot())
    cellar.libraryStep()
    const ringed = [...cellar.getSnapshot().picks.library]
    expect(ringed).toHaveLength(2)
    const [a, b] = ringed
    expect(statusOf(cellar.getSnapshot(), a)).toBe('PLAYING')
    const target = statusOf(cellar.getSnapshot(), b)
    expect(['BACKLOG', 'COMPLETED', 'DROPPED']).toContain(target)

    vi.advanceTimersByTime(1100)
    expect(statusOf(cellar.getSnapshot(), a)).toBe(target)
    expect(statusOf(cellar.getSnapshot(), b)).toBe('PLAYING')
    expect(counts(cellar.getSnapshot())).toEqual(before)
    expect(cellar.getSnapshot().picks.library.size).toBe(2)

    vi.advanceTimersByTime(1400)
    expect(cellar.getSnapshot().picks.library.size).toBe(0)
  })

  it('makes a Dusty step a swap with Playing: the dust blows off one game and settles on another', () => {
    const cellar = new DemoCellar(sequence(0))
    cellar.start('dusty', false)
    const before = counts(cellar.getSnapshot())
    cellar.dustyStep()
    const [d] = [...cellar.getSnapshot().picks.dusty]
    expect(statusOf(cellar.getSnapshot(), d)).toBe('DUSTY')
    const p = cellar.getSnapshot().entries.find((e) => e.status === 'PLAYING')!.game.id

    vi.advanceTimersByTime(900)
    expect(cellar.getSnapshot().blowing.has(d)).toBe(true)

    vi.advanceTimersByTime(1100)
    const after = cellar.getSnapshot()
    expect(after.blowing.has(d)).toBe(false)
    expect(statusOf(after, d)).toBe('PLAYING')
    expect(statusOf(after, p)).toBe('DUSTY')
    expect(counts(after)).toEqual(before)
  })

  it('never lets a shelf lose a card over a long run of both loops', () => {
    const cellar = new DemoCellar()
    cellar.start('library', true)
    cellar.start('dusty', true)
    const before = counts(cellar.getSnapshot())
    for (let t = 0; t < 120; t++) {
      vi.advanceTimersByTime(1000)
      expect(counts(cellar.getSnapshot())).toEqual(before)
    }
    cellar.dispose()
  })
})

describe('LibraryScreen on the Dusty tab', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('blows the dust off the picked game, then lets it settle on the game that turned Dusty', () => {
    const cellar = new DemoCellar(sequence(0))
    render(<LibraryScreen cellar={cellar} tab="DUSTY" />)
    const wall = () => Array.from(document.querySelectorAll('[data-room="dusty"] .card'))
    const names = () => wall().map((c) => c.querySelector('.nm')?.textContent)
    expect(wall().length).toBeGreaterThan(0)
    wall().forEach((c) => expect(c).toHaveClass('dusty'))
    const before = names()

    act(() => { vi.advanceTimersByTime(2300 + 900) })
    const blowing = wall().filter((c) => c.classList.contains('blow'))
    expect(blowing).toHaveLength(1)
    expect(blowing[0]).toHaveAttribute('data-s', 'PLAYING')
    expect(blowing[0]).toHaveClass('pick')
    const leaving = blowing[0].querySelector('.nm')?.textContent

    act(() => { vi.advanceTimersByTime(1100) })
    expect(names()).not.toContain(leaving)
    expect(names()).toHaveLength(before.length)
    const arrived = wall().find((c) => !before.includes(c.querySelector('.nm')?.textContent ?? ''))!
    expect(arrived).not.toHaveClass('dusty')

    act(() => { vi.advanceTimersByTime(700) })
    expect(arrived).toHaveClass('dusty')
    cellar.dispose()
  })
})
