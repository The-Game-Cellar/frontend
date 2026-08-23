import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import { clearRecentlyShownIds } from './recommendationService'
import { clearRecentlyShownUpcomingIds } from './gameService'
import type { AccountExportDTO } from '../types/api'
import { markPendingLogin } from '../config/loginTransition'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Login and account creation happen on Keycloak. The gateway starts the flow, so
// this is a full page navigation rather than a fetch: the browser has to leave.
export function startLogin(register = false): void {
  markPendingLogin()
  window.location.assign(`${API_URL}/api/v1/auth/authorize${register ? '?register=true' : ''}`)
}

export type AccountAction = 'UPDATE_PASSWORD' | 'UPDATE_EMAIL' | 'DELETE_ACCOUNT'

// Password and email are changed on Keycloak's own pages; deletion sends the user there
// only to prove who they are and is confirmed back here. All three leave the app.
export function startAccountAction(intent: AccountAction): void {
  window.location.assign(`${API_URL}/api/v1/auth/authorize?intent=${intent}`)
}

export interface UserInfo {
  userId: string
  email: string
  roles?: string[]
}

interface ApiErrorBody {
  error?: string
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as ApiErrorBody
  return body.error || fallback
}

export async function refreshAccessToken(): Promise<UserInfo> {
  const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Token refresh failed')
  return res.json() as Promise<UserInfo>
}

export async function logout(): Promise<void> {
  queryClient.clear()
  clearRecentlyShownIds()
  clearRecentlyShownUpcomingIds()
  await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}

export async function getMe(): Promise<UserInfo> {
  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Not authenticated')
  return res.json() as Promise<UserInfo>
}

export async function deleteAccount(): Promise<Record<string, unknown>> {
  queryClient.clear()
  clearRecentlyShownIds()
  clearRecentlyShownUpcomingIds()
  const res = await fetch(`${API_URL}/api/v1/auth/account`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Account deletion failed'))
  }
  return res.json() as Promise<Record<string, unknown>>
}

export async function exportAccountData(): Promise<AccountExportDTO> {
  const res = await fetch(`${API_URL}/api/v1/library/account/export`, {
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Data export failed'))
  }
  return res.json() as Promise<AccountExportDTO>
}

// Auth bootstrap (getMe / refreshAccessToken) stays imperative in AuthProvider; only writes are mutations.
export const useDeleteAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteAccount(),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export const useExportAccountData = () =>
  useMutation({
    mutationFn: () => exportAccountData(),
  })
