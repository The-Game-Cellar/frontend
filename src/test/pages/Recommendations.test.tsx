import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import { renderWithProviders } from '../test-utils'
import Recommendations from '../../pages/Recommendations'

const API = 'http://api.test'

describe('Recommendations page', () => {
  it('shows the tier-3 cold-start message when the user has no ratings', async () => {
    render(renderWithProviders(<Recommendations />))
    await waitFor(() =>
      expect(screen.getByText(/rate games in your library to unlock personalized recommendations/i)).toBeInTheDocument()
    )
  })

  it('renders fetched rows when the backend returns grouped data', async () => {
    server.use(
      http.post(`${API}/api/v1/recommendations/personalized/grouped`, () =>
        HttpResponse.json({
          rows: [{
            label: 'More like Hollow Knight',
            genre: 'Metroidvania',
            fallback: false,
            games: [{ igdbId: 1, name: 'Ori', genres: ['Metroidvania'], platforms: ['PC'] }],
          }],
          tier: 1,
        })
      ),
    )
    render(renderWithProviders(<Recommendations />))
    await waitFor(() => expect(screen.getByText(/more like hollow knight/i)).toBeInTheDocument())
  })
})
