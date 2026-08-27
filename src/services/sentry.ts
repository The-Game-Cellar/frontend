import * as Sentry from '@sentry/react'

// Empty DSN keeps the SDK off, which is every environment except production. The warning
// is limited to production builds: a build that lost the variable is a silently
// unmonitored surface, while a dev server without one is the normal case.
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) {
    if (import.meta.env.PROD) console.warn('Sentry is off: VITE_SENTRY_DSN is empty')
    return
  }
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Release is not set here: the bundler plugin injects it as a global the SDK reads.
    tracesSampleRate: 0,
    sendDefaultPii: false,
  })
}

// The Keycloak UUID and nothing else. It separates "breaks for one account" from
// "breaks for everyone" without attaching an email or an address.
export function setSentryUser(userId: string | null): void {
  Sentry.setUser(userId ? { id: userId } : null)
}

// React 19 reports render errors through the root options instead of rethrowing them,
// so the window error handler alone would miss them.
export const onReactError = Sentry.reactErrorHandler()
