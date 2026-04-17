import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GameCard from '../components/common/GameCard';
import { getDashboard } from '../services/recommendationService';
import { getBacklog, getDustyGames } from '../services/libraryService';


function SectionHeader({ title, linkText, linkTo }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-medium text-[#e8e4dc]">{title}</h2>
      {linkText && (
        <Link to={linkTo} className="text-xs text-[#8891a8] hover:text-[#f72585] transition-colors">
          {linkText} →
        </Link>
      )}
    </div>
  );
}

const CARD_WIDTH = 176; // w-44
const GAP = 12;        // gap-3

function GameScroll({ games, getKey, onClick }) {
  const ref = useRef(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [cardWidth, setCardWidth] = useState(CARD_WIDTH);

  useEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const w = ref.current.offsetWidth;
      const count = Math.max(1, Math.floor((w + GAP) / (CARD_WIDTH + GAP)));
      setVisibleCount(count);
      setCardWidth(Math.floor((w - (count - 1) * GAP) / count));
    };
    update();
    const ro = new ResizeObserver(update);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex gap-3">
      {games.slice(0, visibleCount).map(game => (
        <GameCard
          key={getKey(game)}
          game={game}
          onClick={() => onClick(game)}
          style={{ width: cardWidth }}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [becauseYouLiked, setBecauseYouLiked] = useState([]);
  const [wildcard, setWildcard] = useState([]);
  const [backlog, setBacklog] = useState([]);
  const [dusty, setDusty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getDashboard(),
      getBacklog(),
      getDustyGames(),
    ]).then(([dashRes, backlogRes, dustyRes]) => {
      if (dashRes.status === 'fulfilled') {
        const data = dashRes.value.data;
        setRecommendations(data?.recommendations ?? []);
        setBecauseYouLiked(data?.becauseYouLiked ?? []);
        setWildcard(data?.wildcard ?? []);
      }
      if (backlogRes.status === 'fulfilled') {
        const data = Array.isArray(backlogRes.value.data) ? backlogRes.value.data : [];
        setBacklog(data.map(g => ({ ...g, name: g.gameName })));
      }
      if (dustyRes.status === 'fulfilled') {
        const data = Array.isArray(dustyRes.value.data) ? dustyRes.value.data : [];
        setDusty(data.map(g => ({ ...g, name: g.gameName })));
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>;
  }

  return (
    <div className="space-y-10">

      {/* Recommendations for you */}
      <section>
        <SectionHeader title="Recommendations for you" linkText="View all" linkTo="/recommendations" />
        {recommendations.length === 0 ? (
          <p className="text-sm text-[#8891a8]">Add games to your library to get recommendations.</p>
        ) : (
          <GameScroll
            games={recommendations}
            getKey={g => g.rawgId}
            onClick={g => navigate(`/games/${g.rawgId}`)}
          />
        )}
      </section>

      {/* Because you liked... */}
      {becauseYouLiked.map(section => (
        <section key={section.basedOnRawgId}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-[#e8e4dc]">
              Because you liked{' '}
              <Link
                to={`/games/${section.basedOnRawgId}`}
                className="text-[#f72585] [text-shadow:0_0_8px_#f72585] hover:underline"
              >
                {section.basedOnGame}
              </Link>
            </h2>
          </div>
          <GameScroll
            games={section.recommendations}
            getKey={g => g.rawgId}
            onClick={g => navigate(`/games/${g.rawgId}`)}
          />
        </section>
      ))}

      {/* Backlog */}
      <section>
        <SectionHeader title="Your backlog" linkText="View all" linkTo="/library" />
        {backlog.length === 0 ? (
          <p className="text-sm text-[#8891a8]">Your backlog is empty.</p>
        ) : (
          <GameScroll
            games={backlog}
            getKey={g => g.id}
            onClick={g => navigate(`/games/${g.rawgGameId}`)}
          />
        )}
      </section>

      {/* Dusty games */}
      {dusty.length > 0 && (
        <section>
          <SectionHeader title="Dusty games" linkText="View all" linkTo="/library?filter=dusty" />
          <GameScroll
            games={dusty}
            getKey={g => g.id}
            onClick={g => navigate(`/games/${g.rawgGameId}`)}
          />
        </section>
      )}

      {/* Wild Card */}
      {wildcard.length > 0 && (
        <section>
          <SectionHeader title="Wild Card" linkText="More →" linkTo="/wildcard" />
          <GameScroll
            games={wildcard}
            getKey={g => g.rawgId}
            onClick={g => navigate(`/games/${g.rawgId}`)}
          />
        </section>
      )}

    </div>
  );
}
