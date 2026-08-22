import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import LoginTransition from './LoginTransition'
import { getDashboard, recommendationKeys } from '../../services/recommendationService'
import {
  MIN_FIRST_MS,
  MIN_REPEAT_MS,
  MAX_MS,
  isFirstLogin,
  markFirstLoginDone,
  consumePendingLogin,
} from '../../config/loginTransition'

type TransitionState = 'idle' | 'entering' | 'leaving'

export default function PostLoginTransition() {
  const queryClient = useQueryClient()

  // Read once per mount, before first paint, so the overlay is up on the very first
  // frame after the redirect rather than flashing the dashboard first.
  const [pending] = useState(consumePendingLogin)
  const [floor] = useState(() => (isFirstLogin() ? MIN_FIRST_MS : MIN_REPEAT_MS))
  const [state, setState] = useState<TransitionState>(() => (pending ? 'entering' : 'idle'))

  useEffect(() => {
    if (!pending) return

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
        if (!cancelled) setState('idle')
      }, 250)
    }

    run()

    return () => {
      cancelled = true
      if (fadeTimer) clearTimeout(fadeTimer)
    }
  }, [pending, floor, queryClient])

  if (state === 'idle') return null

  return <LoginTransition leaving={state === 'leaving'} durationMs={floor} />
}
