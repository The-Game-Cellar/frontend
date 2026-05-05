import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AuthProvider from '../../context/AuthProvider'
import Callback from '../../pages/Callback'

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
})
