import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import useAuth from '../hooks/useAuth'
import { useLogin } from '../services/authService'
import { recommendationKeys } from '../services/recommendationService'
import { getDashboard } from '../services/recommendationService'
import AttributionFooter from '../components/common/AttributionFooter'
import LoginTransition from '../components/common/LoginTransition'
import {
  MIN_FIRST_MS,
  MIN_REPEAT_MS,
  MAX_MS,
  isFirstLogin,
  markFirstLoginDone,
} from '../config/loginTransition'

type TransitionState = 'idle' | 'entering' | 'leaving'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const loginMutation = useLogin()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [transitionState, setTransitionState] = useState<TransitionState>('idle')
  const [transitionFloor, setTransitionFloor] = useState(MIN_FIRST_MS)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const userInfo = await loginMutation.mutateAsync({ username, password })
      login(userInfo)

      // Prime the dashboard "current" buffer slot so the post-login mount renders instantly.
      // Dashboard maintains a separate "next" buffer that's queued after first render so
      // the user's first refresh click is also instant. See Dashboard.tsx.
      const dashboardPromise = queryClient.prefetchQuery({
        queryKey: [...recommendationKeys.dashboard(), 'current'],
        queryFn: () => getDashboard().then((r) => r.data),
      })

      const minFloor = isFirstLogin() ? MIN_FIRST_MS : MIN_REPEAT_MS
      const startedAt = Date.now()

      setTransitionFloor(minFloor)
      setTransitionState('entering')

      const cap = new Promise<void>((resolve) => setTimeout(resolve, MAX_MS))
      await Promise.race([dashboardPromise, cap])

      const elapsed = Date.now() - startedAt
      const remainder = Math.max(0, minFloor - elapsed)
      if (remainder > 0) await new Promise<void>((resolve) => setTimeout(resolve, remainder))

      markFirstLoginDone()
      setTransitionState('leaving')
      // Match LoginTransition's fade-out duration so the cross-fade reads.
      setTimeout(() => navigate('/dashboard'), 250)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setTransitionState('idle')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] flex flex-col items-center justify-center font-mono">
      <div className="bg-[#111220] border border-[#1e2035] rounded-xl p-8 w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-[#e8e4dc] tracking-wider">
            THE GAME CELLAR
          </h1>
          <p className="text-xs text-[#4a5068]">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="username" className="block text-xs text-[#4a5068] uppercase tracking-wider">
              Username or email
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#0a0b14] border border-[#2a2d45] rounded px-3 py-2 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none focus:[box-shadow:0_0_8px_#f7258540] transition-[border-color,box-shadow] duration-200"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs text-[#4a5068] uppercase tracking-wider">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0a0b14] border border-[#2a2d45] rounded px-3 py-2 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none focus:[box-shadow:0_0_8px_#f7258540] transition-[border-color,box-shadow] duration-200"
            />
          </div>

          {error && (
            <p className="text-xs text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] active:scale-[0.97] disabled:opacity-40 transition-[box-shadow,transform] duration-200"
          >
            {loading ? '[ SIGNING IN... ]' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-center text-[#4a5068]">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-[color,text-shadow] duration-200"
          >
            Create one
          </Link>
        </p>
      </div>
      <div className="mt-6">
        <AttributionFooter />
      </div>
      {transitionState !== 'idle' && (
        <LoginTransition leaving={transitionState === 'leaving'} durationMs={transitionFloor} />
      )}
    </div>
  )
}
