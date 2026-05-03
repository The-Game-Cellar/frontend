import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getUserGames, removeGame, getUserPlatforms, getLibraryGenres } from '../services/libraryService';
import GameListItem from '../components/library/GameListItem';
import LibraryGameCard from '../components/library/LibraryGameCard';
import StyledSelect from '../components/common/StyledSelect';

const GENRE_TO_MOODS = {
  // RAWG genre names (backward compat for cached library games)
  'Action':                         ['Intense', 'Fast-paced'],
  'RPG':                            ['Story-driven', 'Exploration', 'Epic'],
  'Adventure':                      ['Story-driven', 'Exploration', 'Atmospheric'],
  'Shooter':                        ['Intense', 'Fast-paced', 'Competitive'],
  'Strategy':                       ['Tactical', 'Competitive'],
  'Simulation':                     ['Chill', 'Cozy', 'Creative', 'Sandbox'],
  'Puzzle':                         ['Chill', 'Meditative'],
  'Platformer':                     ['Fast-paced', 'Nostalgic'],
  'Racing':                         ['Fast-paced', 'Competitive'],
  'Sports':                         ['Competitive', 'Social'],
  'Fighting':                       ['Intense', 'Competitive'],
  'Indie':                          ['Atmospheric', 'Creative'],
  'Casual':                         ['Chill', 'Humorous'],
  'Arcade':                         ['Fast-paced', 'Nostalgic'],
  'Massively Multiplayer':          ['Social', 'Epic', 'Competitive'],
  'Family':                         ['Cozy', 'Humorous', 'Social'],
  'Board Games':                    ['Chill', 'Tactical', 'Social'],
  'Card':                           ['Tactical', 'Chill'],
  'Educational':                    ['Meditative', 'Creative'],
  // IGDB genre names
  'Role-playing (RPG)':             ['Story-driven', 'Exploration', 'Epic'],
  'Platform':                       ['Fast-paced', 'Nostalgic'],
  'Simulator':                      ['Chill', 'Cozy', 'Creative', 'Sandbox'],
  'Real Time Strategy (RTS)':       ['Tactical', 'Competitive'],
  'Turn-based strategy (TBS)':      ['Tactical'],
  'Tactical':                       ['Tactical'],
  "Hack and slash/Beat 'em up":     ['Intense', 'Fast-paced'],
  'Music':                          ['Meditative', 'Chill'],
  'Visual Novel':                   ['Story-driven', 'Atmospheric'],
  'Card & Board Game':              ['Chill', 'Tactical', 'Social'],
  'MOBA':                           ['Competitive', 'Social'],
  'Point-and-click':                ['Story-driven', 'Atmospheric'],
  'Quiz/Trivia':                    ['Chill', 'Social'],
  'Sport':                          ['Competitive', 'Social'],
  'Pinball':                        ['Nostalgic', 'Fast-paced'],
};

const getMoodsFromGenres = genres =>
  [...new Set((genres ?? []).flatMap(g => GENRE_TO_MOODS[g] ?? []))];

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

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="0" y="1" width="3" height="3" rx="0.5" />
      <rect x="5" y="1" width="11" height="3" rx="0.5" />
      <rect x="0" y="6.5" width="3" height="3" rx="0.5" />
      <rect x="5" y="6.5" width="11" height="3" rx="0.5" />
      <rect x="0" y="12" width="3" height="3" rx="0.5" />
      <rect x="5" y="12" width="11" height="3" rx="0.5" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="7" height="7" rx="1" />
      <rect x="9" y="0" width="7" height="7" rx="1" />
      <rect x="0" y="9" width="7" height="7" rx="1" />
      <rect x="9" y="9" width="7" height="7" rx="1" />
    </svg>
  );
}

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
  const [activeRating, setActiveRating] = useState('');
  const [activeSort, setActiveSort] = useState('status');
  const [activeTag, setActiveTag] = useState('');
  const [activeMood, setActiveMood] = useState('');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('library_view') || 'list');
  const [removeError, setRemoveError] = useState(null);

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

  const fetchGames = useCallback((status, platform, genre) => {
    setLoading(true);
    setError(null);
    const params = {};
    if (status !== 'All') params.status = status;
    if (platform) params.platform = platform;
    if (genre) params.genre = genre;
    getUserGames(params)
      .then(res => setGames(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Failed to load library.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGames(activeStatus, activePlatform, activeGenre);
  }, [activeStatus, fetchGames, activePlatform, activeGenre]);

  const handleViewChange = mode => {
    setViewMode(mode);
    localStorage.setItem('library_view', mode);
  };

  const handleRemove = async id => {
    try {
      await removeGame(id);
      setGames(prev => prev.filter(g => g.id !== id));
    } catch {
      setRemoveError('Failed to remove game. Please try again.');
      setTimeout(() => setRemoveError(null), 3000);
    }
  };

  const allTags = [...new Set(games.flatMap(g => g.tags ?? []))].sort();
  const allMoods = [...new Set(games.flatMap(g => getMoodsFromGenres(g.genres)))].sort();

  const isFiltered = activeStatus !== 'All' || activePlatform || activeGenre || activeRating || activeSort !== 'status' || activeTag || activeMood;

  const resetFilters = () => {
    setActiveStatus('All');
    setActivePlatform('');
    setActiveGenre('');
    setActiveRating('');
    setActiveSort('status');
    setActiveTag('');
    setActiveMood('');
  };

  const displayedGames = [...games]
    .filter(g => {
      if (activeRating && (g.rating == null || g.rating < Number(activeRating))) return false;
      if (activeTag && !(g.tags ?? []).includes(activeTag)) return false;
      if (activeMood && !getMoodsFromGenres(g.genres).includes(activeMood)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (activeSort) {
        case 'latest':    return new Date(b.dateAdded) - new Date(a.dateAdded);
        case 'oldest':    return new Date(a.dateAdded) - new Date(b.dateAdded);
        case 'rating':    return (b.rating ?? 0) - (a.rating ?? 0);
        case 'az':        return a.gameName.localeCompare(b.gameName);
        case 'za':        return b.gameName.localeCompare(a.gameName);
        default:          return (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      }
    });

  const viewBtnClass = active =>
    active
      ? 'p-1.5 rounded border border-[#f72585] text-[#f72585] bg-[#f7258515] [box-shadow:0_0_6px_#f7258540] transition-[border-color,color,background-color,box-shadow] duration-150'
      : 'p-1.5 rounded border border-transparent text-[#4a5068] hover:text-[#e8e4dc] hover:border-[#2a2d45] transition-[border-color,color,background-color,box-shadow] duration-150';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* Left: title + count */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Library</h1>
          {!loading && (
            <span className="text-xs px-2 py-0.5 rounded bg-[#1e2035] text-[#8891a8] border border-[#2a2d45]">
              {displayedGames.length}
            </span>
          )}
        </div>

        {/* Right: view toggle */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          <button onClick={() => handleViewChange('list')} className={viewBtnClass(viewMode === 'list')} title="List view">
            <ListIcon />
          </button>
          <button onClick={() => handleViewChange('grid')} className={viewBtnClass(viewMode === 'grid')} title="Grid view">
            <GridIcon />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveStatus(tab)}
              className={`text-xs px-3 py-1.5 rounded border transition-[border-color,color,background-color,box-shadow] duration-150 ${
                activeStatus === tab
                  ? tabActiveStyles[tab]
                  : `border-[#2a2d45] text-[#4a5068] ${tabHoverStyles[tab]}`
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Labeled filter row */}
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#4a5068] uppercase tracking-wider">Platform</label>
            <StyledSelect
              value={activePlatform}
              onChange={setActivePlatform}
              disabled={platforms.length === 0}
              options={[{ value: '', label: 'All' }, ...platforms.map(p => ({ value: p, label: p }))]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#4a5068] uppercase tracking-wider">Genre</label>
            <StyledSelect
              value={activeGenre}
              onChange={setActiveGenre}
              disabled={genres.length === 0}
              options={[{ value: '', label: 'All' }, ...genres.map(g => ({ value: g, label: g }))]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#4a5068] uppercase tracking-wider">Tags</label>
            <StyledSelect
              value={activeTag}
              onChange={setActiveTag}
              disabled={allTags.length === 0}
              options={[{ value: '', label: 'All' }, ...allTags.map(t => ({ value: t, label: t }))]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#4a5068] uppercase tracking-wider">Mood</label>
            <StyledSelect
              value={activeMood}
              onChange={setActiveMood}
              disabled={allMoods.length === 0}
              options={[{ value: '', label: 'All' }, ...allMoods.map(m => ({ value: m, label: m }))]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#4a5068] uppercase tracking-wider">Rating</label>
            <StyledSelect
              value={activeRating}
              onChange={setActiveRating}
              options={[{ value: '', label: 'All' }, ...[9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => ({ value: String(n), label: `${n}+` }))]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#4a5068] uppercase tracking-wider">Order By</label>
            <StyledSelect
              alwaysActive
              value={activeSort}
              onChange={setActiveSort}
              options={[
                { value: 'status', label: 'Status' },
                { value: 'latest', label: 'Latest' },
                { value: 'oldest', label: 'Oldest' },
                { value: 'rating', label: 'Rating' },
                { value: 'az', label: 'A → Z' },
                { value: 'za', label: 'Z → A' },
              ]}
            />
          </div>

          {isFiltered && (
            <button
              onClick={resetFilters}
              className="ml-auto self-end text-xs px-3 py-2 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] transition-[border-color,box-shadow,color] duration-150"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      {/* Remove error */}
      {removeError && (
        <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
          {removeError}
        </p>
      )}

      {/* States */}
      {loading && (
        <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
      )}

      {!loading && error && (
        <p className="text-sm text-[#ef4444]">{error}</p>
      )}

      {!loading && !error && displayedGames.length === 0 && (
        <div className="flex items-center justify-center h-48 bg-[#111220] border border-[#1e2035] rounded-lg animate-enter">
          <p className="text-sm text-[#8891a8]">{emptyMessages[activeStatus] ?? 'No games match your filters.'}</p>
        </div>
      )}

      {!loading && !error && displayedGames.length > 0 && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 animate-enter">
            {displayedGames.map(entry => (
              <LibraryGameCard
                key={entry.id}
                entry={entry}
                onRemove={handleRemove}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2 animate-enter">
            {displayedGames.map(entry => (
              <GameListItem
                key={entry.id}
                entry={entry}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
