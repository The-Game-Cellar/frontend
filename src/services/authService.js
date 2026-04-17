const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'game-cellar';
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'game-cellar-client';

const TOKEN_URL = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

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
 * Redirect to Keycloak's registration page using PKCE authorization code flow.
 * After registration Keycloak redirects to /callback which exchanges the code
 * for tokens and then proceeds to /onboarding.
 */
export async function redirectToRegister() {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem('pkce_verifier', verifier);

  const redirectUri = encodeURIComponent(`${window.location.origin}/callback`);
  window.location.href =
    `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/registrations` +
    `?client_id=${CLIENT_ID}&response_type=code&scope=openid` +
    `&redirect_uri=${redirectUri}` +
    `&code_challenge=${challenge}&code_challenge_method=S256`;
}

/**
 * Exchange an authorization code for tokens.
 * Reads the PKCE verifier from sessionStorage (set by redirectToRegister).
 * Returns { access_token, refresh_token } on success.
 */
export async function exchangeAuthorizationCode(code) {
  const verifier = sessionStorage.getItem('pkce_verifier');
  sessionStorage.removeItem('pkce_verifier');

  const redirectUri = `${window.location.origin}/callback`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code,
    redirect_uri: redirectUri,
    ...(verifier ? { code_verifier: verifier } : {}),
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || 'Authorization code exchange failed');
  }

  const data = await res.json();
  return { access_token: data.access_token, refresh_token: data.refresh_token };
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
