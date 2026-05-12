import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExchangeAuthorizationCode } from '../services/authService'
import { getUserPlatforms } from '../services/libraryService'
import useAuth from '../hooks/useAuth'

export default function Callback() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const exchangeMutation = useExchangeAuthorizationCode()
  const [stateError, setStateError] = useState<string | null>(null)

  const params = new URLSearchParams(window.location.search)
  const errorParam = params.get('error')
  const initialErrorMessage = errorParam
    ? (params.get('error_description') || 'Registration was cancelled.')
    : null
  const exchangeError = exchangeMutation.isError
    ? (exchangeMutation.error instanceof Error ? exchangeMutation.error.message : 'Authentication failed')
    : null
  const error = initialErrorMessage ?? stateError ?? exchangeError

  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    if (initialErrorMessage) return
    const code = params.get('code')
    if (!code) {
      navigate('/register', { replace: true })
      return
    }
    const returnedState = params.get('state')
    const storedState = sessionStorage.getItem('oauth_state')
    sessionStorage.removeItem('oauth_state')
    if (!returnedState || !storedState || returnedState !== storedState) {
      sessionStorage.removeItem('pkce_verifier')
      setStateError('Authentication failed. Please try registering again.')
      return
    }
    exchangeMutation.mutate(code, {
      onSuccess: async (userInfo) => {
        login(userInfo)
        try {
          const { data: platforms } = await getUserPlatforms()
          navigate(platforms.length > 0 ? '/dashboard' : '/onboarding', { replace: true })
        } catch {
          navigate('/onboarding', { replace: true })
        }
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center font-mono p-6">
        <div className="bg-[#111220] border border-[#1e2035] rounded-xl p-8 w-full max-w-md space-y-4 text-center">
          <p className="text-xs text-[#ef4444]">{error}</p>
          <button
            onClick={() => navigate('/register', { replace: true })}
            className="text-xs text-[#8891a8] hover:text-[#e8e4dc] transition-colors duration-200"
          >
            Back to register
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center font-mono">
      <p className="text-xs text-[#4a5068]">Completing registration...</p>
    </div>
  )
}
