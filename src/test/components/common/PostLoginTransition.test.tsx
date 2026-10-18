import { describe, it, expect, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../../server'
import AuthProvider from '../../../context/AuthProvider'
import PostLoginTransition from '../../../components/common/PostLoginTransition'
import AppRoutes from '../../../AppRoutes'
import { PENDING_LOGIN_FLAG } from '../../../config/loginTransition'

const API = 'http://api.test'
const OVERLAY = /authenticated · entering cellar/i

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>
}

// The tree App renders: the transition beside the routes, both under the sign-in check.
function renderAt(path: string) {
  function Harness() {
    const [queryClient] = useState(
      () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } } }),
    )
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <AuthProvider>
            <PostLoginTransition />
            <AppRoutes />
            <Where />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
  return render(<Harness />)
}

let dashboardCalls = 0

function signedOut() {
  server.use(
    http.get(`${API}/api/v1/auth/me`, () => new HttpResponse(null, { status: 401 })),
    http.post(`${API}/api/v1/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
    http.post(`${API}/api/v1/recommendations/dashboard`, () => {
      dashboardCalls++
      return new HttpResponse(null, { status: 401 })
    }),
  )
}

function countDashboard() {
  server.use(
    http.post(`${API}/api/v1/recommendations/dashboard`, () => {
      dashboardCalls++
      return HttpResponse.json({ recommendations: [], wildcard: [], becauseYouLiked: [] })
    }),
  )
}

describe('PostLoginTransition', () => {
  beforeEach(() => {
    dashboardCalls = 0
  })

  it('leaves a signed-out visitor with a leftover sign-in flag on the front page', async () => {
    signedOut()
    sessionStorage.setItem(PENDING_LOGIN_FLAG, '1')
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: /your backlog/i })).toBeInTheDocument()
    await new Promise((r) => setTimeout(r, 100))
    expect(dashboardCalls).toBe(0)
    expect(screen.queryByText(OVERLAY)).not.toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/)
    expect(sessionStorage.getItem(PENDING_LOGIN_FLAG)).toBeNull()
  })

  it('shows a failed sign-in its retry card instead of starting another one', async () => {
    signedOut()
    sessionStorage.setItem(PENDING_LOGIN_FLAG, '1')
    renderAt('/login?error=auth_failed')
    expect(await screen.findByText(/that sign-in did not complete/i)).toBeInTheDocument()
    await new Promise((r) => setTimeout(r, 100))
    expect(dashboardCalls).toBe(0)
    expect(screen.queryByText(OVERLAY)).not.toBeInTheDocument()
  })

  it('covers a completed sign-in with the overlay while it primes the dashboard, then leaves', async () => {
    countDashboard()
    sessionStorage.setItem(PENDING_LOGIN_FLAG, '1')
    renderAt('/dashboard')
    expect(await screen.findByText(OVERLAY)).toBeInTheDocument()
    await waitFor(() => expect(dashboardCalls).toBeGreaterThan(0))
    await waitFor(() => expect(screen.queryByText(OVERLAY)).not.toBeInTheDocument(), { timeout: 3000 })
    expect(sessionStorage.getItem(PENDING_LOGIN_FLAG)).toBeNull()
  })

  it('shows no overlay to a signed-in visitor who did not just sign in', async () => {
    renderAt('/dashboard')
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/dashboard'))
    await new Promise((r) => setTimeout(r, 100))
    expect(screen.queryByText(OVERLAY)).not.toBeInTheDocument()
  })
})
