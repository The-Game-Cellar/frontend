import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TopBar from '../../../components/common/TopBar'
import { AuthContext } from '../../../context/AuthContext'
import type { AuthContextValue } from '../../../context/AuthContext'

function renderTopBar(logout: AuthContextValue['logout']) {
  const value: AuthContextValue = {
    isAuthenticated: true,
    isLoading: false,
    userId: 'u-1',
    email: 'a@x.test',
    roles: ['user'],
    login: vi.fn(),
    logout,
  }
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>
        <TopBar />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

async function confirmSignOut(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /sign out/i }))
  const buttons = screen.getAllByRole('button', { name: /sign out/i })
  await user.click(buttons[buttons.length - 1])
}

describe('TopBar sign out', () => {
  it('says so and stays when the sign-out fails', async () => {
    const user = userEvent.setup()
    const logout = vi.fn().mockRejectedValue(new TypeError('NetworkError when attempting to fetch resource.'))
    renderTopBar(logout)

    await confirmSignOut(user)

    expect(logout).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/could not sign out/i)).toBeInTheDocument()
    expect(screen.getByText(/sign out\?/i)).toBeInTheDocument()
  })

  it('shows no failure notice when the sign-out succeeds', async () => {
    const user = userEvent.setup()
    const logout = vi.fn().mockResolvedValue(undefined)
    renderTopBar(logout)

    await confirmSignOut(user)

    expect(logout).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/could not sign out/i)).not.toBeInTheDocument()
  })
})
