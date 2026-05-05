import { useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import TruncatedText from '../common/TruncatedText'
import type { GameStatus, UserGameDTO } from '../../types/api'

interface GameListItemProps {
  entry: UserGameDTO
  onRemove: (id: number) => void
}

const statusStyles: Record<GameStatus, string> = {
  PLAYING:   'bg-[#22c55e20] text-[#22c55e] border-[#22c55e40]',
  BACKLOG:   'bg-[#2563eb20] text-[#2563eb] border-[#2563eb40]',
  COMPLETED: 'bg-[#a855f720] text-[#a855f7] border-[#a855f740]',
  DROPPED:   'bg-[#ef444420] text-[#ef4444] border-[#ef444440]',
  WISHLIST:  'bg-[#f59e0b20] text-[#f59e0b] border-[#f59e0b40]',
  DUSTY:     'bg-[#8891a820] text-[#8891a8] border-[#8891a840]',
}

const rowHoverStyles: Record<GameStatus, string> = {
  PLAYING:   'hover:border-[#22c55e] hover:[box-shadow:0_0_15px_#22c55e30]',
  BACKLOG:   'hover:border-[#2563eb] hover:[box-shadow:0_0_15px_#2563eb30]',
  COMPLETED: 'hover:border-[#a855f7] hover:[box-shadow:0_0_15px_#a855f730]',
  DROPPED:   'hover:border-[#ef4444] hover:[box-shadow:0_0_15px_#ef444430]',
  WISHLIST:  'hover:border-[#f59e0b] hover:[box-shadow:0_0_15px_#f59e0b30]',
  DUSTY:     'hover:border-[#8891a8] hover:[box-shadow:0_0_15px_#8891a830]',
}

export default function GameListItem({ entry, onRemove }: GameListItemProps) {
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  const dateAdded = entry.dateAdded
    ? new Date(entry.dateAdded).toLocaleDateString('en-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  const status = entry.status
  const hoverStyle = status ? rowHoverStyles[status] : 'hover:border-[#3a3d58]'
  const badgeStyle = status ? statusStyles[status] : 'border-[#1e2035] text-[#8891a8]'

  return (
    <div
      className={`bg-[#111220] border border-[#2a2d45] rounded-lg flex items-center gap-4 px-4 py-3 transition-[border-color,box-shadow] duration-150 cursor-pointer ${hoverStyle}`}
      onClick={() => { if (!confirming) navigate(`/games/${entry.igdbGameId}`) }}
    >
      {/* Thumbnail */}
      <div className="w-8 flex-shrink-0 aspect-[3/4] bg-[#1e2035] rounded overflow-hidden">
        {entry.backgroundImage ? (
          <img
            src={entry.backgroundImage}
            alt={entry.gameName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[#4a5068] text-[8px]">?</span>
          </div>
        )}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <TruncatedText as="p" text={entry.gameName ?? ''} className="text-sm text-[#e8e4dc]" />
        <div className="flex items-center gap-3 mt-0.5">
          {entry.platform && (
            <span className="text-xs text-[#4a5068]">{entry.platform}</span>
          )}
          {dateAdded && (
            <span className="text-xs text-[#4a5068]">{dateAdded}</span>
          )}
        </div>
      </div>

      {/* Rating */}
      {entry.rating != null && (
        <div className="flex-shrink-0 text-xs">
          <span className="text-[#f72585] [text-shadow:0_0_6px_#f72585]">{entry.rating}</span>
          <span className="text-[#4a5068]">/10</span>
        </div>
      )}

      {/* Status badge */}
      <span
        className={`flex-shrink-0 text-xs px-2 py-0.5 rounded border font-medium ${badgeStyle}`}
      >
        {entry.status}
      </span>

      {/* Remove / confirm */}
      {confirming ? (
        <div className="flex-shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-[#8891a8]">Remove?</span>
          <button
            type="button"
            onClick={() => entry.id != null && onRemove(entry.id)}
            className="text-xs px-2 py-0.5 rounded border border-[#ef4444] text-[#ef4444] hover:bg-[#ef444420] transition-colors"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-xs px-2 py-0.5 rounded border border-[#2a2d45] text-[#4a5068] hover:text-[#e8e4dc] hover:border-[#8891a8] transition-colors"
          >
            No
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={(e: ReactMouseEvent<HTMLButtonElement>) => { e.stopPropagation(); setConfirming(true) }}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[#4a5068] hover:text-[#ef4444] transition-colors text-xl leading-none"
          title="Remove from library"
        >
          ×
        </button>
      )}
    </div>
  )
}
