import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById } from '../services/gameService';
import { getUserGames, updateGame, removeGame } from '../services/libraryService';
import { getSimilar } from '../services/recommendationService';
import GameCard from '../components/common/GameCard';
import AddGameModal from '../components/game/AddGameModal';
import RatingWidget from '../components/game/RatingWidget';

const statusStyles = {
  PLAYING:   'bg-[#22c55e20] text-[#22c55e] border-[#22c55e40]',
  BACKLOG:   'bg-[#2563eb20] text-[#2563eb] border-[#2563eb40]',
  COMPLETED: 'bg-[#a855f720] text-[#a855f7] border-[#a855f740]',
  DROPPED:   'bg-[#ef444420] text-[#ef4444] border-[#ef444440]',
  WISHLIST:  'bg-[#f59e0b20] text-[#f59e0b] border-[#f59e0b40]',
  DUSTY:     'bg-[#8891a820] text-[#8891a8] border-[#8891a840]',
};

const statusGlowShadow = {
  PLAYING:   '0 0 8px #22c55e60',
  BACKLOG:   '0 0 8px #2563eb60',
  COMPLETED: '0 0 8px #a855f760',
  DROPPED:   '0 0 8px #ef444460',
  WISHLIST:  '0 0 8px #f59e0b60',
  DUSTY:     '0 0 8px #8891a860',
};

const statusInsetGlow = {
  PLAYING:   'inset 0 0 12px #22c55e30',
  BACKLOG:   'inset 0 0 12px #2563eb30',
  COMPLETED: 'inset 0 0 12px #a855f730',
  DROPPED:   'inset 0 0 12px #ef444430',
  WISHLIST:  'inset 0 0 12px #f59e0b30',
  DUSTY:     'inset 0 0 12px #8891a830',
};

const ALL_STATUSES = ['PLAYING', 'BACKLOG', 'WISHLIST', 'COMPLETED', 'DROPPED'];

function formatReleaseDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

export default function GameDetail() {
  const { igdbId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [libraryEntry, setLibraryEntry] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [actionError, setActionError] = useState(null);

  const showActionError = msg => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 3000);
  };

  const fetchLibraryEntry = () =>
    getUserGames()
      .then(res => {
        const entries = Array.isArray(res.data) ? res.data : [];
        const match = entries.find(e => String(e.igdbGameId) === String(igdbId));
        setLibraryEntry(match ?? null);
      })
      .catch(() => {});

  useEffect(() => {
    if (!/^\d+$/.test(String(igdbId)) || Number(igdbId) < 1) {
      setError('Invalid game id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      getGameById(igdbId),
      getUserGames(),
      getSimilar(igdbId, 8),
    ])
      .then(([gameRes, libraryRes, similarRes]) => {
        setGame(gameRes.data);
        const entries = Array.isArray(libraryRes.data) ? libraryRes.data : [];
        const match = entries.find(e => String(e.igdbGameId) === String(igdbId));
        setLibraryEntry(match ?? null);
        setSimilar(Array.isArray(similarRes.data) ? similarRes.data : []);
      })
      .catch(() => setError('Failed to load game.'))
      .finally(() => setLoading(false));
  }, [igdbId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async newStatus => {
    if (!libraryEntry) return;
    setUpdating(true);
    try {
      await updateGame(libraryEntry.id, { status: newStatus });
      setLibraryEntry(prev => ({ ...prev, status: newStatus }));
    } catch {
      showActionError('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
      setShowStatusMenu(false);
    }
  };

  const handleRatingChange = async rating => {
    if (!libraryEntry) return;
    try {
      await updateGame(libraryEntry.id, { rating });
      setLibraryEntry(prev => ({ ...prev, rating }));
    } catch {
      showActionError('Failed to save rating. Please try again.');
    }
  };

  const handleRemove = async () => {
    if (!libraryEntry) return;
    try {
      await removeGame(libraryEntry.id);
      setLibraryEntry(null);
      setShowRemoveConfirm(false);
    } catch {
      setShowRemoveConfirm(false);
      showActionError('Failed to remove game. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#ef4444]">{error ?? 'Game not found.'}</p>
      </div>
    );
  }

  const showRating = libraryEntry && libraryEntry.status !== 'WISHLIST';
  const description = stripHtml(game.description);

  return (
    <>
      {showModal && (
        <AddGameModal
          game={game}
          onClose={() => setShowModal(false)}
          onAdded={fetchLibraryEntry}
        />
      )}

      {/* Close status menu on outside click */}
      {showStatusMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
      )}

      {/* Remove confirm modal */}
      {showRemoveConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-enter"
          onClick={() => setShowRemoveConfirm(false)}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-xs space-y-4 animate-enter"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#e8e4dc]">Remove from library?</p>
              <p className="text-xs text-[#4a5068] truncate" title={game.name}>{game.name}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="px-4 py-1.5 border border-[#2a2d45] text-[#8891a8] text-xs rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                className="px-4 py-1.5 bg-[#ef444410] border border-[#ef4444] text-[#ef4444] text-xs rounded [box-shadow:0_0_8px_#ef444440,0_0_20px_#ef444420] hover:bg-[#ef444420] hover:[box-shadow:0_0_12px_#ef444450,0_0_25px_#ef444430] transition-[background-color,box-shadow] duration-200"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8 animate-enter">
        {actionError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            {actionError}
          </p>
        )}

        {/* Hero */}
        <div className="relative rounded-lg bg-[#111220] border border-[#1e2035]">
          {/* Blurred bg — clipped inside its own wrapper so absolute children aren't affected */}
          {game.backgroundImage && (
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center scale-110 opacity-15 blur-sm"
                style={{ backgroundImage: `url(${game.backgroundImage})` }}
              />
            </div>
          )}

          <div className="relative flex flex-col-reverse md:grid md:grid-cols-3 gap-8 p-6">
            {/* Info — below cover on mobile, left 2/3 on desktop */}
            <div className="md:col-span-2 flex flex-col gap-5">
              {/* Title + meta */}
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">{game.name}</h1>
                {formatReleaseDate(game.released) && (
                  <p className="text-xs text-[#8891a8]">{formatReleaseDate(game.released)}</p>
                )}
                {game.genres?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {game.genres.map(g => (
                      <span key={g} className="text-xs px-2 py-0.5 rounded bg-[#1e2035] text-[#8891a8] border border-[#3a3d58]">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                {game.platforms?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {game.platforms.map(p => (
                      <span key={p} className="text-xs px-2 py-0.5 rounded bg-[#1e2035] text-[#8891a8] border border-[#3a3d58]">{p}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Library actions */}
              <div className="relative z-30 flex flex-wrap items-center gap-3">
                {!libraryEntry ? (
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] active:scale-[0.97] transition-[box-shadow,transform] duration-200"
                  >
                    + Add to Library
                  </button>
                ) : (
                  <>
                    {/* Status badge — dropdown opens below */}
                    <div className="relative z-20">
                      <button
                        onClick={() => setShowStatusMenu(v => !v)}
                        disabled={updating}
                        className={`text-xs px-2 py-0.5 rounded border font-medium transition-[background-color,color,border-color,box-shadow] duration-200 disabled:opacity-40 ${statusStyles[libraryEntry.status]}`}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = statusGlowShadow[libraryEntry.status]; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; }}
                      >
                        {libraryEntry.status} ▾
                      </button>

                      {showStatusMenu && (
                        <div className="absolute top-full left-0 mt-1 flex flex-col gap-1 z-20">
                          {ALL_STATUSES.filter(s => s !== libraryEntry.status).map(s => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(s)}
                              disabled={updating}
                              className={`text-xs px-2 py-0.5 rounded border font-medium transition-[background-color,color,border-color,box-shadow] duration-200 disabled:opacity-40 ${statusStyles[s]}`}
                              onMouseEnter={e => { e.currentTarget.style.boxShadow = statusGlowShadow[s]; }}
                              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Remove — opens confirm modal */}
                    <button
                      onClick={() => setShowRemoveConfirm(true)}
                      className="px-3 py-1.5 bg-[#ef444415] border border-[#ef4444] text-[#ef4444] text-xs rounded [box-shadow:0_0_8px_#ef444440,0_0_20px_#ef444420] hover:bg-[#ef444425] hover:[box-shadow:0_0_16px_#ef4444,0_0_36px_#ef444460] transition-[background-color,box-shadow] duration-200"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>

              {/* Rating cluster — IGDB scores + user's rating */}
              {(game.rating != null || game.totalRating != null || showRating) && (
                <div className="mt-auto space-y-3">
                  {/* TEMP: critic icon picker — remove after user picks */}
                  {game.rating != null && (
                    <div className="space-y-1.5 border border-dashed border-[#3a3d58] rounded p-2">
                      <p className="text-[10px] text-[#8891a8] uppercase tracking-wider">Pick critic icon (1–8)</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { n: 1, label: 'Medal', svg: <><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></> },
                          { n: 2, label: 'Trophy', svg: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></> },
                          { n: 3, label: 'Crown', svg: <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" /> },
                          { n: 4, label: 'Shield', svg: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></> },
                          { n: 5, label: 'Gavel', svg: <><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0a2.12 2.12 0 0 1 0-3L11 10" /><path d="m16 16 6-6" /><path d="m8 8 6-6" /><path d="m9 7 8 8" /><path d="m21 11-8-8" /></> },
                          { n: 6, label: 'Newspaper', svg: <><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" /></> },
                          { n: 7, label: 'Quill', svg: <><path d="M12 19c0-7 7-11 9-11-2 7-7 11-9 11Z" /><path d="M12 19c0-7-7-11-9-11 2 7 7 11 9 11Z" /><path d="M12 19v3" /></> },
                          { n: 8, label: 'Sparkle', svg: <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /> },
                        ].map(opt => (
                          <span
                            key={opt.n}
                            title={opt.label}
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-[#f59e0b] bg-[#f59e0b30] [box-shadow:0_0_4px_#f59e0b80] text-[#f59e0b] [text-shadow:0_0_6px_#f59e0b]"
                          >
                            <span className="text-[10px] text-[#8891a8] [text-shadow:none]">{opt.n}</span>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              {opt.svg}
                            </svg>
                            <span className="font-medium">★ {Number(game.rating).toFixed(1)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(game.rating != null || game.totalRating != null) && (
                    <div className="flex flex-wrap gap-2">
                      {game.rating != null && (
                        <span
                          title="Critic score"
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-[#f59e0b] bg-[#f59e0b30] [box-shadow:0_0_4px_#f59e0b80] text-[#f59e0b] [text-shadow:0_0_6px_#f59e0b]"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="8" r="6" />
                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                          </svg>
                          <span className="font-medium">★ {Number(game.rating).toFixed(1)}</span>
                        </span>
                      )}
                      {game.totalRating != null && (
                        <span
                          title="User score"
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-[#f72585] bg-[#f7258530] [box-shadow:0_0_4px_#f7258580] text-[#f72585] [text-shadow:0_0_6px_#f72585]"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          <span className="font-medium">★ {Number(game.totalRating).toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                  )}
                  {showRating && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-[#8891a8] uppercase tracking-wider">Your Rating</p>
                      <RatingWidget value={libraryEntry.rating} onChange={handleRatingChange} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cover — top on mobile, right 1/3 on desktop */}
            <div className="md:col-span-1">
              {(game.coverImageUrl || game.backgroundImage) ? (
                <img
                  src={game.coverImageUrl || game.backgroundImage}
                  alt={game.name}
                  className="w-full rounded-lg border border-[#1e2035]"
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-[#1e2035] rounded-lg flex items-center justify-center">
                  <span className="text-[#4a5068] text-xs">No cover</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* About */}
        {description && (
          <section
            onClick={() => description.length > 300 && setDescExpanded(v => !v)}
            className={`bg-[#111220] border rounded-lg p-5 space-y-3 max-w-3xl transition-[border-color,box-shadow] duration-200 ${
              description.length > 300 ? 'cursor-pointer' : ''
            } ${
              descExpanded
                ? 'border-[#f72585] [box-shadow:0_0_15px_#f7258530]'
                : 'border-[#1e2035] hover:border-[#f72585] hover:[box-shadow:0_0_15px_#f7258530]'
            }`}
          >
            <h2 className="text-lg font-medium text-[#e8e4dc]">About</h2>
            <p className={descExpanded
              ? 'text-sm text-[#8891a8] leading-relaxed'
              : 'text-sm text-[#8891a8] leading-relaxed line-clamp-4'
            }>
              {description}
            </p>
          </section>
        )}

        {/* Similar games */}
        {similar.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-medium text-[#e8e4dc]">Similar Games</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {similar.map(g => (
                <GameCard
                  key={g.igdbId}
                  game={g}
                  onClick={() => navigate(`/games/${g.igdbId}`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
