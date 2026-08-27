import { describe, it, expect, vi, afterEach } from 'vitest'
import { initSentry, setSentryUser } from '../../services/sentry'

const { init, setUser } = vi.hoisted(() => ({ init: vi.fn(), setUser: vi.fn() }))

vi.mock('@sentry/react', () => ({
  init,
  setUser,
  reactErrorHandler: () => () => {},
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('initSentry', () => {
  it('stays off without a DSN', () => {
    vi.stubEnv('VITE_SENTRY_DSN', '')
    initSentry()
    expect(init).not.toHaveBeenCalled()
  })

  it('reports errors only, sends no PII, and posts through the same-origin tunnel', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://key@o1.ingest.de.sentry.io/1')
    initSentry()
    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({ tracesSampleRate: 0, sendDefaultPii: false, tunnel: '/crash' }),
    )
  })
})

describe('setSentryUser', () => {
  it('attaches only the id and clears on null', () => {
    setSentryUser('4b1c9b2e-0000-4000-8000-000000000000')
    expect(setUser).toHaveBeenCalledWith({ id: '4b1c9b2e-0000-4000-8000-000000000000' })
    setSentryUser(null)
    expect(setUser).toHaveBeenCalledWith(null)
  })
})
