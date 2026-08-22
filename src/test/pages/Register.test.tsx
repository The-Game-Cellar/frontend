import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import Register from '../../pages/Register'

const { startLoginMock } = vi.hoisted(() => ({ startLoginMock: vi.fn() }))

vi.mock('../../services/authService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/authService')>()
  return { ...actual, startLogin: startLoginMock }
})

describe('Register page', () => {
  beforeEach(() => {
    startLoginMock.mockClear()
  })

  // The route is kept only so existing links and bookmarks still land somewhere.
  it('forwards to the hosted sign-up page rather than rendering a form', async () => {
    const { container } = render(renderWithProviders(<Register />, { initialEntries: ['/register'] }))
    await waitFor(() => expect(startLoginMock).toHaveBeenCalledWith(true))
    expect(container.querySelector('form')).toBeNull()
  })
})
