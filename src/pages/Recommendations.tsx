import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersonalizedGrouped, useRefreshGenreRow } from '../services/recommendationService'
import GameCard from '../components/common/GameCard'
import type { RecommendationDTO, RecommendationRow } from '../types/api'

const CARD_W = 176
const GAP = 12

interface AdaptiveRailProps {
  games: RecommendationDTO[]
  onGameClick: (game: RecommendationDTO) => void
}

function AdaptiveRail({ games, onGameClick }: AdaptiveRailProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width
      if (w) setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const slot = CARD_W + GAP
  const fits = Math.max(1, Math.floor((width + GAP) / slot))
  const visible = games.slice(0, fits)
  const dynamicGap = fits > 1 && width > 0
    ? Math.max(GAP, (width - fits * CARD_W) / (fits - 1))
    : GAP

  return (
    <div ref={ref} className="flex overflow-hidden" style={{ gap: `${dynamicGap}px` }}>
      {visible.map((g) => (
        <GameCard key={g.igdbId} game={g} onClick={() => onGameClick(g)} />
      ))}
    </div>
  )
}

interface RowProps {
  row: RecommendationRow
  onGameClick: (g: RecommendationDTO) => void
  onLabelClick: (genre: string) => void
  onRefresh: (genre: string) => void
  refreshing: boolean
}

function Row({ row, onGameClick, onLabelClick, onRefresh, refreshing }: RowProps) {
  if (!row.games || row.games.length === 0) return null
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        {row.fallback ? (
          <h2 className="text-xl font-medium text-[#e8e4dc]">{row.label}</h2>
        ) : (
          <button
            onClick={() => row.genre && onLabelClick(row.genre)}
            className="text-xl font-medium text-[#e8e4dc] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-[color,text-shadow] duration-200"
          >
            {row.label} →
          </button>
        )}
        {!row.fallback && row.genre && (
          <button
            onClick={() => row.genre && onRefresh(row.genre)}
            disabled={refreshing}
            className="text-sm px-3 py-1.5 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] active:scale-[0.97] transition-[border-color,color,transform] disabled:opacity-40 disabled:cursor-not-allowed"
            title="Refresh this row"
          >
            {refreshing ? '↻ ...' : 'Refresh'}
          </button>
        )}
      </div>
      <AdaptiveRail games={row.games} onGameClick={onGameClick} />
    </section>
  )
}

export default function Recommendations() {
  const navigate = useNavigate()
  const { data, isFetching, error } = usePersonalizedGrouped()
  const refreshRow = useRefreshGenreRow()

  const handleGameClick = (g: RecommendationDTO) => navigate(`/games/${g.igdbId}`)
  const handleLabelClick = (genre: string) => navigate(`/explore?genre=${encodeURIComponent(genre)}`)
  const handleRowRefresh = (genre: string) => refreshRow.mutate(genre)
  const refreshingGenre = refreshRow.isPending ? (refreshRow.variables ?? null) : null

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Recommendations</h1>
      </div>

      {isFetching && (
        <p className="text-base text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
      )}

      {!isFetching && error && (
        <p className="text-base text-[#ef4444]">Failed to load recommendations.</p>
      )}

      {!isFetching && !error && data && data.tier === 3 && (
        <div className="inline-flex px-4 py-3 rounded-lg border border-[#2a2d45] bg-[#12152a] text-sm text-[#8891a8] animate-enter">
          {data.emptyMessage ?? 'Rate games in your library to unlock personalized recommendations.'}
        </div>
      )}

      {!isFetching && !error && data && data.tier !== 3 && data.emptyMessage && (
        <div className="inline-flex px-4 py-3 rounded-lg border border-[#2a2d45] bg-[#12152a] text-sm text-[#8891a8] animate-enter">
          {data.emptyMessage}
        </div>
      )}

      {!isFetching && !error && data && (data.rows ?? []).length === 0 && (
        <div className="flex items-center justify-center h-48 bg-[#111220] border border-[#1e2035] rounded-lg animate-enter">
          <p className="text-base text-[#8891a8]">Couldn't load recommendations right now. Try refreshing in a moment.</p>
        </div>
      )}

      {!isFetching && !error && data && (data.rows ?? []).length > 0 && (
        <div className="space-y-10 animate-enter">
          {(data.rows ?? []).map((row, i) => (
            <Row
              key={`${row.label}-${i}`}
              row={row}
              onGameClick={handleGameClick}
              onLabelClick={handleLabelClick}
              onRefresh={handleRowRefresh}
              refreshing={refreshingGenre === row.genre}
            />
          ))}
        </div>
      )}
    </div>
  )
}
