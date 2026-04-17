import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addPlatform } from '../services/libraryService';

const PLATFORMS = [
  'PC',
  'PlayStation 5',
  'PlayStation 4',
  'Xbox Series S/X',
  'Xbox One',
  'Nintendo Switch',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function togglePlatform(platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }

  async function handleFinish() {
    if (selectedPlatforms.length === 0) return;

    setLoading(true);
    setError(null);

    const results = await Promise.allSettled(
      selectedPlatforms.map((platform) =>
        addPlatform({ platformName: platform, isPrimary: false })
      )
    );

    const failed = results
      .map((r, i) => (r.status === 'rejected' ? selectedPlatforms[i] : null))
      .filter(Boolean);

    if (failed.length > 0) {
      setSelectedPlatforms(failed);
      setError(`Failed to save ${failed.length} platform(s). Please try again.`);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center font-mono p-6">
      <div className="bg-[#111220] border border-[#1e2035] rounded-xl p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-[#e8e4dc] tracking-wider">
            Welcome to the Cellar
          </h1>
          <p className="text-xs text-[#4a5068]">
            Select the platforms you own so we can recommend the right games
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map((platform) => {
            const active = selectedPlatforms.includes(platform);
            return (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={`px-3 py-2.5 rounded text-xs text-left border transition-all duration-200 ${
                  active
                    ? 'bg-[#f7258515] border-[#f72585] text-[#f72585] [box-shadow:0_0_8px_#f7258540]'
                    : 'bg-[#0a0b14] border-[#1e2035] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]'
                }`}
              >
                {platform}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleFinish}
          disabled={selectedPlatforms.length === 0 || loading}
          className="w-full px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? 'Saving...' : `Enter the Cellar (${selectedPlatforms.length} selected)`}
        </button>
      </div>
    </div>
  );
}
