import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { delay, http, HttpResponse } from 'msw'
import { server } from './server'
import AuthProvider from '../context/AuthProvider'
import AppRoutes from '../AppRoutes'

const API = 'http://api.test'

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>
}

function renderAt(path: string) {
  function Harness() {
    const [queryClient] = useState(
      () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } } }),
    )
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <AuthProvider>
            <AppRoutes />
            <Where />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
  return render(<Harness />)
}

function signedOut() {
  server.use(
    http.get(`${API}/api/v1/auth/me`, () => new HttpResponse(null, { status: 401 })),
    http.post(`${API}/api/v1/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
  )
}

const frontPageHeading = () => screen.findByRole('heading', { level: 1, name: /your backlog/i })

describe('AppRoutes, the front page', () => {
  it('shows a signed-out visitor the front page at /', async () => {
    signedOut()
    renderAt('/')
    expect(await frontPageHeading()).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/)
  })

  it('sends a signed-in visitor at / on to the dashboard without drawing the front page', async () => {
    renderAt('/')
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/dashboard'))
    expect(screen.queryByRole('heading', { level: 1, name: /your backlog/i })).not.toBeInTheDocument()
  })

  it('renders nothing at / while the sign-in check is still unanswered', async () => {
    server.use(http.get(`${API}/api/v1/auth/me`, async () => {
      await delay('infinite')
      return HttpResponse.json({})
    }))
    renderAt('/')
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('heading', { level: 1, name: /your backlog/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/)
  })

  it('lands a stranger on a mistyped path on the front page, not on the sign-in', async () => {
    signedOut()
    renderAt('/no-such-page')
    expect(await frontPageHeading()).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/)
  })

  it('passes a signed-in visitor on a mistyped path through the front page to the dashboard', async () => {
    renderAt('/no-such-page')
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/dashboard'))
  })

  it('still serves the privacy policy to a signed-out visitor', async () => {
    signedOut()
    renderAt('/privacy')
    expect(await screen.findByRole('heading', { level: 1, name: /what the cellar keeps about you/i })).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent('/privacy')
  })
})
