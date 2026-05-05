import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import { renderWithProviders } from '../test-utils'
import Login from '../../pages/Login'

const API = 'http://api.test'

function renderLogin() {
  return render(renderWithProviders(<Login />))
}

describe('Login page', () => {
  it('renders username + password inputs and a sign-in button', () => {
    renderLogin()
    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows an inline error when the backend rejects credentials', async () => {
    server.use(
      http.post(`${API}/api/v1/auth/login`, () =>
        new HttpResponse(JSON.stringify({ error: 'Bad creds' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      ),
    )
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/username or email/i), 'wrong')
    await user.type(screen.getByLabelText(/^password$/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/bad creds/i)).toBeInTheDocument())
  })
})
