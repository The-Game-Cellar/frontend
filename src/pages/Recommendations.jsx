import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPersonalized } from '../services/recommendationService';
import GameCard from '../components/common/GameCard';

const PAGE_SIZE = 20;

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    const end = Math.min(totalPages, start + 5);
    for (let i = start; i < end; i++) pages.push(i);
    return pages;
  };

  const btnBase = 'px-3 py-1.5 text-xs rounded border transition-all duration-150';
  const inactive = `${btnBase} border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]`;
  const active = `${btnBase} border-[#f72585] text-[#f72585] bg-[#f7258515] [box-shadow:0_0_6px_#f7258560]`;
  const nav = `${btnBase} border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] disabled:opacity-40 disabled:cursor-not-allowed`;

  return (
    <div className="flex items-center justify-center gap-2 pt-2 pb-4">
      <button onClick={() => onPageChange(page - 1)} disabled={page === 0} className={nav}>← Prev</button>
      {getPages().map(i => (
        <button key={i} onClick={() => onPageChange(i)} className={i === page ? active : inactive}>{i + 1}</button>
      ))}
      <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages - 1} className={nav}>Next →</button>
    </div>
  );
}

export default function Recommendations() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    getPersonalized(100)
      .then(res => setGames(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Failed to load recommendations.'))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(games.length / PAGE_SIZE);

  const fetchMore = () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError(false);
    getPersonalized(50)
      .then(res => {
        const incoming = Array.isArray(res.data) ? res.data : [];
        setGames(prev => {
          const seen = new Set(prev.map(g => g.rawgId));
          const fresh = incoming.filter(g => !seen.has(g.rawgId));
          return [...prev, ...fresh];
        });
      })
      .catch(() => setLoadMoreError(true))
      .finally(() => {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  };

  const handlePageChange = p => {
    if (p === page) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (p === totalPages - 1) fetchMore();
  };

  const paged = games.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

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
          {paged.map(game => (
            <GameCard
              key={game.rawgId}
              game={game}
              onClick={() => navigate(`/games/${game.rawgId}`)}
            />
          ))}
        </div>
      )}

      {loadingMore && (
        <p className="text-xs text-[#4a5068] text-center">[ LOADING MORE... ]</p>
      )}

      {loadMoreError && (
        <p className="text-xs text-[#ef4444] text-center">Failed to load more recommendations.</p>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
}
