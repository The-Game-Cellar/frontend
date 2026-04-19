import { createContext, useState, useCallback } from 'react';
import { logout as logoutApi } from '../services/authService';

function readUserInfoCookie() {
  const match = document.cookie.split(';').find(c => c.trim().startsWith('user_info='));
  if (!match) return null;
  try {
    const encoded = match.substring(match.indexOf('=') + 1).trim();
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const info = readUserInfoCookie();
    return info ? { userId: info.userId, email: info.email, roles: info.roles ?? [] } : null;
  });

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
