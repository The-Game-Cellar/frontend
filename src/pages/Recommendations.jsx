import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPersonalized } from '../services/recommendationService';
import GameCard from '../components/common/GameCard';

export default function Recommendations() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPersonalized(20)
      .then(res => setGames(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Failed to load recommendations.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Recommendations</h1>

      {loading && (
        <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
      )}

      {!loading && error && (
        <p className="text-sm text-[#ef4444]">{error}</p>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="flex items-center justify-center h-48 bg-[#111220] border border-[#1e2035] rounded-lg">
          <p className="text-sm text-[#8891a8]">No recommendations yet. Add some games to your library first.</p>
        </div>
      )}

      {!loading && !error && games.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-4">
          {games.map(game => (
            <GameCard
              key={game.rawgId}
              game={game}
              onClick={() => navigate(`/games/${game.rawgId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
