import { useNavigate } from 'react-router-dom';

const statusStyles = {
  PLAYING:   'bg-[#22c55e20] text-[#22c55e] border-[#22c55e40]',
  BACKLOG:   'bg-[#8891a820] text-[#8891a8] border-[#8891a840]',
  COMPLETED: 'bg-[#a855f720] text-[#a855f7] border-[#a855f740]',
  DROPPED:   'bg-[#ef444420] text-[#ef4444] border-[#ef444440]',
  WISHLIST:  'bg-[#f59e0b20] text-[#f59e0b] border-[#f59e0b40]',
};

export default function GameListItem({ entry, onRemove }) {
  const navigate = useNavigate();

  const dateAdded = entry.dateAdded
    ? new Date(entry.dateAdded).toLocaleDateString('en-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className="bg-[#111220] border border-[#1e2035] rounded-lg flex items-center gap-4 px-4 py-3 hover:border-[#2a2d45] hover:bg-[#141525] transition-all duration-150 cursor-pointer"
      onClick={() => navigate(`/games/${entry.rawgGameId}`)}
    >
      {/* Thumbnail */}
      <div className="w-8 flex-shrink-0 aspect-[3/4] bg-[#1e2035] rounded overflow-hidden">
        {entry.backgroundImage ? (
          <img
            src={entry.backgroundImage}
            alt={entry.gameName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[#4a5068] text-[8px]">?</span>
          </div>
        )}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#e8e4dc] truncate">{entry.gameName}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {entry.platform && (
            <span className="text-xs text-[#4a5068]">{entry.platform}</span>
          )}
          {dateAdded && (
            <span className="text-xs text-[#4a5068]">{dateAdded}</span>
          )}
        </div>
      </div>

      {/* Rating */}
      {entry.rating != null && (
        <div className="flex-shrink-0 text-xs">
          <span className="text-[#f72585] [text-shadow:0_0_6px_#f72585]">{entry.rating}</span>
          <span className="text-[#4a5068]">/10</span>
        </div>
      )}

      {/* Status badge */}
      <span
        className={`flex-shrink-0 text-xs px-2 py-0.5 rounded border font-medium ${statusStyles[entry.status] ?? 'border-[#1e2035] text-[#8891a8]'}`}
      >
        {entry.status}
      </span>

      {/* Remove button */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onRemove(entry.id); }}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[#4a5068] hover:text-[#ef4444] transition-colors text-xl leading-none"
        title="Remove from library"
      >
        ×
      </button>
    </div>
  );
}
