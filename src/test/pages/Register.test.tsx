import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AuthProvider from '../../context/AuthProvider'
import Register from '../../pages/Register'

function renderRegister() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Register page', () => {
  it('renders the four-field form', () => {
    renderRegister()
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('shows a mismatch error when passwords do not match', async () => {
    const user = userEvent.setup()
    renderRegister()
    await user.type(screen.getByLabelText(/^username$/i), 'alice')
    await user.type(screen.getByLabelText(/^email$/i), 'a@example.test')
    await user.type(screen.getByLabelText(/^password$/i), 'longenough1')
    await user.type(screen.getByLabelText(/confirm password/i), 'differentpass1')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument())
  })
})
