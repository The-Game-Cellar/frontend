import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getUserGames, removeGame, getUserPlatforms, getLibraryGenres } from '../services/libraryService';
import GameListItem from '../components/library/GameListItem';

const STATUS_TABS = ['All', 'PLAYING', 'BACKLOG', 'WISHLIST', 'DUSTY', 'COMPLETED', 'DROPPED'];

const STATUS_ORDER = { PLAYING: 0, BACKLOG: 1, WISHLIST: 2, DUSTY: 3, COMPLETED: 4, DROPPED: 5 };

const tabActiveStyles = {
  All:       'bg-[#f7258515] border-[#f72585] text-[#f72585] [box-shadow:0_0_6px_#f7258560]',
  PLAYING:   'bg-[#22c55e15] border-[#22c55e] text-[#22c55e] [box-shadow:0_0_6px_#22c55e60]',
  BACKLOG:   'bg-[#2563eb15] border-[#2563eb] text-[#2563eb] [box-shadow:0_0_6px_#2563eb60]',
  COMPLETED: 'bg-[#a855f715] border-[#a855f7] text-[#a855f7] [box-shadow:0_0_6px_#a855f760]',
  DROPPED:   'bg-[#ef444415] border-[#ef4444] text-[#ef4444] [box-shadow:0_0_6px_#ef444460]',
  WISHLIST:  'bg-[#f59e0b15] border-[#f59e0b] text-[#f59e0b] [box-shadow:0_0_6px_#f59e0b60]',
  DUSTY:     'bg-[#8891a815] border-[#8891a8] text-[#8891a8] [box-shadow:0_0_6px_#8891a860]',
};

const tabHoverStyles = {
  All:       'hover:border-[#f72585] hover:text-[#f72585] hover:[box-shadow:0_0_6px_#f7258560]',
  PLAYING:   'hover:border-[#22c55e] hover:text-[#22c55e] hover:[box-shadow:0_0_6px_#22c55e60]',
  BACKLOG:   'hover:border-[#2563eb] hover:text-[#2563eb] hover:[box-shadow:0_0_6px_#2563eb60]',
  COMPLETED: 'hover:border-[#a855f7] hover:text-[#a855f7] hover:[box-shadow:0_0_6px_#a855f760]',
  DROPPED:   'hover:border-[#ef4444] hover:text-[#ef4444] hover:[box-shadow:0_0_6px_#ef444460]',
  WISHLIST:  'hover:border-[#f59e0b] hover:text-[#f59e0b] hover:[box-shadow:0_0_6px_#f59e0b60]',
  DUSTY:     'hover:border-[#8891a8] hover:text-[#8891a8] hover:[box-shadow:0_0_6px_#8891a860]',
};

const emptyMessages = {
  All:       'Your library is empty. Find games in Explore.',
  PLAYING:   'Nothing currently playing.',
  BACKLOG:   'Backlog is clear!',
  COMPLETED: 'No completed games yet.',
  DROPPED:   'No dropped games.',
  WISHLIST:  'Wishlist is empty.',
  DUSTY:     'No dusty games — everything has been played recently.',
};

export default function Library() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('filter') === 'dusty'
    ? 'DUSTY'
    : (STATUS_TABS.includes(searchParams.get('status')) ? searchParams.get('status') : 'All');

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStatus, setActiveStatus] = useState(initialStatus);
  const [activePlatform, setActivePlatform] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [activeGenre, setActiveGenre] = useState('');
  const [genres, setGenres] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    getUserPlatforms()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setPlatforms(data.map(p => p.platformName ?? p));
      })
      .catch(() => {});
    getLibraryGenres()
      .then(res => setGenres(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  const fetchGames = useCallback((status, query, platform, genre) => {
    setLoading(true);
    setError(null);
    const params = {};
    if (status !== 'All') params.status = status;
    if (query) params.search = query;
    if (platform) params.platform = platform;
    if (genre) params.genre = genre;
    getUserGames(params)
      .then(res => setGames(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Failed to load library.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGames(activeStatus, searchQuery, activePlatform, activeGenre);
  }, [activeStatus, searchQuery, fetchGames, activePlatform, activeGenre]);

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
                  ? tabActiveStyles[tab]
                  : `border-[#2a2d45] text-[#4a5068] ${tabHoverStyles[tab]}`
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search + platform + genre */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search your library..."
            className="w-full max-w-sm bg-[#111220] border border-[#2a2d45] rounded px-3 py-2 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none transition-colors"
          />
          <select
            value={activePlatform}
            onChange={e => setActivePlatform(e.target.value)}
            disabled={platforms.length === 0}
            className="bg-[#111220] border border-[#2a2d45] rounded px-3 py-2 text-sm text-[#e8e4dc] focus:border-[#f72585] focus:outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">Platforms</option>
            {platforms.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={activeGenre}
            onChange={e => setActiveGenre(e.target.value)}
            disabled={genres.length === 0}
            className="bg-[#111220] border border-[#2a2d45] rounded px-3 py-2 text-sm text-[#e8e4dc] focus:border-[#f72585] focus:outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">Genres</option>
            {genres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
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
          {[...games]
            .sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99))
            .map(entry => (
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
