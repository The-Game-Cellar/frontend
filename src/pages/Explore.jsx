import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchGames, getPopularGames, getGenres, getPlatforms } from '../services/gameService';
import GameCard from '../components/common/GameCard';

const MOODS = [
  { value: '',            label: 'All Moods' },
  { value: 'chill',       label: 'Chill' },
  { value: 'intense',     label: 'Intense' },
  { value: 'story-driven', label: 'Story-Driven' },
];

const PAGE_SIZE = 20;

export default function Explore() {
  const navigate = useNavigate();

  const [games, setGames] = useState([]);
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [platform, setPlatform] = useState('');
  const [mood, setMood] = useState('');

  const debounceRef = useRef(null);

  // Load dropdown options once
  useEffect(() => {
    getGenres().then(res => {
      const data = Array.isArray(res.data?.genres) ? res.data.genres : [];
      setGenres(data);
    }).catch(() => {});
    getPlatforms().then(res => {
      const data = Array.isArray(res.data?.platforms) ? res.data.platforms : [];
      setPlatforms(data);
    }).catch(() => {});
  }, []);

  // Fetch page 1 when filters change
  useEffect(() => {
    setPage(1);
    setGames([]);
    setHasMore(true);
    doFetch(1, false, searchQuery, genre, platform, mood);
  }, [searchQuery, genre, platform, mood]); // eslint-disable-line react-hooks/exhaustive-deps

  const doFetch = async (pageNum, append, q, g, p, m) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    const isFiltered = q || g || p || m;
    try {
      let res;
      if (isFiltered) {
        res = await searchGames({ query: q, genre: g, platform: p, mood: m, page: pageNum, pageSize: PAGE_SIZE });
      } else {
        res = await getPopularGames({ page: pageNum, pageSize: PAGE_SIZE });
      }
      const incoming = Array.isArray(res.data?.games) ? res.data.games : [];
      setGames(prev => append ? [...prev, ...incoming] : incoming);
      setHasMore(incoming.length >= PAGE_SIZE);
    } catch {
      setError('Failed to load games.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    doFetch(next, true, searchQuery, genre, platform, mood);
  };

  const handleSearchChange = e => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(val), 300);
  };

  const resolveLabel = item => {
    if (typeof item === 'string') return item;
    return item.name ?? item.genre ?? item.platform ?? '';
  };

  const isFiltered = searchQuery || genre || platform || mood;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Explore</h1>

      {/* Search */}
      <input
        type="text"
        value={searchInput}
        onChange={handleSearchChange}
        placeholder="Search games..."
        className="w-full bg-[#111220] border border-[#1e2035] rounded px-4 py-3 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none transition-colors"
      />

      {/* Filter row */}
      <div className="flex flex-wrap gap-3">
        <select
          value={genre}
          onChange={e => setGenre(e.target.value)}
          className="bg-[#111220] border border-[#1e2035] rounded px-3 py-1.5 text-xs text-[#8891a8] focus:border-[#f72585] focus:outline-none transition-colors"
        >
          <option value="">All Genres</option>
          {genres.map((g, i) => (
            <option key={i} value={resolveLabel(g)}>{resolveLabel(g)}</option>
          ))}
        </select>

        <select
          value={platform}
          onChange={e => setPlatform(e.target.value)}
          className="bg-[#111220] border border-[#1e2035] rounded px-3 py-1.5 text-xs text-[#8891a8] focus:border-[#f72585] focus:outline-none transition-colors"
        >
          <option value="">All Platforms</option>
          {platforms.map((p, i) => (
            <option key={i} value={resolveLabel(p)}>{resolveLabel(p)}</option>
          ))}
        </select>

        <select
          value={mood}
          onChange={e => setMood(e.target.value)}
          className="bg-[#111220] border border-[#1e2035] rounded px-3 py-1.5 text-xs text-[#8891a8] focus:border-[#f72585] focus:outline-none transition-colors"
        >
          {MOODS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {isFiltered && (
          <button
            onClick={() => {
              setSearchInput('');
              setSearchQuery('');
              setGenre('');
              setPlatform('');
              setMood('');
            }}
            className="text-xs text-[#4a5068] hover:text-[#e8e4dc] transition-colors px-2"
          >
            Clear filters ×
          </button>
        )}
      </div>

      {/* Section label */}
      <p className="text-xs text-[#4a5068]">
        {isFiltered ? 'Search results' : 'Popular games'}
      </p>

      {/* States */}
      {loading && (
        <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
      )}

      {!loading && error && (
        <p className="text-sm text-[#ef4444]">{error}</p>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="flex items-center justify-center h-48 bg-[#111220] border border-[#1e2035] rounded-lg">
          <p className="text-sm text-[#8891a8]">No games found.</p>
        </div>
      )}

      {games.length > 0 && (
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

      {/* Load more */}
      {!loading && !error && hasMore && games.length > 0 && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2 border border-[#1e2035] text-[#8891a8] text-sm rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-colors disabled:opacity-40"
          >
            {loadingMore ? '[ LOADING... ]' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
