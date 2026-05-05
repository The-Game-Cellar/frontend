import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { logout as logoutApi, getMe, refreshAccessToken } from '../services/authService'
import type { UserInfo } from '../services/authService'
import { AuthContext } from './AuthContext'

interface UserState {
  userId: string
  email: string
  roles: string[]
}

interface AuthProviderProps {
  children: ReactNode
}

function toUserState(userInfo: UserInfo): UserState {
  return {
    userId: userInfo.userId,
    email: userInfo.email,
    roles: userInfo.roles ?? [],
  }
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function bootstrap() {
      try {
        const userInfo = await getMe()
        setUser(toUserState(userInfo))
      } catch {
        try {
          const userInfo = await refreshAccessToken()
          setUser(toUserState(userInfo))
        } catch {
          setUser(null)
        }
      } finally {
        setIsLoading(false)
      }
    }
    bootstrap()
  }, [])

  const login = useCallback((userInfo: UserInfo) => {
    setUser(toUserState(userInfo))
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } finally {
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        userId: user?.userId ?? null,
        email: user?.email ?? null,
        roles: user?.roles ?? [],
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


