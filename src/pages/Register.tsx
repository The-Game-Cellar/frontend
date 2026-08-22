import { useEffect } from 'react'
import { startLogin } from '../services/authService'

export default function Register() {
  // Account creation is a Keycloak-hosted page now. The route is kept so existing
  // links and bookmarks still land somewhere, and it forwards to that page.
  useEffect(() => {
    startLogin(true)
  }, [])

  return null
}
