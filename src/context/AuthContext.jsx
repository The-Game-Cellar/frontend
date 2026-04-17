import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { refreshAccessToken } from '../services/authService';

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
  const [idToken, setIdToken] = useState(() => localStorage.getItem('idToken'));
  const [user, setUser] = useState(null);
  const refreshTimerRef = useRef(null);

  // Parse user from token and schedule proactive refresh
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!token) {
      setUser(null);
      return;
    }

    const parsed = parseJwt(token);

    if (!parsed || parsed.exp * 1000 <= Date.now()) {
      // Already expired — try refresh immediately
      doRefresh();
      return;
    }

    setUser({
      userId: parsed.sub,
      email: parsed.email ?? parsed.preferred_username ?? null,
      roles: parsed.realm_access?.roles ?? [],
    });

    // Schedule a proactive refresh 60 seconds before expiry
    const msUntilRefresh = parsed.exp * 1000 - Date.now() - 60_000;
    if (msUntilRefresh > 0) {
      refreshTimerRef.current = setTimeout(doRefresh, msUntilRefresh);
    } else {
      // Less than 60 s left — refresh now
      doRefresh();
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const doRefresh = useCallback(async () => {
    const storedRefresh = localStorage.getItem('refreshToken');
    if (!storedRefresh) {
      clearAll();
      return;
    }
    try {
      const { access_token, refresh_token } = await refreshAccessToken(storedRefresh);
      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      setToken(access_token);
    } catch {
      // Refresh token expired — force logout
      clearAll();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function clearAll() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('idToken');
    setToken(null);
    setIdToken(null);
    setUser(null);
  }

  const login = useCallback((accessToken, refreshToken, newIdToken) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (newIdToken) {
      localStorage.setItem('idToken', newIdToken);
      setIdToken(newIdToken);
    }
    setToken(accessToken);
  }, []);

  const logout = useCallback(() => {
    clearAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider
      value={{
        token,
        idToken,
        isAuthenticated: !!user,
        userId: user?.userId ?? null,
        email: user?.email ?? null,
        roles: user?.roles ?? [],
        login,
        logout,
        doRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
