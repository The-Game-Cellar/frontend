import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render } from '@testing-library/react'
import { RecommendDemo } from '../../../components/landing/recommend'
import RecommendScreen from '../../../components/landing/RecommendScreen'

const shelves = () => Array.from(document.querySelectorAll('[data-room="recommend"] .shelf'))
const names = (shelf: Element) => Array.from(shelf.querySelectorAll('.card .nm')).map((n) => n.textContent)
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

// jsdom has no layout, so the screen is given one: 1200 x 500, which fits the room at 0.8 and seven cards a row.
function giveLayout() {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1200)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(500)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1200)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
}

describe('RecommendScreen, the genre shelves', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    giveLayout()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('lays every shelf out as one row that fits the screen', () => {
    const demo = new RecommendDemo(() => 0)
    render(<RecommendScreen demo={demo} />)
    expect(shelves().map((s) => s.querySelector('.lab')?.textContent)).toEqual(['Adventure', 'Role-playing (RPG)', 'Indie'])
    shelves().forEach((s) => expect(names(s)).toHaveLength(7))
    expect(parseFloat((document.querySelector('[data-room="recommend"]') as HTMLElement).style.width)).toBe(1500)
    demo.dispose()
  })

  it('refreshes the first shelf on through its pool, dimmed while the call runs', () => {
    const demo = new RecommendDemo(() => 0)
    render(<RecommendScreen demo={demo} />)
    const first = names(shelves()[0])
    const others = shelves().slice(1).map(names)
    const ghost = () => shelves()[0].querySelector('.ghost') as HTMLElement

    advance(6400)
    expect(ghost()).toHaveClass('press')
    advance(350)
    expect(ghost()).toHaveClass('busy')
    expect(ghost().textContent).toBe('↻ Refreshing…')
    expect(shelves()[0].querySelector('.srow')).toHaveClass('busy')

    advance(1200)
    expect(ghost().textContent).toBe('↻ Refresh')
    const next = names(shelves()[0])
    expect(next).toHaveLength(7)
    expect(next.filter((n) => first.includes(n))).toHaveLength(0)
    expect(shelves().slice(1).map(names)).toEqual(others)
    demo.dispose()
  })
})
