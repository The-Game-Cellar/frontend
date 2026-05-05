import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import Dashboard from '../../pages/Dashboard'
import { invalidateDashboard, invalidatePrefetchedPersonalized } from '../../services/recommendationService'

const API = 'http://api.test'

describe('Dashboard page', () => {
  beforeEach(() => {
    // Module-level prefetch caches survive vitest's per-test cleanup; reset them
    // explicitly so each test starts from a known state and the mock handlers fire.
    invalidateDashboard()
    invalidatePrefetchedPersonalized()
  })

  it('renders the four primary section headings', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
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
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Stardew Valley')).toBeInTheDocument())
  })
})
