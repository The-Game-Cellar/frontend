const num = (raw: unknown, fallback: number): number => {
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export const MIN_FIRST_MS = num(import.meta.env.VITE_LOGIN_TRANSITION_MIN_MS, 700)
export const MIN_REPEAT_MS = num(import.meta.env.VITE_LOGIN_TRANSITION_MIN_MS_REPEAT, 200)
export const MAX_MS = num(import.meta.env.VITE_LOGIN_TRANSITION_MAX_MS, 1500)

export const FIRST_LOGIN_FLAG = 'cellar:first_login_done'

export const isFirstLogin = (): boolean => {
  try {
    return localStorage.getItem(FIRST_LOGIN_FLAG) !== '1'
  } catch {
    return true
  }
}

export const markFirstLoginDone = (): void => {
  try {
    localStorage.setItem(FIRST_LOGIN_FLAG, '1')
  } catch {
    // localStorage unavailable, silently skip; user just sees the long version every time
  }
}

// Login happens on Keycloak, so the browser leaves the app entirely and comes back
// through a redirect that looks like any other navigation. This flag is what tells
// the landing page that the arrival was a login. sessionStorage, so a second tab or
// a later visit never inherits it.
export const PENDING_LOGIN_FLAG = 'cellar:pending_login'

export const markPendingLogin = (): void => {
  try {
    sessionStorage.setItem(PENDING_LOGIN_FLAG, '1')
  } catch {
    // sessionStorage unavailable; the transition is skipped, login still completes
  }
}

export const consumePendingLogin = (): boolean => {
  try {
    const pending = sessionStorage.getItem(PENDING_LOGIN_FLAG) === '1'
    if (pending) sessionStorage.removeItem(PENDING_LOGIN_FLAG)
    return pending
  } catch {
    return false
  }
}
