import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import LoginTransition from './LoginTransition'
import useAuth from '../../hooks/useAuth'
import { getDashboard, recommendationKeys } from '../../services/recommendationService'
import {
  MIN_FIRST_MS,
  MIN_REPEAT_MS,
  MAX_MS,
  isFirstLogin,
  markFirstLoginDone,
  consumePendingLogin,
} from '../../config/loginTransition'

type TransitionState = 'entering' | 'leaving' | 'done'

export default function PostLoginTransition() {
  const queryClient = useQueryClient()
  const { isAuthenticated, isLoading } = useAuth()

  // The flag is read and removed on the first load whatever follows, so one that a sign-in
  // never completed (Keycloak left, or the callback failed) cannot outlive that load.
  const [pending] = useState(consumePendingLogin)
  const [floor] = useState(() => (isFirstLogin() ? MIN_FIRST_MS : MIN_REPEAT_MS))
  const [state, setState] = useState<TransitionState>('entering')
  // Only an arrival the gateway answers as signed in is a sign-in. A signed-out visitor with the
  // flag gets nothing, since the prefetch would 401 and the client would send them to the sign-in.
  // Until the answer the routes render nothing, so the dashboard cannot show before the overlay.
  const arrived = pending && !isLoading && isAuthenticated

  useEffect(() => {
    if (!arrived) return

    const minFloor = floor
    const startedAt = Date.now()
    let cancelled = false
    let fadeTimer: ReturnType<typeof setTimeout> | undefined

    async function run() {
      // Prime the dashboard slot so the overlay covers the fetch instead of the
      // user watching an empty grid fill in behind it.
      const prefetch = queryClient.prefetchQuery({
        queryKey: [...recommendationKeys.dashboard(), 'current'],
        queryFn: () => getDashboard().then((r) => r.data),
      })
      const cap = new Promise<void>((resolve) => setTimeout(resolve, MAX_MS))
      await Promise.race([prefetch, cap])

      const remainder = Math.max(0, minFloor - (Date.now() - startedAt))
      if (remainder > 0) await new Promise<void>((resolve) => setTimeout(resolve, remainder))
      if (cancelled) return

      markFirstLoginDone()
      setState('leaving')
      // Matches LoginTransition's fade-out so the cross-fade reads cleanly.
      fadeTimer = setTimeout(() => {
        if (!cancelled) setState('done')
      }, 250)
    }

    run()

    return () => {
      cancelled = true
      if (fadeTimer) clearTimeout(fadeTimer)
    }
  }, [arrived, floor, queryClient])

  if (!arrived || state === 'done') return null

  return <LoginTransition leaving={state === 'leaving'} durationMs={floor} />
}
