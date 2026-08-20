import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '../test-utils'
import Onboarding from '../../pages/Onboarding'

const API = 'http://api.test'

function mockCatalog() {
  server.use(
    http.get(`${API}/api/v1/platforms/catalog`, () =>
      HttpResponse.json([
        { id: 1, name: 'PlayStation 5', category: 'sony', displayOrder: 1 },
        { id: 2, name: 'PlayStation 4', category: 'sony', displayOrder: 2 },
        { id: 3, name: 'PC', category: 'pc', displayOrder: 10 },
      ]),
    ),
  )
}

function renderOnboarding() {
  return render(renderWithProviders(<Onboarding />))
}

// Routed render so a navigation away from onboarding is observable.
function renderRoutedOnboarding() {
  return render(
    renderWithProviders(
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<p>dashboard stub</p>} />
      </Routes>,
      { initialEntries: ['/onboarding'] },
    ),
  )
}

describe('Onboarding page', () => {
  it('renders the platform step first with the catalog picker (collapsed by default)', async () => {
    mockCatalog()
    const user = userEvent.setup()
    renderOnboarding()
    expect(screen.getByText(/welcome to the cellar/i)).toBeInTheDocument()
    const sonyHeader = await screen.findByRole('button', { name: /sony/i })
    await user.click(sonyHeader)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /\+ PlayStation 5/ })).toBeInTheDocument(),
    )
  })

  it('tells the user the catalog is still being built when it comes back empty', async () => {
    server.use(http.get(`${API}/api/v1/platforms/catalog`, () => HttpResponse.json([])))
    renderOnboarding()
    expect(await screen.findByText(/still being built/i)).toBeInTheDocument()
    expect(screen.queryByText(/couldn't load the platform catalog/i)).not.toBeInTheDocument()
  })

  it('reports a failed catalog request as a load error, not as an empty catalog', async () => {
    server.use(
      http.get(`${API}/api/v1/platforms/catalog`, () => new HttpResponse(null, { status: 500 })),
    )
    renderOnboarding()
    expect(await screen.findByText(/couldn't load the platform catalog/i)).toBeInTheDocument()
    expect(screen.queryByText(/still being built/i)).not.toBeInTheDocument()
  })

  it('offers a sign-out escape hatch, since onboarding renders outside the app shell', async () => {
    mockCatalog()
    renderOnboarding()
    expect(await screen.findByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('lets the user skip the platform step and land on the dashboard', async () => {
    mockCatalog()
    const user = userEvent.setup()
    renderRoutedOnboarding()
    await user.click(await screen.findByRole('button', { name: /skip for now/i }))
    await user.click(await screen.findByRole('button', { name: /skip anyway/i }))
    expect(await screen.findByText('dashboard stub')).toBeInTheDocument()
  })

  it('warns what skipping costs before letting go of the platform step', async () => {
    mockCatalog()
    const user = userEvent.setup()
    renderRoutedOnboarding()
    await user.click(await screen.findByRole('button', { name: /skip for now/i }))

    expect(await screen.findByText(/skip setup\?/i)).toBeInTheDocument()
    expect(screen.getByText(/mostly see random games/i)).toBeInTheDocument()
    expect(screen.getByText(/profile . preferences/i)).toBeInTheDocument()
    expect(screen.queryByText('dashboard stub')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /go back/i }))
    expect(screen.queryByText(/skip setup\?/i)).not.toBeInTheDocument()
    expect(screen.queryByText('dashboard stub')).not.toBeInTheDocument()
  })

  it('keeps the skip route open when the catalog comes back empty', async () => {
    server.use(http.get(`${API}/api/v1/platforms/catalog`, () => HttpResponse.json([])))
    const user = userEvent.setup()
    renderRoutedOnboarding()
    expect(await screen.findByText(/still being built/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /skip for now/i }))
    await user.click(await screen.findByRole('button', { name: /skip anyway/i }))
    expect(await screen.findByText('dashboard stub')).toBeInTheDocument()
  })

  it('reflects the selection count in the platform-step continue button', async () => {
    mockCatalog()
    const user = userEvent.setup()
    renderOnboarding()
    const sonyHeader = await screen.findByRole('button', { name: /sony/i })
    await user.click(sonyHeader)
    const ps5Chip = await screen.findByRole('button', { name: /\+ PlayStation 5/ })
    await user.click(ps5Chip)
    expect(screen.getByRole('button', { name: /continue \(1 selected\)/i })).toBeInTheDocument()
  })
})
