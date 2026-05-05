import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import AuthProvider from '../../context/AuthContext'
import Profile from '../../pages/Profile'

const API = 'http://api.test'

function renderProfile() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Profile />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Profile page', () => {
  it('renders the account email from auth context', async () => {
    renderProfile()
    await waitFor(() => expect(screen.getByText('test@example.test')).toBeInTheDocument())
  })

  it('renders rendered library stats from the backend', async () => {
    server.use(
      http.get(`${API}/api/v1/library/stats`, () =>
        HttpResponse.json({
          totalGames: 7,
          byStatus: { PLAYING: 2, BACKLOG: 3, COMPLETED: 1, DROPPED: 0, WISHLIST: 1 },
        })
      ),
    )
    renderProfile()
    await waitFor(() => expect(screen.getByText(/7/)).toBeInTheDocument())
    expect(screen.getByText(/games in library/i)).toBeInTheDocument()
  })

  it('opens the change-password modal when its button is clicked', async () => {
    const user = userEvent.setup()
    renderProfile()
    await waitFor(() => expect(screen.getByText('test@example.test')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /change password/i }))
    expect(screen.getByText(/min 8 characters/i)).toBeInTheDocument()
  })
})
