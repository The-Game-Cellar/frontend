import { useState, useEffect, useRef, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GameCard from '../components/common/GameCard'
import type { GameCardData } from '../components/common/GameCard'
import {
  getDashboard,
  prefetchPersonalized,
  consumePrefetchedDashboard,
  getLoadedDashboard,
  setLoadedDashboard,
  invalidateDashboard,
} from '../services/recommendationService'
import { getBacklog, getDustyGames, getUserPlatforms, getOwnedIgdbIds } from '../services/libraryService'
import { getUpcomingGames } from '../services/gameService'
import type {
  BecauseYouLikedDTO,
  DashboardDTO,
  GameResponse,
  RecommendationDTO,
  UserGameDTO,
} from '../types/api'

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
      {games.slice(0, visibleCount).map((game) => (
        <GameCard
          key={getKey(game)}
          game={game}
          onClick={() => onClick(game)}
          style={{ width: cardWidth }}
          subtitle={getSubtitle ? getSubtitle(game) : undefined}
        />
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [recommendations, setRecommendations] = useState<RecommendationDTO[]>([])
  const [becauseYouLiked, setBecauseYouLiked] = useState<BecauseYouLikedDTO[]>([])
  const [wildcard, setWildcard] = useState<RecommendationDTO[]>([])
  const [backlog, setBacklog] = useState<LibraryDashboardEntry[]>([])
  const [dusty, setDusty] = useState<LibraryDashboardEntry[]>([])
  const [upcoming, setUpcoming] = useState<GameResponse[]>([])
  const [upcomingLoading, setUpcomingLoading] = useState(true)
  const [upcomingError, setUpcomingError] = useState(false)
  const [dashLoading, setDashLoading] = useState(true)
  const [recsError, setRecsError] = useState(false)
  const [backlogError, setBacklogError] = useState(false)
  const [dustyError, setDustyError] = useState(false)

  const loadBacklog = useCallback(() => {
    setBacklogError(false)
    getBacklog()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : []
        setBacklog(data.map((g) => ({ ...g, name: g.gameName ?? '' })))
      })
      .catch(() => setBacklogError(true))
  }, [])

  const loadDusty = useCallback(() => {
    setDustyError(false)
    getDustyGames()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : []
        setDusty(data.map((g) => ({ ...g, name: g.gameName ?? '' })))
      })
      .catch(() => setDustyError(true))
  }, [])

  const loadUpcoming = useCallback(() => {
    setUpcomingError(false)
    setUpcomingLoading(true)
    Promise.all([getUserPlatforms(), getOwnedIgdbIds()])
      .then(([platformsRes, ownedRes]) => {
        const platformList = Array.isArray(platformsRes.data) ? platformsRes.data : []
        const platformNames = platformList
          .map((p) => p.platformName ?? '')
          .filter((p) => p.length > 0)
        const ownedIds = Array.isArray(ownedRes.data) ? ownedRes.data : []
        return getUpcomingGames({ platforms: platformNames, windowDays: 90, limit: 20, excludeIds: ownedIds })
      })
      .then((res) => {
        const data = Array.isArray(res.data?.games) ? res.data.games : []
        setUpcoming(data)
      })
      .catch(() => setUpcomingError(true))
      .finally(() => setUpcomingLoading(false))
  }, [])

  const applyDashboardPayload = useCallback((data: DashboardDTO | null) => {
    setRecommendations(data?.recommendations ?? [])
    setBecauseYouLiked(data?.becauseYouLiked ?? [])
    setWildcard(data?.wildcard ?? [])
  }, [])

  const loadDashboard = useCallback(() => {
    setRecsError(false)

    const cached = getLoadedDashboard()
    if (cached) {
      applyDashboardPayload(cached)
      setDashLoading(false)
      return
    }

    const prefetched = consumePrefetchedDashboard()
    if (prefetched) {
      setDashLoading(true)
      prefetched
        .then((data) => {
          if (!data) {
            setRecsError(true)
            return
          }
          applyDashboardPayload(data)
          setLoadedDashboard(data)
        })
        .catch(() => setRecsError(true))
        .finally(() => setDashLoading(false))
      return
    }

    setDashLoading(true)
    getDashboard()
      .then((res) => {
        const data = res.data
        applyDashboardPayload(data)
        setLoadedDashboard(data)
      })
      .catch(() => setRecsError(true))
      .finally(() => setDashLoading(false))
  }, [applyDashboardPayload])

  useEffect(() => {
    loadBacklog()
    loadDusty()
    loadDashboard()
    loadUpcoming()
    prefetchPersonalized(100)
  }, [loadBacklog, loadDusty, loadDashboard, loadUpcoming])

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
              onClick={() => { invalidateDashboard(); loadDashboard() }}
              className="text-xs px-2.5 py-1 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] active:scale-[0.97] transition-[border-color,color,transform]"
              title="Re-shuffle"
            >
              Refresh
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

      {/* Coming Soon — platform-filtered to user's owned platforms, default 90-day window. */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[#e8e4dc]">Coming soon</h2>
          <div className="flex items-center gap-3">
            <Link to="/explore?view=upcoming" className="text-xs text-[#8891a8] hover:text-[#f72585] transition-colors">
              View all →
            </Link>
            <button
              onClick={loadUpcoming}
              className="text-xs px-2.5 py-1 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] active:scale-[0.97] transition-[border-color,color,transform]"
              title="Re-shuffle"
            >
              Refresh
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
