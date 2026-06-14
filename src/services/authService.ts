import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import { clearRecentlyShownIds } from './recommendationService'
import { clearRecentlyShownUpcomingIds } from './gameService'
import type { AccountExportDTO } from '../types/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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

export async function login(username: string, password: string): Promise<UserInfo> {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Invalid username or password'))
  }
  return res.json() as Promise<UserInfo>
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

export async function register(username: string, email: string, password: string): Promise<UserInfo> {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Registration failed'))
  }
  return res.json() as Promise<UserInfo>
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/api/v1/auth/change-password`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Password update failed'))
  }
  return res.json() as Promise<Record<string, unknown>>
}

export async function changeEmail(currentPassword: string, newEmail: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/api/v1/auth/change-email`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newEmail }),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Email update failed'))
  }
  return res.json() as Promise<Record<string, unknown>>
}

export async function deleteAccount(currentPassword: string): Promise<Record<string, unknown>> {
  queryClient.clear()
  clearRecentlyShownIds()
  clearRecentlyShownUpcomingIds()
  const res = await fetch(`${API_URL}/api/v1/auth/account`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword }),
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
export const useLogin = () =>
  useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      login(username, password),
  })

export const useRegister = () =>
  useMutation({
    mutationFn: ({ username, email, password }: { username: string; email: string; password: string }) =>
      register(username, email, password),
  })

export const useChangeEmail = () =>
  useMutation({
    mutationFn: ({ currentPassword, newEmail }: { currentPassword: string; newEmail: string }) =>
      changeEmail(currentPassword, newEmail),
  })

export const useChangePassword = () =>
  useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      changePassword(currentPassword, newPassword),
  })

export const useDeleteAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (currentPassword: string) => deleteAccount(currentPassword),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export const useExportAccountData = () =>
  useMutation({
    mutationFn: () => exportAccountData(),
  })
