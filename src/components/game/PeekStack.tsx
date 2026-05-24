import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export interface PeekStackItem {
  igdbId?: number
  name?: string
  coverImageUrl?: string | null
  backgroundImage?: string | null
}

interface PeekStackProps<T extends PeekStackItem> {
  items: T[]
  onItemClick: (item: T) => void
  renderBadge?: (item: T) => ReactNode
  resetKey?: string | number
}

export default function PeekStack<T extends PeekStackItem>({
  items,
  onItemClick,
  renderBadge,
  resetKey,
}: PeekStackProps<T>) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    setHoveredIndex(null)
  }, [resetKey])

  if (items.length === 0) return null

  const n = items.length
  const CARD_FRAC = n === 1 ? 1 : n === 2 ? 0.5 : 27 / 64

  const containerSize =
    n === 1 ? 'w-[42.1875%] aspect-[3/4]'
    : n === 2 ? 'w-[84.375%] aspect-[3/2]'
    : 'w-full aspect-video'

  return (
    <div className={`relative rounded-lg border border-[#1e2035] bg-[#111220] ${containerSize}`}>
      {items.map((item, i) => {
        const isTop = i === 0
        const isHovered = hoveredIndex === i
        const isBright = isHovered || (hoveredIndex === null && isTop)
        const leftPct = n === 1
          ? ((1 - CARD_FRAC) / 2) * 100
          : (i * (1 - CARD_FRAC) / (n - 1)) * 100
        const zIndex = isHovered
          ? 100
          : hoveredIndex !== null
            ? n - Math.abs(i - hoveredIndex)
            : n - i
        const isFirst = i === 0
        const isLast = i === n - 1
        return (
          <button
            key={item.igdbId ?? i}
            onClick={() => onItemClick(item)}
            onMouseEnter={() => setHoveredIndex(i)}
            title={item.name}
            aria-label={item.name}
            style={{ left: `${leftPct}%`, zIndex }}
            className={`absolute top-0 h-full aspect-[3/4] border-l border-r border-[#0a0b14] bg-[#1e2035] overflow-hidden cursor-pointer transition-[transform,filter,box-shadow] duration-200 ${
              isFirst ? 'rounded-l-lg' : ''
            } ${
              isLast ? 'rounded-r-lg' : ''
            } ${
              isBright ? '' : 'brightness-50'
            } ${
              isHovered ? 'scale-[1.04] [box-shadow:0_0_18px_#f7258560,0_0_2px_#f72585]' : ''
            }`}
          >
            {(item.coverImageUrl || item.backgroundImage) ? (
              <img
                src={item.coverImageUrl || item.backgroundImage || undefined}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[#4a5068] text-xs">No cover</span>
              </div>
            )}
            {renderBadge?.(item)}
          </button>
        )
      })}
    </div>
  )
}
