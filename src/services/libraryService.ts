import type { AxiosResponse } from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './api'
import {
  invalidatePrefetchedPersonalized,
  prefetchPersonalized,
  invalidateDashboard,
  prefetchDashboard,
  recommendationKeys,
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

// ─── TanStack Query hooks ───────────────────────────────────────────────────

export const libraryKeys = {
  all: ['library'] as const,
  games: (params?: GetUserGamesParams) => [...libraryKeys.all, 'games', params ?? {}] as const,
  ownedIgdbIds: () => [...libraryKeys.all, 'ownedIgdbIds'] as const,
  backlog: () => [...libraryKeys.all, 'backlog'] as const,
  wishlist: () => [...libraryKeys.all, 'wishlist'] as const,
  playing: () => [...libraryKeys.all, 'playing'] as const,
  completed: () => [...libraryKeys.all, 'completed'] as const,
  stats: () => [...libraryKeys.all, 'stats'] as const,
  dusty: () => [...libraryKeys.all, 'dusty'] as const,
  genres: () => [...libraryKeys.all, 'genres'] as const,
  platforms: () => [...libraryKeys.all, 'platforms'] as const,
}

export const useUserGames = (params?: GetUserGamesParams) =>
  useQuery({
    queryKey: libraryKeys.games(params),
    queryFn: () => getUserGames(params).then((r) => (Array.isArray(r.data) ? r.data : [])),
  })

export const useOwnedIgdbIds = () =>
  useQuery({
    queryKey: libraryKeys.ownedIgdbIds(),
    queryFn: () => getOwnedIgdbIds().then((r) => (Array.isArray(r.data) ? r.data : [])),
  })

export const useBacklog = () =>
  useQuery({
    queryKey: libraryKeys.backlog(),
    queryFn: () => getBacklog().then((r) => (Array.isArray(r.data) ? r.data : [])),
  })

export const useWishlist = () =>
  useQuery({
    queryKey: libraryKeys.wishlist(),
    queryFn: () => getWishlist().then((r) => (Array.isArray(r.data) ? r.data : [])),
  })

export const usePlaying = () =>
  useQuery({
    queryKey: libraryKeys.playing(),
    queryFn: () => getPlaying().then((r) => (Array.isArray(r.data) ? r.data : [])),
  })

export const useCompleted = () =>
  useQuery({
    queryKey: libraryKeys.completed(),
    queryFn: () => getCompleted().then((r) => (Array.isArray(r.data) ? r.data : [])),
  })

export const useStats = () =>
  useQuery({
    queryKey: libraryKeys.stats(),
    queryFn: () => getStats().then((r) => r.data),
  })

export const useDustyGames = () =>
  useQuery({
    queryKey: libraryKeys.dusty(),
    queryFn: () => getDustyGames().then((r) => (Array.isArray(r.data) ? r.data : [])),
  })

export const useLibraryGenres = () =>
  useQuery({
    queryKey: libraryKeys.genres(),
    queryFn: () => getLibraryGenres().then((r) => (Array.isArray(r.data) ? r.data : [])),
  })

export const useUserPlatforms = () =>
  useQuery({
    queryKey: libraryKeys.platforms(),
    queryFn: () => getUserPlatforms().then((r) => (Array.isArray(r.data) ? r.data : [])),
  })

const invalidateLibraryAndRecs = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: libraryKeys.all })
  qc.invalidateQueries({ queryKey: recommendationKeys.all })
}

export const useAddGame = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AddGameRequest) => addGame(data).then((r) => r.data),
    onSuccess: () => invalidateLibraryAndRecs(queryClient),
  })
}

export const useUpdateGame = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ gameId, data }: { gameId: number; data: UpdateGameRequest }) =>
      updateGame(gameId, data).then((r) => r.data),
    onSuccess: () => invalidateLibraryAndRecs(queryClient),
  })
}

export const useRemoveGame = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (gameId: number) => removeGame(gameId).then((r) => r.data),
    onSuccess: () => invalidateLibraryAndRecs(queryClient),
  })
}

export const useAddPlatform = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AddPlatformRequest) => addPlatform(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all })
      queryClient.invalidateQueries({ queryKey: recommendationKeys.all })
    },
  })
}

export const useRemovePlatform = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (platformId: number) => removePlatform(platformId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all })
      queryClient.invalidateQueries({ queryKey: recommendationKeys.all })
    },
  })
}
