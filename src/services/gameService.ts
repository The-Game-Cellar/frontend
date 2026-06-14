import type { AxiosResponse } from 'axios'
import { useQuery } from '@tanstack/react-query'
import api from './api'
import type {
  GameResponse,
  GameSearchResponse,
  GenresResponse,
  PlatformCatalogDTO,
  PlatformsResponse,
  PopularTagsResponse,
} from '../types/api'

export interface SearchGamesParams {
  query?: string
  platform?: string
  genre?: string
  gameMode?: string
  perspective?: string
  gameType?: 'main' | 'variant' | 'all'
  ordering?: '-rating' | '-released' | 'released' | 'name' | '-name'
  page?: number
  pageSize?: number
  dbOnly?: boolean
  releasedFrom?: number
  releasedTo?: number
  tags?: string
  ratingFrom?: number
}

export interface PopularGamesParams {
  platform?: string
  page?: number
}

export interface UpcomingGamesParams {
  platforms?: string[]
  windowDays?: number
  limit?: number
  excludeIds?: number[]
  // Presence of page switches the backend from sample mode (Dashboard rotation, recently-shown
  // penalty applied) to deterministic sort-by-date pagination (Explore browse view, stable across refreshes).
  page?: number
  pageSize?: number
}

export type UpcomingPlatformsResponse = Record<string, string[]>

// Session-scoped IGDB ids for Coming Soon; backend uses this as a soft-penalty input on the
// inverse-days weighted sample. Separate localStorage key from Recommendations so the two
// rotation flows do not bleed into each other. Hard cap at 2000 mirrors the backend @Size.
const UPCOMING_SHOWN_KEY = 'cellar:upcoming:shown'
const UPCOMING_SHOWN_HARD_CAP = 2000

export const getRecentlyShownUpcomingIds = (): number[] => {
  try {
    const raw = localStorage.getItem(UPCOMING_SHOWN_KEY)
    if (!raw) return []
    const arr: unknown = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((n): n is number => Number.isInteger(n)) : []
  } catch {
    return []
  }
}

export const addRecentlyShownUpcomingIds = (ids: number[]): void => {
  if (!Array.isArray(ids) || ids.length === 0) return
  const fresh = ids.filter((n): n is number => Number.isInteger(n))
  if (fresh.length === 0) return
  const current = getRecentlyShownUpcomingIds()
  const seen = new Set<number>(current)
  const merged = [...current]
  for (const id of fresh) {
    if (seen.has(id)) continue
    merged.push(id)
    seen.add(id)
  }
  const trimmed = merged.length > UPCOMING_SHOWN_HARD_CAP
    ? merged.slice(merged.length - UPCOMING_SHOWN_HARD_CAP)
    : merged
  try {
    localStorage.setItem(UPCOMING_SHOWN_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage full or disabled
  }
}

export const clearRecentlyShownUpcomingIds = (): void => {
  try {
    localStorage.removeItem(UPCOMING_SHOWN_KEY)
  } catch {
    // ignore
  }
}

export const searchGames = (params: SearchGamesParams): Promise<AxiosResponse<GameSearchResponse>> =>
  api.get('/api/v1/games/search', { params })

export const getGameById = (igdbId: number): Promise<AxiosResponse<GameResponse>> =>
  api.get(`/api/v1/games/${igdbId}`)

export const getPopularGames = (params: PopularGamesParams): Promise<AxiosResponse<GameSearchResponse>> =>
  api.get('/api/v1/games/popular', { params })

// POST because recentlyShownIds grows uncapped per session (up to 2000 ids) and would blow Tomcat's
// 8KB header buffer over a query string. Mirrors the /personalized POST decision.
// page present => deterministic sort-by-release-date pagination; recentlyShownIds skipped on the
// wire so Explore browsing does not pollute Dashboard's rotation penalty set.
export const getUpcomingGames = ({
  platforms = [],
  windowDays = 90,
  limit = 20,
  excludeIds = [],
  page,
  pageSize,
}: UpcomingGamesParams = {}): Promise<AxiosResponse<GameSearchResponse>> => {
  const paginated = page != null
  const recentlyShownIds = paginated ? [] : getRecentlyShownUpcomingIds()
  return api.post('/api/v1/games/upcoming', {
    platform: platforms.length > 0 ? platforms.join(',') : undefined,
    windowDays,
    limit,
    excludeIds: excludeIds.length > 0 ? excludeIds : undefined,
    recentlyShownIds,
    page,
    pageSize,
  })
}

export const getUpcomingPlatforms = (): Promise<AxiosResponse<UpcomingPlatformsResponse>> =>
  api.get('/api/v1/games/upcoming/platforms')

export const getGenres = (): Promise<AxiosResponse<GenresResponse>> =>
  api.get('/api/v1/games/genres')

export const getPlatforms = (): Promise<AxiosResponse<PlatformsResponse>> =>
  api.get('/api/v1/games/platforms')

export const getPlatformCatalog = (): Promise<AxiosResponse<PlatformCatalogDTO[]>> =>
  api.get('/api/v1/platforms/catalog')

export const getPopularTags = (limit: number = 50): Promise<AxiosResponse<PopularTagsResponse>> =>
  api.get('/api/v1/games/tags/popular', { params: { limit } })

export const getByFranchise = (
  name: string,
  limit: number = 20,
  excludeIgdbId?: number
): Promise<AxiosResponse<GameResponse[]>> =>
  api.get(`/api/v1/games/by-franchise/${encodeURIComponent(name)}`, {
    params: { limit, ...(excludeIgdbId ? { excludeIgdbId } : {}) },
  })

export const getByCollection = (
  name: string,
  limit: number = 20,
  excludeIgdbId?: number
): Promise<AxiosResponse<GameResponse[]>> =>
  api.get(`/api/v1/games/by-collection/${encodeURIComponent(name)}`, {
    params: { limit, ...(excludeIgdbId ? { excludeIgdbId } : {}) },
  })

export const getByDeveloper = (
  name: string,
  limit: number = 20,
  excludeIgdbId?: number
): Promise<AxiosResponse<GameResponse[]>> =>
  api.get(`/api/v1/games/by-developer/${encodeURIComponent(name)}`, {
    params: { limit, ...(excludeIgdbId ? { excludeIgdbId } : {}) },
  })

export const getEditions = (igdbId: number): Promise<AxiosResponse<GameResponse[]>> =>
  api.get(`/api/v1/games/${igdbId}/editions`)

// ─── TanStack Query hooks ───────────────────────────────────────────────────

export const gameKeys = {
  all: ['games'] as const,
  search: (params: SearchGamesParams) => [...gameKeys.all, 'search', params] as const,
  byId: (igdbId: number) => [...gameKeys.all, 'byId', igdbId] as const,
  popular: (params: PopularGamesParams) => [...gameKeys.all, 'popular', params] as const,
  upcoming: (params: UpcomingGamesParams) => [...gameKeys.all, 'upcoming', params] as const,
  upcomingPlatforms: () => [...gameKeys.all, 'upcoming', 'platforms'] as const,
  genres: () => [...gameKeys.all, 'genres'] as const,
  platforms: () => [...gameKeys.all, 'platforms'] as const,
  platformCatalog: () => [...gameKeys.all, 'platformCatalog'] as const,
  popularTags: (limit: number) => [...gameKeys.all, 'popularTags', limit] as const,
  byFranchise: (name: string, limit: number, excludeIgdbId?: number) =>
    [...gameKeys.all, 'byFranchise', name, limit, excludeIgdbId] as const,
  byCollection: (name: string, limit: number, excludeIgdbId?: number) =>
    [...gameKeys.all, 'byCollection', name, limit, excludeIgdbId] as const,
  byDeveloper: (name: string, limit: number, excludeIgdbId?: number) =>
    [...gameKeys.all, 'byDeveloper', name, limit, excludeIgdbId] as const,
  editions: (igdbId: number) => [...gameKeys.all, 'editions', igdbId] as const,
}

export const useSearchGames = (params: SearchGamesParams, enabled = true) =>
  useQuery({
    queryKey: gameKeys.search(params),
    queryFn: () => searchGames(params).then((r) => r.data),
    enabled,
  })

export const useGameById = (igdbId: number, enabled = true) =>
  useQuery({
    queryKey: gameKeys.byId(igdbId),
    queryFn: () => getGameById(igdbId).then((r) => r.data),
    enabled: enabled && Number.isFinite(igdbId),
  })

export const usePopularGames = (params: PopularGamesParams) =>
  useQuery({
    queryKey: gameKeys.popular(params),
    queryFn: () => getPopularGames(params).then((r) => r.data),
  })

export const useUpcomingGames = (params: UpcomingGamesParams = {}, enabled = true) =>
  useQuery({
    queryKey: gameKeys.upcoming(params),
    queryFn: () =>
      getUpcomingGames(params).then((r) => {
        // Only the sample-mode (Dashboard) feeds the rotation penalty set. Paginated browse
        // visits are deterministic and would taint Dashboard variety with stale ids.
        if (params.page == null) {
          const ids = (r.data?.games ?? [])
            .map((g) => g.igdbId)
            .filter((id): id is number => id != null)
          addRecentlyShownUpcomingIds(ids)
        }
        return r.data
      }),
    enabled,
  })

export const useUpcomingPlatforms = () =>
  useQuery({
    queryKey: gameKeys.upcomingPlatforms(),
    queryFn: () => getUpcomingPlatforms().then((r) => r.data),
  })

export const useGenres = () =>
  useQuery({
    queryKey: gameKeys.genres(),
    queryFn: () => getGenres().then((r) => r.data),
  })

export const useGamePlatforms = () =>
  useQuery({
    queryKey: gameKeys.platforms(),
    queryFn: () => getPlatforms().then((r) => r.data),
  })

export const usePlatformCatalog = () =>
  useQuery({
    queryKey: gameKeys.platformCatalog(),
    queryFn: () => getPlatformCatalog().then((r) => r.data),
  })

export const usePopularTags = (limit = 50) =>
  useQuery({
    queryKey: gameKeys.popularTags(limit),
    queryFn: () =>
      getPopularTags(limit).then((r) => (r.data?.tags ?? []).filter((t): t is string => typeof t === 'string' && t.length > 0)),
  })

export const useByFranchise = (name: string, limit = 20, excludeIgdbId?: number, enabled = true) =>
  useQuery({
    queryKey: gameKeys.byFranchise(name, limit, excludeIgdbId),
    queryFn: () => getByFranchise(name, limit, excludeIgdbId).then((r) => r.data),
    enabled: enabled && name.length > 0,
  })

export const useByCollection = (name: string, limit = 20, excludeIgdbId?: number, enabled = true) =>
  useQuery({
    queryKey: gameKeys.byCollection(name, limit, excludeIgdbId),
    queryFn: () => getByCollection(name, limit, excludeIgdbId).then((r) => r.data),
    enabled: enabled && name.length > 0,
  })

export const useByDeveloper = (name: string, limit = 20, excludeIgdbId?: number, enabled = true) =>
  useQuery({
    queryKey: gameKeys.byDeveloper(name, limit, excludeIgdbId),
    queryFn: () => getByDeveloper(name, limit, excludeIgdbId).then((r) => r.data),
    enabled: enabled && name.length > 0,
  })

export const useEditions = (igdbId: number, enabled = true) =>
  useQuery({
    queryKey: gameKeys.editions(igdbId),
    queryFn: () => getEditions(igdbId).then((r) => r.data),
    enabled: enabled && Number.isFinite(igdbId),
  })
