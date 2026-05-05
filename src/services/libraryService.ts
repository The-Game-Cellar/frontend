import type { AxiosResponse } from 'axios'
import api from './api'
import {
  invalidatePrefetchedPersonalized,
  prefetchPersonalized,
  invalidateDashboard,
  prefetchDashboard,
} from './recommendationService'
import type {
  AddGameRequest,
  AddPlatformRequest,
  GameStatus,
  UpdateGameRequest,
  UserGameDTO,
  UserPlatformDTO,
  UserStatsDTO,
} from '../types/api'

export interface GetUserGamesParams {
  status?: GameStatus
  platform?: string
  search?: string
  genre?: string
}

const refreshRecsCache = (): void => {
  invalidatePrefetchedPersonalized()
  prefetchPersonalized(100)
  invalidateDashboard()
  prefetchDashboard()
}

// Collection
export const getUserGames = (params?: GetUserGamesParams): Promise<AxiosResponse<UserGameDTO[]>> =>
  api.get('/api/v1/library/games', { params })

export const getOwnedIgdbIds = (): Promise<AxiosResponse<number[]>> =>
  api.get('/api/v1/library/igdb-ids')

export const addGame = (data: AddGameRequest): Promise<AxiosResponse<UserGameDTO>> =>
  api.post<UserGameDTO>('/api/v1/library/games', data).then((res) => {
    refreshRecsCache()
    return res
  })

export const updateGame = (gameId: number, data: UpdateGameRequest): Promise<AxiosResponse<UserGameDTO>> =>
  api.put<UserGameDTO>(`/api/v1/library/games/${gameId}`, data).then((res) => {
    refreshRecsCache()
    return res
  })

export const removeGame = (gameId: number): Promise<AxiosResponse<void>> =>
  api.delete<void>(`/api/v1/library/games/${gameId}`).then((res) => {
    refreshRecsCache()
    return res
  })

// Filtered views
export const getBacklog = (): Promise<AxiosResponse<UserGameDTO[]>> =>
  api.get('/api/v1/library/backlog')

export const getWishlist = (): Promise<AxiosResponse<UserGameDTO[]>> =>
  api.get('/api/v1/library/wishlist')

export const getPlaying = (): Promise<AxiosResponse<UserGameDTO[]>> =>
  api.get('/api/v1/library/playing')

export const getCompleted = (): Promise<AxiosResponse<UserGameDTO[]>> =>
  api.get('/api/v1/library/completed')

// Special
export const getStats = (): Promise<AxiosResponse<UserStatsDTO>> =>
  api.get('/api/v1/library/stats')

export const getDustyGames = (): Promise<AxiosResponse<UserGameDTO[]>> =>
  api.get('/api/v1/library/dusty')

export const getLibraryGenres = (): Promise<AxiosResponse<string[]>> =>
  api.get('/api/v1/library/genres')

// Platforms (used in onboarding + recommendations)
export const getUserPlatforms = (): Promise<AxiosResponse<UserPlatformDTO[]>> =>
  api.get('/api/v1/library/platforms')

export const addPlatform = (data: AddPlatformRequest): Promise<AxiosResponse<UserPlatformDTO>> =>
  api.post('/api/v1/library/platforms', data)

export const removePlatform = (platformId: number): Promise<AxiosResponse<void>> =>
  api.delete(`/api/v1/library/platforms/${platformId}`)
