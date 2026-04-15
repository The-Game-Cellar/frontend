import { createContext, useState, useEffect, useCallback } from 'react';

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const parsed = parseJwt(token);

    // Reject expired tokens
    if (!parsed || parsed.exp * 1000 <= Date.now()) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      return;
    }

    setUser({
      userId: parsed.sub,
      email: parsed.email ?? parsed.preferred_username ?? null,
      roles: parsed.realm_access?.roles ?? [],
    });
  }, [token]);

  const login = useCallback((newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
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
