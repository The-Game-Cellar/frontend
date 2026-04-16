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
  BACKLOG:   'bg-[#8891a820] text-[#8891a8] border-[#8891a840]',
  COMPLETED: 'bg-[#a855f720] text-[#a855f7] border-[#a855f740]',
  DROPPED:   'bg-[#ef444420] text-[#ef4444] border-[#ef444440]',
  WISHLIST:  'bg-[#f59e0b20] text-[#f59e0b] border-[#f59e0b40]',
};

const ALL_STATUSES = ['PLAYING', 'BACKLOG', 'COMPLETED', 'DROPPED', 'WISHLIST'];

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
        <div className="relative rounded-lg overflow-hidden bg-[#111220] border border-[#1e2035]">
          {/* Blurred bg */}
          {game.backgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center scale-110 opacity-15 blur-sm"
              style={{ backgroundImage: `url(${game.backgroundImage})` }}
            />
          )}

          <div className="relative flex flex-col-reverse md:grid md:grid-cols-3 gap-8 p-6">
            {/* Info — below cover on mobile, left 2/3 on desktop */}
            <div className="md:col-span-2 space-y-5">
              {/* Title + meta */}
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">{game.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {game.rating != null && (
                    <span className="text-xs text-[#8891a8]">★ {Number(game.rating).toFixed(1)}</span>
                  )}
                  {game.genres?.map(g => (
                    <span key={g} className="text-xs px-2 py-0.5 rounded bg-[#1e2035] text-[#8891a8] border border-[#2a2d45]">
                      {g}
                    </span>
                  ))}
                </div>
                {game.platforms?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {game.platforms.map(p => (
                      <span key={p} className="text-xs text-[#4a5068]">{p}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Library actions */}
              <div className="flex flex-wrap items-center gap-3">
                {!libraryEntry ? (
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] transition-all duration-200"
                  >
                    + Add to Library
                  </button>
                ) : (
                  <>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${statusStyles[libraryEntry.status]}`}>
                      {libraryEntry.status}
                    </span>

                    {/* Change status dropdown */}
                    <div className="relative z-20">
                      <button
                        onClick={() => setShowStatusMenu(v => !v)}
                        className="px-3 py-1.5 border border-[#1e2035] text-[#8891a8] text-xs rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-colors"
                      >
                        Change Status ▾
                      </button>
                      {showStatusMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-[#111220] border border-[#1e2035] rounded shadow-xl min-w-[140px]">
                          {ALL_STATUSES.filter(s => s !== libraryEntry.status).map(s => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(s)}
                              disabled={updating}
                              className="w-full text-left px-3 py-2 text-xs text-[#8891a8] hover:text-[#e8e4dc] hover:bg-[#181a2e] transition-colors disabled:opacity-40"
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
                        className="text-xs text-[#4a5068] hover:text-[#ef4444] transition-colors"
                      >
                        Remove
                      </button>
                    ) : (
                      <span className="flex items-center gap-2 text-xs">
                        <span className="text-[#8891a8]">Remove?</span>
                        <button onClick={handleRemove} className="text-[#ef4444] hover:underline">Yes</button>
                        <button onClick={() => setShowRemoveConfirm(false)} className="text-[#4a5068] hover:underline">No</button>
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Rating */}
              {showRating && (
                <div className="space-y-1.5">
                  <p className="text-xs text-[#4a5068] uppercase tracking-wider">Your Rating</p>
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

        {/* Description */}
        {description && (
          <section className="space-y-2">
            <h2 className="text-lg font-medium text-[#e8e4dc]">About</h2>
            <p className="text-sm text-[#8891a8] leading-relaxed max-w-3xl">{description}</p>
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
