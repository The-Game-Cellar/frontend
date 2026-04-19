import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getStats, getUserPlatforms, addPlatform } from '../services/libraryService';

const ALL_PLATFORMS = [
  'PC', 'PlayStation 5', 'PlayStation 4',
  'Xbox Series S/X', 'Xbox One', 'Nintendo Switch',
];

const STATUSES = [
  { key: 'PLAYING',   label: 'Playing',   color: '#22c55e', glow: '#22c55e40' },
  { key: 'BACKLOG',   label: 'Backlog',   color: '#2563eb', glow: '#2563eb40' },
  { key: 'COMPLETED', label: 'Completed', color: '#a855f7', glow: '#a855f740' },
  { key: 'DROPPED',   label: 'Dropped',   color: '#ef4444', glow: '#ef444440' },
  { key: 'WISHLIST',  label: 'Wishlist',  color: '#f59e0b', glow: '#f59e0b40' },
];

export default function Profile() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [adding, setAdding] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  useEffect(() => {
    getStats().then(r => setStats(r.data)).catch(() => {});
    getUserPlatforms().then(r => setPlatforms(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const ownedNames = platforms.map(p => p.platformName);
  const available = ALL_PLATFORMS.filter(p => !ownedNames.includes(p));
  const totalGames = stats
    ? Object.values(stats.byStatus ?? {}).reduce((sum, n) => sum + n, 0)
    : null;

  async function handleAddPlatform(name) {
    setAdding(true);
    try {
      await addPlatform({ platformName: name, isPrimary: false });
      const res = await getUserPlatforms();
      setPlatforms(Array.isArray(res.data) ? res.data : []);
    } catch {} finally {
      setAdding(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Profile</h1>

      {/* Account */}
      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-3">
        <p className="text-xs text-[#8891a8] uppercase tracking-wider">Account</p>
        <p className="text-sm text-[#e8e4dc]">{email ?? '—'}</p>
        {totalGames !== null && (
          <div className="pt-3 border-t border-[#1e2035] flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-[#f72585] [text-shadow:0_0_12px_#f7258560]">
              {totalGames}
            </span>
            <span className="text-xs text-[#8891a8]">games in library</span>
          </div>
        )}
      </section>

      {/* Library stats */}
      {stats && (
        <section className="space-y-3">
          <p className="text-xs text-[#8891a8] uppercase tracking-wider">Library</p>
          <div className="grid grid-cols-3 gap-3">
            {STATUSES.map(({ key, label, color, glow }) => {
              const count = stats.byStatus?.[key] ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => navigate(`/library?status=${key}`)}
                  className="bg-[#111220] border border-[#2a2d45] rounded-lg p-4 text-center space-y-1 transition-all duration-200 hover:border-current hover:scale-[1.02]"
                  style={{ '--glow': glow }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.boxShadow = `0 0 12px ${glow}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <p className="text-2xl font-semibold" style={{ color, textShadow: `0 0 10px ${glow}` }}>
                    {count}
                  </p>
                  <p className="text-xs text-[#8891a8]">{label}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Platforms */}
      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-4">
        <p className="text-xs text-[#8891a8] uppercase tracking-wider">Platforms</p>
        {ownedNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {ownedNames.map(name => (
              <span key={name} className="text-xs px-3 py-1.5 rounded border bg-[#f7258510] border-[#f7258560] text-[#f72585]">
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#4a5068]">No platforms added yet.</p>
        )}
        {available.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-[#1e2035]">
            <p className="text-xs text-[#8891a8]">Add platform</p>
            <div className="flex flex-wrap gap-2">
              {available.map(name => (
                <button
                  key={name}
                  onClick={() => handleAddPlatform(name)}
                  disabled={adding}
                  className="text-xs px-3 py-1.5 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] disabled:opacity-40 transition-colors"
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Sign out */}
      <button
        onClick={() => setConfirmOpen(true)}
        className="px-4 py-2 bg-[#ef444410] border border-[#ef4444] text-[#ef4444] text-xs rounded [box-shadow:0_0_8px_#ef444440,0_0_20px_#ef444420] hover:bg-[#ef444420] hover:[box-shadow:0_0_12px_#ef444450,0_0_25px_#ef444430] transition-all duration-200"
      >
        Sign out
      </button>

      {/* Logout confirm modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-xs space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#e8e4dc]">Sign out?</p>
              <p className="text-xs text-[#4a5068]">You will be returned to the login page.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-1.5 border border-[#2a2d45] text-[#8891a8] text-xs rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 bg-[#ef444410] border border-[#ef4444] text-[#ef4444] text-xs rounded [box-shadow:0_0_8px_#ef444440,0_0_20px_#ef444420] hover:bg-[#ef444420] hover:[box-shadow:0_0_12px_#ef444450,0_0_25px_#ef444430] transition-all duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
