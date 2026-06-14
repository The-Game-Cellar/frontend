import { useEffect, useState, useRef } from 'react'
import type { ChangeEvent, CSSProperties, Dispatch, SetStateAction } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useSearchGames,
  useGenres,
  useGamePlatforms,
  usePopularTags,
  useUpcomingGames,
  useUpcomingPlatforms,
} from '../services/gameService'
import type { SearchGamesParams } from '../services/gameService'
import { useOwnedIgdbIds } from '../services/libraryService'
import { useGridPageSize } from '../hooks/useGridPageSize'
import GameCard from '../components/common/GameCard'
import PlatformDropdown from '../components/common/PlatformDropdown'
import StyledSelect from '../components/common/StyledSelect'
import TagDropdown from '../components/common/TagDropdown'
import YearRangeSlider from '../components/common/YearRangeSlider'
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
  { value: 'Single player',             label: 'Single-player' },
  { value: 'Multiplayer',               label: 'Multiplayer' },
  { value: 'Co-operative',              label: 'Co-operative' },
  { value: 'Split screen',              label: 'Split-screen' },
  { value: 'Massively Multiplayer Online (MMO)', label: 'MMO' },
  { value: 'Battle Royale',             label: 'Battle Royale' },
]

const PERSPECTIVES = [
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

const YEAR_MIN = 1970
const YEAR_MAX = new Date().getFullYear() + 5

const RATING_OPTIONS = [
  { value: '',  label: 'All' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5+' },
  { value: '6', label: '6+' },
  { value: '7', label: '7+' },
  { value: '8', label: '8+' },
  { value: '9', label: '9+' },
]

function yearToEpochStart(year: number): number {
  return Math.floor(new Date(Date.UTC(year, 0, 1)).getTime() / 1000)
}

function yearToEpochEnd(year: number): number {
  return Math.floor(new Date(Date.UTC(year, 11, 31, 23, 59, 59)).getTime() / 1000)
}

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
  const initialGenreParam = searchParams.get('genre') ?? ''
  const [genreFilters, setGenreFilters] = useState<string[]>(initialGenreParam ? initialGenreParam.split(',').filter(Boolean) : [])
  const [platform, setPlatform] = useState('')
  const [gameModeFilters, setGameModeFilters] = useState<string[]>([])
  const [perspectiveFilters, setPerspectiveFilters] = useState<string[]>([])
  const [gameType, setGameType] = useState<GameTypeFilter>('main')
  const [ordering, setOrdering] = useState<OrderingFilter>('-rating')
  const [yearRange, setYearRange] = useState<[number, number]>([YEAR_MIN, YEAR_MAX])
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [ratingFrom, setRatingFrom] = useState<number | null>(null)
  const [page, setPage] = useState(0)

  const [upcomingHorizon, setUpcomingHorizon] = useState('90')
  const [upcomingPage, setUpcomingPage] = useState(0)

  const gridContainerRef = useRef<HTMLDivElement | null>(null)
  const pageSize = useGridPageSize(gridContainerRef)
  // Reset both feeds to page 0 when the viewport-derived pageSize changes; otherwise the
  // user can land on an out-of-range page after a resize.
  useEffect(() => {
    setPage(0)
    setUpcomingPage(0)
  }, [pageSize])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: genresData } = useGenres()
  const genres = genresData?.genres ?? []

  const { data: platformsData } = useGamePlatforms()
  const platformGroups: PlatformGroup[] = Array.isArray(platformsData?.groups) ? platformsData.groups : []
  const platformOthers: string[] = Array.isArray(platformsData?.others) ? platformsData.others : []

  const { data: popularTagsData } = usePopularTags(50)
  const tagOptions: string[] = Array.isArray(popularTagsData) ? popularTagsData : []

  const [yearFrom, yearTo] = yearRange
  const yearActive = yearFrom > YEAR_MIN || yearTo < YEAR_MAX
  const tagsActive = tagFilters.length > 0
  const genreActive = genreFilters.length > 0
  const gameModesActive = gameModeFilters.length > 0
  const perspectiveActive = perspectiveFilters.length > 0
  const ratingActive = ratingFrom !== null
  const browseParams: SearchGamesParams = {
    query: searchQuery,
    platform,
    gameType,
    ordering,
    page,
    pageSize,
    ...(genreActive ? { genre: genreFilters.join(',') } : {}),
    ...(gameModesActive ? { gameMode: gameModeFilters.join(',') } : {}),
    ...(perspectiveActive ? { perspective: perspectiveFilters.join(',') } : {}),
    ...(yearActive ? { releasedFrom: yearToEpochStart(yearFrom), releasedTo: yearToEpochEnd(yearTo) } : {}),
    ...(tagsActive ? { tags: tagFilters.join(',') } : {}),
    ...(ratingActive ? { ratingFrom } : {}),
  }
  const {
    data: browseData,
    isFetching: browseLoading,
    error: browseError,
  } = useSearchGames(browseParams, view === 'browse')
  const games: GameResponse[] = Array.isArray(browseData?.games) ? browseData.games : []
  const totalPages = Math.ceil((browseData?.totalCount ?? 0) / pageSize)
  const tagCounts = (browseData?.availableTagCounts ?? undefined) as Record<string, number> | undefined
  const genreCounts = (browseData?.availableGenreCounts ?? undefined) as Record<string, number> | undefined
  const gameModeCounts = (browseData?.availableGameModeCounts ?? undefined) as Record<string, number> | undefined
  const perspectiveCounts = (browseData?.availablePerspectiveCounts ?? undefined) as Record<string, number> | undefined

  const { data: ownedIdsData } = useOwnedIgdbIds()
  const ownedIds = ownedIdsData ?? []

  const upcomingPlatforms = platform ? platform.split(',').map((s) => s.trim()).filter(Boolean) : []
  const upcomingWindowDays = parseInt(upcomingHorizon, 10)
  const {
    data: upcomingData,
    isFetching: upcomingLoading,
    error: upcomingError,
  } = useUpcomingGames(
    {
      platforms: upcomingPlatforms,
      windowDays: upcomingWindowDays,
      excludeIds: ownedIds,
      page: upcomingPage,
      pageSize,
    },
    view === 'upcoming',
  )
  const upcomingGames: GameResponse[] = Array.isArray(upcomingData?.games) ? upcomingData.games : []
  const upcomingTotalPages = Math.ceil((upcomingData?.totalCount ?? 0) / pageSize)

  const handleUpcomingPageChange = (p: number) => {
    setUpcomingPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const { data: upcomingPlatformsRaw } = useUpcomingPlatforms()
  const upcomingPlatformsResponse = upcomingPlatformsRaw as { platforms?: unknown } | undefined
  const upcomingPlatformNames: string[] = Array.isArray(upcomingPlatformsResponse?.platforms)
    ? upcomingPlatformsResponse.platforms.filter((s): s is string => typeof s === 'string')
    : []

  // While upcoming-platforms is loading, keep the full list so the dropdown is never empty.
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

  const isFiltered = !!(searchQuery || genreActive || platform || gameModesActive || perspectiveActive || gameType !== 'main' || ordering !== '-rating' || yearActive || tagsActive || ratingActive)

  const handleReset = () => {
    setSearchInput('')
    setSearchQuery('')
    setGenreFilters([])
    setPlatform('')
    setGameModeFilters([])
    setPerspectiveFilters([])
    setGameType('main')
    setOrdering('-rating')
    setYearRange([YEAR_MIN, YEAR_MAX])
    setTagFilters([])
    setRatingFrom(null)
    setPage(0)
  }

  return (
    <div ref={gridContainerRef} className="space-y-6">
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
              className={`text-sm px-4 py-2 rounded border transition-[border-color,box-shadow,color,background-color] duration-150 active:scale-[0.97] ${
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
              <label className="text-sm text-[#8891a8] uppercase tracking-wider">Horizon</label>
              <StyledSelect
                alwaysActive
                value={upcomingHorizon}
                onChange={(v) => { setUpcomingHorizon(v); setUpcomingPage(0) }}
                options={HORIZON_OPTIONS}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-[#8891a8] uppercase tracking-wider">Platform</label>
              <PlatformDropdown
                value={platform}
                groups={filteredPlatformGroups}
                others={filteredPlatformOthers}
                onChange={(v) => { setPlatform(v); setUpcomingPage(0) }}
              />
            </div>
          </div>

          {upcomingLoading && (
            <p className="text-base text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
          )}
          {!upcomingLoading && upcomingError && (
            <p className="text-base text-[#ef4444]">Failed to load upcoming releases.</p>
          )}
          {!upcomingLoading && !upcomingError && upcomingGames.length === 0 && (
            <div className="flex items-center justify-center h-48 bg-[#111220] border border-[#1e2035] rounded-lg animate-enter">
              <p className="text-base text-[#8891a8]">No upcoming releases match your filters.</p>
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

          {!upcomingLoading && !upcomingError && upcomingTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2 pb-4">
              <button
                onClick={() => handleUpcomingPageChange(upcomingPage - 1)}
                disabled={upcomingPage === 0}
                className="px-4 py-2 text-sm rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] transition-[border-color,color,transform] duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, upcomingTotalPages) }, (_, i) => {
                const start = Math.max(0, Math.min(upcomingPage - 2, upcomingTotalPages - 5))
                const pageNum = start + i
                return (
                  <button
                    key={pageNum}
                    onClick={() => handleUpcomingPageChange(pageNum)}
                    className={`px-4 py-2 text-sm rounded border transition-[border-color,box-shadow,color,background-color,transform] duration-150 active:scale-[0.97] ${
                      pageNum === upcomingPage
                        ? 'border-[#f72585] text-[#f72585] bg-[#f7258515] [box-shadow:0_0_6px_#f7258560]'
                        : 'border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                )
              })}
              <button
                onClick={() => handleUpcomingPageChange(upcomingPage + 1)}
                disabled={upcomingPage === upcomingTotalPages - 1}
                className="px-4 py-2 text-sm rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] transition-[border-color,color,transform] duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <BrowseView
          searchInput={searchInput}
          handleSearchChange={handleSearchChange}
          genreFilters={genreFilters} setGenreFilters={(v) => { setGenreFilters(v); setPage(0) }} genres={genres}
          platform={platform} setPlatform={(v) => { setPlatform(v); setPage(0) }}
          platformGroups={platformGroups} platformOthers={platformOthers}
          gameModeFilters={gameModeFilters} setGameModeFilters={(v) => { setGameModeFilters(v); setPage(0) }}
          perspectiveFilters={perspectiveFilters} setPerspectiveFilters={(v) => { setPerspectiveFilters(v); setPage(0) }}
          gameType={gameType} setGameType={setGameType}
          ordering={ordering} setOrdering={(v) => { setOrdering(v); setPage(0) }}
          yearRange={yearRange} setYearRange={(v) => { setYearRange(v); setPage(0) }}
          tagFilters={tagFilters} setTagFilters={(v) => { setTagFilters(v); setPage(0) }} tagOptions={tagOptions} tagCounts={tagCounts}
          genreCounts={genreCounts} gameModeCounts={gameModeCounts} perspectiveCounts={perspectiveCounts}
          ratingFrom={ratingFrom} setRatingFrom={(v) => { setRatingFrom(v); setPage(0) }}
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
  genreFilters: string[]
  setGenreFilters: (v: string[]) => void
  genres: string[]
  platform: string
  setPlatform: (v: string) => void
  platformGroups: PlatformGroup[]
  platformOthers: string[]
  gameModeFilters: string[]
  setGameModeFilters: (v: string[]) => void
  perspectiveFilters: string[]
  setPerspectiveFilters: (v: string[]) => void
  gameType: GameTypeFilter
  setGameType: Dispatch<SetStateAction<GameTypeFilter>>
  ordering: OrderingFilter
  setOrdering: (v: OrderingFilter) => void
  yearRange: [number, number]
  setYearRange: (v: [number, number]) => void
  tagFilters: string[]
  setTagFilters: (v: string[]) => void
  tagOptions: string[]
  tagCounts: Record<string, number> | undefined
  genreCounts: Record<string, number> | undefined
  gameModeCounts: Record<string, number> | undefined
  perspectiveCounts: Record<string, number> | undefined
  ratingFrom: number | null
  setRatingFrom: (v: number | null) => void
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
  genreFilters, setGenreFilters, genres,
  platform, setPlatform, platformGroups, platformOthers,
  gameModeFilters, setGameModeFilters, perspectiveFilters, setPerspectiveFilters,
  gameType, setGameType, ordering, setOrdering,
  yearRange, setYearRange,
  tagFilters, setTagFilters, tagOptions, tagCounts,
  genreCounts, gameModeCounts, perspectiveCounts,
  ratingFrom, setRatingFrom,
  isFiltered, handleReset,
  loading, error, games, navigate,
  page, totalPages, handlePageChange,
}: BrowseViewProps) {
  return (
    <>
      {/* Search + filters */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#8891a8] uppercase tracking-wider">Search</label>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search games..."
            className="w-64 bg-[#111220] border border-[#2a2d45] rounded px-3.5 py-2 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#8891a8] uppercase tracking-wider">Genre</label>
          <TagDropdown
            value={genreFilters}
            options={genres.map((g) => ({ value: g, label: g }))}
            onChange={setGenreFilters}
            counts={genreCounts}
            emptyLabel="No genres available."
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#8891a8] uppercase tracking-wider">Tags</label>
          <TagDropdown
            value={tagFilters}
            options={tagOptions.map((t) => ({ value: t, label: t }))}
            onChange={setTagFilters}
            counts={tagCounts}
            emptyLabel="No tags available."
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#8891a8] uppercase tracking-wider">Platform</label>
          <PlatformDropdown
            value={platform}
            groups={platformGroups}
            others={platformOthers}
            onChange={setPlatform}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#8891a8] uppercase tracking-wider">Gamemodes</label>
          <TagDropdown
            value={gameModeFilters}
            options={GAME_MODES}
            onChange={setGameModeFilters}
            counts={gameModeCounts}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#8891a8] uppercase tracking-wider">Camera</label>
          <TagDropdown
            value={perspectiveFilters}
            options={PERSPECTIVES}
            onChange={setPerspectiveFilters}
            counts={perspectiveCounts}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#8891a8] uppercase tracking-wider">Rating</label>
          <StyledSelect
            value={ratingFrom === null ? '' : String(ratingFrom)}
            onChange={(v) => setRatingFrom(v === '' ? null : Number(v))}
            options={RATING_OPTIONS}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#8891a8] uppercase tracking-wider">Order By</label>
          <StyledSelect alwaysActive value={ordering} onChange={(v) => setOrdering(v as OrderingFilter)} options={ORDERINGS} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#8891a8] uppercase tracking-wider">Release Year</label>
          <YearRangeSlider min={YEAR_MIN} max={YEAR_MAX} value={yearRange} onChange={setYearRange} />
        </div>

        <button
          type="button"
          onClick={() => setGameType((t) => (t === 'variant' ? 'main' : 'variant'))}
          className={`self-end text-sm px-4 py-2 rounded border transition-[border-color,box-shadow,color,transform] duration-150 active:scale-[0.97] ${
            gameType === 'variant'
              ? 'border-[#f72585] text-[#f72585] [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540]'
              : 'border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]'
          }`}
          title={gameType === 'variant' ? 'Showing variants only. Click to return to main games.' : 'Showing main games. Click to switch to variants only.'}
        >
          {gameType === 'variant' ? 'Variants only ✓' : 'Variants only'}
        </button>

        {isFiltered && (
          <button onClick={handleReset} className="self-end text-sm px-4 py-2 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] transition-[border-color,box-shadow,color,transform] duration-150 active:scale-[0.97]">
            Reset filter
          </button>
        )}
      </div>

      {/* States */}
      {loading && (
        <p className="text-base text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
      )}

      {!loading && error && (
        <p className="text-base text-[#ef4444]">{error}</p>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="flex items-center justify-center h-48 bg-[#111220] border border-[#1e2035] rounded-lg animate-enter">
          <p className="text-base text-[#8891a8]">No games found.</p>
        </div>
      )}

      {games.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-4">
          {games.map((game, i) => (
            <div
              key={game.igdbId}
              className="animate-stagger-in"
              style={{ '--i': Math.min(i, 20) } as CSSProperties}
            >
              <GameCard
                game={game}
                onClick={() => navigate(`/games/${game.igdbId}`)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 pb-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 0}
            className="px-4 py-2 text-sm rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] transition-[border-color,color,transform] duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
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
                className={`px-4 py-2 text-sm rounded border transition-[border-color,box-shadow,color,background-color,transform] duration-150 active:scale-[0.97] ${
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
            className="px-4 py-2 text-sm rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] transition-[border-color,color,transform] duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </>
  )
}
