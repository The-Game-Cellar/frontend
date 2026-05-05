import type { AxiosResponse } from 'axios'
import api from './api'
import type {
  DashboardDTO,
  GroupedRecommendationsResponse,
  RecommendationDTO,
} from '../types/api'

// ─── Recently-shown set (localStorage) ──────────────────────────────────────
// Session-scoped set of IGDB ids the user has been shown on the Recommendations
// page. Sent as `recentlyShownIds` on every /personalized fetch so the backend
// applies a soft score penalty — recently-shown games drop out of MMR top picks
// but resurface if the candidate pool runs dry, so the system never returns
// truly empty. Cleared on logout / deleteAccount; otherwise grows for the
// length of the session. Hard ceiling at 2000 ids as a runaway-guard against
// extreme browse sessions blowing the URL length budget.

const SHOWN_KEY = 'cellar:recs:shown'
const SHOWN_HARD_CAP = 2000

export const getRecentlyShownIds = (): number[] => {
  try {
    const raw = localStorage.getItem(SHOWN_KEY)
    if (!raw) return []
    const arr: unknown = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((n): n is number => Number.isInteger(n)) : []
  } catch {
    return []
  }
}

export const addRecentlyShownIds = (ids: number[]): void => {
  if (!Array.isArray(ids) || ids.length === 0) return
  const fresh = ids.filter((n): n is number => Number.isInteger(n))
  if (fresh.length === 0) return
  const current = getRecentlyShownIds()
  const seen = new Set<number>(current)
  const merged = [...current]
  for (const id of fresh) {
    if (seen.has(id)) continue
    merged.push(id)
    seen.add(id)
  }
  const trimmed = merged.length > SHOWN_HARD_CAP ? merged.slice(merged.length - SHOWN_HARD_CAP) : merged
  try {
    localStorage.setItem(SHOWN_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage full / disabled — ignore
  }
}

export const clearRecentlyShownIds = (): void => {
  try {
    localStorage.removeItem(SHOWN_KEY)
  } catch {
    // ignore
  }
}

// POST rather than GET because recentlyShownIds grows uncapped with session activity and
// would blow Tomcat's default 8KB header buffer on the URL path. Body has no such limit.
export const getPersonalized = (limit: number = 10): Promise<AxiosResponse<RecommendationDTO[]>> => {
  const recentlyShownIds = getRecentlyShownIds()
  return api.post('/api/v1/recommendations/personalized', { limit, recentlyShownIds })
}

// Row-based variant — returns { rows: [{ label, genre, fallback, games[] }], tier, emptyMessage }.
export const getPersonalizedGrouped = (): Promise<AxiosResponse<GroupedRecommendationsResponse>> => {
  const recentlyShownIds = getRecentlyShownIds()
  return api.post('/api/v1/recommendations/personalized/grouped', { recentlyShownIds })
}

export const getWildCard = (limit: number = 10): Promise<AxiosResponse<RecommendationDTO[]>> =>
  api.get('/api/v1/recommendations/wildcard', { params: { limit } })

export const getSimilar = (gameId: number, limit: number = 10): Promise<AxiosResponse<RecommendationDTO[]>> =>
  api.get(`/api/v1/recommendations/similar/${gameId}`, { params: { limit } })

export const getBasedOn = (gameId: number, limit: number = 10): Promise<AxiosResponse<RecommendationDTO[]>> =>
  api.get(`/api/v1/recommendations/because-you-liked/${gameId}`, { params: { limit } })

export const getDashboard = (): Promise<AxiosResponse<DashboardDTO>> =>
  api.get('/api/v1/recommendations/dashboard')

// ─── Prefetch cache for /dashboard ──────────────────────────────────────────
// Two-slot cache mirroring the /personalized pattern: loadedDashboard restores
// the rendered Dashboard payload across navigations; nextDashboardPromise
// holds the in-flight fetch fired right after login so the first Dashboard
// render is instant. Both clear on logout / library mutation.

let loadedDashboard: DashboardDTO | null = null
let nextDashboardPromise: Promise<DashboardDTO | null> | null = null

const fetchDashboardPayload = (): Promise<DashboardDTO | null> =>
  getDashboard()
    .then((res) => res.data ?? null)
    .catch(() => null)

export const prefetchDashboard = (): Promise<DashboardDTO | null> => {
  if (nextDashboardPromise) return nextDashboardPromise
  nextDashboardPromise = fetchDashboardPayload()
  return nextDashboardPromise
}

export const consumePrefetchedDashboard = (): Promise<DashboardDTO | null> | null => {
  const p = nextDashboardPromise
  nextDashboardPromise = null
  return p
}

export const getLoadedDashboard = (): DashboardDTO | null => loadedDashboard

export const setLoadedDashboard = (payload: DashboardDTO | null): void => {
  loadedDashboard = payload ?? null
}

export const invalidateDashboard = (): void => {
  loadedDashboard = null
  nextDashboardPromise = null
}

// ─── Prefetch cache for /personalized ───────────────────────────────────────
// Two-slot module cache that survives SPA navigations:
//   - loadedGames: the currently-rendered list. Restored when the user leaves
//     Recommendations and comes back, so the page is consistent within a session.
//   - nextBatchPromise: the next batch waiting in the wings. Dashboard kicks
//     the first prefetch; Recommendations consumes when no loadedGames exist.
//     fetchMore (last-page boundary) consumes the ready batch + queues another.
// Both slots clear on logout / deleteAccount and on any library mutation.
// Failed HTTP resolves to [] so callers never have to handle reject.

let loadedGames: RecommendationDTO[] | null = null
let nextBatchPromise: Promise<RecommendationDTO[]> | null = null

const fetchPersonalizedBatch = (limit: number): Promise<RecommendationDTO[]> =>
  getPersonalized(limit).then((res) => (Array.isArray(res.data) ? res.data : []))

export const prefetchPersonalized = (limit: number = 100): Promise<RecommendationDTO[]> => {
  if (nextBatchPromise) return nextBatchPromise
  nextBatchPromise = fetchPersonalizedBatch(limit).catch(() => [])
  return nextBatchPromise
}

export const consumePrefetchedPersonalized = (): Promise<RecommendationDTO[]> | null => {
  const p = nextBatchPromise
  nextBatchPromise = null
  return p
}

export const getLoadedPersonalized = (): RecommendationDTO[] | null => loadedGames

export const setLoadedPersonalized = (games: RecommendationDTO[] | null | undefined): void => {
  loadedGames = Array.isArray(games) ? games : null
}

export const invalidatePrefetchedPersonalized = (): void => {
  loadedGames = null
  nextBatchPromise = null
}
