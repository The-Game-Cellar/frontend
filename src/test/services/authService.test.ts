import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { redirectToRegister } from '../../services/authService'

describe('redirectToRegister — OAuth state generation', () => {
  let originalHref: string
  let assignedHref = ''

  beforeEach(() => {
    originalHref = window.location.href
    assignedHref = ''
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        get href() {
          return assignedHref
        },
        set href(v: string) {
          assignedHref = v
        },
        origin: 'http://localhost:5173',
      },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, href: originalHref },
    })
  })

  it('stores a CSPRNG state value in sessionStorage', async () => {
    await redirectToRegister()
    const stored = sessionStorage.getItem('oauth_state')
    expect(stored).toBeTruthy()
    expect(stored!).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(stored!.length).toBeGreaterThanOrEqual(16)
  })

  it('appends &state=<value> to the authorize URL', async () => {
    await redirectToRegister()
    const stored = sessionStorage.getItem('oauth_state')!
    const url = new URL(assignedHref)
    expect(url.searchParams.get('state')).toBe(stored)
  })

  it('generates a different state on each invocation', async () => {
    await redirectToRegister()
    const first = sessionStorage.getItem('oauth_state')
    sessionStorage.removeItem('oauth_state')
    await redirectToRegister()
    const second = sessionStorage.getItem('oauth_state')
    expect(first).not.toBe(second)
  })

  it('also sets pkce_verifier and code_challenge alongside state', async () => {
    await redirectToRegister()
    expect(sessionStorage.getItem('pkce_verifier')).toBeTruthy()
    const url = new URL(assignedHref)
    expect(url.searchParams.get('code_challenge')).toBeTruthy()
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
  })
})
