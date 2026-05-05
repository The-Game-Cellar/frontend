import { useState } from 'react'
import { AxiosError } from 'axios'
import { useUserPlatforms, useAddGame } from '../../services/libraryService'
import RatingWidget from './RatingWidget'
import type { GameStatus } from '../../types/api'

interface AddGameModalProps {
  game: { igdbId: number; name: string }
  onClose: () => void
  onAdded?: () => void
}

type SelectableStatus = Exclude<GameStatus, 'DUSTY'>

const STATUSES: SelectableStatus[] = ['BACKLOG', 'PLAYING', 'COMPLETED', 'WISHLIST', 'DROPPED']

const statusStyles: Record<SelectableStatus, { active: string; inactive: string }> = {
  PLAYING: {
    active:   'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e] [box-shadow:0_0_10px_#22c55e60]',
    inactive: 'bg-[#22c55e]/8 text-[#22c55e]/85 border-[#22c55e]/45 hover:bg-[#22c55e]/15 hover:text-[#22c55e] hover:border-[#22c55e]/75 hover:[box-shadow:0_0_8px_#22c55e33]',
  },
  BACKLOG: {
    active:   'bg-[#2563eb]/20 text-[#2563eb] border-[#2563eb] [box-shadow:0_0_10px_#2563eb60]',
    inactive: 'bg-[#2563eb]/8 text-[#2563eb]/85 border-[#2563eb]/45 hover:bg-[#2563eb]/15 hover:text-[#2563eb] hover:border-[#2563eb]/75 hover:[box-shadow:0_0_8px_#2563eb33]',
  },
  COMPLETED: {
    active:   'bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7] [box-shadow:0_0_10px_#a855f760]',
    inactive: 'bg-[#a855f7]/8 text-[#a855f7]/85 border-[#a855f7]/45 hover:bg-[#a855f7]/15 hover:text-[#a855f7] hover:border-[#a855f7]/75 hover:[box-shadow:0_0_8px_#a855f733]',
  },
  DROPPED: {
    active:   'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444] [box-shadow:0_0_10px_#ef444460]',
    inactive: 'bg-[#ef4444]/8 text-[#ef4444]/85 border-[#ef4444]/45 hover:bg-[#ef4444]/15 hover:text-[#ef4444] hover:border-[#ef4444]/75 hover:[box-shadow:0_0_8px_#ef444433]',
  },
  WISHLIST: {
    active:   'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b] [box-shadow:0_0_10px_#f59e0b60]',
    inactive: 'bg-[#f59e0b]/8 text-[#f59e0b]/85 border-[#f59e0b]/45 hover:bg-[#f59e0b]/15 hover:text-[#f59e0b] hover:border-[#f59e0b]/75 hover:[box-shadow:0_0_8px_#f59e0b33]',
  },
}

export default function AddGameModal({ game, onClose, onAdded }: AddGameModalProps) {
  const [status, setStatus] = useState<SelectableStatus>('BACKLOG')
  // Empty string = "use first available platform". A user-selected value overrides.
  const [platformOverride, setPlatformOverride] = useState<string>('')
  const [rating, setRating] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)

  const {
    data: platformsData,
    isPending: platformsLoading,
    isError: platformLoadError,
    refetch: loadPlatforms,
  } = useUserPlatforms()
  const platforms = platformsData ?? []
  const addGameMutation = useAddGame()
  const loading = addGameMutation.isPending

  const platform = platformOverride || (platforms[0]?.platformName ?? '')

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 200)
  }

  const showRating = status === 'PLAYING' || status === 'COMPLETED'

  const submitErrorMessage = (e: unknown): string => {
    const axErr = e instanceof AxiosError ? e : null
    const status = axErr?.response?.status
    if (status === 409) return 'This game is already in your library.'
    if (status === 401) return 'Session expired. Please log in again.'
    if (status === 400) return 'Invalid request. Check status and platform.'
    if (status == null || status >= 500) return 'Service unavailable. Please try again.'
    return 'Failed to add game. Please try again.'
  }

  const handleSubmit = async () => {
    if (!platform) return
    setError(null)
    try {
      await addGameMutation.mutateAsync({
        igdbGameId: game.igdbId,
        gameName: game.name,
        status,
        platform,
        rating: showRating && rating != null ? rating : undefined,
      })
      onAdded?.()
      handleClose()
    } catch (e) {
      setError(submitErrorMessage(e))
    }
  }

  const updateStatus = (s: SelectableStatus) => {
    setStatus(s)
    if (s === 'WISHLIST' || s === 'DROPPED') setRating(null)
    if (error) setError(null)
  }

  const updatePlatform = (p: string) => {
    setPlatformOverride(p)
    if (error) setError(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={`bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-sm space-y-5 ${closing ? 'animate-exit' : 'animate-enter'}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#e8e4dc]">Add to Library</h2>
            <p className="text-xs text-[#8891a8] mt-0.5 truncate max-w-[220px]">{game.name}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-[#4a5068] hover:text-[#e8e4dc] transition-colors text-xl leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-xs text-[#4a5068] uppercase tracking-wider">Status</label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => updateStatus(s)}
                className={`text-xs px-2 py-1 rounded border font-medium transition-[border-color,color,background-color,box-shadow] duration-150 ${
                  status === s ? statusStyles[s].active : statusStyles[s].inactive
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div className="space-y-2">
          <label className="text-xs text-[#4a5068] uppercase tracking-wider">Platform</label>
          {platformLoadError ? (
            <div className="flex items-center gap-3">
              <p className="text-xs text-[#ef4444]">Could not load platforms.</p>
              <button
                type="button"
                onClick={() => loadPlatforms()}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#2a2d45] text-[#8891a8] text-sm rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
                Retry
              </button>
            </div>
          ) : platformsLoading ? (
            <p className="text-xs text-[#4a5068]">Loading platforms...</p>
          ) : (
            <select
              value={platform}
              onChange={(e) => updatePlatform(e.target.value)}
              className="w-full bg-[#0a0b14] border border-[#2a2d45] rounded px-3 py-2 text-sm text-[#e8e4dc] focus:border-[#f72585] focus:outline-none transition-colors"
            >
              {platforms.map((p, i) => {
                const name = p.platformName ?? ''
                return <option key={p.id ?? i} value={name}>{name}</option>
              })}
            </select>
          )}
        </div>

        {/* Rating (optional, only for PLAYING / COMPLETED) — animated reveal */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
            showRating ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
          aria-hidden={!showRating}
        >
          <div className="overflow-hidden min-h-0">
            <div className="space-y-2">
              <label className="text-xs text-[#4a5068] uppercase tracking-wider">Rating (optional)</label>
              <RatingWidget value={rating} onChange={setRating} />
            </div>
          </div>
        </div>

        {error && (
          <div className="px-3 py-2 rounded border border-[#ef444440] bg-[#ef444410] text-xs text-[#ef4444]">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSubmit}
            disabled={loading || !platform}
            className="flex-1 px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] active:scale-[0.97] transition-[box-shadow,transform] duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '[ ADDING... ]' : 'Add to Library'}
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-[#2a2d45] text-[#8891a8] text-sm rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
