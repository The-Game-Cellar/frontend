import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { useOnboardingStatus } from '../../services/libraryService'

const ONBOARDING_PATH = '/onboarding'

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const { pathname } = useLocation()
  const { data: onboarding, isLoading: onboardingLoading } = useOnboardingStatus()

  if (isLoading) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (onboardingLoading) return null

  // Login returns from Keycloak through a redirect that looks the same for a first
  // login and a thousandth, so the account's own state is what decides where it lands.
  if (!onboarding?.completed && pathname !== ONBOARDING_PATH) {
    return <Navigate to={ONBOARDING_PATH} replace />
  }

  if (onboarding?.completed && pathname === ONBOARDING_PATH) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
