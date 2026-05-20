import type { AxiosError, AxiosResponse } from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './api'
import { recommendationKeys } from './recommendationService'
import type {
  AddGameRequest,
  AddPlatformRequest,
  GameStatus,
  SetPrimaryRequest,
  UpdateGameRequest,
  UpdateGenrePreferencesRequest,
  UpdateReleaseYearPreferencesRequest,
  UpdateTagPreferencesRequest,
  UserGameDTO,
  UserGenrePreferenceDTO,
  UserPlatformDTO,
  UserReleaseYearPreferenceDTO,
  UserStatsDTO,
  UserTagPreferenceDTO,
} from '../types/api'

export interface GetUserGamesParams {
  status?: GameStatus
  platform?: string
  search?: string
  genre?: string
}

// Collection
export const getUserGames = (params?: GetUserGamesParams): Promise<AxiosResponse<UserGameDTO[]>> =>
  api.get('/api/v1/library/games', { params })

export const getOwnedIgdbIds = (): Promise<AxiosResponse<number[]>> =>
  api.get('/api/v1/library/igdb-ids')

export const getUserGameByIgdbId = (igdbId: number): Promise<AxiosResponse<UserGameDTO>> =>
  api.get(`/api/v1/library/games/by-igdb/${igdbId}`)

export const addGame = (data: AddGameRequest): Promise<AxiosResponse<UserGameDTO>> =>
  api.post<UserGameDTO>('/api/v1/library/games', data)

export const updateGame = (gameId: number, data: UpdateGameRequest): Promise<AxiosResponse<UserGameDTO>> =>
  api.put<UserGameDTO>(`/api/v1/library/games/${gameId}`, data)

export const removeGame = (gameId: number): Promise<AxiosResponse<void>> =>
  api.delete<void>(`/api/v1/library/games/${gameId}`)

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

export const setPlatformPrimary = (
  platformId: number,
  data: SetPrimaryRequest
): Promise<AxiosResponse<UserPlatformDTO>> =>
  api.patch(`/api/v1/library/platforms/${platformId}/primary`, data)

// Genre preferences (cold-start signal collected during onboarding)
export const getGenrePreferences = (): Promise<AxiosResponse<UserGenrePreferenceDTO[]>> =>
  api.get('/api/v1/library/genre-preferences')

export const updateGenrePreferences = (
  data: UpdateGenrePreferencesRequest
): Promise<AxiosResponse<UserGenrePreferenceDTO[]>> =>
  api.put('/api/v1/library/genre-preferences', data)

// Tag preferences (Profile-only equivalent of genre preferences for the tag dimension)
export const getTagPreferences = (): Promise<AxiosResponse<UserTagPreferenceDTO[]>> =>
  api.get('/api/v1/library/tag-preferences')

export const updateTagPreferences = (
  data: UpdateTagPreferencesRequest
): Promise<AxiosResponse<UserTagPreferenceDTO[]>> =>
  api.put('/api/v1/library/tag-preferences', data)

// Release-year preferences (declared decade buckets; boost candidates whose release falls in)
export const getReleaseYearPreferences = (): Promise<AxiosResponse<UserReleaseYearPreferenceDTO[]>> =>
  api.get('/api/v1/library/release-year-preferences')

export const updateReleaseYearPreferences = (
  data: UpdateReleaseYearPreferencesRequest
): Promise<AxiosResponse<UserReleaseYearPreferenceDTO[]>> =>
  api.put('/api/v1/library/release-year-preferences', data)

// ─── TanStack Query hooks ───────────────────────────────────────────────────

export const libraryKeys = {
  all: ['library'] as const,
  games: (params?: GetUserGamesParams) => [...libraryKeys.all, 'games', params ?? {}] as const,
  ownedIgdbIds: () => [...libraryKeys.all, 'ownedIgdbIds'] as const,
  byIgdb: (igdbId: number) => [...libraryKeys.all, 'byIgdb', igdbId] as const,
  backlog: () => [...libraryKeys.all, 'backlog'] as const,
  wishlist: () => [...libraryKeys.all, 'wishlist'] as const,
  playing: () => [...libraryKeys.all, 'playing'] as const,
  completed: () => [...libraryKeys.all, 'completed'] as const,
  stats: () => [...libraryKeys.all, 'stats'] as const,
  dusty: () => [...libraryKeys.all, 'dusty'] as const,
  genres: () => [...libraryKeys.all, 'genres'] as const,
  platforms: () => [...libraryKeys.all, 'platforms'] as const,
  genrePreferences: () => [...libraryKeys.all, 'genrePreferences'] as const,
  tagPreferences: () => [...libraryKeys.all, 'tagPreferences'] as const,
  releaseYearPreferences: () => [...libraryKeys.all, 'releaseYearPreferences'] as const,
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

export const useUserGameByIgdb = (igdbId: number, enabled = true) =>
  useQuery<UserGameDTO | null>({
    queryKey: libraryKeys.byIgdb(igdbId),
    queryFn: () =>
      getUserGameByIgdbId(igdbId)
        .then((r) => r.data)
        .catch((e: AxiosError) => {
          if (e.response?.status === 404) return null
          throw e
        }),
    enabled: enabled && Number.isFinite(igdbId) && igdbId >= 1,
    retry: (failureCount, error) => {
      const status = (error as AxiosError).response?.status
      if (status === 404) return false
      return failureCount < 3
    },
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

export const useSetPlatformPrimary = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ platformId, isPrimary }: { platformId: number; isPrimary: boolean }) =>
      setPlatformPrimary(platformId, { isPrimary }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all })
      queryClient.invalidateQueries({ queryKey: recommendationKeys.all })
    },
  })
}

export const useGenrePreferences = () =>
  useQuery({
    queryKey: libraryKeys.genrePreferences(),
    queryFn: () =>
      getGenrePreferences().then((r) =>
        Array.isArray(r.data)
          ? r.data.map((d) => d.genreName ?? '').filter((s) => s.length > 0)
          : []
      ),
  })

export const useUpdateGenrePreferences = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (genres: string[]) =>
      updateGenrePreferences({ genres }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.genrePreferences() })
      queryClient.invalidateQueries({ queryKey: recommendationKeys.all })
    },
  })
}

export const useTagPreferences = () =>
  useQuery({
    queryKey: libraryKeys.tagPreferences(),
    queryFn: () =>
      getTagPreferences().then((r) =>
        Array.isArray(r.data)
          ? r.data.map((d) => d.tagName ?? '').filter((s) => s.length > 0)
          : []
      ),
  })

export const useUpdateTagPreferences = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tags: string[]) =>
      updateTagPreferences({ tags }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.tagPreferences() })
      queryClient.invalidateQueries({ queryKey: recommendationKeys.all })
    },
  })
}

export const useReleaseYearPreferences = () =>
  useQuery({
    queryKey: libraryKeys.releaseYearPreferences(),
    queryFn: () =>
      getReleaseYearPreferences().then((r) =>
        Array.isArray(r.data)
          ? r.data.map((d) => d.bucketLabel ?? '').filter((s) => s.length > 0)
          : []
      ),
  })

export const useUpdateReleaseYearPreferences = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (buckets: string[]) =>
      updateReleaseYearPreferences({ buckets }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.releaseYearPreferences() })
      queryClient.invalidateQueries({ queryKey: recommendationKeys.all })
    },
  })
}
