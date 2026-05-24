export default function About() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">About</h1>
        <p className="text-sm text-[#8891a8]">The Game Cellar, your personal backlog &amp; recommendation companion.</p>
      </header>

      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-3">
        <p className="text-xs text-[#8891a8] uppercase tracking-wider">What it is</p>
        <p className="text-sm text-[#e8e4dc] leading-relaxed">
          A self-hosted game library and discovery platform. Track what you&apos;re playing, what&apos;s on your backlog,
          and what&apos;s worth playing next based on what you actually like. No ads, no monetization, no tracking
          beyond what login requires.
        </p>
      </section>

      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-3">
        <p className="text-xs text-[#8891a8] uppercase tracking-wider">Data &amp; attribution</p>
        <p className="text-sm text-[#e8e4dc] leading-relaxed">
          All game metadata, cover art, screenshots, and trailers are sourced from{' '}
          <a
            href="https://www.igdb.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f72585] [text-shadow:0_0_6px_#f7258560] hover:[text-shadow:0_0_10px_#f72585] transition-[text-shadow] duration-200"
          >
            IGDB
          </a>
          {' '}(the Internet Game Database, owned by Twitch / Amazon). The Game Cellar accesses IGDB&apos;s public
          API under the standard Twitch Developer Services Agreement.
        </p>
        <p className="text-sm text-[#e8e4dc] leading-relaxed">
          The Game Cellar is not affiliated with, endorsed by, or sponsored by any game publisher, developer,
          platform holder (Sony, Microsoft, Nintendo, Valve, etc.), or IGDB / Twitch / Amazon. All trademarks,
          logos, and game titles are the property of their respective owners.
        </p>
      </section>

    </div>
  );
}
