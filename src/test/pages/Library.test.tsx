import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import Library from '../../pages/Library'

const API = 'http://api.test'

describe('Library page', () => {
  it('renders the empty-library message when the user has no entries', async () => {
    render(<MemoryRouter><Library /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText(/your library is empty/i)).toBeInTheDocument())
  })

  it('switches the active tab when a status filter is clicked', async () => {
    server.use(
      http.get(`${API}/api/v1/library/games`, ({ request }) => {
        const url = new URL(request.url)
        if (url.searchParams.get('status') === 'BACKLOG') {
          return HttpResponse.json([{
            id: 1, igdbGameId: 99, gameName: 'Backlog Pick', status: 'BACKLOG',
          }])
        }
        return HttpResponse.json([])
      }),
    )
    const user = userEvent.setup()
    render(<MemoryRouter><Library /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'BACKLOG' }))
    await waitFor(() => expect(screen.getByText('Backlog Pick')).toBeInTheDocument())
  })
})
