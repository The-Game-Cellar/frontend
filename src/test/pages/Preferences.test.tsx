import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import { renderWithProviders } from '../test-utils'
import Preferences from '../../pages/Preferences'

const API = 'http://api.test'

function renderPreferences() {
  return render(renderWithProviders(<Preferences />))
}

describe('Preferences page', () => {
  it('renders the platforms and genre-preferences sections', async () => {
    server.use(
      http.get(`${API}/api/v1/library/platforms`, () =>
        HttpResponse.json([{ id: 1, platformName: 'PC', isPrimary: false }]),
      ),
      http.get(`${API}/api/v1/games/genres`, () =>
        HttpResponse.json({ genres: ['RPG', 'Action'] }),
      ),
      http.get(`${API}/api/v1/library/genre-preferences`, () =>
        HttpResponse.json([{ genreName: 'RPG' }]),
      ),
    )
    renderPreferences()

    await waitFor(() => expect(screen.getByTitle(/remove pc/i)).toBeInTheDocument())
    expect(screen.getByText('Platforms')).toBeInTheDocument()
    expect(screen.getByText('Genre preferences')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'RPG' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })

  it('renders the tag-preferences section with chips from the catalog', async () => {
    server.use(
      http.get(`${API}/api/v1/games/tags/popular`, () =>
        HttpResponse.json({ tags: ['cozy', 'atmospheric', 'story rich'] }),
      ),
      http.get(`${API}/api/v1/library/tag-preferences`, () =>
        HttpResponse.json([{ tagName: 'cozy' }]),
      ),
    )
    renderPreferences()

    await waitFor(() => expect(screen.getByRole('button', { name: 'cozy' })).toBeInTheDocument())
    expect(screen.getByText('Tag preferences')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'atmospheric' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'story rich' })).toBeInTheDocument()
  })

  it('renders the release-era section with the five decade buckets and enables Save on chip click', async () => {
    server.use(
      http.get(`${API}/api/v1/library/release-year-preferences`, () => HttpResponse.json([])),
    )
    renderPreferences()

    await waitFor(() => expect(screen.getByText('Release era preferences')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Pre-1990' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1990s' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2000s' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2010s' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2020s' })).toBeInTheDocument()

    const saveButtons = screen.getAllByRole('button', { name: /save preferences/i })
    const eraSaveButton = saveButtons[saveButtons.length - 1]
    expect(eraSaveButton).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: '2020s' }))
    await waitFor(() => expect(eraSaveButton).not.toBeDisabled())
  })

  it('toggles primary platform when star is clicked', async () => {
    let patchCalled = false
    let patchedBody: { isPrimary: boolean } | null = null

    server.use(
      http.get(`${API}/api/v1/library/platforms`, () =>
        HttpResponse.json([{ id: 7, platformName: 'PC', isPrimary: false }]),
      ),
      http.patch(`${API}/api/v1/library/platforms/:id/primary`, async ({ request }) => {
        patchCalled = true
        patchedBody = (await request.json()) as { isPrimary: boolean }
        return HttpResponse.json({ id: 7, platformName: 'PC', isPrimary: true })
      }),
    )

    renderPreferences()
    await waitFor(() =>
      expect(screen.getByLabelText(/set as primary platform/i)).toBeInTheDocument(),
    )

    const star = screen.getByLabelText(/set as primary platform/i)
    expect(star).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(star)
    await waitFor(() => expect(patchCalled).toBe(true))
    expect(patchedBody).toEqual({ isPrimary: true })
  })
})
