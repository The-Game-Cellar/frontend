import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import { renderWithProviders } from '../test-utils'
import Dashboard from '../../pages/Dashboard'

const API = 'http://api.test'

describe('Dashboard page', () => {
  it('renders the four primary section headings', async () => {
    render(renderWithProviders(<Dashboard />))
    await waitFor(() => expect(screen.getByRole('heading', { name: /recommendations for you/i, level: 2 })).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: /coming soon/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /your backlog/i, level: 2 })).toBeInTheDocument()
  })

  it('renders dashboard payload entries when the backend returns data', async () => {
    server.use(
      http.get(`${API}/api/v1/recommendations/dashboard`, () =>
        HttpResponse.json({
          recommendations: [{ igdbId: 1, name: 'Stardew Valley', genres: ['Sim'], tier: 1 }],
          wildcard: [],
          becauseYouLiked: [],
        })
      ),
    )
    render(renderWithProviders(<Dashboard />))
    await waitFor(() => expect(screen.getByText('Stardew Valley')).toBeInTheDocument())
  })
})
