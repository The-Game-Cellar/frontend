import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exchangeAuthorizationCode } from '../services/authService'
import { getUserPlatforms } from '../services/libraryService'
import useAuth from '../hooks/useAuth'

export default function Callback() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const errorParam = params.get('error')

    if (errorParam) {
      setError(params.get('error_description') || 'Registration was cancelled.')
      return
    }

    if (!code) {
      navigate('/register', { replace: true })
      return
    }

    exchangeAuthorizationCode(code)
      .then(async (userInfo) => {
        login(userInfo)
        try {
          const { data: platforms } = await getUserPlatforms()
          navigate(platforms.length > 0 ? '/dashboard' : '/onboarding', { replace: true })
        } catch {
          navigate('/onboarding', { replace: true })
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Authentication failed'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
