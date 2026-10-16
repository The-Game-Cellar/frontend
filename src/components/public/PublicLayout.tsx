import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import './public.css'

const STAIR = '2,5 8.5,5 8.5,12 15.5,12 15.5,19 22,19'

export default function PublicLayout() {
  const shellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = document.documentElement
    root.style.scrollBehavior = 'smooth'

    // SMIL gradients ignore the CSS motion reset, so reduced motion pauses them here.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shellRef.current?.querySelectorAll('svg').forEach((svg) => svg.pauseAnimations())
    }

    return () => {
      root.style.scrollBehavior = ''
    }
  }, [])

  return (
    <div className="public" ref={shellRef}>
      <div className="bg" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
      </div>

      <div className="page">
        <header className="nav">
          <Link className="brand" to="/" aria-label="The Game Cellar, front page">
            <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
              <defs>
                <linearGradient id="specMark" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24" spreadMethod="repeat">
                  <stop offset="0" style={{ stopColor: 'var(--s1)' }} />
                  <stop offset=".25" style={{ stopColor: 'var(--s2)' }} />
                  <stop offset=".5" style={{ stopColor: 'var(--s3)' }} />
                  <stop offset=".75" style={{ stopColor: 'var(--s4)' }} />
                  <stop offset="1" style={{ stopColor: 'var(--s5)' }} />
                  <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="-24 -24" dur="8s" repeatCount="indefinite" />
                </linearGradient>
              </defs>
              <polyline className="halo" points={STAIR} />
              <polyline className="core" points={STAIR} />
            </svg>
            <span className="brand-text"><small>THE</small><strong>GAME CELLAR</strong></span>
          </Link>
          <div className="nav-actions">
            <Link className="btn small" to="/login">Log in</Link>
            <span className="btn small neon soon" aria-disabled="true">Coming soon</span>
          </div>
        </header>

        <Outlet />

        <footer>
          <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
            <polyline className="halo" points={STAIR} />
            <polyline className="core" points={STAIR} />
          </svg>
          <span>&copy; 2026 The Game Cellar</span>
          <NavLink to="/privacy">Privacy</NavLink>
          <a href="mailto:hello@gamecellar.app">Contact</a>
          <span className="credit">Game data and cover art from <a href="https://www.igdb.com" rel="noopener">IGDB</a></span>
        </footer>
      </div>
    </div>
  )
}
