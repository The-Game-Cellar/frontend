import { http, HttpResponse } from 'msw';

const API = 'http://api.test';

export const TEST_USER = Object.freeze({
  userId: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.test',
  roles: ['user'],
});

export const handlers = [
  http.get(`${API}/api/v1/auth/me`, () => HttpResponse.json(TEST_USER)),
  http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.json(TEST_USER)),
  http.post(`${API}/api/v1/auth/logout`, () => new HttpResponse(null, { status: 204 })),
];
