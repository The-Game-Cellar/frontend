import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPersonalized, getWildCard } from '../services/recommendationService';
import GameCard from '../components/common/GameCard';

const TABS = ['For You', 'Wild Card'];

export default function Recommendations() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('For You');
  const [forYou, setForYou] = useState([]);
  const [wildCard, setWildCard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'For You') {
      setLoading(true);
      setError(null);
      getPersonalized(20)
        .then(res => setForYou(Array.isArray(res.data) ? res.data : []))
        .catch(() => setError('Failed to load recommendations.'))
        .finally(() => setLoading(false));
    } else if (wildCard.length === 0) {
      rollWildCard();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const rollWildCard = () => {
    setLoading(true);
    setError(null);
    getWildCard(12)
      .then(res => setWildCard(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Failed to load Wild Card.'))
      .finally(() => setLoading(false));
  };

  const games = activeTab === 'For You' ? forYou : wildCard;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Recommendations</h1>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-[#111220] border border-[#1e2035] rounded p-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); }}
              className={`text-xs px-4 py-1.5 rounded transition-all duration-150 ${
                activeTab === tab
                  ? 'bg-[#f7258515] text-[#f72585] [text-shadow:0_0_6px_#f72585] border border-[#f7258560]'
                  : 'text-[#8891a8] hover:text-[#e8e4dc]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Wild Card roll button */}
      {activeTab === 'Wild Card' && !loading && (
        <button
          onClick={rollWildCard}
          className="px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] transition-all duration-200"
        >
          ↺ Roll Again
        </button>
      )}

      {/* States */}
      {loading && (
        <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
      )}

      {!loading && error && (
        <p className="text-sm text-[#ef4444]">{error}</p>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 bg-[#111220] border border-[#1e2035] rounded-lg space-y-2">
          <p className="text-sm text-[#8891a8]">
            {activeTab === 'For You'
              ? 'No recommendations yet. Add some games to your library first.'
              : 'No games found. Try rolling again.'}
          </p>
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
