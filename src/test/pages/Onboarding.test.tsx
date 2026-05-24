import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
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
