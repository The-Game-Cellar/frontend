function base64UrlEncode(input) {
  return btoa(input)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function fakeJwt(claims = {}) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = base64UrlEncode(JSON.stringify({
    sub: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.test',
    realm_access: { roles: ['user'] },
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...claims,
  }));
  return `${header}.${payload}.signature-not-verified-in-tests`;
}
