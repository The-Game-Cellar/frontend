import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import GameDetail from '../../pages/GameDetail'

const API = 'http://api.test'

function renderGameDetail(igdbId: number) {
  return render(
    <MemoryRouter initialEntries={[`/games/${igdbId}`]}>
      <Routes>
        <Route path="/games/:igdbId" element={<GameDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('GameDetail page', () => {
  it('renders the game title, genres and platforms when fetched', async () => {
    server.use(
      http.get(`${API}/api/v1/games/12345`, () =>
        HttpResponse.json({
          igdbId: 12345,
          name: 'Hollow Knight',
          description: 'Explore twisting caverns.',
          genres: ['Metroidvania'],
          platforms: ['PC'],
          screenshotUrls: [],
          videoIds: [],
        })
      ),
      http.get(`${API}/api/v1/recommendations/similar/12345`, () => HttpResponse.json([])),
    )
    renderGameDetail(12345)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Hollow Knight', level: 1 })).toBeInTheDocument())
    expect(screen.getByText('Metroidvania')).toBeInTheDocument()
    expect(screen.getByText('PC')).toBeInTheDocument()
  })

  it('renders an Add to Library button when the game is not in the user library', async () => {
    server.use(
      http.get(`${API}/api/v1/games/9`, () =>
        HttpResponse.json({ igdbId: 9, name: 'Celeste', genres: [], platforms: [] })
      ),
      http.get(`${API}/api/v1/recommendations/similar/9`, () => HttpResponse.json([])),
    )
    renderGameDetail(9)
    await waitFor(() => expect(screen.getByRole('button', { name: /add to library/i })).toBeInTheDocument())
  })
})
