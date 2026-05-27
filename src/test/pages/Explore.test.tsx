import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

  it('omits releasedFrom/releasedTo when slider is at full range', async () => {
    const captured: URL[] = []
    server.use(
      http.get(`${API}/api/v1/games/search`, ({ request }) => {
        captured.push(new URL(request.url))
        return HttpResponse.json({ games: [], totalCount: 0, page: 0, pageSize: 20 })
      }),
    )
    render(renderWithProviders(<Explore />))
    await waitFor(() => expect(captured.length).toBeGreaterThan(0))
    const last = captured[captured.length - 1]
    expect(last.searchParams.get('releasedFrom')).toBeNull()
    expect(last.searchParams.get('releasedTo')).toBeNull()
  })

  it('passes releasedFrom/releasedTo when slider thumbs move inward', async () => {
    const captured: URL[] = []
    server.use(
      http.get(`${API}/api/v1/games/search`, ({ request }) => {
        captured.push(new URL(request.url))
        return HttpResponse.json({ games: [], totalCount: 0, page: 0, pageSize: 20 })
      }),
    )
    render(renderWithProviders(<Explore />))
    await waitFor(() => expect(screen.getByLabelText('Release year from')).toBeInTheDocument())

    const fromInput = screen.getByLabelText('Release year from') as HTMLInputElement
    const toInput = screen.getByLabelText('Release year to') as HTMLInputElement

    fireEvent.change(fromInput, { target: { value: '2000' } })
    fireEvent.change(toInput, { target: { value: '2010' } })

    await waitFor(() => {
      const last = captured[captured.length - 1]
      expect(last.searchParams.get('releasedFrom')).not.toBeNull()
      expect(last.searchParams.get('releasedTo')).not.toBeNull()
    })
    const last = captured[captured.length - 1]
    const from = Number(last.searchParams.get('releasedFrom'))
    const to = Number(last.searchParams.get('releasedTo'))
    expect(from).toBe(Math.floor(Date.UTC(2000, 0, 1) / 1000))
    expect(to).toBe(Math.floor(Date.UTC(2010, 11, 31, 23, 59, 59) / 1000))
  })

  it('omits tags param when no tags are selected', async () => {
    const captured: URL[] = []
    server.use(
      http.get(`${API}/api/v1/games/search`, ({ request }) => {
        captured.push(new URL(request.url))
        return HttpResponse.json({ games: [], totalCount: 0, page: 0, pageSize: 20 })
      }),
    )
    render(renderWithProviders(<Explore />))
    await waitFor(() => expect(captured.length).toBeGreaterThan(0))
    const last = captured[captured.length - 1]
    expect(last.searchParams.get('tags')).toBeNull()
  })

  it('omits ratingFrom when no threshold is picked', async () => {
    const captured: URL[] = []
    server.use(
      http.get(`${API}/api/v1/games/search`, ({ request }) => {
        captured.push(new URL(request.url))
        return HttpResponse.json({ games: [], totalCount: 0, page: 0, pageSize: 20 })
      }),
    )
    render(renderWithProviders(<Explore />))
    await waitFor(() => expect(captured.length).toBeGreaterThan(0))
    const last = captured[captured.length - 1]
    expect(last.searchParams.get('ratingFrom')).toBeNull()
  })

  it('passes ratingFrom when user picks a threshold from the Rating dropdown', async () => {
    const captured: URL[] = []
    server.use(
      http.get(`${API}/api/v1/games/search`, ({ request }) => {
        captured.push(new URL(request.url))
        return HttpResponse.json({ games: [], totalCount: 0, page: 0, pageSize: 20 })
      }),
    )
    const user = userEvent.setup()
    render(renderWithProviders(<Explore />))
    await waitFor(() => expect(screen.getByText('Rating')).toBeInTheDocument())

    const ratingLabel = screen.getByText('Rating')
    const ratingTrigger = ratingLabel.parentElement?.querySelector('button')
    if (!ratingTrigger) throw new Error('rating dropdown trigger not found')
    await user.click(ratingTrigger)
    await user.click(screen.getByRole('button', { name: '7+' }))

    await waitFor(() => {
      const last = captured[captured.length - 1]
      expect(last.searchParams.get('ratingFrom')).toBe('7')
    })
  })

  it('passes selected tags as CSV when user picks from the Tags dropdown', async () => {
    server.use(
      http.get(`${API}/api/v1/games/tags/popular`, () =>
        HttpResponse.json({ tags: ['metroidvania', 'exploration', 'stealth'] }),
      ),
    )
    const captured: URL[] = []
    server.use(
      http.get(`${API}/api/v1/games/search`, ({ request }) => {
        captured.push(new URL(request.url))
        return HttpResponse.json({ games: [], totalCount: 0, page: 0, pageSize: 20 })
      }),
    )
    const user = userEvent.setup()
    render(renderWithProviders(<Explore />))
    await waitFor(() => expect(screen.getByText('Tags')).toBeInTheDocument())

    const tagsLabel = screen.getByText('Tags')
    const tagsTrigger = tagsLabel.parentElement?.querySelector('button')
    if (!tagsTrigger) throw new Error('tags dropdown trigger not found')
    await user.click(tagsTrigger)

    await waitFor(() => expect(screen.getByRole('button', { name: /metroidvania/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /metroidvania/i }))
    await user.click(screen.getByRole('button', { name: /exploration/i }))

    await waitFor(() => {
      const last = captured[captured.length - 1]
      expect(last.searchParams.get('tags')).toBe('metroidvania,exploration')
    })
  })
})
