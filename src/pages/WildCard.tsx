import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWildCard } from '../services/recommendationService'
import GameCard from '../components/common/GameCard'
import type { RecommendationDTO } from '../types/api'

export default function WildCard() {
  const navigate = useNavigate()
  const [games, setGames] = useState<RecommendationDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rollCount, setRollCount] = useState(0)

  const roll = () => {
    setLoading(true)
    setError(null)
    getWildCard(12)
      .then((res) => {
        setGames(Array.isArray(res.data) ? res.data : [])
        setRollCount((c) => c + 1)
      })
      .catch(() => setError('Failed to load Wild Card.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    roll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Wild Card</h1>
          <p className="text-xs text-[#4a5068]">Random picks from the cellar — roll again for a new hand</p>
        </div>
        <button
          onClick={roll}
          disabled={loading}
          className="px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-[box-shadow,transform] duration-200"
        >
          ↺ Roll Again
        </button>
      </div>

      {loading && (
        <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
      )}

      {!loading && error && (
        <p className="text-sm text-[#ef4444]">{error}</p>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="flex items-center justify-center h-48 bg-[#111220] border border-[#1e2035] rounded-lg animate-enter">
          <p className="text-sm text-[#8891a8]">No games found. Try rolling again.</p>
        </div>
      )}

      {!loading && !error && games.length > 0 && (
        <div
          key={rollCount}
          className="grid grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-4 animate-wildcard"
        >
          {games.map((game) => (
            <GameCard
              key={game.igdbId}
              game={game}
              onClick={() => navigate(`/games/${game.igdbId}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
