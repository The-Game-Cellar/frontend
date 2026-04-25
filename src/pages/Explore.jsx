import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchGames, getGenres, getPlatforms } from '../services/gameService';
import GameCard from '../components/common/GameCard';

const MOODS = [
  { value: '',             label: 'All Moods' },
  { value: 'chill',        label: 'Chill' },
  { value: 'intense',      label: 'Intense' },
  { value: 'story-driven', label: 'Story-Driven' },
];

const ORDERINGS = [
  { value: '-rating',   label: 'Popular' },
  { value: '-released', label: 'Newest' },
  { value: 'released',  label: 'Oldest' },
  { value: 'name',      label: 'A → Z' },
  { value: '-name',     label: 'Z → A' },
];

const PAGE_SIZE = 20;

const selectClass = 'bg-[#111220] border border-[#2a2d45] rounded px-3 py-1.5 text-xs text-[#8891a8] focus:border-[#f72585] focus:outline-none transition-colors';

export default function Explore() {
  const navigate = useNavigate();

  const [games, setGames] = useState([]);
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [platform, setPlatform] = useState('');
  const [mood, setMood] = useState('');
  const [ordering, setOrdering] = useState('-rating');

  const debounceRef = useRef(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    getGenres().then(res => {
      setGenres(Array.isArray(res.data?.genres) ? res.data.genres : []);
    }).catch(() => {});
    getPlatforms().then(res => {
      setPlatforms(Array.isArray(res.data?.platforms) ? res.data.platforms : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(0);
    doFetch(0, searchQuery, genre, platform, mood, ordering);
  }, [searchQuery, genre, platform, mood, ordering]); // eslint-disable-line react-hooks/exhaustive-deps

  const doFetch = async (pageNum, q, g, p, m, ord) => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await searchGames({ query: q, genre: g, platform: p, mood: m, ordering: ord, page: pageNum, pageSize: PAGE_SIZE });
      if (id !== fetchIdRef.current) return;
      const incoming = Array.isArray(res.data?.games) ? res.data.games : [];
      const total = res.data?.totalCount ?? 0;
      setGames(incoming);
      setTotalPages(Math.ceil(total / PAGE_SIZE));
    } catch {
      if (id !== fetchIdRef.current) return;
      setError('Failed to load games.');
    } finally {
      if (id === fetchIdRef.current) setLoading(false);
    }
  };

  const handlePageChange = p => {
    setPage(p);
    doFetch(p, searchQuery, genre, platform, mood, ordering);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const isFiltered = searchQuery || genre || platform || mood || ordering !== '-rating';

  const handleReset = () => {
    setSearchInput('');
    setSearchQuery('');
    setGenre('');
    setPlatform('');
    setMood('');
    setOrdering('-rating');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Explore</h1>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search games..."
          className="w-64 bg-[#111220] border border-[#2a2d45] rounded px-3 py-1.5 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none transition-colors"
        />

        <select value={genre} onChange={e => setGenre(e.target.value)} className={selectClass}>
          <option value="">All Genres</option>
          {genres.map((g, i) => (
            <option key={i} value={resolveLabel(g)}>{resolveLabel(g)}</option>
          ))}
        </select>

        <select value={platform} onChange={e => setPlatform(e.target.value)} className={selectClass}>
          <option value="">All Platforms</option>
          {platforms.map((p, i) => (
            <option key={i} value={resolveLabel(p)}>{resolveLabel(p)}</option>
          ))}
        </select>

        <select value={mood} onChange={e => setMood(e.target.value)} className={selectClass}>
          {MOODS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <select value={ordering} onChange={e => setOrdering(e.target.value)} className={selectClass}>
          {ORDERINGS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {isFiltered && (
          <button onClick={handleReset} className="text-xs px-3 py-1.5 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] transition-all duration-150">
            Reset filter
          </button>
        )}
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
          <p className="text-sm text-[#8891a8]">No games found.</p>
        </div>
      )}

      {games.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-4">
          {games.map(game => (
            <GameCard
              key={game.igdbId}
              game={game}
              onClick={() => navigate(`/games/${game.igdbId}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 pb-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(0, Math.min(page - 2, totalPages - 5));
            const pageNum = start + i;
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1.5 text-xs rounded border transition-all duration-150 ${
                  pageNum === page
                    ? 'border-[#f72585] text-[#f72585] bg-[#f7258515] [box-shadow:0_0_6px_#f7258560]'
                    : 'border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]'
                }`}
              >
                {pageNum + 1}
              </button>
            );
          })}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 text-xs rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
