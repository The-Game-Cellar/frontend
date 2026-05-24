import { Link } from 'react-router-dom'

// Twitch/IGDB ToS requires a discoverable credit on every view that surfaces IGDB-sourced data.
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
  )
}
