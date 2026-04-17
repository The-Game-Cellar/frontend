import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { keycloakLogout } from '../services/authService';
import { getStats, getUserPlatforms, addPlatform } from '../services/libraryService';

const ALL_PLATFORMS = [
  'PC', 'PlayStation 5', 'PlayStation 4',
  'Xbox Series S/X', 'Xbox One', 'Nintendo Switch',
];

const STATUS_LABELS = {
  PLAYING: 'Playing',
  BACKLOG: 'Backlog',
  COMPLETED: 'Completed',
  DROPPED: 'Dropped',
  WISHLIST: 'Wishlist',
};

const STATUS_COLORS = {
  PLAYING: '#22c55e',
  BACKLOG: '#8891a8',
  COMPLETED: '#a855f7',
  DROPPED: '#ef4444',
  WISHLIST: '#f59e0b',
};

export default function Profile() {
  const { email } = useAuth();
  const [stats, setStats] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getStats().then(r => setStats(r.data)).catch(() => {});
    getUserPlatforms().then(r => setPlatforms(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const ownedNames = platforms.map(p => p.platformName);
  const available = ALL_PLATFORMS.filter(p => !ownedNames.includes(p));

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
    <div className="max-w-xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Profile</h1>

      {/* Account */}
      <section className="bg-[#111220] border border-[#1e2035] rounded-lg p-5 space-y-1">
        <p className="text-xs text-[#4a5068] uppercase tracking-wider">Account</p>
        <p className="text-sm text-[#e8e4dc]">{email ?? '—'}</p>
      </section>

      {/* Stats */}
      {stats && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-[#e8e4dc]">Library</h2>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="bg-[#111220] border border-[#1e2035] rounded-lg p-3 space-y-1 text-center">
                <p className="text-xl font-semibold" style={{ color: STATUS_COLORS[key] }}>
                  {stats.byStatus?.[key] ?? 0}
                </p>
                <p className="text-xs text-[#4a5068]">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Platforms */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-[#e8e4dc]">Platforms</h2>
        <div className="flex flex-wrap gap-2">
          {ownedNames.map(name => (
            <span key={name} className="text-xs px-3 py-1.5 rounded border bg-[#f7258510] border-[#f7258560] text-[#f72585]">
              {name}
            </span>
          ))}
        </div>
        {available.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-[#4a5068]">Add platform</p>
            <div className="flex flex-wrap gap-2">
              {available.map(name => (
                <button
                  key={name}
                  onClick={() => handleAddPlatform(name)}
                  disabled={adding}
                  className="text-xs px-3 py-1.5 rounded border border-[#1e2035] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] disabled:opacity-40 transition-colors"
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
        onClick={keycloakLogout}
        className="px-4 py-2 bg-[#ef444410] border border-[#ef4444] text-[#ef4444] text-xs rounded [box-shadow:0_0_8px_#ef444440,0_0_20px_#ef444420] hover:bg-[#ef444420] hover:[box-shadow:0_0_12px_#ef444450,0_0_25px_#ef444430] transition-all duration-200"
      >
        Sign out
      </button>
    </div>
  );
}
