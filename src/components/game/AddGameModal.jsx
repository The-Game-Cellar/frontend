import { useState, useEffect } from 'react';
import { getUserPlatforms, addGame } from '../../services/libraryService';
import RatingWidget from './RatingWidget';

const STATUSES = ['BACKLOG', 'PLAYING', 'COMPLETED', 'WISHLIST', 'DROPPED'];

const statusStyles = {
  PLAYING:   'bg-[#22c55e20] text-[#22c55e] border-[#22c55e40]',
  BACKLOG:   'bg-[#2563eb20] text-[#2563eb] border-[#2563eb40]',
  COMPLETED: 'bg-[#a855f720] text-[#a855f7] border-[#a855f740]',
  DROPPED:   'bg-[#ef444420] text-[#ef4444] border-[#ef444440]',
  WISHLIST:  'bg-[#f59e0b20] text-[#f59e0b] border-[#f59e0b40]',
};

export default function AddGameModal({ game, onClose, onAdded }) {
  const [status, setStatus] = useState('BACKLOG');
  const [platform, setPlatform] = useState('');
  const [rating, setRating] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUserPlatforms()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setPlatforms(data);
        if (data.length > 0) {
          const first = data[0];
          setPlatform(first.platformName ?? first.platform_name ?? first.name ?? first);
        }
      })
      .catch(() => {});
  }, []);

  const showRating = status === 'PLAYING' || status === 'COMPLETED';

  const handleSubmit = async () => {
    if (!platform) return;
    setLoading(true);
    setError(null);
    try {
      await addGame({
        rawgGameId: game.rawgId,
        gameName: game.name,
        status,
        platform,
        rating: showRating ? rating : null,
      });
      onAdded?.();
      onClose();
    } catch {
      setError('Failed to add game. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#e8e4dc]">Add to Library</h2>
            <p className="text-xs text-[#8891a8] mt-0.5 truncate max-w-[220px]">{game.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#4a5068] hover:text-[#e8e4dc] transition-colors text-xl leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-xs text-[#4a5068] uppercase tracking-wider">Status</label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { setStatus(s); if (s === 'WISHLIST' || s === 'DROPPED') setRating(null); }}
                className={`text-xs px-2 py-1 rounded border font-medium transition-all duration-150 ${
                  status === s
                    ? statusStyles[s]
                    : 'bg-transparent border-[#2a2d45] text-[#8891a8] hover:border-[#3a3d58] hover:text-[#e8e4dc]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div className="space-y-2">
          <label className="text-xs text-[#4a5068] uppercase tracking-wider">Platform</label>
          {platforms.length > 0 ? (
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="w-full bg-[#0a0b14] border border-[#2a2d45] rounded px-3 py-2 text-sm text-[#e8e4dc] focus:border-[#f72585] focus:outline-none transition-colors"
            >
              {platforms.map((p, i) => {
                const name = p.platformName ?? p.platform_name ?? p.name ?? p;
                return <option key={i} value={name}>{name}</option>;
              })}
            </select>
          ) : (
            <input
              type="text"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              placeholder="e.g. PC, PlayStation 5"
              className="w-full bg-[#0a0b14] border border-[#2a2d45] rounded px-3 py-2 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none transition-colors"
            />
          )}
        </div>

        {/* Rating (optional, only for PLAYING / COMPLETED) */}
        {showRating && (
          <div className="space-y-2">
            <label className="text-xs text-[#4a5068] uppercase tracking-wider">Rating (optional)</label>
            <RatingWidget value={rating} onChange={setRating} />
          </div>
        )}

        {error && <p className="text-xs text-[#ef4444]">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSubmit}
            disabled={loading || !platform}
            className="flex-1 px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '[ ADDING... ]' : 'Add to Library'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#2a2d45] text-[#8891a8] text-sm rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
