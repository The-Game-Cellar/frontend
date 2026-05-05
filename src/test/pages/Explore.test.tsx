import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import Explore from '../../pages/Explore'

const API = 'http://api.test'

describe('Explore page', () => {
  it('renders the Browse / Coming soon tabs', async () => {
    render(<MemoryRouter><Explore /></MemoryRouter>)
    await waitFor(() => expect(screen.getByRole('button', { name: /^browse$/i })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /coming soon/i })).toBeInTheDocument()
  })

  // Surfaced-bug regression — backend returns Record<string, string[]>; the page must
  // populate the genre dropdown from the top-level keys, not from a non-existent .genres field.
  // Asserts the genre StyledSelect's option list contains the backend keys after expanding.
  it('populates the genre dropdown from the canonical Record<string,string[]> shape', async () => {
    server.use(
      http.get(`${API}/api/v1/games/genres`, () =>
        HttpResponse.json({ Action: ['Brawler'], RPG: ['JRPG', 'WRPG'] })
      ),
    )
    const user = userEvent.setup()
    render(<MemoryRouter><Explore /></MemoryRouter>)
    // Wait until the page mount + initial fetches have settled.
    await waitFor(() => expect(screen.getByText('Genre')).toBeInTheDocument())
    // Open the Genre dropdown — its trigger sits next to the "Genre" label.
    const genreLabel = screen.getByText('Genre')
    const genreSelectTrigger = genreLabel.parentElement?.querySelector('button')
    if (!genreSelectTrigger) throw new Error('genre dropdown trigger not found')
    await user.click(genreSelectTrigger)
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'RPG' })).toBeInTheDocument()
  })
})
