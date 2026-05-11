import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils'
import Profile from '../../pages/Profile'

function renderProfile() {
  return render(renderWithProviders(<Profile />))
}

describe('Profile page', () => {
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

  it('opens the change-password modal when its button is clicked', async () => {
    const user = userEvent.setup()
    renderProfile()
    await waitFor(() => expect(screen.getByText('test@example.test')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /change password/i }))
    expect(screen.getByText(/min 8 characters/i)).toBeInTheDocument()
  })
})
