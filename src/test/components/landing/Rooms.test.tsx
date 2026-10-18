import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import Rooms from '../../../components/landing/Rooms'

const current = () => document.querySelector('.tile-card.cur')?.getAttribute('data-card')
const active = () => document.querySelector('.rooms-rail a.active')?.getAttribute('data-go')
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

describe('Rooms, the rail and its one window', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('opens on Library with its hairline running', () => {
    render(<Rooms />)
    expect(current()).toBe('library')
    expect(active()).toBe('library')
    expect(document.querySelector('.rooms-rail a.active .prog')).toHaveClass('run')
  })

  it('moves on every 15 s in the rail order and comes round again', () => {
    render(<Rooms />)
    const seen = [current()]
    for (let i = 0; i < 4; i++) {
      advance(14750)
      expect(current()).toBe(seen[seen.length - 1])
      advance(250)
      seen.push(current())
    }
    expect(seen).toEqual(['library', 'dusty', 'recommend', 'explore', 'library'])
    expect(active()).toBe('library')
  })

  it('holds while the pointer is over the rail or the window, and resumes when it leaves', () => {
    const { container } = render(<Rooms />)
    const bento = container.querySelector('.bento') as HTMLElement
    fireEvent.pointerEnter(bento)
    expect(document.querySelector('.rooms-rail')).toHaveClass('held')
    // not a whole lap of the four rooms, which would land back on Library
    advance(20000)
    expect(current()).toBe('library')
    fireEvent.pointerLeave(bento)
    expect(document.querySelector('.rooms-rail')).not.toHaveClass('held')
    advance(15000)
    expect(current()).toBe('dusty')
  })

  it('switches on a rail click and starts the clock again from there', () => {
    render(<Rooms />)
    advance(10000)
    fireEvent.click(screen.getByRole('link', { name: 'Explore' }))
    expect(current()).toBe('explore')
    expect(active()).toBe('explore')
    advance(14750)
    expect(current()).toBe('explore')
    advance(250)
    expect(current()).toBe('library')
  })

  it('restarts the hairline on a switch', () => {
    render(<Rooms />)
    const before = document.querySelector('.rooms-rail a.active .prog')
    fireEvent.click(screen.getByRole('link', { name: 'Recommend' }))
    const after = document.querySelector('.rooms-rail a.active .prog')
    expect(after).toHaveClass('run')
    expect(after).not.toBe(before)
  })

  it('draws the dust already settled on the first draw of both Library screens', () => {
    render(<Rooms />)
    const dusty = Array.from(document.querySelectorAll('[data-room="library"] .card[data-s="DUSTY"], [data-room="dusty"] .card'))
    expect(dusty.length).toBeGreaterThan(0)
    dusty.forEach((c) => expect(c).toHaveClass('dusty'))
  })

  it('takes no click on the window', () => {
    render(<Rooms />)
    fireEvent.click(document.querySelector('.tile-card.cur') as HTMLElement)
    expect(current()).toBe('library')
    expect(document.querySelector('.tile-card.cur')?.closest('a, button')).toBeNull()
  })
})

describe('Rooms under reduced motion', () => {
  let original: typeof window.matchMedia

  beforeEach(() => {
    vi.useFakeTimers()
    original = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = original
    vi.useRealTimers()
  })

  it('draws every screen at rest and starts no timer', () => {
    render(<Rooms />)
    expect(vi.getTimerCount()).toBe(0)
    expect(document.querySelector('.rooms-rail a.active .prog')).not.toHaveClass('run')
    // every screen is drawn at once rather than when its window is seen
    expect(document.querySelector('[data-room="library"] .card')).not.toBeNull()
    expect(document.querySelector('[data-room="dusty"] .card.dusty')).not.toBeNull()
    expect(document.querySelector('[data-room="explore"] .card')).not.toBeNull()
    advance(60000)
    expect(current()).toBe('library')
    expect(document.querySelector('[data-room="explore"] .q')?.textContent).toBe('')
  })
})
