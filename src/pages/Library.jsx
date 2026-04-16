import { useState, useEffect, useRef, useCallback } from 'react';
import { getUserGames, removeGame } from '../services/libraryService';
import GameListItem from '../components/library/GameListItem';

const STATUS_TABS = ['All', 'PLAYING', 'BACKLOG', 'COMPLETED', 'DROPPED', 'WISHLIST'];

const emptyMessages = {
  All:       'Your library is empty. Find games in Explore.',
  PLAYING:   'Nothing currently playing.',
  BACKLOG:   'Backlog is clear!',
  COMPLETED: 'No completed games yet.',
  DROPPED:   'No dropped games.',
  WISHLIST:  'Wishlist is empty.',
};

export default function Library() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStatus, setActiveStatus] = useState('All');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef(null);

  const fetchGames = useCallback((status, query) => {
    setLoading(true);
    setError(null);
    const params = {};
    if (status !== 'All') params.status = status;
    if (query) params.search = query;
    getUserGames(params)
      .then(res => setGames(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Failed to load library.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGames(activeStatus, searchQuery);
  }, [activeStatus, searchQuery, fetchGames]);

  const handleSearchChange = e => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(val), 300);
  };

  const handleStatusChange = tab => {
    setActiveStatus(tab);
  };

  const handleRemove = async id => {
    try {
      await removeGame(id);
      setGames(prev => prev.filter(g => g.id !== id));
    } catch {
      // silent — game stays visible; user can retry
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Library</h1>
        {!loading && (
          <span className="text-xs px-2 py-0.5 rounded bg-[#1e2035] text-[#8891a8] border border-[#2a2d45]">
            {games.length}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => handleStatusChange(tab)}
              className={`text-xs px-3 py-1.5 rounded border transition-all duration-150 ${
                activeStatus === tab
                  ? 'bg-[#f7258515] border-[#f72585] text-[#f72585] [box-shadow:0_0_6px_#f7258560]'
                  : 'border-[#1e2035] text-[#8891a8] hover:border-[#2a2d45] hover:text-[#e8e4dc]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search your library..."
          className="w-full max-w-sm bg-[#111220] border border-[#1e2035] rounded px-3 py-2 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none transition-colors"
        />
      </div>

      {/* States */}
      {loading && (
        <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
      )}

      {!loading && error && (
        <p className="text-sm text-[#ef4444]">{error}</p>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="flex items-center justify-center h-48 bg-[#111220] border border-[#1e2035] rounded-lg">
          <p className="text-sm text-[#8891a8]">{emptyMessages[activeStatus]}</p>
        </div>
      )}

      {!loading && !error && games.length > 0 && (
        <div className="space-y-2">
          {games.map(entry => (
            <GameListItem
              key={entry.id}
              entry={entry}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
