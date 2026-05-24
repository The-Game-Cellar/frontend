import { useState, useEffect, useRef, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import GameCard from '../components/common/GameCard'
import type { GameCardData } from '../components/common/GameCard'
import { recommendationKeys } from '../services/recommendationService'
import { getDashboard } from '../services/recommendationService'
import { useBacklog, useDustyGames, useUserPlatforms, useOwnedIgdbIds } from '../services/libraryService'
import { useUpcomingGames } from '../services/gameService'
import type {
  DashboardDTO,
  GameResponse,
  RecommendationDTO,
  UserGameDTO,
} from '../types/api'

// Dashboard recommendations buffer. `current` holds what's rendered; an
// in-memory queue holds N pre-fetched batches that are ready to swap in
// instantly when the user clicks Refresh. After every consume, a fresh batch
// is queued in the background so the buffer stays topped up; rapid refresh
// clicks burn through the queue without ever waiting on the network until the
// queue genuinely empties.
const DASHBOARD_CURRENT_KEY = [...recommendationKeys.dashboard(), 'current'] as const
const DASHBOARD_BUFFER_TARGET = 4

type LibraryDashboardEntry = UserGameDTO & { name: string }

interface SectionHeaderProps {
  title: string
  linkText?: string
  linkTo?: string
}

function SectionHeader({ title, linkText, linkTo }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-medium text-[#e8e4dc]">{title}</h2>
      {linkText && linkTo && (
        <Link to={linkTo} className="text-xs text-[#8891a8] hover:text-[#f72585] transition-colors">
          {linkText} →
        </Link>
      )}
    </div>
  )
}

interface ErrorBannerProps {
  message: string
  onRetry: () => void
}

function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg border border-[#1e2035] bg-[#12152a] text-sm">
      <span className="text-[#8891a8]">{message}</span>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#4a5068] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] active:scale-[0.97] transition-[border-color,color,transform]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        Retry
      </button>
    </div>
  )
}

const CARD_WIDTH = 176 // w-44
const GAP = 12         // gap-3

interface GameCardSkeletonProps {
  style?: CSSProperties
}

function GameCardSkeleton({ style }: GameCardSkeletonProps) {
  return (
    <div style={style} className="flex-shrink-0 rounded-lg overflow-hidden bg-[#12152a] animate-pulse">
      <div className="w-full aspect-[3/4] bg-[#1e2035]" />
      <div className="p-2 space-y-1.5">
        <div className="h-2.5 bg-[#1e2035] rounded w-3/4" />
        <div className="h-2 bg-[#1e2035] rounded w-1/2" />
      </div>
    </div>
  )
}

const RELEASE_DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function formatReleaseDate(epochSeconds: number | null | undefined): string {
  if (!epochSeconds) return ''
  return `Releases ${RELEASE_DATE_FORMAT.format(new Date(epochSeconds * 1000))}`
}

interface GameScrollProps<T extends GameCardData> {
  games: T[]
  getKey: (game: T) => string | number
  onClick: (game: T) => void
  loading?: boolean
  getSubtitle?: (game: T) => string | undefined
}

function GameScroll<T extends GameCardData>({ games, getKey, onClick, loading = false, getSubtitle }: GameScrollProps<T>) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visibleCount, setVisibleCount] = useState(6)
  const [cardWidth, setCardWidth] = useState(CARD_WIDTH)
  const [staggerTick, setStaggerTick] = useState(0)
  const prevGamesRef = useRef<T[]>(games)

  useEffect(() => {
    if (prevGamesRef.current !== games) {
      prevGamesRef.current = games
      setStaggerTick((t) => t + 1)
    }
  }, [games])

  useEffect(() => {
    const update = () => {
      if (!ref.current) return
      const w = ref.current.offsetWidth
      const count = Math.max(1, Math.floor((w + GAP) / (CARD_WIDTH + GAP)))
      setVisibleCount(count)
      setCardWidth(Math.floor((w - (count - 1) * GAP) / count))
    }
    update()
    const ro = new ResizeObserver(update)
    if (ref.current) ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  if (loading) {
    return (
      <div ref={ref} className="flex gap-3">
        {Array.from({ length: visibleCount }).map((_, i) => (
          <GameCardSkeleton key={i} style={{ width: cardWidth }} />
        ))}
      </div>
    )
  }

  return (
    <div ref={ref} className="flex gap-3">
      {games.slice(0, visibleCount).map((game, i) => (
        <div
          key={`${staggerTick}-${getKey(game)}`}
          className="animate-stagger-in"
          style={{ '--i': i } as CSSProperties}
        >
          <GameCard
            game={game}
            onClick={() => onClick(game)}
            style={{ width: cardWidth }}
            subtitle={getSubtitle ? getSubtitle(game) : undefined}
          />
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    data: dashData,
    isPending: dashLoading,
    isError: recsError,
  } = useQuery({
    queryKey: DASHBOARD_CURRENT_KEY,
    queryFn: () => getDashboard().then((r) => r.data),
  })

  // In-memory FIFO of pre-fetched dashboard batches + a counter for in-flight
  // refills. The buffer is drained one entry at a time by the Refresh button
  // and topped up to DASHBOARD_BUFFER_TARGET in the background. Refs (not state)
  // because mutations to these don't need to trigger renders.
  const bufferRef = useRef<DashboardDTO[]>([])
  const inFlightRef = useRef(0)

  const fetchOne = useCallback(() => {
    inFlightRef.current += 1
    return getDashboard()
      .then((res) => {
        if (res.data) bufferRef.current.push(res.data)
      })
      .catch(() => { /* swallow: refill is best-effort, refresh button still works */ })
      .finally(() => {
        inFlightRef.current -= 1
      })
  }, [])

  const refillBuffer = useCallback(() => {
    while (bufferRef.current.length + inFlightRef.current < DASHBOARD_BUFFER_TARGET) {
      fetchOne()
    }
  }, [fetchOne])

  // Once the current batch is rendered, top the buffer up. Re-runs whenever
  // dashData reference changes (e.g. after a refresh-button consume swaps in
  // a new batch via setQueryData) so the queue is continuously refilled.
  useEffect(() => {
    if (dashData) refillBuffer()
  }, [dashData, refillBuffer])

  // Track the rare cold-buffer fallback so the button can flag it briefly.
  const [dashRefreshing, setDashRefreshing] = useState(false)

  const loadDashboard = useCallback(async () => {
    if (bufferRef.current.length > 0) {
      const next = bufferRef.current.shift()!
      queryClient.setQueryData(DASHBOARD_CURRENT_KEY, next)
      // useEffect on dashData will trigger refillBuffer.
      return
    }
    // Cold buffer. Fetch directly, swap when it lands.
    setDashRefreshing(true)
    try {
      const res = await getDashboard()
      if (res.data) queryClient.setQueryData(DASHBOARD_CURRENT_KEY, res.data)
    } catch { /* ignore, keep showing current */ }
    setDashRefreshing(false)
  }, [queryClient])
  const recommendations: RecommendationDTO[] = dashData?.recommendations ?? []
  const becauseYouLiked = dashData?.becauseYouLiked ?? []
  const wildcard: RecommendationDTO[] = dashData?.wildcard ?? []

  const { data: backlogData, isError: backlogError, refetch: refetchBacklog } = useBacklog()
  const backlog: LibraryDashboardEntry[] = (backlogData ?? []).map((g) => ({ ...g, name: g.gameName ?? '' }))

  const { data: dustyData, isError: dustyError, refetch: refetchDusty } = useDustyGames()
  const dusty: LibraryDashboardEntry[] = (dustyData ?? []).map((g) => ({ ...g, name: g.gameName ?? '' }))

  const { data: platformsData } = useUserPlatforms()
  const platformNames = (platformsData ?? [])
    .map((p) => p.platformName ?? '')
    .filter((p) => p.length > 0)

  const { data: ownedIdsData } = useOwnedIgdbIds()
  const ownedIds = ownedIdsData ?? []

  const {
    data: upcomingResp,
    isPending: upcomingLoading,
    isFetching: upcomingRefreshing,
    isError: upcomingError,
    refetch: refetchUpcoming,
  } = useUpcomingGames({ platforms: platformNames, windowDays: 90, limit: 20, excludeIds: ownedIds })
  const upcoming: GameResponse[] = Array.isArray(upcomingResp?.games) ? upcomingResp.games : []

  const loadBacklog = () => { refetchBacklog() }
  const loadDusty = () => { refetchDusty() }
  const loadUpcoming = () => { refetchUpcoming() }

  return (
    <div className="space-y-10 animate-enter">

      {/* Recommendations for you */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[#e8e4dc]">Recommendations for you</h2>
          <div className="flex items-center gap-3">
            <Link to="/recommendations" className="text-xs text-[#8891a8] hover:text-[#f72585] transition-colors">
              View all →
            </Link>
            <button
              onClick={loadDashboard}
              disabled={dashRefreshing}
              className="text-xs px-2.5 py-1 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] active:scale-[0.97] transition-[border-color,color,transform] disabled:opacity-40 disabled:cursor-not-allowed"
              title="Re-shuffle"
            >
              {dashRefreshing ? '↻ Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        {recsError ? (
          <ErrorBanner message="Could not load recommendations." onRetry={loadDashboard} />
        ) : !dashLoading && recommendations.length === 0 ? (
          <p className="text-sm text-[#8891a8]">Couldn't load recommendations right now. Try refreshing in a moment.</p>
        ) : (
          <>
            {!dashLoading && recommendations.length > 0 && recommendations[0].tier === 3 && (
              <div className="inline-flex mb-3 px-4 py-2 rounded-lg border border-[#2a2d45] bg-[#12152a] text-xs text-[#8891a8]">
                Popular on your platforms. Rate games in your library to personalize.
              </div>
            )}
            <GameScroll
              games={recommendations}
              getKey={(g) => g.igdbId ?? 0}
              onClick={(g) => navigate(`/games/${g.igdbId}`)}
              loading={dashLoading}
            />
          </>
        )}
      </section>

      {/* Coming Soon: platform-filtered to user's owned platforms, default 90-day window. */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[#e8e4dc]">Coming soon</h2>
          <div className="flex items-center gap-3">
            <Link to="/explore?view=upcoming" className="text-xs text-[#8891a8] hover:text-[#f72585] transition-colors">
              View all →
            </Link>
            <button
              onClick={loadUpcoming}
              disabled={upcomingRefreshing}
              className="text-xs px-2.5 py-1 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] active:scale-[0.97] transition-[border-color,color,transform] disabled:opacity-40 disabled:cursor-not-allowed"
              title="Re-shuffle"
            >
              {upcomingRefreshing ? '↻ Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        {upcomingError ? (
          <ErrorBanner message="Could not load upcoming releases." onRetry={loadUpcoming} />
        ) : !upcomingLoading && upcoming.length === 0 ? (
          <p className="text-sm text-[#8891a8]">No upcoming releases on your platforms in the next 90 days.</p>
        ) : (
          <GameScroll
            games={upcoming}
            getKey={(g) => g.igdbId ?? 0}
            onClick={(g) => navigate(`/games/${g.igdbId}`)}
            loading={upcomingLoading}
            getSubtitle={(g) => formatReleaseDate(g.firstReleaseDate)}
          />
        )}
      </section>

      {/* Because you liked... */}
      {!recsError && !dashLoading && becauseYouLiked.map((section) => (
        <section key={section.basedOnIgdbId}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-[#e8e4dc]">
              Because you liked{' '}
              <Link
                to={`/games/${section.basedOnIgdbId}`}
                className="text-[#f72585] [text-shadow:0_0_8px_#f72585] hover:underline"
              >
                {section.basedOnGame}
              </Link>
            </h2>
          </div>
          <GameScroll
            games={section.recommendations ?? []}
            getKey={(g) => g.igdbId ?? 0}
            onClick={(g) => navigate(`/games/${g.igdbId}`)}
          />
        </section>
      ))}

      {/* Backlog */}
      <section>
        <SectionHeader title="Your backlog" linkText="View all" linkTo="/library" />
        {backlogError ? (
          <ErrorBanner message="Could not load your backlog." onRetry={loadBacklog} />
        ) : backlog.length === 0 ? (
          <p className="text-sm text-[#8891a8]">Your backlog is empty.</p>
        ) : (
          <GameScroll
            games={backlog}
            getKey={(g) => g.id ?? 0}
            onClick={(g) => navigate(`/games/${g.igdbGameId}`)}
          />
        )}
      </section>

      {/* Dusty games */}
      {dustyError ? (
        <section>
          <SectionHeader title="Dusty games" linkText="View all" linkTo="/library?filter=dusty" />
          <ErrorBanner message="Could not load dusty games." onRetry={loadDusty} />
        </section>
      ) : dusty.length > 0 && (
        <section>
          <SectionHeader title="Dusty games" linkText="View all" linkTo="/library?filter=dusty" />
          <GameScroll
            games={dusty}
            getKey={(g) => g.id ?? 0}
            onClick={(g) => navigate(`/games/${g.igdbGameId}`)}
          />
        </section>
      )}

      {/* Wild Card */}
      {!recsError && !dashLoading && wildcard.length > 0 && (
        <section>
          <SectionHeader title="Wild Card" linkText="More →" linkTo="/wildcard" />
          <GameScroll
            games={wildcard}
            getKey={(g) => g.igdbId ?? 0}
            onClick={(g) => navigate(`/games/${g.igdbId}`)}
          />
        </section>
      )}

    </div>
  )
}
