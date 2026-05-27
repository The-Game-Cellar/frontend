import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import GameCard from '../components/common/GameCard'
import type { GameCardData } from '../components/common/GameCard'
import { recommendationKeys, addRecentlyShownIds } from '../services/recommendationService'
import { getDashboard, getPersonalized, getWildCard, rollBecauseYouLiked } from '../services/recommendationService'
import type { BecauseYouLikedDTO } from '../types/api'
import { useBacklog, useDustyGames, useUserPlatforms, useOwnedIgdbIds } from '../services/libraryService'
import { useUpcomingGames } from '../services/gameService'
import type {
  DashboardDTO,
  GameResponse,
  RecommendationDTO,
  UserGameDTO,
} from '../types/api'

const DASHBOARD_CURRENT_KEY = [...recommendationKeys.dashboard(), 'current'] as const

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

  const [recsRefreshing, setRecsRefreshing] = useState(false)
  const [wildcardRefreshing, setWildcardRefreshing] = useState(false)
  const [bylRefreshing, setBylRefreshing] = useState<Record<number, boolean>>({})

  const updateDashSlice = useCallback(
    (mutator: (prev: DashboardDTO) => DashboardDTO) => {
      queryClient.setQueryData<DashboardDTO | undefined>(DASHBOARD_CURRENT_KEY, (prev) => {
        if (!prev) return prev
        return mutator(prev)
      })
    },
    [queryClient],
  )

  const refreshRecommendations = useCallback(async () => {
    setRecsRefreshing(true)
    try {
      const res = await getPersonalized(20)
      const fresh: RecommendationDTO[] = Array.isArray(res.data) ? res.data : []
      const ids = fresh.map((r) => r.igdbId).filter((id): id is number => id != null)
      addRecentlyShownIds(ids)
      updateDashSlice((prev) => ({ ...prev, recommendations: fresh }))
    } catch { /* keep current */ }
    setRecsRefreshing(false)
  }, [updateDashSlice])

  const refreshWildcard = useCallback(async () => {
    setWildcardRefreshing(true)
    try {
      const res = await getWildCard(12)
      const fresh: RecommendationDTO[] = Array.isArray(res.data) ? res.data : []
      updateDashSlice((prev) => ({ ...prev, wildcard: fresh }))
    } catch { /* keep current */ }
    setWildcardRefreshing(false)
  }, [updateDashSlice])

  const refreshBecauseYouLiked = useCallback(
    async (basedOnIgdbId: number) => {
      setBylRefreshing((m) => ({ ...m, [basedOnIgdbId]: true }))
      try {
        const currentSections = (queryClient.getQueryData<DashboardDTO>(DASHBOARD_CURRENT_KEY)?.becauseYouLiked ?? [])
        const excludes = currentSections
          .map((s) => s.basedOnIgdbId)
          .filter((id): id is number => id != null)
        const res = await rollBecauseYouLiked(excludes)
        const fresh = res.data && typeof res.data === 'object' ? (res.data as BecauseYouLikedDTO) : null
        if (fresh) {
          updateDashSlice((prev) => {
            const sections = (prev.becauseYouLiked ?? []).map((s) =>
              s.basedOnIgdbId === basedOnIgdbId ? fresh : s,
            )
            return { ...prev, becauseYouLiked: sections }
          })
        }
      } catch { /* keep current */ }
      setBylRefreshing((m) => ({ ...m, [basedOnIgdbId]: false }))
    },
    [updateDashSlice, queryClient],
  )

  const recommendations: RecommendationDTO[] = dashData?.recommendations ?? []
  const becauseYouLiked = dashData?.becauseYouLiked ?? []
  const wildcard: RecommendationDTO[] = dashData?.wildcard ?? []

  const { data: backlogData, isError: backlogError, refetch: refetchBacklog } = useBacklog()
  // Memoize so reference stays stable across renders triggered by sibling-section refreshes.
  // GameScroll's prevGamesRef check otherwise sees a new .map() array every render and replays
  // the stagger-in animation.
  const backlog: LibraryDashboardEntry[] = useMemo(
    () => (backlogData ?? []).map((g) => ({ ...g, name: g.gameName ?? '' })),
    [backlogData],
  )

  const { data: dustyData, isError: dustyError, refetch: refetchDusty } = useDustyGames()
  const dusty: LibraryDashboardEntry[] = useMemo(
    () => (dustyData ?? []).map((g) => ({ ...g, name: g.gameName ?? '' })),
    [dustyData],
  )

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
              onClick={refreshRecommendations}
              disabled={recsRefreshing}
              className="text-xs px-2.5 py-1 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] active:scale-[0.97] transition-[border-color,color,transform] disabled:opacity-40 disabled:cursor-not-allowed"
              title="Refresh recommendations"
            >
              {recsRefreshing ? '↻ Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        {recsError ? (
          <ErrorBanner message="Could not load recommendations." onRetry={refreshRecommendations} />
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

      {/* Because you liked X | Because you liked Y -- two sections share one row, 50/50 split. */}
      {!recsError && !dashLoading && becauseYouLiked.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {becauseYouLiked.map((section: BecauseYouLikedDTO) => {
            const sectionId = section.basedOnIgdbId ?? 0
            const refreshing = !!bylRefreshing[sectionId]
            return (
              <section key={sectionId} className="min-w-0">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <h2 className="text-lg font-medium text-[#e8e4dc] truncate">
                    Because you liked{' '}
                    <Link
                      to={`/games/${sectionId}`}
                      className="text-[#f72585] [text-shadow:0_0_8px_#f72585] hover:underline"
                    >
                      {section.basedOnGame}
                    </Link>
                  </h2>
                  <button
                    onClick={() => refreshBecauseYouLiked(sectionId)}
                    disabled={refreshing || !sectionId}
                    className="flex-shrink-0 text-xs px-2.5 py-1 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] active:scale-[0.97] transition-[border-color,color,transform] disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Refresh this row"
                  >
                    {refreshing ? '↻ ...' : 'Refresh'}
                  </button>
                </div>
                <GameScroll
                  games={section.recommendations ?? []}
                  getKey={(g) => g.igdbId ?? 0}
                  onClick={(g) => navigate(`/games/${g.igdbId}`)}
                />
              </section>
            )
          })}
        </div>
      )}

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-[#e8e4dc]">Wild Card</h2>
            <div className="flex items-center gap-3">
              <Link to="/wildcard" className="text-xs text-[#8891a8] hover:text-[#f72585] transition-colors">
                More →
              </Link>
              <button
                onClick={refreshWildcard}
                disabled={wildcardRefreshing}
                className="text-xs px-2.5 py-1 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] active:scale-[0.97] transition-[border-color,color,transform] disabled:opacity-40 disabled:cursor-not-allowed"
                title="Refresh wild card"
              >
                {wildcardRefreshing ? '↻ Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
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
