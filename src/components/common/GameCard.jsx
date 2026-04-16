const statusStyles = {
  PLAYING:   'bg-[#22c55e20] text-[#22c55e] border-[#22c55e40]',
  BACKLOG:   'bg-[#8891a820] text-[#8891a8] border-[#8891a840]',
  COMPLETED: 'bg-[#a855f720] text-[#a855f7] border-[#a855f740]',
  DROPPED:   'bg-[#ef444420] text-[#ef4444] border-[#ef444440]',
  WISHLIST:  'bg-[#f59e0b20] text-[#f59e0b] border-[#f59e0b40]',
};

export default function GameCard({ game, onClick }) {
  return (
    <div
      className="bg-[#111220] border border-[#1e2035] rounded-lg overflow-hidden w-44 flex-shrink-0 cursor-pointer hover:border-[#f72585] hover:[box-shadow:0_0_15px_#f7258530] transition-all duration-200 group"
      onClick={onClick}
    >
      <div className="aspect-[3/4] bg-[#1e2035] overflow-hidden relative">
        {game.backgroundImage ? (
          <img
            src={game.backgroundImage}
            alt={game.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[#4a5068] text-xs text-center px-2">No cover</span>
          </div>
        )}
        {game.status && statusStyles[game.status] && (
          <div className="absolute top-1.5 right-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${statusStyles[game.status]}`}>
              {game.status}
            </span>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-[#e8e4dc] truncate">{game.name}</p>
        <p className="text-xs text-[#8891a8] truncate">
          {game.genres?.length > 0 ? game.genres[0] : ''}
        </p>
      </div>
    </div>
  );
}
