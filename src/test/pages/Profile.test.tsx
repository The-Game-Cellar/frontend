import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import { renderWithProviders } from '../test-utils'
import Profile from '../../pages/Profile'

const API = 'http://api.test'

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

  it('saves the file the gateway assembles, exactly as it came back', async () => {
    const assembled = { account: { username: 'alex' }, library: { games: [] }, recommendations: { profile: null } }
    const requested: string[] = []
    server.use(http.get(`${API}/api/v1/auth/account/export`, ({ request }) => {
      requested.push(request.url)
      return HttpResponse.json(assembled)
    }))
    let saved: Blob | undefined
    const createObjectURL = vi.fn((blob: Blob) => {
      saved = blob
      return 'blob:export'
    })
    const revokeObjectURL = vi.fn()
    Object.assign(URL, { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const user = userEvent.setup()
    renderProfile()
    await waitFor(() => expect(screen.getByText('test@example.test')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /download my data/i }))

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    expect(requested).toEqual([`${API}/api/v1/auth/account/export`])
    expect(JSON.parse(await saved!.text())).toEqual(assembled)
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toMatch(/^the-game-cellar-export-\d{4}-\d{2}-\d{2}\.json$/)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export')
    click.mockRestore()
  })

  it('says so when the export cannot be gathered, and saves nothing', async () => {
    server.use(http.get(`${API}/api/v1/auth/account/export`, () =>
      HttpResponse.json({ error: 'Could not gather all of your data, try again' }, { status: 502 })))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const user = userEvent.setup()
    renderProfile()
    await waitFor(() => expect(screen.getByText('test@example.test')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /download my data/i }))

    expect(await screen.findByText(/export failed/i)).toBeInTheDocument()
    expect(click).not.toHaveBeenCalled()
    click.mockRestore()
  })

  it('keeps the user signed in and says so when the sign-out never reaches the server', async () => {
    server.use(http.post(`${API}/api/v1/auth/logout`, () => HttpResponse.error()))
    const user = userEvent.setup()
    renderProfile()
    await waitFor(() => expect(screen.getByText('test@example.test')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /sign out/i }))
    const buttons = screen.getAllByRole('button', { name: /sign out/i })
    await user.click(buttons[buttons.length - 1])

    expect(await screen.findByText(/could not sign out/i)).toBeInTheDocument()
    expect(screen.getByText('test@example.test')).toBeInTheDocument()
  })
})
