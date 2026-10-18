import { NavLink } from 'react-router-dom'
import BrandMark from './BrandMark'
import './shell.css'

export default function PublicFooter() {
  return (
    <footer>
      <BrandMark />
      <span>&copy; 2026 The Game Cellar</span>
      <NavLink to="/privacy">Privacy</NavLink>
      <a href="mailto:hello@gamecellar.app">Contact</a>
      <span className="credit">Game data and cover art from <a href="https://www.igdb.com" rel="noopener">IGDB</a></span>
    </footer>
  )
}
