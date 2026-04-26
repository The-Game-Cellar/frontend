import { createContext, useState, useEffect, useCallback } from 'react';
import { logout as logoutApi, getMe, refreshAccessToken } from '../services/authService';

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const userInfo = await getMe();
        setUser({ userId: userInfo.userId, email: userInfo.email, roles: userInfo.roles ?? [] });
      } catch {
        try {
          const userInfo = await refreshAccessToken();
          setUser({ userId: userInfo.userId, email: userInfo.email, roles: userInfo.roles ?? [] });
        } catch {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
  }, []);

  const login = useCallback((userInfo) => {
    setUser({
      userId: userInfo.userId,
      email: userInfo.email,
      roles: userInfo.roles ?? [],
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  }, []);

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
  );
}
