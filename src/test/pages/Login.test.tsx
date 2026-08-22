import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils'
import Login from '../../pages/Login'

// startLogin performs a full page navigation, which jsdom cannot do. The mock also
// keeps the assertion on the contract (it was called) rather than on the URL string.
const { startLoginMock } = vi.hoisted(() => ({ startLoginMock: vi.fn() }))

vi.mock('../../services/authService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/authService')>()
  return { ...actual, startLogin: startLoginMock }
})

function renderLogin(path = '/login') {
  return render(renderWithProviders(<Login />, { initialEntries: [path] }))
}

describe('Login page', () => {
  beforeEach(() => {
    startLoginMock.mockClear()
  })

  it('sends the browser straight to the hosted sign-in page', async () => {
    renderLogin()
    await waitFor(() => expect(startLoginMock).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })

  it('stops and explains itself when the callback reports a failure', async () => {
    renderLogin('/login?error=auth_failed')
    expect(await screen.findByText(/did not complete/i)).toBeInTheDocument()
    expect(startLoginMock).not.toHaveBeenCalled()
  })

  it('retries the sign-in from the failure card', async () => {
    const user = userEvent.setup()
    renderLogin('/login?error=auth_failed')
    await user.click(await screen.findByRole('button', { name: /try again/i }))
    expect(startLoginMock).toHaveBeenCalledTimes(1)
  })
})
