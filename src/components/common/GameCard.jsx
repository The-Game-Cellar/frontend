export default function GameCard({ game, onClick, style }) {
  return (
    <div
      className="bg-[#111220] border border-[#1e2035] rounded-lg overflow-hidden w-44 flex-shrink-0 cursor-pointer hover:border-[#f72585] hover:[box-shadow:0_0_15px_#f7258530] transition-all duration-200 group"
      style={style}
      onClick={onClick}
    >
      <div className="aspect-[3/4] bg-[#1e2035] overflow-hidden">
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
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-[#e8e4dc] truncate" title={game.name}>{game.name}</p>
        <p className="text-xs text-[#8891a8] truncate">
          {game.genres?.length > 0 ? game.genres[0] : ''}
        </p>
      </div>
    </div>
  );
}
