import type { CSSProperties } from 'react'
import CoverFallback from './CoverFallback'
import TruncatedText from './TruncatedText'

export interface GameCardData {
  igdbId?: number
  name?: string
  backgroundImage?: string
  platforms?: string[]
  genres?: string[]
}

interface GameCardProps {
  game: GameCardData
  onClick?: () => void
  style?: CSSProperties
  subtitle?: string
}

export default function GameCard({ game, onClick, style, subtitle }: GameCardProps) {
  const subtitleText = subtitle ?? (game.genres && game.genres.length > 0 ? game.genres[0] : '')
  return (
    <div
      className="bg-[#111220] border border-[#1e2035] rounded-lg overflow-hidden w-44 flex-shrink-0 cursor-pointer neon-card group"
      style={style}
      onClick={onClick}
    >
      <div className="aspect-[3/4] bg-[#1e2035] overflow-hidden">
        {game.backgroundImage ? (
          <img
            src={game.backgroundImage}
            alt={game.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <CoverFallback platforms={game.platforms} />
        )}
      </div>
      <div className="p-2">
        <TruncatedText as="p" text={game.name ?? ''} className="text-xs font-medium text-[#e8e4dc]" />
        <p className="text-xs text-[#8891a8] truncate">{subtitleText}</p>
      </div>
    </div>
  )
}
