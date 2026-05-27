import type { AxiosResponse } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from './api'
import type {
  BecauseYouLikedDTO,
  DashboardDTO,
  GroupedRecommendationsResponse,
  RecommendationDTO,
  RecommendationRow,
} from '../types/api'

// Session-scoped IGDB ids; backend uses this as a soft-penalty input, not an exclusion.
// Cleared on logout/deleteAccount. Hard cap at 2000 to guard URL length on extreme sessions.
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
    // localStorage full or disabled
  }
}

export const clearRecentlyShownIds = (): void => {
  try {
    localStorage.removeItem(SHOWN_KEY)
  } catch {
    // ignore
  }
}

// POST because recentlyShownIds grows uncapped per session and would blow Tomcat's 8KB header buffer.
export const getPersonalizedGrouped = (): Promise<AxiosResponse<GroupedRecommendationsResponse>> => {
  const recentlyShownIds = getRecentlyShownIds()
  return api.post('/api/v1/recommendations/personalized/grouped', { recentlyShownIds })
}

// Single-row refresh on /recommendations. Backend enqueues a per-genre top-up so the next
// click serves strictly fresh ids; current bucket parks in pool_holding for ~60s.
export const refreshGenreRow = (genre: string): Promise<AxiosResponse<RecommendationRow>> => {
  const recentlyShownIds = getRecentlyShownIds()
  return api.post('/api/v1/recommendations/personalized/grouped/genre', { genre, recentlyShownIds })
}

// Per-section refresh on /dashboard. /personalized returns a flat top-N (not the grouped layout).
// recentlyShownIds + limit are sent through the body.
export const getPersonalized = (limit: number = 10): Promise<AxiosResponse<RecommendationDTO[]>> => {
  const recentlyShownIds = getRecentlyShownIds()
  return api.post('/api/v1/recommendations/personalized', { limit, recentlyShownIds })
}

// Refresh button on dashboard "Because you liked X" rotates seed to a different rated >= 7 game.
// excludeSeedIgdbIds covers BOTH currently-shown BYL sections so the new pick doesn't collide
// with either. Backend re-rolls and returns one fresh section.
export const rollBecauseYouLiked = (
  excludeSeedIgdbIds: number[],
): Promise<AxiosResponse<BecauseYouLikedDTO | ''>> =>
  api.get('/api/v1/recommendations/dashboard/because-you-liked', {
    params: { excludeSeedIgdbIds },
    paramsSerializer: { indexes: null },
  })

export const getWildCard = (limit: number = 10): Promise<AxiosResponse<RecommendationDTO[]>> =>
  api.get('/api/v1/recommendations/wildcard', { params: { limit } })

export const getSimilar = (gameId: number, limit: number = 10): Promise<AxiosResponse<RecommendationDTO[]>> =>
  api.get(`/api/v1/recommendations/similar/${gameId}`, { params: { limit } })

export const getBasedOn = (gameId: number, limit: number = 10): Promise<AxiosResponse<RecommendationDTO[]>> =>
  api.get(`/api/v1/recommendations/because-you-liked/${gameId}`, { params: { limit } })

export const getDashboard = async (): Promise<AxiosResponse<DashboardDTO>> => {
  const recentlyShownIds = getRecentlyShownIds()
  const res = await api.post<DashboardDTO>('/api/v1/recommendations/dashboard', { recentlyShownIds })
  const personalizedIds = (res.data?.recommendations ?? [])
    .map((r) => r.igdbId)
    .filter((id): id is number => id != null)
  addRecentlyShownIds(personalizedIds)
  return res
}

export const recommendationKeys = {
  all: ['recommendations'] as const,
  // recentlyShownIds excluded from grouped key: it's tracking state, not query identity.
  grouped: () => [...recommendationKeys.all, 'grouped'] as const,
  wildcard: (limit: number) => [...recommendationKeys.all, 'wildcard', limit] as const,
  similar: (gameId: number, limit: number) => [...recommendationKeys.all, 'similar', gameId, limit] as const,
  basedOn: (gameId: number, limit: number) => [...recommendationKeys.all, 'basedOn', gameId, limit] as const,
  dashboard: () => [...recommendationKeys.all, 'dashboard'] as const,
}

export const useDashboard = () =>
  useQuery({
    queryKey: recommendationKeys.dashboard(),
    queryFn: () => getDashboard().then((r) => r.data),
  })

export const usePersonalizedGrouped = () =>
  useQuery({
    queryKey: recommendationKeys.grouped(),
    queryFn: () =>
      getPersonalizedGrouped().then((res) => {
        const payload: GroupedRecommendationsResponse = res.data ?? { rows: [], tier: 3 }
        const allIds = (payload.rows ?? [])
          .flatMap((r) => (r.games ?? []).map((g) => g.igdbId).filter((id): id is number => id != null))
        addRecentlyShownIds(allIds)
        return payload
      }),
  })

export const useWildCard = (limit = 10) =>
  useQuery({
    queryKey: recommendationKeys.wildcard(limit),
    queryFn: () => getWildCard(limit).then((r) => (Array.isArray(r.data) ? r.data : [])),
  })

export const useSimilar = (gameId: number, limit = 10, enabled = true) =>
  useQuery({
    queryKey: recommendationKeys.similar(gameId, limit),
    queryFn: () => getSimilar(gameId, limit).then((r) => (Array.isArray(r.data) ? r.data : [])),
    enabled: enabled && Number.isFinite(gameId),
  })

export const useBasedOn = (gameId: number, limit = 10, enabled = true) =>
  useQuery({
    queryKey: recommendationKeys.basedOn(gameId, limit),
    queryFn: () => getBasedOn(gameId, limit).then((r) => (Array.isArray(r.data) ? r.data : [])),
    enabled: enabled && Number.isFinite(gameId),
  })

// Replaces only the matching row in the cached grouped query. Tracks the new ids in the
// recently-shown set so the next refresh keeps biasing toward fresh content.
export const useRefreshGenreRow = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (genre: string) => refreshGenreRow(genre).then((r) => r.data),
    onSuccess: (row, genre) => {
      if (!row) return
      const ids = (row.games ?? []).map((g) => g.igdbId).filter((id): id is number => id != null)
      addRecentlyShownIds(ids)
      queryClient.setQueryData<GroupedRecommendationsResponse | undefined>(
        recommendationKeys.grouped(),
        (prev) => {
          if (!prev) return prev
          const rows = (prev.rows ?? []).map((r) => (r.genre === genre ? row : r))
          return { ...prev, rows }
        },
      )
    },
  })
}
