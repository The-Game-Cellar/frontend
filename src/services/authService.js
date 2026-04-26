const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'game-cellar';
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'game-cellar-client';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

export async function login(username, password) {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Invalid username or password');
  }
  return res.json();
}

export async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Token refresh failed');
  return res.json();
}

export async function logout() {
  await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function getMe() {
  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function register(username, email, password) {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Registration failed');
  }
  return res.json();
}

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

export async function exchangeAuthorizationCode(code) {
  const verifier = sessionStorage.getItem('pkce_verifier');
  sessionStorage.removeItem('pkce_verifier');

  const res = await fetch(`${API_URL}/api/v1/auth/callback`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      codeVerifier: verifier,
      redirectUri: `${window.location.origin}/callback`,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Authorization code exchange failed');
  }
  return res.json();
}
