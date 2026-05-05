import { http, HttpResponse } from 'msw'
import type { UserInfo } from '../services/authService'

const API = 'http://api.test'

export const TEST_USER: Readonly<UserInfo> = Object.freeze({
  userId: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.test',
  roles: ['user'],
})

// Default catch-all handlers that return empty payloads so page-level smoke tests
// can render without hitting unhandled-request errors. Individual tests use server.use(...)
// to override per-endpoint behaviour (loading states, errors, populated lists).
export const handlers = [
  http.get(`${API}/api/v1/auth/me`, () => HttpResponse.json(TEST_USER)),
  http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.json(TEST_USER)),
  http.post(`${API}/api/v1/auth/logout`, () => new HttpResponse(null, { status: 204 })),

  // Library
  http.get(`${API}/api/v1/library/games`, () => HttpResponse.json([])),
  http.get(`${API}/api/v1/library/igdb-ids`, () => HttpResponse.json([])),
  http.get(`${API}/api/v1/library/backlog`, () => HttpResponse.json([])),
  http.get(`${API}/api/v1/library/wishlist`, () => HttpResponse.json([])),
  http.get(`${API}/api/v1/library/playing`, () => HttpResponse.json([])),
  http.get(`${API}/api/v1/library/completed`, () => HttpResponse.json([])),
  http.get(`${API}/api/v1/library/dusty`, () => HttpResponse.json([])),
  http.get(`${API}/api/v1/library/genres`, () => HttpResponse.json([])),
  http.get(`${API}/api/v1/library/platforms`, () => HttpResponse.json([])),
  http.get(`${API}/api/v1/library/stats`, () => HttpResponse.json({ totalGames: 0, byStatus: {}, averageRating: 0, totalRated: 0 })),

  // Game catalog
  http.get(`${API}/api/v1/games/genres`, () => HttpResponse.json({})),
  http.get(`${API}/api/v1/games/platforms`, () => HttpResponse.json({ groups: [], others: [] })),
  http.get(`${API}/api/v1/games/upcoming`, () => HttpResponse.json({ games: [], totalCount: 0, page: 0, pageSize: 20 })),
  http.get(`${API}/api/v1/games/upcoming/platforms`, () => HttpResponse.json({ platforms: [] })),
  http.get(`${API}/api/v1/games/search`, () => HttpResponse.json({ games: [], totalCount: 0, page: 0, pageSize: 20 })),

  // Recommendations
  http.get(`${API}/api/v1/recommendations/dashboard`, () => HttpResponse.json({ recommendations: [], wildcard: [], becauseYouLiked: [] })),
  http.post(`${API}/api/v1/recommendations/personalized`, () => HttpResponse.json([])),
  http.post(`${API}/api/v1/recommendations/personalized/grouped`, () => HttpResponse.json({ rows: [], tier: 3, emptyMessage: 'Rate games in your library to unlock personalized recommendations.' })),
  http.get(`${API}/api/v1/recommendations/wildcard`, () => HttpResponse.json([])),

  // Game-detail companion endpoints — empty by default so GameDetail smokes don't trip MSW unhandled-request errors
  http.get(`${API}/api/v1/games/:id/editions`, () => HttpResponse.json([])),
  http.get(`${API}/api/v1/recommendations/similar/:id`, () => HttpResponse.json([])),
  http.get(`${API}/api/v1/games/by-franchise/:name`, () => HttpResponse.json([])),
  http.get(`${API}/api/v1/games/by-collection/:name`, () => HttpResponse.json([])),
]
