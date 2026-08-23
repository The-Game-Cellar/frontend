import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils'
import Profile from '../../pages/Profile'

// The account actions perform a full page navigation, which jsdom cannot do. Mocking
// keeps the assertion on the contract: which intent the page asked the gateway for.
const { startAccountActionMock } = vi.hoisted(() => ({ startAccountActionMock: vi.fn() }))

vi.mock('../../services/authService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/authService')>()
  return { ...actual, startAccountAction: startAccountActionMock }
})

function renderProfile(path = '/profile') {
  return render(renderWithProviders(<Profile />, { initialEntries: [path] }))
}

describe('Profile page', () => {
  beforeEach(() => {
    startAccountActionMock.mockClear()
  })

  it('renders the account email from auth context', async () => {
    renderProfile()
    await waitFor(() => expect(screen.getByText('test@example.test')).toBeInTheDocument())
  })

  it('renders the account-management actions and Sign out', async () => {
    renderProfile()
    await waitFor(() => expect(screen.getByText('test@example.test')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /change email/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download my data/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('hands the password change to Keycloak rather than collecting one', async () => {
    const user = userEvent.setup()
    renderProfile()
    await waitFor(() => expect(screen.getByText('test@example.test')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /change password/i }))
    expect(startAccountActionMock).toHaveBeenCalledWith('UPDATE_PASSWORD')
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })

  it('asks for re-authentication before deletion instead of a password', async () => {
    const user = userEvent.setup()
    renderProfile()
    await waitFor(() => expect(screen.getByText('test@example.test')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /delete account/i }))
    expect(startAccountActionMock).toHaveBeenCalledWith('DELETE_ACCOUNT')
    expect(screen.queryByText(/delete account\?/i)).not.toBeInTheDocument()
  })

  it('reports what Keycloak did on the return', async () => {
    renderProfile('/profile?action=email&status=pending')
    expect(await screen.findByText(/confirmation link/i)).toBeInTheDocument()
  })

  it('confirms deletion only once the re-authentication has completed', async () => {
    renderProfile('/profile?action=delete&status=ready')
    expect(await screen.findByText(/delete account\?/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete forever/i })).toBeInTheDocument()
  })
})
