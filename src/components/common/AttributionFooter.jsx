import { Link } from 'react-router-dom';

/**
 * Persistent IGDB attribution. Required by the Twitch / IGDB Terms of Service —
 * any view that displays IGDB-sourced data must include a discoverable credit.
 * Shown sitewide via Layout, and on Login/Register since unauthenticated users
 * can already see "The Game Cellar" branding before they reach the API.
 */
export default function AttributionFooter() {
  return (
    <footer className="text-center text-xs text-[#4a5068] py-3 px-4">
      <span>Game data powered by </span>
      <a
        href="https://www.igdb.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-[color,text-shadow] duration-200"
      >
        IGDB
      </a>
      <span className="mx-2 text-[#2a2d45]">·</span>
      <Link
        to="/about"
        className="text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-[color,text-shadow] duration-200"
      >
        About
      </Link>
    </footer>
  );
}
