import { Link } from 'react-router-dom'
import BrandMark from './BrandMark'
import './shell.css'

export default function PublicNav() {
  return (
    <header className="nav">
      <Link className="brand" to="/" aria-label="The Game Cellar, front page">
        <BrandMark withGradient />
        <span className="brand-text"><small>THE</small><strong>GAME CELLAR</strong></span>
      </Link>
      <div className="nav-actions">
        <Link className="btn small" to="/login">Log in</Link>
        <span className="btn small neon soon" aria-disabled="true">Coming soon</span>
      </div>
    </header>
  )
}
