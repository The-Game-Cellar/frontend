import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '../server'
import {
  libraryKeys,
  useAddGame,
  useUpdateGame,
  useRemoveGame,
} from '../../services/libraryService'
import { recommendationKeys } from '../../services/recommendationService'
import { queryClient as appQueryClient } from '../../services/queryClient'
import { logout } from '../../services/authService'

const API = 'http://api.test'

function makeClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('library mutations invalidate dependent caches', () => {
  let client: QueryClient
  let spy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    client = makeClient()
    spy = vi.spyOn(client, 'invalidateQueries')
  })

  it('useAddGame onSuccess invalidates library + recommendations', async () => {
    server.use(
      http.post(`${API}/api/v1/library/games`, () =>
        HttpResponse.json({ id: 1, igdbGameId: 100, status: 'BACKLOG' }),
      ),
    )

    const { result } = renderHook(() => useAddGame(), { wrapper: wrap(client) })
    result.current.mutate({ igdbGameId: 100, gameName: 'Test', platform: 'PC', status: 'BACKLOG' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: libraryKeys.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: recommendationKeys.all })
  })

  it('useUpdateGame onSuccess invalidates library + recommendations', async () => {
    server.use(
      http.put(`${API}/api/v1/library/games/:id`, () =>
        HttpResponse.json({ id: 1, igdbGameId: 100, status: 'PLAYING' }),
      ),
    )

    const { result } = renderHook(() => useUpdateGame(), { wrapper: wrap(client) })
    result.current.mutate({ gameId: 1, data: { status: 'PLAYING' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: libraryKeys.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: recommendationKeys.all })
  })

  it('useRemoveGame onSuccess invalidates library + recommendations', async () => {
    server.use(
      http.delete(`${API}/api/v1/library/games/:id`, () => new HttpResponse(null, { status: 204 })),
    )

    const { result } = renderHook(() => useRemoveGame(), { wrapper: wrap(client) })
    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: libraryKeys.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: recommendationKeys.all })
  })
})

describe('logout clears the shared QueryClient cache', () => {
  it('drops all cached queries via queryClient.clear()', async () => {
    appQueryClient.setQueryData(libraryKeys.all, [{ id: 1 }])
    appQueryClient.setQueryData(recommendationKeys.all, [{ id: 2 }])

    expect(appQueryClient.getQueryData(libraryKeys.all)).toBeDefined()
    expect(appQueryClient.getQueryData(recommendationKeys.all)).toBeDefined()

    await logout()

    expect(appQueryClient.getQueryData(libraryKeys.all)).toBeUndefined()
    expect(appQueryClient.getQueryData(recommendationKeys.all)).toBeUndefined()
  })
})
