import type { AxiosResponse } from 'axios'
import api from './api'
import type { GameResponse, GameSearchResponse, PlatformsResponse } from '../types/api'

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

export type GenresResponse = Record<string, string[]>
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

export const getEditions = (igdbId: number): Promise<AxiosResponse<GameResponse[]>> =>
  api.get(`/api/v1/games/${igdbId}/editions`)
