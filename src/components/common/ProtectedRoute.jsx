import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

/**
 * Wraps routes that require a valid JWT.
 * Unauthenticated users are redirected to /login.
 * The `replace` prop prevents the login page from being pushed to history.
 */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
