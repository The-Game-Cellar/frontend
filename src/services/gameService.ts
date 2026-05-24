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
}

export type UpcomingPlatformsResponse = Record<string, string[]>

export const searchGames = (params: SearchGamesParams): Promise<AxiosResponse<GameSearchResponse>> =>
  api.get('/api/v1/games/search', { params })

export const getGameById = (igdbId: number): Promise<AxiosResponse<GameResponse>> =>
  api.get(`/api/v1/games/${igdbId}`)

export const getPopularGames = (params: PopularGamesParams): Promise<AxiosResponse<GameSearchResponse>> =>
  api.get('/api/v1/games/popular', { params })

export const getUpcomingGames = ({
  platforms = [],
  windowDays = 90,
  limit = 20,
  excludeIds = [],
}: UpcomingGamesParams = {}): Promise<AxiosResponse<GameSearchResponse>> => {
  const params: Record<string, string | number> = { windowDays, limit }
  if (platforms.length > 0) params.platform = platforms.join(',')
  if (excludeIds.length > 0) params.excludeIds = excludeIds.join(',')
  return api.get('/api/v1/games/upcoming', { params })
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
    queryFn: () => getUpcomingGames(params).then((r) => r.data),
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
