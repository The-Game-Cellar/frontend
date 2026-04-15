import GameCard from '../components/common/GameCard';

// Placeholder mock data — replace with API calls when backend is ready
const mockGames = [
  { rawgId: 1, name: 'The Witcher 3', genres: ['RPG'], backgroundImage: 'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg' },
  { rawgId: 2, name: 'Elden Ring', genres: ['Action RPG'], backgroundImage: 'https://media.rawg.io/media/games/b29/b294fdd866dcdb643e7bab370a552855.jpg' },
  { rawgId: 3, name: 'Cyberpunk 2077', genres: ['RPG'], backgroundImage: 'https://media.rawg.io/media/games/26d/26d4437715bee60138dab4a7c8c59c92.jpg' },
  { rawgId: 4, name: 'Red Dead Redemption 2', genres: ['Action'], backgroundImage: 'https://media.rawg.io/media/games/511/5118aff5091cb3efec399c808f8c598f.jpg' },
  { rawgId: 5, name: 'Hollow Knight', genres: ['Metroidvania'], backgroundImage: null },
];

const mockBacklog = [
  { id: 1, name: 'The Witcher 3', status: 'PLAYING', platform: 'PC' },
  { id: 2, name: 'Elden Ring', status: 'BACKLOG', platform: 'PlayStation 5' },
  { id: 3, name: 'Hades', status: 'BACKLOG', platform: 'PC' },
];

const statusStyles = {
  PLAYING:   'bg-[#22c55e20] text-[#22c55e] border-[#22c55e40]',
  BACKLOG:   'bg-[#8891a820] text-[#8891a8] border-[#8891a840]',
  COMPLETED: 'bg-[#a855f720] text-[#a855f7] border-[#a855f740]',
  DROPPED:   'bg-[#ef444420] text-[#ef4444] border-[#ef444440]',
  WISHLIST:  'bg-[#f59e0b20] text-[#f59e0b] border-[#f59e0b40]',
};

function SectionHeader({ title, linkText, linkTo }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-medium text-[#e8e4dc]">{title}</h2>
      {linkText && (
        <a href={linkTo} className="text-xs text-[#8891a8] hover:text-[#f72585] transition-colors">
          {linkText} →
        </a>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Recommendations */}
      <section>
        <SectionHeader title="Recommendations for you" linkText="View all" linkTo="/recommendations" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {mockGames.map((game) => (
            <GameCard key={game.rawgId} game={game} />
          ))}
        </div>
      </section>

      {/* Backlog */}
      <section>
        <SectionHeader title="Your backlog" linkText="View all" linkTo="/library" />
        <div className="space-y-2">
          {mockBacklog.map((item) => (
            <div
              key={item.id}
              className="bg-[#111220] border border-[#1e2035] rounded-lg px-4 py-3 flex items-center justify-between hover:border-[#2a2d45] transition-colors"
            >
              <div>
                <span className="text-sm text-[#e8e4dc]">{item.name}</span>
                <span className="text-xs text-[#4a5068] ml-3">{item.platform}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${statusStyles[item.status]}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Dusty games */}
      <section>
        <SectionHeader title="Dusty games" linkText="View all" linkTo="/library" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {mockGames.slice(2).map((game) => (
            <GameCard key={game.rawgId} game={game} />
          ))}
        </div>
      </section>
    </div>
  );
}
