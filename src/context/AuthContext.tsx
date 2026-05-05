import { createContext } from 'react'
import type { UserInfo } from '../services/authService'

export interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  userId: string | null
  email: string | null
  roles: string[]
  login: (userInfo: UserInfo) => void
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
