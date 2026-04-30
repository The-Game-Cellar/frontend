import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById, getByFranchise, getByCollection } from '../services/gameService';
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

function pickBestSeries(gameName, franchises, collections) {
  const fr = (Array.isArray(franchises) ? franchises : []).filter(Boolean).map(n => ({ name: n, kind: 'franchise' }));
  const co = (Array.isArray(collections) ? collections : []).filter(Boolean).map(n => ({ name: n, kind: 'collection' }));
  const all = [...fr, ...co];
  if (all.length === 0) return null;
  const fallback = fr[0] || co[0];
  if (!gameName) return fallback;
  const lower = gameName.toLowerCase();
  const matches = all.filter(c => lower.includes(c.name.toLowerCase()));
  if (matches.length === 0) return fallback;
  return matches.slice().sort((a, b) => b.name.length - a.name.length)[0];
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
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showAddons, setShowAddons] = useState(false);
  const [addons, setAddons] = useState(null);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [addonPreviews, setAddonPreviews] = useState([]);
  const [hoveredAddon, setHoveredAddon] = useState(null);
  const [franchiseGames, setFranchiseGames] = useState([]);
  const [showFranchiseModal, setShowFranchiseModal] = useState(false);
  const [franchiseRowWidth, setFranchiseRowWidth] = useState(0);
  const franchiseRowRef = useRef(null);
  const [similarRowWidth, setSimilarRowWidth] = useState(0);
  const similarRowRef = useRef(null);

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
    setAddons(null);
    setShowAddons(false);
    setAddonsLoading(false);
    setAddonPreviews([]);
    setHoveredAddon(null);
    setFranchiseGames([]);
    setShowFranchiseModal(false);

    Promise.all([
      getGameById(igdbId),
      getUserGames(),
      getSimilar(igdbId, 50),
    ])
      .then(([gameRes, libraryRes, similarRes]) => {
        setGame(gameRes.data);
        const entries = Array.isArray(libraryRes.data) ? libraryRes.data : [];
        const match = entries.find(e => String(e.igdbGameId) === String(igdbId));
        setLibraryEntry(match ?? null);
        setSimilar(Array.isArray(similarRes.data) ? similarRes.data : []);

        const previewTagged = [
          ...(Array.isArray(gameRes.data.expansionIds) ? gameRes.data.expansionIds : []).map(id => ({ id, kind: 'EXPANSION' })),
          ...(Array.isArray(gameRes.data.dlcIds) ? gameRes.data.dlcIds : []).map(id => ({ id, kind: 'DLC' })),
        ];
        if (previewTagged.length > 0) {
          Promise.allSettled(previewTagged.map(t => getGameById(t.id))).then(rs => {
            setAddonPreviews(
              rs
                .map((r, idx) => r.status === 'fulfilled' ? { ...r.value.data, _kind: previewTagged[idx].kind } : null)
                .filter(Boolean)
            );
          });
        }

        const series = pickBestSeries(gameRes.data.name, gameRes.data.franchises, gameRes.data.collections);
        if (series) {
          const fetcher = series.kind === 'collection' ? getByCollection : getByFranchise;
          fetcher(series.name, 50, Number(igdbId))
            .then(res => setFranchiseGames(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
        }
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

  const screenshots = Array.isArray(game?.screenshotUrls) ? game.screenshotUrls : [];
  const videos = Array.isArray(game?.videoIds) ? game.videoIds : [];
  const dlcIds = Array.isArray(game?.dlcIds) ? game.dlcIds : [];
  const expansionIds = Array.isArray(game?.expansionIds) ? game.expansionIds : [];
  const addonCount = dlcIds.length + expansionIds.length;

  const handleOpenAddons = async () => {
    setShowAddons(true);
    if (addons !== null) return;
    setAddonsLoading(true);
    const tagged = [
      ...dlcIds.map(id => ({ id, kind: 'DLC' })),
      ...expansionIds.map(id => ({ id, kind: 'EXPANSION' })),
    ];
    const results = await Promise.allSettled(
      tagged.map(({ id }) => getGameById(id))
    );
    const resolved = results
      .map((r, i) => (r.status === 'fulfilled' ? { ...r.value.data, _kind: tagged[i].kind } : null))
      .filter(Boolean)
      .sort((a, b) => {
        const da = a.released ? Date.parse(a.released) : -Infinity;
        const db = b.released ? Date.parse(b.released) : -Infinity;
        return db - da;
      });
    setAddons(resolved);
    setAddonsLoading(false);
  };

  useEffect(() => {
    if (!showAddons) return;
    const onKey = e => { if (e.key === 'Escape') setShowAddons(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showAddons]);

  useEffect(() => {
    if (!showFranchiseModal) return;
    const onKey = e => { if (e.key === 'Escape') setShowFranchiseModal(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showFranchiseModal]);

  useEffect(() => {
    const el = franchiseRowRef.current;
    if (!el) return;
    setFranchiseRowWidth(el.clientWidth);
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w) setFranchiseRowWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [franchiseGames.length]);

  useEffect(() => {
    const el = similarRowRef.current;
    if (!el) return;
    setSimilarRowWidth(el.clientWidth);
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w) setSimilarRowWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [similar.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = e => {
      if (e.key === 'Escape') setLightboxIndex(null);
      else if (e.key === 'ArrowLeft') setLightboxIndex(i => (i > 0 ? i - 1 : screenshots.length - 1));
      else if (e.key === 'ArrowRight') setLightboxIndex(i => (i < screenshots.length - 1 ? i + 1 : 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, screenshots.length]);

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
  const hasMedia = screenshots.length > 0 || videos.length > 0;

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

      {/* Screenshot lightbox */}
      {lightboxIndex !== null && screenshots[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-enter"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] text-2xl leading-none transition-[color,text-shadow] duration-200"
            aria-label="Close"
          >
            ✕
          </button>
          {screenshots.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i > 0 ? i - 1 : screenshots.length - 1)); }}
                className="absolute left-4 text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] text-4xl leading-none transition-[color,text-shadow] duration-200"
                aria-label="Previous screenshot"
              >
                ‹
              </button>
              <button
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i < screenshots.length - 1 ? i + 1 : 0)); }}
                className="absolute right-4 text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] text-4xl leading-none transition-[color,text-shadow] duration-200"
                aria-label="Next screenshot"
              >
                ›
              </button>
            </>
          )}
          <img
            src={screenshots[lightboxIndex]}
            alt={`${game.name} screenshot ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-lg border border-[#1e2035]"
            onClick={e => e.stopPropagation()}
          />
          {screenshots.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-[#8891a8] bg-[#111220cc] px-2 py-1 rounded">
              {lightboxIndex + 1} / {screenshots.length}
            </span>
          )}
        </div>
      )}

      {/* DLC & Expansions modal */}
      {showAddons && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-enter"
          onClick={() => setShowAddons(false)}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg w-fit max-w-5xl max-h-[85vh] flex flex-col animate-enter"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#1e2035]">
              <div className="space-y-0.5">
                <h2 className="text-lg font-medium text-[#e8e4dc]">DLC & Expansions</h2>
                <p className="text-xs text-[#4a5068] truncate" title={game.name}>{game.name}</p>
              </div>
              <button
                onClick={() => setShowAddons(false)}
                className="text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] text-xl leading-none transition-[color,text-shadow] duration-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              {addonsLoading && (
                <div className="flex items-center justify-center h-32">
                  <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
                </div>
              )}
              {!addonsLoading && addons && addons.length === 0 && (
                <p className="text-sm text-[#8891a8] text-center py-8">No add-ons available in cache.</p>
              )}
              {!addonsLoading && addons && addons.length > 0 && (
                <div className="flex flex-wrap gap-4 justify-center">
                  {addons.map(a => (
                    <div key={a.igdbId} className="relative">
                      <span
                        className="absolute top-2 left-2 z-10 text-[10px] px-1.5 py-0.5 rounded font-medium tracking-wider bg-[#111220] text-[#f59e0b] border border-[#f59e0b] [box-shadow:0_0_4px_#f59e0b]"
                      >
                        {a._kind}
                      </span>
                      <GameCard
                        game={a}
                        onClick={() => { setShowAddons(false); navigate(`/games/${a.igdbId}`); }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Franchise modal */}
      {showFranchiseModal && pickBestSeries(game.name, game.franchises, game.collections) && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-enter"
          onClick={() => setShowFranchiseModal(false)}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg w-fit max-w-5xl max-h-[85vh] flex flex-col animate-enter"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#1e2035]">
              <div className="space-y-0.5">
                <h2 className="text-lg font-medium text-[#e8e4dc]">{pickBestSeries(game.name, game.franchises, game.collections)?.name} series</h2>
                <p className="text-xs text-[#4a5068]">{franchiseGames.length} games</p>
              </div>
              <button
                onClick={() => setShowFranchiseModal(false)}
                className="text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] text-xl leading-none transition-[color,text-shadow] duration-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <div className="flex flex-wrap gap-4 justify-center">
                {franchiseGames.map(g => (
                  <GameCard
                    key={g.igdbId}
                    game={g}
                    onClick={() => { setShowFranchiseModal(false); navigate(`/games/${g.igdbId}`); }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
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

        {/* About + media row — about | screenshot | trailer (each 1/3). About expands to span row when clicked. */}
        {(description || hasMedia) && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {description && (
              <div
                onClick={() => description.length > 300 && setDescExpanded(v => !v)}
                className={`md:row-start-1 md:col-start-1 md:col-span-1 self-start bg-[#111220] border rounded-lg p-5 space-y-3 transition-[border-color,box-shadow] duration-200 ${
                  description.length > 300 ? 'cursor-pointer' : ''
                } ${
                  descExpanded
                    ? 'border-[#f72585] [box-shadow:0_0_15px_#f7258530]'
                    : 'border-[#1e2035] hover:border-[#f72585] hover:[box-shadow:0_0_15px_#f7258530]'
                }`}
              >
                <h2 className="text-lg font-medium text-[#e8e4dc]">About</h2>
                <p className={`text-sm text-[#8891a8] leading-relaxed ${descExpanded ? '' : 'line-clamp-[8]'}`}>
                  {description}
                </p>
              </div>
            )}
            {screenshots.length > 0 && (
              <div className="order-2 md:order-none md:row-start-1 md:col-start-2 md:col-span-1">
                <button
                  onClick={() => setLightboxIndex(0)}
                  className="group relative w-full aspect-video rounded-lg overflow-hidden border border-[#1e2035] hover:border-[#f72585] hover:[box-shadow:0_0_15px_#f7258530] active:scale-[0.98] transition-[border-color,box-shadow,transform] duration-200"
                  aria-label={screenshots.length > 1 ? `View ${screenshots.length} screenshots` : 'View screenshot'}
                >
                  <img
                    src={screenshots[0]}
                    alt={`${game.name} screenshot 1`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm text-[#e8e4dc] bg-[#111220cc] backdrop-blur-sm border border-[#f72585] [box-shadow:0_0_12px_#f7258540] px-3 py-1.5 rounded">
                      {screenshots.length > 1 ? `View all ${screenshots.length} screenshots` : 'View screenshot'}
                    </span>
                  </span>
                  {screenshots.length > 1 && (
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-xs text-[#e8e4dc] bg-[#111220cc] backdrop-blur-sm border border-[#3a3d58] px-2.5 py-1 rounded group-hover:opacity-0 transition-opacity duration-200">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                      <span className="font-medium">1 / {screenshots.length}</span>
                    </span>
                  )}
                </button>
              </div>
            )}
            {videos[0] && (
              <div className="order-1 md:order-none md:row-start-1 md:col-start-3 md:col-span-1">
                <div className="relative aspect-video rounded-lg overflow-hidden border border-[#1e2035] bg-[#111220]">
                  <iframe
                    src={`https://www.youtube.com/embed/${videos[0]}`}
                    title={`${game.name} trailer`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* DLC & Expansions */}
        {addonCount > 0 && addonPreviews.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-[#e8e4dc]">DLC & Expansions</h2>
                <button
                  onClick={handleOpenAddons}
                  className="text-xs text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-[color,text-shadow] duration-200 flex-shrink-0"
                >
                  View all {addonCount} →
                </button>
              </div>
              <div className={`relative rounded-lg border border-[#1e2035] bg-[#111220] ${
                addonPreviews.length === 1 ? 'w-[42.1875%] aspect-[3/4]' :
                addonPreviews.length === 2 ? 'w-[84.375%] aspect-[3/2]' :
                'w-full aspect-video'
              }`}>
                {(() => {
                  const stack = addonPreviews;
                  const n = stack.length;
                  const CARD_FRAC = n === 1 ? 1 : n === 2 ? 0.5 : 27 / 64;
                  return stack.map((p, i) => {
                    const isTop = i === 0;
                    const isHovered = hoveredAddon === i;
                    const isBright = isHovered || (hoveredAddon === null && isTop);
                    const leftPct = n === 1
                      ? ((1 - CARD_FRAC) / 2) * 100
                      : (i * (1 - CARD_FRAC) / (n - 1)) * 100;
                    const zIndex = isHovered
                      ? 100
                      : hoveredAddon !== null
                        ? n - Math.abs(i - hoveredAddon)
                        : n - i;
                    const isFirst = i === 0;
                    const isLast = i === n - 1;
                    return (
                      <button
                        key={p.igdbId}
                        onClick={() => navigate(`/games/${p.igdbId}`)}
                        onMouseEnter={() => setHoveredAddon(i)}
                        title={p.name}
                        aria-label={p.name}
                        style={{
                          left: `${leftPct}%`,
                          zIndex,
                        }}
                        className={`absolute top-0 h-full aspect-[3/4] border-l border-r border-[#0a0b14] bg-[#1e2035] overflow-hidden cursor-pointer transition-[transform,filter,box-shadow] duration-200 ${
                          isFirst ? 'rounded-l-lg' : ''
                        } ${
                          isLast ? 'rounded-r-lg' : ''
                        } ${
                          isBright ? '' : 'brightness-50'
                        } ${
                          isHovered ? 'scale-[1.04] [box-shadow:0_0_18px_#f7258560,0_0_2px_#f72585]' : ''
                        }`}
                      >
                        {(p.coverImageUrl || p.backgroundImage) ? (
                          <img
                            src={p.coverImageUrl || p.backgroundImage}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[#4a5068] text-xs">No cover</span>
                          </div>
                        )}
                        {p._kind && (
                          <span className="absolute top-1.5 left-1.5 text-[9px] px-1 py-0.5 rounded font-medium tracking-wider bg-[#111220cc] backdrop-blur-sm text-[#f59e0b] border border-[#f59e0b] [box-shadow:0_0_4px_#f59e0b]">
                            {p._kind}
                          </span>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </section>
        )}

        {/* More from franchise */}
        {franchiseGames.length > 0 && pickBestSeries(game.name, game.franchises, game.collections) && (() => {
          const CARD_W = 176; // w-44
          const GAP = 12;     // gap-3
          const SLOT = CARD_W + GAP;
          const fits = Math.max(1, Math.floor((franchiseRowWidth + GAP) / SLOT));
          const needViewAll = franchiseGames.length > fits;
          const visible = needViewAll ? franchiseGames.slice(0, fits) : franchiseGames;
          const dynamicGap = fits > 1 && franchiseRowWidth > 0
            ? Math.max(GAP, (franchiseRowWidth - fits * CARD_W) / (fits - 1))
            : GAP;
          return (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-[#e8e4dc]">{pickBestSeries(game.name, game.franchises, game.collections)?.name} series</h2>
                {needViewAll && (
                  <button
                    onClick={() => setShowFranchiseModal(true)}
                    className="text-xs text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-[color,text-shadow] duration-200 flex-shrink-0"
                  >
                    View all {franchiseGames.length} →
                  </button>
                )}
              </div>
              <div
                ref={franchiseRowRef}
                className="flex overflow-hidden"
                style={{ gap: `${dynamicGap}px` }}
              >
                {visible.map(g => (
                  <GameCard
                    key={g.igdbId}
                    game={g}
                    onClick={() => navigate(`/games/${g.igdbId}`)}
                  />
                ))}
              </div>
            </section>
          );
        })()}

        {/* Similar games */}
        {similar.length > 0 && (() => {
          const CARD_W = 176;
          const GAP = 12;
          const SLOT = CARD_W + GAP;
          const fits = Math.max(1, Math.floor((similarRowWidth + GAP) / SLOT));
          const visible = similar.slice(0, fits);
          const dynamicGap = fits > 1 && similarRowWidth > 0
            ? Math.max(GAP, (similarRowWidth - fits * CARD_W) / (fits - 1))
            : GAP;
          return (
            <section className="space-y-3">
              <h2 className="text-lg font-medium text-[#e8e4dc]">Similar Games</h2>
              <div
                ref={similarRowRef}
                className="flex overflow-hidden"
                style={{ gap: `${dynamicGap}px` }}
              >
                {visible.map(g => (
                  <GameCard
                    key={g.igdbId}
                    game={g}
                    onClick={() => navigate(`/games/${g.igdbId}`)}
                  />
                ))}
              </div>
            </section>
          );
        })()}
      </div>
    </>
  );
}
