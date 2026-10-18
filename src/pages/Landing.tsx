import { useEffect, useRef } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useDocumentTitle from '../hooks/useDocumentTitle'
import PublicNav from '../components/public/PublicNav'
import PublicFooter from '../components/public/PublicFooter'
import usePublicPageMotion, { prefersReducedMotion } from '../components/public/usePublicPageMotion'
import Hero from '../components/landing/Hero'
import Mosaic from '../components/landing/Mosaic'
import Rooms from '../components/landing/Rooms'
import Closing from '../components/landing/Closing'
import { RevealContext, useRevealObserver } from '../components/landing/reveal'
import '../components/landing/screens.css'
import './Landing.css'

// A soft light that follows a fine pointer across the page.
function useCursorLight(lightRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const light = lightRef.current
    if (!light || !window.matchMedia('(pointer: fine)').matches) return
    let tx = -2000, ty = -2000, cx = -2000, cy = -2000
    let raf: number | null = null
    const tick = () => {
      cx += (tx - cx) * 0.08
      cy += (ty - cy) * 0.08
      light.style.transform = `translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px)`
      raf = Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(tick) : null
    }
    const move = (e: PointerEvent) => {
      if (prefersReducedMotion()) {
        light.classList.remove('on')
        return
      }
      tx = e.clientX
      ty = e.clientY
      light.classList.add('on')
      if (raf === null) raf = requestAnimationFrame(tick)
    }
    const leave = () => light.classList.remove('on')
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerleave', leave)
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [lightRef])
}

function FrontPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const lightRef = useRef<HTMLDivElement>(null)
  const revealed = useRevealObserver(rootRef)
  useDocumentTitle()
  usePublicPageMotion(rootRef, { smoothUnderReducedMotion: false })
  useCursorLight(lightRef)

  const reveal = (key: string) => (revealed.all || revealed.keys.has(key) ? 'reveal in' : 'reveal')

  return (
    <RevealContext.Provider value={revealed}>
      <div className="landing" ref={rootRef}>
        <div className="bg bg-fog" aria-hidden="true">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="blob blob-4" />
        </div>
        <Mosaic />
        <div className="cursor-light" ref={lightRef} aria-hidden="true" />
        <div className="fx fx-scan" aria-hidden="true" />
        <div className="fx fx-noise" aria-hidden="true" />
        <div className="fx fx-vignette" aria-hidden="true" />

        <div className="page">
          <PublicNav />

          <main>
            <Hero />

            <div className="rule" />

            <section className="band" id="rooms">
              <p className={`kicker ${reveal('rooms-kicker')}`} data-reveal="rooms-kicker" style={{ '--i': 0 } as CSSProperties}>What it does</p>
              <h2 className={reveal('rooms-title')} data-reveal="rooms-title" style={{ '--i': 1 } as CSSProperties}>Four rooms, one cellar.</h2>
              <p className={`sub ${reveal('rooms-sub')}`} data-reveal="rooms-sub" style={{ '--i': 2 } as CSSProperties}>
                Nothing here is a feed. It is a place to keep your games, find new ones, and get told what to play when you cannot decide.
              </p>
              <Rooms />
            </section>

            <div className="rule" />

            <Closing />
          </main>

          <PublicFooter />
        </div>
      </div>
    </RevealContext.Provider>
  )
}

// The public front page. A signed-in visitor goes on to the dashboard; nothing renders until the sign-in
// check has answered, so the page never flashes for them.
export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <FrontPage />
}
