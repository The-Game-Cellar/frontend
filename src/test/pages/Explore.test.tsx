import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import { renderWithProviders } from '../test-utils'
import Explore from '../../pages/Explore'

const API = 'http://api.test'

describe('Explore page', () => {
  it('renders the Browse / Coming soon tabs', async () => {
    render(renderWithProviders(<Explore />))
    await waitFor(() => expect(screen.getByRole('button', { name: /^browse$/i })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /coming soon/i })).toBeInTheDocument()
  })

  it('populates the genre dropdown from GenresResponse', async () => {
    server.use(
      http.get(`${API}/api/v1/games/genres`, () =>
        HttpResponse.json({ genres: ['Action', 'RPG'] })
      ),
    )
    const user = userEvent.setup()
    render(renderWithProviders(<Explore />))
    await waitFor(() => expect(screen.getByText('Genre')).toBeInTheDocument())
    const genreLabel = screen.getByText('Genre')
    const genreSelectTrigger = genreLabel.parentElement?.querySelector('button')
    if (!genreSelectTrigger) throw new Error('genre dropdown trigger not found')
    await user.click(genreSelectTrigger)
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'RPG' })).toBeInTheDocument()
  })
})
