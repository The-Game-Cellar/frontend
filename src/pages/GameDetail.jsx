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
  const { rawgId } = useParams();
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

  const fetchLibraryEntry = () =>
    getUserGames()
      .then(res => {
        const entries = Array.isArray(res.data) ? res.data : [];
        const match = entries.find(e => String(e.rawgGameId) === String(rawgId));
        setLibraryEntry(match ?? null);
      })
      .catch(() => {});

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      getGameById(rawgId),
      getUserGames(),
      getSimilar(rawgId, 8),
    ])
      .then(([gameRes, libraryRes, similarRes]) => {
        setGame(gameRes.data);
        const entries = Array.isArray(libraryRes.data) ? libraryRes.data : [];
        const match = entries.find(e => String(e.rawgGameId) === String(rawgId));
        setLibraryEntry(match ?? null);
        setSimilar(Array.isArray(similarRes.data) ? similarRes.data : []);
      })
      .catch(() => setError('Failed to load game.'))
      .finally(() => setLoading(false));
  }, [rawgId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async newStatus => {
    if (!libraryEntry) return;
    setUpdating(true);
    try {
      await updateGame(libraryEntry.id, { status: newStatus });
      setLibraryEntry(prev => ({ ...prev, status: newStatus }));
    } catch {
      // silent
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
      // silent
    }
  };

  const handleRemove = async () => {
    if (!libraryEntry) return;
    try {
      await removeGame(libraryEntry.id);
      setLibraryEntry(null);
      setShowRemoveConfirm(false);
    } catch {
      // silent
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

      <div className="space-y-8">
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
                <div className="flex flex-wrap items-center gap-2">
                  {game.rating != null && (
                    <span className="text-xs text-[#f59e0b] [text-shadow:0_0_6px_#f59e0b60]">★ {Number(game.rating).toFixed(1)}</span>
                  )}
                  {game.genres?.map(g => (
                    <span key={g} className="text-xs px-2 py-0.5 rounded bg-[#1e2035] text-[#8891a8] border border-[#3a3d58]">
                      {g}
                    </span>
                  ))}
                </div>
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
                    className="px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] transition-all duration-200"
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
                        className={`text-xs px-2 py-0.5 rounded border font-medium transition-all duration-200 disabled:opacity-40 ${statusStyles[libraryEntry.status]}`}
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
                              className={`text-xs px-2 py-0.5 rounded border font-medium transition-all duration-200 disabled:opacity-40 ${statusStyles[s]}`}
                              onMouseEnter={e => { e.currentTarget.style.boxShadow = statusGlowShadow[s]; }}
                              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Remove */}
                    {!showRemoveConfirm ? (
                      <button
                        onClick={() => setShowRemoveConfirm(true)}
                        className="px-3 py-1.5 bg-[#ef444415] border border-[#ef4444] text-[#ef4444] text-xs rounded [box-shadow:0_0_8px_#ef444440,0_0_20px_#ef444420] hover:bg-[#ef444425] hover:[box-shadow:0_0_12px_#ef444450,0_0_25px_#ef444430] transition-all duration-200"
                      >
                        Remove
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#8891a8]">Remove from library?</span>
                        <button
                          onClick={handleRemove}
                          className="px-3 py-1.5 bg-[#ef444415] border border-[#ef4444] text-[#ef4444] text-xs rounded hover:bg-[#ef444425] transition-all duration-200"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => setShowRemoveConfirm(false)}
                          className="px-3 py-1.5 border border-[#2a2d45] text-[#8891a8] text-xs rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Rating */}
              {showRating && (
                <div className="mt-auto space-y-1.5">
                  <p className="text-xs text-[#8891a8] uppercase tracking-wider">Your Rating</p>
                  <RatingWidget value={libraryEntry.rating} onChange={handleRatingChange} />
                </div>
              )}
            </div>

            {/* Cover — top on mobile, right 1/3 on desktop */}
            <div className="md:col-span-1">
              {game.backgroundImage ? (
                <img
                  src={game.backgroundImage}
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
            className={`bg-[#111220] border rounded-lg p-5 space-y-3 max-w-3xl transition-all duration-200 ${
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
                  key={g.rawgId}
                  game={g}
                  onClick={() => navigate(`/games/${g.rawgId}`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
