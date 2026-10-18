import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render } from '@testing-library/react'
import { ExploreDemo } from '../../../components/landing/explore'
import ExploreScreen from '../../../components/landing/ExploreScreen'

const room = () => document.querySelector('[data-room="explore"]') as HTMLElement
const query = () => room().querySelector('.q')?.textContent
const count = () => room().querySelector('.count')?.textContent
const cards = () => room().querySelectorAll('.card').length
const loadingShown = () => !(room().querySelector('.empty') as HTMLElement).hidden
const resetShown = () => !(room().querySelector('.reset') as HTMLElement).hidden
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

describe('ExploreScreen, the Browse demo', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('types each search, clears the wall under Loading, then shows game_db\'s answer with its real count', () => {
    const demo = new ExploreDemo(() => 0)
    render(<ExploreScreen demo={demo} />)

    // Popular between searches, counted over the whole catalog with thin-space thousands
    expect(cards()).toBe(48)
    expect(count()).toBe('308 300 games')
    expect(resetShown()).toBe(false)

    advance(2600 + 400)
    expect(query()).toBe('z')
    expect(room().querySelector('.search')).toHaveClass('typing')
    expect(resetShown()).toBe(true)
    advance(4 * 130)
    expect(query()).toBe('zelda')

    advance(130)
    expect(loadingShown()).toBe(true)
    expect(room().querySelector('.empty .h')?.textContent).toBe('Loading')
    expect(cards()).toBe(0)

    advance(1100)
    expect(loadingShown()).toBe(false)
    expect(cards()).toBe(72)
    expect(count()).toBe('126 games')
    expect(room().querySelector('.card .nm')?.textContent).toBe('The Legend of Zelda: A Link to the Past')

    advance(4800)
    expect(query()).toBe('')
    expect(resetShown()).toBe(false)
    expect(room().querySelector('.search')).not.toHaveClass('typing')
    expect(loadingShown()).toBe(true)

    advance(1100)
    expect(cards()).toBe(48)
    expect(count()).toBe('308 300 games')
    demo.dispose()
  })

  it('moves on to the next search after Popular has stood for a while', () => {
    const demo = new ExploreDemo(() => 0)
    render(<ExploreScreen demo={demo} />)
    // zelda: 2600 wait, 400 + 5 x 130 typing, 1100 loading, 4800 shown, 1100 loading, 3600 popular
    advance(2600 + 400 + 5 * 130 + 1100 + 4800 + 1100 + 3600 + 400 + 4 * 130)
    expect(query()).toBe('souls')
    demo.dispose()
  })

  it('shows a search result with the score on the ten-point scale it carries in the catalog', () => {
    const demo = new ExploreDemo(() => 0)
    render(<ExploreScreen demo={demo} />)
    advance(2600 + 400 + 5 * 130 + 1100)
    const ocarina = Array.from(room().querySelectorAll('.card')).find((c) => c.querySelector('.nm')?.textContent === 'The Legend of Zelda: Ocarina of Time')!
    expect(ocarina.querySelector('.rt:last-child')?.textContent).toBe('★9.2/10')
    demo.dispose()
  })
})
