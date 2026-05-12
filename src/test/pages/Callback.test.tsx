import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import { TEST_USER } from '../handlers'
import AuthProvider from '../../context/AuthProvider'
import Callback from '../../pages/Callback'

const API = 'http://api.test'

function renderCallback(search: string) {
  // Callback reads window.location.search directly, so set it before render.
  window.history.replaceState({}, '', `/callback${search}`)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/callback${search}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/callback" element={<Callback />} />
            <Route path="/register" element={<div>register-page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Callback page', () => {
  it('shows the cancellation error when Keycloak returns ?error=', async () => {
    renderCallback('?error=access_denied&error_description=User%20cancelled')
    await waitFor(() => expect(screen.getByText(/user cancelled/i)).toBeInTheDocument())
  })

  it('rejects callback when state parameter is missing', async () => {
    sessionStorage.setItem('oauth_state', 'expected-state-value')
    renderCallback('?code=abc')
    await waitFor(() => expect(screen.getByText(/authentication failed/i)).toBeInTheDocument())
    expect(sessionStorage.getItem('oauth_state')).toBeNull()
  })

  it('rejects callback when state parameter does not match stored value', async () => {
    sessionStorage.setItem('oauth_state', 'expected-state-value')
    renderCallback('?code=abc&state=attacker-supplied-state')
    await waitFor(() => expect(screen.getByText(/authentication failed/i)).toBeInTheDocument())
    expect(sessionStorage.getItem('oauth_state')).toBeNull()
  })

  it('rejects callback when no state was ever stored', async () => {
    renderCallback('?code=abc&state=anything')
    await waitFor(() => expect(screen.getByText(/authentication failed/i)).toBeInTheDocument())
  })

  it('proceeds to code exchange when state matches stored value', async () => {
    let exchangeCalled = false
    server.use(
      http.post(`${API}/api/v1/auth/callback`, () => {
        exchangeCalled = true
        return HttpResponse.json(TEST_USER)
      }),
    )
    sessionStorage.setItem('oauth_state', 'matching-state-value')
    sessionStorage.setItem('pkce_verifier', 'fake-verifier')
    renderCallback('?code=abc&state=matching-state-value')

    await waitFor(() => expect(exchangeCalled).toBe(true))
    expect(screen.queryByText(/authentication failed/i)).not.toBeInTheDocument()
    expect(sessionStorage.getItem('oauth_state')).toBeNull()
  })
})
