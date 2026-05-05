import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPersonalizedGrouped,
  addRecentlyShownIds,
} from '../services/recommendationService'
import GameCard from '../components/common/GameCard'
import type { GroupedRecommendationsResponse, RecommendationDTO, RecommendationRow } from '../types/api'

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
}

function Row({ row, onGameClick, onLabelClick }: RowProps) {
  if (!row.games || row.games.length === 0) return null
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        {row.fallback ? (
          <h2 className="text-lg font-medium text-[#e8e4dc]">{row.label}</h2>
        ) : (
          <button
            onClick={() => row.genre && onLabelClick(row.genre)}
            className="text-lg font-medium text-[#e8e4dc] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-[color,text-shadow] duration-200"
          >
            {row.label} →
          </button>
        )}
      </div>
      <AdaptiveRail games={row.games} onGameClick={onGameClick} />
    </section>
  )
}

export default function Recommendations() {
  const navigate = useNavigate()
  const [data, setData] = useState<GroupedRecommendationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getPersonalizedGrouped()
      .then((res) => {
        const payload: GroupedRecommendationsResponse = res.data ?? { rows: [], tier: 3 }
        setData(payload)
        const allIds = (payload.rows ?? []).flatMap((r) => (r.games ?? []).map((g) => g.igdbId).filter((id): id is number => id != null))
        addRecentlyShownIds(allIds)
      })
      .catch(() => setError('Failed to load recommendations.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleGameClick = (g: RecommendationDTO) => navigate(`/games/${g.igdbId}`)
  const handleLabelClick = (genre: string) => navigate(`/explore?genre=${encodeURIComponent(genre)}`)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Recommendations</h1>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 text-xs rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[box-shadow:0_0_6px_#f7258560] active:scale-[0.97] transition-[border-color,color,box-shadow,transform] duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          [ REFRESH ]
        </button>
      </div>

      {loading && (
        <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
      )}

      {!loading && error && (
        <p className="text-sm text-[#ef4444]">{error}</p>
      )}

      {!loading && !error && data && data.tier === 3 && (
        <div className="inline-flex px-4 py-3 rounded-lg border border-[#2a2d45] bg-[#12152a] text-xs text-[#8891a8] animate-enter">
          {data.emptyMessage ?? 'Rate games in your library to unlock personalized recommendations.'}
        </div>
      )}

      {!loading && !error && data && data.tier !== 3 && data.emptyMessage && (
        <div className="inline-flex px-4 py-3 rounded-lg border border-[#2a2d45] bg-[#12152a] text-xs text-[#8891a8] animate-enter">
          {data.emptyMessage}
        </div>
      )}

      {!loading && !error && data && (data.rows ?? []).length === 0 && (
        <div className="flex items-center justify-center h-48 bg-[#111220] border border-[#1e2035] rounded-lg animate-enter">
          <p className="text-sm text-[#8891a8]">Couldn't load recommendations right now. Try refreshing in a moment.</p>
        </div>
      )}

      {!loading && !error && data && (data.rows ?? []).length > 0 && (
        <div className="space-y-10 animate-enter">
          {(data.rows ?? []).map((row, i) => (
            <Row key={`${row.label}-${i}`} row={row} onGameClick={handleGameClick} onLabelClick={handleLabelClick} />
          ))}
        </div>
      )}
    </div>
  )
}
