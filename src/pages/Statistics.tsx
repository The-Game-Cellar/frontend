import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStats } from '../services/libraryService'
import type { GameStatus } from '../types/api'

const TOP_N = 8

interface StatusEntry {
  key: GameStatus
  label: string
  color: string
  glow: string
}

const STATUSES: StatusEntry[] = [
  { key: 'PLAYING',   label: 'Playing',   color: '#22c55e', glow: '#22c55e40' },
  { key: 'BACKLOG',   label: 'Backlog',   color: '#2563eb', glow: '#2563eb40' },
  { key: 'COMPLETED', label: 'Completed', color: '#a855f7', glow: '#a855f740' },
  { key: 'DROPPED',   label: 'Dropped',   color: '#ef4444', glow: '#ef444440' },
  { key: 'WISHLIST',  label: 'Wishlist',  color: '#f59e0b', glow: '#f59e0b40' },
]

export default function Statistics() {
  const navigate = useNavigate()
  const { data: stats, isLoading, isError } = useStats()
  const [showAllGenres, setShowAllGenres] = useState(false)
  const [showAllPlatforms, setShowAllPlatforms] = useState(false)

  const sortedGenres: [string, number][] = stats?.byGenre
    ? Object.entries(stats.byGenre).sort(([, a], [, b]) => b - a)
    : []
  const sortedPlatforms: [string, number][] = stats?.byPlatform
    ? Object.entries(stats.byPlatform).sort(([, a], [, b]) => b - a)
    : []

  const visibleGenres = showAllGenres ? sortedGenres : sortedGenres.slice(0, TOP_N)
  const visiblePlatforms = showAllPlatforms ? sortedPlatforms : sortedPlatforms.slice(0, TOP_N)
  const maxGenreCount = sortedGenres[0]?.[1] ?? 1
  const maxPlatformCount = sortedPlatforms[0]?.[1] ?? 1

  const totalGames = stats
    ? Object.values(stats.byStatus ?? {}).reduce((sum, n) => sum + n, 0)
    : null

  const hasAnyData =
    stats != null &&
    ((totalGames ?? 0) > 0 ||
      sortedGenres.length > 0 ||
      sortedPlatforms.length > 0 ||
      (stats.totalRated != null && stats.totalRated > 0))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Statistics</h1>
        <p className="text-xs text-[#8891a8]">
          Distribution of games across statuses, genres and platforms in your library, plus your rating overview.
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
      )}

      {isError && (
        <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
          Failed to load statistics.
        </p>
      )}

      {!isLoading && !isError && stats && !hasAnyData && (
        <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-8 text-center space-y-2">
          <p className="text-sm text-[#e8e4dc]">No statistics yet.</p>
          <p className="text-xs text-[#4a5068]">
            Add games and ratings to your library to see distributions here.
          </p>
        </section>
      )}

      {stats && totalGames !== null && totalGames > 0 && (
        <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-4">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <p className="text-xs text-[#8891a8] uppercase tracking-wider">Library overview</p>
            {stats.averageRating != null && stats.totalRated != null && stats.totalRated > 0 && (
              <p className="text-xs text-[#8891a8]">
                Average rating{' '}
                <span className="text-[#f72585] [text-shadow:0_0_6px_#f72585] tabular-nums font-semibold">
                  {stats.averageRating.toFixed(1)}
                </span>{' '}
                <span className="text-[#4a5068]">/ 10</span>
                {' · '}
                <span className="tabular-nums">{stats.totalRated}</span> games rated
              </p>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-[#f72585] [text-shadow:0_0_12px_#f7258560] tabular-nums">
              {totalGames}
            </span>
            <span className="text-xs text-[#8891a8]">games in library</span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {STATUSES.map(({ key, label, color, glow }) => {
              const count = stats.byStatus?.[key] ?? 0
              const cardStyle: CSSProperties = { ['--glow' as never]: glow }
              return (
                <button
                  key={key}
                  onClick={() => navigate(`/library?status=${key}`)}
                  className="bg-[#111220] border border-[#2a2d45] rounded-lg p-4 text-center space-y-1 transition-[border-color,box-shadow,transform] duration-200 hover:border-current hover:scale-[1.02]"
                  style={cardStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color
                    e.currentTarget.style.boxShadow = `0 0 12px ${glow}`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = ''
                    e.currentTarget.style.boxShadow = ''
                  }}
                >
                  <p className="text-2xl font-semibold tabular-nums" style={{ color, textShadow: `0 0 10px ${glow}` }}>
                    {count}
                  </p>
                  <p className="text-xs text-[#8891a8]">{label}</p>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {stats && sortedGenres.length > 0 && (
        <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-3">
          <div className="space-y-0.5">
            <p className="text-xs text-[#8891a8] uppercase tracking-wider">Games by genre</p>
            <p className="text-xs text-[#4a5068]">
              Number of games in your library tagged with each genre. A game with multiple genres counts toward each of them.
            </p>
          </div>
          <div className="space-y-2 pt-1">
            {visibleGenres.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3 text-xs">
                <span className="w-32 truncate text-[#e8e4dc]" title={name}>{name}</span>
                <div className="flex-1 h-2 bg-[#1e2035] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#8891a8] transition-[width] duration-300"
                    style={{ width: `${(count / maxGenreCount) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[#8891a8] tabular-nums">{count}</span>
              </div>
            ))}
          </div>
          {sortedGenres.length > TOP_N && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAllGenres((v) => !v)}
                className="text-xs text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-[color,text-shadow] duration-200"
              >
                {showAllGenres ? 'Show fewer' : `Show all ${sortedGenres.length} →`}
              </button>
            </div>
          )}
        </section>
      )}

      {stats && sortedPlatforms.length > 0 && (
        <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-3">
          <div className="space-y-0.5">
            <p className="text-xs text-[#8891a8] uppercase tracking-wider">Games by platform</p>
            <p className="text-xs text-[#4a5068]">
              Number of games in your library you play on each platform. Each game is counted on the platform you selected when adding it.
            </p>
          </div>
          <div className="space-y-2 pt-1">
            {visiblePlatforms.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3 text-xs">
                <span className="w-32 truncate text-[#e8e4dc]" title={name}>{name}</span>
                <div className="flex-1 h-2 bg-[#1e2035] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#8891a8] transition-[width] duration-300"
                    style={{ width: `${(count / maxPlatformCount) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[#8891a8] tabular-nums">{count}</span>
              </div>
            ))}
          </div>
          {sortedPlatforms.length > TOP_N && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAllPlatforms((v) => !v)}
                className="text-xs text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-[color,text-shadow] duration-200"
              >
                {showAllPlatforms ? 'Show fewer' : `Show all ${sortedPlatforms.length} →`}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
