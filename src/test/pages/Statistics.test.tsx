import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import { renderWithProviders } from '../test-utils'
import Statistics from '../../pages/Statistics'

const API = 'http://api.test'

function renderStatistics() {
  return render(renderWithProviders(<Statistics />))
}

describe('Statistics page', () => {
  it('renders library overview, rating overview, genre bars, and platform bars', async () => {
    server.use(
      http.get(`${API}/api/v1/library/stats`, () =>
        HttpResponse.json({
          totalGames: 10,
          byStatus: { PLAYING: 2, BACKLOG: 5, COMPLETED: 2, WISHLIST: 1 },
          averageRating: 7.5,
          totalRated: 4,
          byGenre: { RPG: 5, Action: 3, Adventure: 2 },
          byPlatform: { PC: 6, 'PlayStation 5': 3, 'Nintendo Switch': 1 },
        }),
      ),
    )
    renderStatistics()

    await waitFor(() => expect(screen.getByText('Library overview')).toBeInTheDocument())
    expect(screen.getByText(/games in library/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /playing/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /backlog/i })).toBeInTheDocument()
    expect(screen.getByText(/average rating/i)).toBeInTheDocument()
    expect(screen.getByText('7.5')).toBeInTheDocument()
    expect(screen.getByText(/games rated/i)).toBeInTheDocument()
    expect(screen.getByText('Games by genre')).toBeInTheDocument()
    expect(screen.getByText('Games by platform')).toBeInTheDocument()
    expect(screen.getByText('RPG')).toBeInTheDocument()
    expect(screen.getByText('PC')).toBeInTheDocument()
    expect(screen.getByText('PlayStation 5')).toBeInTheDocument()
  })

  it('toggles show all when there are more than 8 genres', async () => {
    const manyGenres: Record<string, number> = {}
    for (let i = 1; i <= 12; i += 1) manyGenres[`Genre ${i}`] = 13 - i
    server.use(
      http.get(`${API}/api/v1/library/stats`, () =>
        HttpResponse.json({
          totalGames: 12,
          byStatus: { BACKLOG: 12 },
          averageRating: 0,
          totalRated: 0,
          byGenre: manyGenres,
          byPlatform: {},
        }),
      ),
    )
    renderStatistics()

    await waitFor(() => expect(screen.getByText('Genre 1')).toBeInTheDocument())
    expect(screen.queryByText('Genre 12')).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /show all 12/i }))
    expect(screen.getByText('Genre 12')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /show fewer/i }))
    expect(screen.queryByText('Genre 12')).not.toBeInTheDocument()
  })

  it('renders empty state when no library data exists', async () => {
    server.use(
      http.get(`${API}/api/v1/library/stats`, () =>
        HttpResponse.json({
          totalGames: 0,
          byStatus: {},
          averageRating: 0,
          totalRated: 0,
          byGenre: {},
          byPlatform: {},
        }),
      ),
    )
    renderStatistics()

    await waitFor(() => expect(screen.getByText(/no statistics yet/i)).toBeInTheDocument())
  })
})
