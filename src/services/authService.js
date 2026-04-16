const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'game-cellar';
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'game-cellar-client';

const TOKEN_URL = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;

/**
 * Exchange username + password for tokens via Keycloak.
 * Returns { access_token, refresh_token } on success.
 */
export async function login(username, password) {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: CLIENT_ID,
    username,
    password,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || 'Invalid username or password');
  }

  const data = await res.json();
  return { access_token: data.access_token, refresh_token: data.refresh_token };
}

/**
 * Exchange a refresh_token for new tokens.
 * Returns { access_token, refresh_token } on success.
 * Throws if the refresh_token is expired or invalid.
 */
export async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await res.json();
  return { access_token: data.access_token, refresh_token: data.refresh_token };
}

/**
 * Redirect to Keycloak's own registration page.
 * After registration Keycloak redirects back to /onboarding.
 *
 * TODO: Registration dead-end — needs OAuth callback implementation before shipping.
 * Problem: Keycloak returns to /onboarding with ?code=xyz but no code-exchange
 * handler exists. Onboarding then calls addPlatform() which requires a bearer
 * token → all calls fail with 401 and the registration journey dead-ends.
 * Fix: Add a /callback route (or handle in Onboarding) that exchanges the
 * authorization code for tokens via POST /token?grant_type=authorization_code,
 * stores the access_token in AuthContext, then proceeds to onboarding.
 * Alternative: redirect back to /login after registration instead of /onboarding.
 */
export function redirectToRegister() {
  const redirectUri = encodeURIComponent(`${window.location.origin}/onboarding`);
  window.location.href =
    `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/registrations` +
    `?client_id=${CLIENT_ID}&response_type=code&scope=openid&redirect_uri=${redirectUri}`;
}

/**
 * Log out from Keycloak and redirect back to /login.
 */
export function keycloakLogout() {
  const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
  window.location.href =
    `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout` +
    `?redirect_uri=${redirectUri}`;
}
