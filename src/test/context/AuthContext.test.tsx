import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import { TEST_USER } from '../handlers'
import AuthProvider, { AuthContext } from '../../context/AuthContext'

const API = 'http://api.test'

function Probe() {
  return (
    <AuthContext.Consumer>
      {(ctx) => {
        if (!ctx) return null
        return (
          <div>
            <span data-testid="loading">{String(ctx.isLoading)}</span>
            <span data-testid="authed">{String(ctx.isAuthenticated)}</span>
            <span data-testid="userId">{ctx.userId ?? ''}</span>
            <button onClick={() => ctx.login({ userId: 'u-2', email: 'b@x.test', roles: ['user'] })}>
              login
            </button>
            <button onClick={ctx.logout}>logout</button>
          </div>
        )
      }}
    </AuthContext.Consumer>
  )
}

describe('AuthContext', () => {
  it('bootstraps an authenticated session via /auth/me', async () => {
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('authed')).toHaveTextContent('true')
    expect(screen.getByTestId('userId')).toHaveTextContent(TEST_USER.userId)
  })

  it('falls back to refresh when /auth/me fails', async () => {
    server.use(
      http.get(`${API}/api/v1/auth/me`, () => new HttpResponse(null, { status: 401 })),
    )
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('authed')).toHaveTextContent('true')
  })

  it('ends unauthenticated when both /me and /refresh fail', async () => {
    server.use(
      http.get(`${API}/api/v1/auth/me`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${API}/api/v1/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
    )
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('authed')).toHaveTextContent('false')
    expect(screen.getByTestId('userId')).toHaveTextContent('')
  })

  it('login() and logout() flip authenticated state', async () => {
    server.use(
      http.get(`${API}/api/v1/auth/me`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${API}/api/v1/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
    )
    const user = userEvent.setup()
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    await user.click(screen.getByText('login'))
    expect(screen.getByTestId('authed')).toHaveTextContent('true')
    expect(screen.getByTestId('userId')).toHaveTextContent('u-2')

    await user.click(screen.getByText('logout'))
    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'))
  })
})
