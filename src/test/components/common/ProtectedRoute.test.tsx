import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../../server'
import AuthProvider from '../../../context/AuthProvider'
import ProtectedRoute from '../../../components/common/ProtectedRoute'

const API = 'http://api.test'

interface HarnessProps {
  initialPath: string
}

function Harness({ initialPath }: HarnessProps) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } } }),
  )
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>login-page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>dashboard-page</div>} />
              <Route path="/onboarding" element={<div>onboarding-page</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function onboardingCompleted(completed: boolean) {
  server.use(
    http.get(`${API}/api/v1/library/onboarding`, () =>
      HttpResponse.json({ completed, completedAt: completed ? '2026-01-01T00:00:00' : null }),
    ),
  )
}

describe('ProtectedRoute', () => {
  it('renders the child route when authenticated', async () => {
    onboardingCompleted(true)
    render(<Harness initialPath="/dashboard" />)
    await waitFor(() => expect(screen.getByText('dashboard-page')).toBeInTheDocument())
  })

  it('redirects to /login when not authenticated', async () => {
    server.use(
      http.get(`${API}/api/v1/auth/me`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${API}/api/v1/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
    )
    render(<Harness initialPath="/dashboard" />)
    await waitFor(() => expect(screen.getByText('login-page')).toBeInTheDocument())
    expect(screen.queryByText('dashboard-page')).not.toBeInTheDocument()
  })

  // The redirect back from the hosted login looks the same for a first sign-in and a
  // thousandth, so the account's own state is what decides where it lands.
  it('sends an account that has not finished onboarding to the onboarding route', async () => {
    onboardingCompleted(false)
    render(<Harness initialPath="/dashboard" />)
    await waitFor(() => expect(screen.getByText('onboarding-page')).toBeInTheDocument())
    expect(screen.queryByText('dashboard-page')).not.toBeInTheDocument()
  })

  it('turns away an account that has already been through onboarding', async () => {
    onboardingCompleted(true)
    render(<Harness initialPath="/onboarding" />)
    await waitFor(() => expect(screen.getByText('dashboard-page')).toBeInTheDocument())
    expect(screen.queryByText('onboarding-page')).not.toBeInTheDocument()
  })
})
