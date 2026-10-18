import { describe, it, expect, vi, afterEach } from 'vitest'
import { startLogin } from '../../services/authService'
import { PENDING_LOGIN_FLAG } from '../../config/loginTransition'

describe('startLogin', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function stubLocation() {
    const replace = vi.fn()
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, replace, assign })
    return { replace, assign }
  }

  it('leaves for the gateway in place of the page that started it, so Back skips that page', () => {
    const { replace, assign } = stubLocation()
    startLogin()
    expect(replace).toHaveBeenCalledWith('http://api.test/api/v1/auth/authorize')
    expect(assign).not.toHaveBeenCalled()
  })

  it('asks for the sign-up page the same way', () => {
    const { replace } = stubLocation()
    startLogin(true)
    expect(replace).toHaveBeenCalledWith('http://api.test/api/v1/auth/authorize?register=true')
  })

  it('marks the tab as on its way to a sign-in', () => {
    stubLocation()
    startLogin()
    expect(sessionStorage.getItem(PENDING_LOGIN_FLAG)).toBe('1')
  })
})
