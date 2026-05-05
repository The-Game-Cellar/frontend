import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import { renderWithProviders } from '../test-utils'
import WildCard from '../../pages/WildCard'

const API = 'http://api.test'

describe('WildCard page', () => {
  it('renders fetched games into cards', async () => {
    server.use(
      http.get(`${API}/api/v1/recommendations/wildcard`, () =>
        HttpResponse.json([{ igdbId: 42, name: 'Hollow Knight', genres: ['Metroidvania'], platforms: ['PC'] }])
      ),
    )
    render(renderWithProviders(<WildCard />))
    await waitFor(() => expect(screen.getByText('Hollow Knight')).toBeInTheDocument())
  })

  it('shows the empty-hand message when the backend returns no picks', async () => {
    render(renderWithProviders(<WildCard />))
    await waitFor(() => expect(screen.getByText(/no games found/i)).toBeInTheDocument())
  })
})
