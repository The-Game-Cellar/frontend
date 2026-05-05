import { useState, useEffect, useRef, useCallback } from 'react'
import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { searchGames, getGenres, getPlatforms, getUpcomingGames, getUpcomingPlatforms } from '../services/gameService'
import type { SearchGamesParams } from '../services/gameService'
import { getOwnedIgdbIds } from '../services/libraryService'
import GameCard from '../components/common/GameCard'
import PlatformDropdown from '../components/common/PlatformDropdown'
import StyledSelect from '../components/common/StyledSelect'
import type { GameResponse, PlatformGroup } from '../types/api'

type ViewKey = 'browse' | 'upcoming'
type GameTypeFilter = NonNullable<SearchGamesParams['gameType']>
type OrderingFilter = NonNullable<SearchGamesParams['ordering']>

const HORIZON_OPTIONS = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '0',  label: 'All upcoming' },
]

const UPCOMING_DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function formatReleaseDate(epochSeconds: number | null | undefined): string {
  if (!epochSeconds) return ''
  return `Releases ${UPCOMING_DATE_FORMAT.format(new Date(epochSeconds * 1000))}`
}

const GAME_MODES = [
  { value: '',                          label: 'All' },
  { value: 'Single player',             label: 'Single-player' },
  { value: 'Multiplayer',               label: 'Multiplayer' },
  { value: 'Co-operative',              label: 'Co-operative' },
  { value: 'Split screen',              label: 'Split-screen' },
  { value: 'Massively Multiplayer Online (MMO)', label: 'MMO' },
  { value: 'Battle Royale',             label: 'Battle Royale' },
]

const PERSPECTIVES = [
  { value: '',                  label: 'All' },
  { value: 'First person',      label: 'First-person' },
  { value: 'Third person',      label: 'Third-person' },
  { value: 'Bird view / Isometric', label: 'Bird-view / Isometric' },
  { value: 'Side view',         label: 'Side-view' },
  { value: 'Text',              label: 'Text' },
  { value: 'Auditory',          label: 'Auditory' },
  { value: 'Virtual Reality',   label: 'Virtual Reality' },
]

const ORDERINGS: { value: OrderingFilter; label: string }[] = [
  { value: '-rating',   label: 'Popular' },
  { value: '-released', label: 'Newest' },
  { value: 'released',  label: 'Oldest' },
  { value: 'name',      label: 'A → Z' },
  { value: '-name',     label: 'Z → A' },
]

const PAGE_SIZE = 20

export default function Explore() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const view: ViewKey = searchParams.get('view') === 'upcoming' ? 'upcoming' : 'browse'
  const setView = (next: ViewKey) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'upcoming') params.set('view', 'upcoming')
    else params.delete('view')
    setSearchParams(params)
  }

  const [games, setGames] = useState<GameResponse[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [platformGroups, setPlatformGroups] = useState<PlatformGroup[]>([])
  const [platformOthers, setPlatformOthers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [genre, setGenre] = useState(searchParams.get('genre') ?? '')
  const [platform, setPlatform] = useState('')
  const [gameMode, setGameMode] = useState('')
  const [perspective, setPerspective] = useState('')
  const [gameType, setGameType] = useState<GameTypeFilter>('main')
  const [ordering, setOrdering] = useState<OrderingFilter>('-rating')

  // Coming Soon view state
  const [upcomingHorizon, setUpcomingHorizon] = useState('90')
  const [upcomingGames, setUpcomingGames] = useState<GameResponse[]>([])
  const [upcomingLoading, setUpcomingLoading] = useState(false)
  const [upcomingError, setUpcomingError] = useState<string | null>(null)
  const [upcomingPlatformNames, setUpcomingPlatformNames] = useState<string[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    getGenres()
      .then((res) => {
        // Backend returns Record<string, string[]>. Top-level keys are the genre names.
        // Defensive narrowing: pre-typed JS code expected a different shape; see surfaced-bugs buffer.
        const data = res.data
        if (data && typeof data === 'object') {
          setGenres(Object.keys(data))
        } else {
          setGenres([])
        }
      })
      .catch(() => {})
    getPlatforms()
      .then((res) => {
        setPlatformGroups(Array.isArray(res.data?.groups) ? res.data.groups : [])
        setPlatformOthers(Array.isArray(res.data?.others) ? res.data.others : [])
      })
      .catch(() => {})
  }, [])

  const doFetch = useCallback(async (
    pageNum: number,
    q: string,
    g: string,
    p: string,
    gm: string,
    pv: string,
    gt: GameTypeFilter,
    ord: OrderingFilter,
  ) => {
    const id = ++fetchIdRef.current
    setLoading(true)
    setError(null)
    try {
      const res = await searchGames({
        query: q, genre: g, platform: p,
        gameMode: gm, perspective: pv, gameType: gt,
        ordering: ord, page: pageNum, pageSize: PAGE_SIZE,
      })
      if (id !== fetchIdRef.current) return
      const incoming = Array.isArray(res.data?.games) ? res.data.games : []
      const total = res.data?.totalCount ?? 0
      setGames(incoming)
      setTotalPages(Math.ceil(total / PAGE_SIZE))
    } catch {
      if (id !== fetchIdRef.current) return
      setError('Failed to load games.')
    } finally {
      if (id === fetchIdRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (view !== 'browse') return
    setPage(0)
    doFetch(0, searchQuery, genre, platform, gameMode, perspective, gameType, ordering)
  }, [view, searchQuery, genre, platform, gameMode, perspective, gameType, ordering, doFetch])

  const loadUpcoming = useCallback(() => {
    setUpcomingLoading(true)
    setUpcomingError(null)
    const platforms = platform ? platform.split(',').map((s) => s.trim()).filter(Boolean) : []
    const windowDays = parseInt(upcomingHorizon, 10)
    getOwnedIgdbIds()
      .then((res) => {
        const ownedIds = Array.isArray(res.data) ? res.data : []
        return getUpcomingGames({ platforms, windowDays, limit: 60, excludeIds: ownedIds })
      })
      .then((res) => {
        const data = Array.isArray(res.data?.games) ? res.data.games : []
        setUpcomingGames(data)
      })
      .catch(() => setUpcomingError('Failed to load upcoming releases.'))
      .finally(() => setUpcomingLoading(false))
  }, [upcomingHorizon, platform])

  useEffect(() => {
    if (view !== 'upcoming') return
    loadUpcoming()
  }, [view, loadUpcoming])

  useEffect(() => {
    if (view !== 'upcoming') return
    getUpcomingPlatforms()
      .then((res) => {
        const data = res.data as { platforms?: unknown }
        const names = Array.isArray(data?.platforms) ? data.platforms.filter((s): s is string => typeof s === 'string') : []
        setUpcomingPlatformNames(names)
      })
      .catch(() => setUpcomingPlatformNames([]))
  }, [view])

  // Filter the full platform list to those that have at least one upcoming release.
  // PlatformDropdown's groups[].platforms and others arrays are flat strings (not objects),
  // so the filter compares against String(p) directly. Drops empty umbrella groups so the
  // dropdown stays tight. While the upcoming-platforms list is still loading we keep the
  // full list — narrowing only kicks in once we have data, so the dropdown is never empty.
  const upcomingPlatformSet = new Set(upcomingPlatformNames.map((n) => String(n).toLowerCase()))
  const hasUpcomingPlatformData = upcomingPlatformNames.length > 0
  const filteredPlatformGroups: PlatformGroup[] = hasUpcomingPlatformData
    ? platformGroups
        .map((group) => ({
          ...group,
          platforms: (group.platforms ?? []).filter((p) => upcomingPlatformSet.has(String(p).toLowerCase())),
        }))
        .filter((group) => (group.platforms ?? []).length > 0)
    : platformGroups
  const filteredPlatformOthers = hasUpcomingPlatformData
    ? platformOthers.filter((p) => upcomingPlatformSet.has(String(p).toLowerCase()))
    : platformOthers

  const handlePageChange = (p: number) => {
    setPage(p)
    doFetch(p, searchQuery, genre, platform, gameMode, perspective, gameType, ordering)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchQuery(val), 300)
  }

  const isFiltered = !!(searchQuery || genre || platform || gameMode || perspective || gameType !== 'main' || ordering !== '-rating')

  const handleReset = () => {
    setSearchInput('')
    setSearchQuery('')
    setGenre('')
    setPlatform('')
    setGameMode('')
    setPerspective('')
    setGameType('main')
    setOrdering('-rating')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Explore</h1>
        <div className="flex gap-2">
          {([
            { id: 'browse',   label: 'Browse' },
            { id: 'upcoming', label: 'Coming soon' },
          ] as { id: ViewKey; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`text-xs px-3 py-1.5 rounded border transition-[border-color,box-shadow,color,background-color] duration-150 active:scale-[0.97] ${
                view === tab.id
                  ? 'border-[#f72585] text-[#f72585] bg-[#f7258515] [box-shadow:0_0_6px_#f7258560]'
                  : 'border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'upcoming' ? (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#4a5068] uppercase tracking-wider">Horizon</label>
              <StyledSelect alwaysActive value={upcomingHorizon} onChange={setUpcomingHorizon} options={HORIZON_OPTIONS} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#4a5068] uppercase tracking-wider">Platform</label>
              <PlatformDropdown
                value={platform}
                groups={filteredPlatformGroups}
                others={filteredPlatformOthers}
                onChange={setPlatform}
              />
            </div>
            <button
              onClick={loadUpcoming}
              className="text-xs px-3 py-1.5 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] active:scale-[0.97] transition-[border-color,color,transform]"
              title="Re-shuffle"
            >
              Refresh
            </button>
          </div>

          {upcomingLoading && (
            <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
          )}
          {!upcomingLoading && upcomingError && (
            <p className="text-sm text-[#ef4444]">{upcomingError}</p>
          )}
          {!upcomingLoading && !upcomingError && upcomingGames.length === 0 && (
            <div className="flex items-center justify-center h-48 bg-[#111220] border border-[#1e2035] rounded-lg animate-enter">
              <p className="text-sm text-[#8891a8]">No upcoming releases match your filters.</p>
            </div>
          )}
          {upcomingGames.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-4 animate-enter">
              {upcomingGames.map((g) => (
                <GameCard
                  key={g.igdbId}
                  game={g}
                  subtitle={formatReleaseDate(g.firstReleaseDate)}
                  onClick={() => navigate(`/games/${g.igdbId}`)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <BrowseView
          searchInput={searchInput}
          handleSearchChange={handleSearchChange}
          genre={genre} setGenre={setGenre} genres={genres}
          platform={platform} setPlatform={setPlatform}
          platformGroups={platformGroups} platformOthers={platformOthers}
          gameMode={gameMode} setGameMode={setGameMode}
          perspective={perspective} setPerspective={setPerspective}
          gameType={gameType} setGameType={setGameType}
          ordering={ordering} setOrdering={setOrdering}
          isFiltered={isFiltered} handleReset={handleReset}
          loading={loading} error={error} games={games} navigate={navigate}
          page={page} totalPages={totalPages} handlePageChange={handlePageChange}
        />
      )}
    </div>
  )
}

interface BrowseViewProps {
  searchInput: string
  handleSearchChange: (e: ChangeEvent<HTMLInputElement>) => void
  genre: string
  setGenre: (v: string) => void
  genres: string[]
  platform: string
  setPlatform: (v: string) => void
  platformGroups: PlatformGroup[]
  platformOthers: string[]
  gameMode: string
  setGameMode: (v: string) => void
  perspective: string
  setPerspective: (v: string) => void
  gameType: GameTypeFilter
  setGameType: Dispatch<SetStateAction<GameTypeFilter>>
  ordering: OrderingFilter
  setOrdering: (v: OrderingFilter) => void
  isFiltered: boolean
  handleReset: () => void
  loading: boolean
  error: string | null
  games: GameResponse[]
  navigate: NavigateFunction
  page: number
  totalPages: number
  handlePageChange: (p: number) => void
}

function BrowseView({
  searchInput, handleSearchChange,
  genre, setGenre, genres,
  platform, setPlatform, platformGroups, platformOthers,
  gameMode, setGameMode, perspective, setPerspective,
  gameType, setGameType, ordering, setOrdering,
  isFiltered, handleReset,
  loading, error, games, navigate,
  page, totalPages, handlePageChange,
}: BrowseViewProps) {
  return (
    <>
      {/* Search + filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#4a5068] uppercase tracking-wider">Search</label>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search games..."
            className="w-64 bg-[#111220] border border-[#2a2d45] rounded px-3 py-1.5 text-xs text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#4a5068] uppercase tracking-wider">Genre</label>
          <StyledSelect
            value={genre}
            onChange={setGenre}
            options={[{ value: '', label: 'All' }, ...genres.map((g) => ({ value: g, label: g }))]}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#4a5068] uppercase tracking-wider">Platform</label>
          <PlatformDropdown
            value={platform}
            groups={platformGroups}
            others={platformOthers}
            onChange={setPlatform}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#4a5068] uppercase tracking-wider">Gamemodes</label>
          <StyledSelect value={gameMode} onChange={setGameMode} options={GAME_MODES} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#4a5068] uppercase tracking-wider">Camera</label>
          <StyledSelect value={perspective} onChange={setPerspective} options={PERSPECTIVES} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#4a5068] uppercase tracking-wider">Order By</label>
          <StyledSelect alwaysActive value={ordering} onChange={(v) => setOrdering(v as OrderingFilter)} options={ORDERINGS} />
        </div>

        <button
          type="button"
          onClick={() => setGameType((t) => (t === 'variant' ? 'main' : 'variant'))}
          className={`text-xs px-3 py-1.5 rounded border transition-[border-color,box-shadow,color] duration-150 ${
            gameType === 'variant'
              ? 'border-[#f72585] text-[#f72585] [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540]'
              : 'border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]'
          }`}
          title={gameType === 'variant' ? 'Showing variants only — click to return to main games' : 'Showing main games — click to switch to variants only'}
        >
          {gameType === 'variant' ? 'Variants only ✓' : 'Variants only'}
        </button>

        {isFiltered && (
          <button onClick={handleReset} className="text-xs px-3 py-1.5 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] transition-[border-color,box-shadow,color] duration-150">
            Reset filter
          </button>
        )}
      </div>

      {/* States */}
      {loading && (
        <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
      )}

      {!loading && error && (
        <p className="text-sm text-[#ef4444]">{error}</p>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="flex items-center justify-center h-48 bg-[#111220] border border-[#1e2035] rounded-lg animate-enter">
          <p className="text-sm text-[#8891a8]">No games found.</p>
        </div>
      )}

      {games.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-4 animate-enter">
          {games.map((game) => (
            <GameCard
              key={game.igdbId}
              game={game}
              onClick={() => navigate(`/games/${game.igdbId}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 pb-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] transition-[border-color,color] duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(0, Math.min(page - 2, totalPages - 5))
            const pageNum = start + i
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1.5 text-xs rounded border transition-[border-color,box-shadow,color,background-color] duration-150 ${
                  pageNum === page
                    ? 'border-[#f72585] text-[#f72585] bg-[#f7258515] [box-shadow:0_0_6px_#f7258560]'
                    : 'border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]'
                }`}
              >
                {pageNum + 1}
              </button>
            )
          })}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 text-xs rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] transition-[border-color,color] duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </>
  )
}
