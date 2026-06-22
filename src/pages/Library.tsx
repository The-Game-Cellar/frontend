import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useUserGames, useLibraryGamePlatforms, useLibraryGenres, useRemoveGame } from '../services/libraryService'
import type { GetUserGamesParams } from '../services/libraryService'
import GameListItem from '../components/library/GameListItem'
import LibraryGameCard from '../components/library/LibraryGameCard'
import StyledSelect from '../components/common/StyledSelect'
import type { GameStatus } from '../types/api'

type StatusTab = 'All' | GameStatus
type ViewMode = 'list' | 'grid'
type SortMode = 'status' | 'latest' | 'oldest' | 'rating' | 'az' | 'za'

const STATUS_TABS: StatusTab[] = ['All', 'PLAYING', 'BACKLOG', 'WISHLIST', 'DUSTY', 'COMPLETED', 'DROPPED']

const STATUS_ORDER: Record<GameStatus, number> = { PLAYING: 0, BACKLOG: 1, WISHLIST: 2, DUSTY: 3, COMPLETED: 4, DROPPED: 5 }

const tabActiveStyles: Record<StatusTab, string> = {
  All:       'bg-[#f7258515] border-[#f72585] text-[#f72585] [box-shadow:0_0_6px_#f7258560]',
  PLAYING:   'bg-[#22c55e15] border-[#22c55e] text-[#22c55e] [box-shadow:0_0_6px_#22c55e60]',
  BACKLOG:   'bg-[#2563eb15] border-[#2563eb] text-[#2563eb] [box-shadow:0_0_6px_#2563eb60]',
  COMPLETED: 'bg-[#a855f715] border-[#a855f7] text-[#a855f7] [box-shadow:0_0_6px_#a855f760]',
  DROPPED:   'bg-[#ef444415] border-[#ef4444] text-[#ef4444] [box-shadow:0_0_6px_#ef444460]',
  WISHLIST:  'bg-[#f59e0b15] border-[#f59e0b] text-[#f59e0b] [box-shadow:0_0_6px_#f59e0b60]',
  DUSTY:     'bg-[#8891a815] border-[#8891a8] text-[#8891a8] [box-shadow:0_0_6px_#8891a860]',
}

const tabHoverStyles: Record<StatusTab, string> = {
  All:       'hover:border-[#f72585] hover:text-[#f72585] hover:[box-shadow:0_0_6px_#f7258560]',
  PLAYING:   'hover:border-[#22c55e] hover:text-[#22c55e] hover:[box-shadow:0_0_6px_#22c55e60]',
  BACKLOG:   'hover:border-[#2563eb] hover:text-[#2563eb] hover:[box-shadow:0_0_6px_#2563eb60]',
  COMPLETED: 'hover:border-[#a855f7] hover:text-[#a855f7] hover:[box-shadow:0_0_6px_#a855f760]',
  DROPPED:   'hover:border-[#ef4444] hover:text-[#ef4444] hover:[box-shadow:0_0_6px_#ef444460]',
  WISHLIST:  'hover:border-[#f59e0b] hover:text-[#f59e0b] hover:[box-shadow:0_0_6px_#f59e0b60]',
  DUSTY:     'hover:border-[#8891a8] hover:text-[#8891a8] hover:[box-shadow:0_0_6px_#8891a860]',
}

const emptyMessages: Record<StatusTab, string> = {
  All:       'Your library is empty. Find games in Explore.',
  PLAYING:   'Nothing currently playing.',
  BACKLOG:   'Backlog is clear!',
  COMPLETED: 'No completed games yet.',
  DROPPED:   'No dropped games.',
  WISHLIST:  'Wishlist is empty.',
  DUSTY:     'No dusty games. Everything has been played recently.',
}

function isStatusTab(value: string): value is StatusTab {
  return (STATUS_TABS as string[]).includes(value)
}

function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="0" y="1" width="3" height="3" rx="0.5" />
      <rect x="5" y="1" width="11" height="3" rx="0.5" />
      <rect x="0" y="6.5" width="3" height="3" rx="0.5" />
      <rect x="5" y="6.5" width="11" height="3" rx="0.5" />
      <rect x="0" y="12" width="3" height="3" rx="0.5" />
      <rect x="5" y="12" width="11" height="3" rx="0.5" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="7" height="7" rx="1" />
      <rect x="9" y="0" width="7" height="7" rx="1" />
      <rect x="0" y="9" width="7" height="7" rx="1" />
      <rect x="9" y="9" width="7" height="7" rx="1" />
    </svg>
  )
}

export default function Library() {
  const [searchParams] = useSearchParams()
  const initialStatus: StatusTab = (() => {
    if (searchParams.get('filter') === 'dusty') return 'DUSTY'
    const s = searchParams.get('status')
    return s && isStatusTab(s) ? s : 'All'
  })()

  const [activeStatus, setActiveStatus] = useState<StatusTab>(initialStatus)
  const [activePlatform, setActivePlatform] = useState('')
  const [activeGenre, setActiveGenre] = useState('')
  const [activeRating, setActiveRating] = useState('')
  const [activeSort, setActiveSort] = useState<SortMode>('status')
  const [activeTag, setActiveTag] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('library_view') as ViewMode) || 'list')
  const [removeError, setRemoveError] = useState<string | null>(null)

  const userGamesParams: GetUserGamesParams = {}
  if (activeStatus !== 'All') userGamesParams.status = activeStatus
  if (activePlatform) userGamesParams.platform = activePlatform
  if (activeGenre) userGamesParams.genre = activeGenre

  const { data: gamesData, isPending: gamesPending, error: gamesError } = useUserGames(userGamesParams)
  const { data: platformsData } = useLibraryGamePlatforms()
  const { data: genresData } = useLibraryGenres()
  const removeGameMutation = useRemoveGame()

  const games = gamesData ?? []
  const platforms = platformsData ?? []
  const genres = genresData ?? []

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('library_view', mode)
  }

  const handleRemove = (id: number) => {
    removeGameMutation.mutate(id, {
      onError: () => {
        setRemoveError('Failed to remove game. Please try again.')
        setTimeout(() => setRemoveError(null), 3000)
      },
    })
  }

  const allTags = [...new Set(games.flatMap((g) => g.tags ?? []))].sort()

  const isFiltered = activeStatus !== 'All' || activePlatform || activeGenre || activeRating || activeSort !== 'status' || activeTag

  const resetFilters = () => {
    setActiveStatus('All')
    setActivePlatform('')
    setActiveGenre('')
    setActiveRating('')
    setActiveSort('status')
    setActiveTag('')
  }

  const displayedGames = [...games]
    .filter((g) => {
      if (activeRating && (g.rating == null || g.rating < Number(activeRating))) return false
      if (activeTag && !(g.tags ?? []).includes(activeTag)) return false
      return true
    })
    .sort((a, b) => {
      switch (activeSort) {
        case 'latest':    return new Date(b.dateAdded ?? 0).getTime() - new Date(a.dateAdded ?? 0).getTime()
        case 'oldest':    return new Date(a.dateAdded ?? 0).getTime() - new Date(b.dateAdded ?? 0).getTime()
        case 'rating':    return (b.rating ?? 0) - (a.rating ?? 0)
        case 'az':        return (a.gameName ?? '').localeCompare(b.gameName ?? '')
        case 'za':        return (b.gameName ?? '').localeCompare(a.gameName ?? '')
        default:          return (a.status ? STATUS_ORDER[a.status] : 99) - (b.status ? STATUS_ORDER[b.status] : 99)
      }
    })

  const viewBtnClass = (active: boolean): string =>
    active
      ? 'p-2 rounded border border-[#f72585] text-[#f72585] bg-[#f7258515] [box-shadow:0_0_6px_#f7258540] transition-[border-color,color,background-color,box-shadow,transform] duration-150 active:scale-[0.97]'
      : 'p-2 rounded border border-transparent text-[#4a5068] hover:text-[#e8e4dc] hover:border-[#2a2d45] transition-[border-color,color,background-color,box-shadow,transform] duration-150 active:scale-[0.97]'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Library</h1>
          {!gamesPending && (
            <span className="text-sm px-2.5 py-1 rounded bg-[#1e2035] text-[#8891a8] border border-[#2a2d45]">
              {displayedGames.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          <button onClick={() => handleViewChange('list')} className={viewBtnClass(viewMode === 'list')} title="List view">
            <ListIcon />
          </button>
          <button onClick={() => handleViewChange('grid')} className={viewBtnClass(viewMode === 'grid')} title="Grid view">
            <GridIcon />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveStatus(tab)}
              className={`text-sm px-4 py-2 rounded border transition-[border-color,color,background-color,box-shadow,transform] duration-150 active:scale-[0.97] ${
                activeStatus === tab
                  ? tabActiveStyles[tab]
                  : `border-[#2a2d45] text-[#8891a8] ${tabHoverStyles[tab]}`
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#8891a8] uppercase tracking-wider">Platform</label>
            <StyledSelect
              value={activePlatform}
              onChange={setActivePlatform}
              disabled={platforms.length === 0}
              options={[{ value: '', label: 'All' }, ...platforms.map((p) => ({ value: p, label: p }))]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#8891a8] uppercase tracking-wider">Genre</label>
            <StyledSelect
              value={activeGenre}
              onChange={setActiveGenre}
              disabled={genres.length === 0}
              options={[{ value: '', label: 'All' }, ...genres.map((g) => ({ value: g, label: g }))]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#8891a8] uppercase tracking-wider">Tags</label>
            <StyledSelect
              value={activeTag}
              onChange={setActiveTag}
              disabled={allTags.length === 0}
              options={[{ value: '', label: 'All' }, ...allTags.map((t) => ({ value: t, label: t }))]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#8891a8] uppercase tracking-wider">Rating</label>
            <StyledSelect
              value={activeRating}
              onChange={setActiveRating}
              options={[{ value: '', label: 'All' }, ...[9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n}+` }))]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#8891a8] uppercase tracking-wider">Order By</label>
            <StyledSelect
              alwaysActive
              value={activeSort}
              onChange={(v) => setActiveSort(v as SortMode)}
              options={[
                { value: 'status', label: 'Status' },
                { value: 'latest', label: 'Latest' },
                { value: 'oldest', label: 'Oldest' },
                { value: 'rating', label: 'Rating' },
                { value: 'az', label: 'A → Z' },
                { value: 'za', label: 'Z → A' },
              ]}
            />
          </div>

          {isFiltered && (
            <button
              onClick={resetFilters}
              className="ml-auto self-end text-sm px-4 py-2 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] transition-[border-color,box-shadow,color,transform] duration-150 active:scale-[0.97]"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      {removeError && (
        <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
          {removeError}
        </p>
      )}

      {gamesPending && (
        <p className="text-base text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
      )}

      {!gamesPending && gamesError && (
        <p className="text-base text-[#ef4444]">Failed to load library.</p>
      )}

      {!gamesPending && !gamesError && displayedGames.length === 0 && (
        <div className="flex items-center justify-center h-48 bg-[#111220] border border-[#1e2035] rounded-lg animate-enter">
          <p className="text-base text-[#8891a8]">{emptyMessages[activeStatus] ?? 'No games match your filters.'}</p>
        </div>
      )}

      {!gamesPending && !gamesError && displayedGames.length > 0 && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {displayedGames.map((entry, i) => (
              <div
                key={entry.id}
                className="animate-stagger-in"
                style={{ '--i': Math.min(i, 20) } as CSSProperties}
              >
                <LibraryGameCard entry={entry} onRemove={handleRemove} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayedGames.map((entry, i) => (
              <div
                key={entry.id}
                className="animate-stagger-in"
                style={{ '--i': Math.min(i, 20) } as CSSProperties}
              >
                <GameListItem entry={entry} onRemove={handleRemove} />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
