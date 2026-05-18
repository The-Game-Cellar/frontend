import { useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import CoverFallback from '../common/CoverFallback'
import TruncatedText from '../common/TruncatedText'
import type { GameStatus, UserGameDTO } from '../../types/api'

interface LibraryGameCardProps {
  entry: UserGameDTO
  onRemove: (id: number) => void
}

const statusStyles: Record<GameStatus, string> = {
  PLAYING:   'bg-[#0a0b14cc] text-[#22c55e] border-[#22c55e]',
  BACKLOG:   'bg-[#0a0b14cc] text-[#2563eb] border-[#2563eb]',
  COMPLETED: 'bg-[#0a0b14cc] text-[#a855f7] border-[#a855f7]',
  DROPPED:   'bg-[#0a0b14cc] text-[#ef4444] border-[#ef4444]',
  WISHLIST:  'bg-[#0a0b14cc] text-[#f59e0b] border-[#f59e0b]',
  DUSTY:     'bg-[#0a0b14cc] text-[#8891a8] border-[#8891a8]',
}

export default function LibraryGameCard({ entry, onRemove }: LibraryGameCardProps) {
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  const status = entry.status
  const badgeStyle = status ? statusStyles[status] : 'bg-[#0a0b14cc] text-[#8891a8] border-[#2a2d45]'

  return (
    <div
      className="bg-[#111220] border border-[#1e2035] rounded-lg overflow-hidden cursor-pointer neon-card group"
      onClick={() => { if (!confirming) navigate(`/games/${entry.igdbGameId}`) }}
    >
      {/* Cover */}
      <div className="aspect-[3/4] bg-[#1e2035] overflow-hidden relative">
        {entry.backgroundImage ? (
          <img
            src={entry.backgroundImage}
            alt={entry.gameName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <CoverFallback platforms={entry.platform ? [entry.platform] : []} />
        )}

        {/* Status badge — bottom left */}
        <span className={`absolute bottom-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded border font-medium ${badgeStyle}`}>
          {entry.status}
        </span>

        {/* Confirm overlay — cross-fades with default state */}
        <div
          className={`absolute inset-0 bg-[#0a0b14cc] flex flex-col items-center justify-center gap-2 transition-opacity duration-200 ${confirming ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs text-[#e8e4dc]">Remove?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => entry.id != null && onRemove(entry.id)}
              className="text-xs px-2.5 py-1 rounded border border-[#ef4444] text-[#ef4444] hover:bg-[#ef444420] transition-colors"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-xs px-2.5 py-1 rounded border border-[#2a2d45] text-[#4a5068] hover:text-[#e8e4dc] hover:border-[#8891a8] transition-colors"
            >
              No
            </button>
          </div>
        </div>

        {/* Remove button — top right, visible on hover, hides when confirming */}
        <button
          type="button"
          onClick={(e: ReactMouseEvent<HTMLButtonElement>) => { e.stopPropagation(); setConfirming(true) }}
          className={`absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-[#0a0b14cc] rounded text-[#4a5068] hover:text-[#ef4444] transition-[opacity,color] duration-200 text-base leading-none ${confirming ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
          title="Remove from library"
        >
          ×
        </button>
      </div>

      {/* Info */}
      <div className="p-2 space-y-0.5">
        <TruncatedText as="p" text={entry.gameName ?? ''} className="text-xs font-medium text-[#e8e4dc]" />
        {entry.rating != null ? (
          <p className="text-xs">
            <span className="text-[#f72585] [text-shadow:0_0_6px_#f72585]">{entry.rating}</span>
            <span className="text-[#4a5068]">/10</span>
          </p>
        ) : (
          <p className="text-xs text-[#4a5068]">—</p>
        )}
      </div>
    </div>
  )
}
