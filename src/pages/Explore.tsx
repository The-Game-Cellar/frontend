import { useState, useRef } from 'react'
import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useSearchGames,
  useGenres,
  useGamePlatforms,
  useUpcomingGames,
  useUpcomingPlatforms,
} from '../services/gameService'
import type { SearchGamesParams } from '../services/gameService'
import { useOwnedIgdbIds } from '../services/libraryService'
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

  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [genre, setGenre] = useState(searchParams.get('genre') ?? '')
  const [platform, setPlatform] = useState('')
  const [gameMode, setGameMode] = useState('')
  const [perspective, setPerspective] = useState('')
  const [gameType, setGameType] = useState<GameTypeFilter>('main')
  const [ordering, setOrdering] = useState<OrderingFilter>('-rating')
  const [page, setPage] = useState(0)

  const [upcomingHorizon, setUpcomingHorizon] = useState('90')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: genresData } = useGenres()
  const genres = genresData && typeof genresData === 'object' ? Object.keys(genresData) : []

  const { data: platformsData } = useGamePlatforms()
  const platformGroups: PlatformGroup[] = Array.isArray(platformsData?.groups) ? platformsData.groups : []
  const platformOthers: string[] = Array.isArray(platformsData?.others) ? platformsData.others : []

  // Browse view query
  const browseParams: SearchGamesParams = {
    query: searchQuery,
    genre,
    platform,
    gameMode,
    perspective,
    gameType,
    ordering,
    page,
    pageSize: PAGE_SIZE,
  }
  const {
    data: browseData,
    isFetching: browseLoading,
    error: browseError,
  } = useSearchGames(browseParams, view === 'browse')
  const games: GameResponse[] = Array.isArray(browseData?.games) ? browseData.games : []
  const totalPages = Math.ceil((browseData?.totalCount ?? 0) / PAGE_SIZE)

  // Upcoming view queries
  const { data: ownedIdsData } = useOwnedIgdbIds()
  const ownedIds = ownedIdsData ?? []

  const upcomingPlatforms = platform ? platform.split(',').map((s) => s.trim()).filter(Boolean) : []
  const upcomingWindowDays = parseInt(upcomingHorizon, 10)
  const {
    data: upcomingData,
    isFetching: upcomingLoading,
    error: upcomingError,
    refetch: refetchUpcoming,
  } = useUpcomingGames(
    { platforms: upcomingPlatforms, windowDays: upcomingWindowDays, limit: 60, excludeIds: ownedIds },
    view === 'upcoming',
  )
  const upcomingGames: GameResponse[] = Array.isArray(upcomingData?.games) ? upcomingData.games : []

  const { data: upcomingPlatformsRaw } = useUpcomingPlatforms()
  const upcomingPlatformsResponse = upcomingPlatformsRaw as { platforms?: unknown } | undefined
  const upcomingPlatformNames: string[] = Array.isArray(upcomingPlatformsResponse?.platforms)
    ? upcomingPlatformsResponse.platforms.filter((s): s is string => typeof s === 'string')
    : []

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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchQuery(val)
      setPage(0)
    }, 300)
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
    setPage(0)
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
              onClick={() => refetchUpcoming()}
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
            <p className="text-sm text-[#ef4444]">Failed to load upcoming releases.</p>
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
          genre={genre} setGenre={(v) => { setGenre(v); setPage(0) }} genres={genres}
          platform={platform} setPlatform={(v) => { setPlatform(v); setPage(0) }}
          platformGroups={platformGroups} platformOthers={platformOthers}
          gameMode={gameMode} setGameMode={(v) => { setGameMode(v); setPage(0) }}
          perspective={perspective} setPerspective={(v) => { setPerspective(v); setPage(0) }}
          gameType={gameType} setGameType={setGameType}
          ordering={ordering} setOrdering={(v) => { setOrdering(v); setPage(0) }}
          isFiltered={isFiltered} handleReset={handleReset}
          loading={browseLoading} error={browseError ? 'Failed to load games.' : null} games={games} navigate={navigate}
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
