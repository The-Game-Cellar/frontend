import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { prefersReducedMotion } from '../public/usePublicPageMotion'

const MOTE_COLORS = ['s1', 's2', 's3', 's4', 's5']
const HEADLINE = 'Your backlog,\nfinally\nunder control.'

interface Mote {
  left: string
  top: string
  c: string
  t: string
  dl: string
  dx: string
}

function makeMotes(): Mote[] {
  return Array.from({ length: 22 }, (_, m) => ({
    left: `${(8 + Math.random() * 84).toFixed(1)}%`,
    top: `${(15 + Math.random() * 75).toFixed(1)}%`,
    c: `var(--${MOTE_COLORS[m % MOTE_COLORS.length]})`,
    t: `${(9 + Math.random() * 9).toFixed(1)}s`,
    dl: `${(-Math.random() * 14).toFixed(1)}s`,
    dx: `${((Math.random() - 0.5) * 120).toFixed(0)}px`,
  }))
}

// Restarts the burst animation on an element whose class list React never rewrites.
function burst(el: HTMLElement | null, later: (ms: number, fn: () => void) => void) {
  if (!el) return
  el.classList.remove('burst')
  void el.offsetWidth
  el.classList.add('burst')
  later(800, () => el.classList.remove('burst'))
}

interface SignProps {
  signRef: RefObject<HTMLDivElement | null>
}

function Sign({ signRef }: SignProps) {
  return (
    <div className="sign" ref={signRef} aria-label="The Game Cellar">
      <svg viewBox="0 0 1180 420">
        <defs>
          <linearGradient id="spec" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1180" y2="0" spreadMethod="repeat">
            <stop offset="0" className="st st1" />
            <stop offset=".25" className="st st2" />
            <stop offset=".5" className="st st3" />
            <stop offset=".75" className="st st4" />
            <stop offset="1" className="st st5" />
            <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="-1180 0" dur="16s" repeatCount="indefinite" />
          </linearGradient>
          <linearGradient id="specStairs" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="590" y2="590" spreadMethod="repeat">
            <stop offset="0" className="st st1" />
            <stop offset=".25" className="st st2" />
            <stop offset=".5" className="st st3" />
            <stop offset=".75" className="st st4" />
            <stop offset="1" className="st st5" />
            <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="-590 -590" dur="16s" repeatCount="indefinite" />
          </linearGradient>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b2" />
            <feMerge>
              <feMergeNode in="b1" /><feMergeNode in="b1" />
              <feMergeNode in="b2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="fadeEnds" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset=".18" stopColor="#fff" stopOpacity="1" />
            <stop offset=".82" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <mask id="edge"><rect x="0" y="-60" width="1320" height="540" fill="url(#fadeEnds)" /></mask>
        </defs>
        <g mask="url(#edge)">
          <polyline className="stairs" pathLength={1} points="0,70 360,70 360,160 580,160 580,250 820,250 820,340 1320,340" />
        </g>
        <g className="wg w1">
          <rect className="hit" x="370" y="64" width="210" height="100" />
          <text className="w gx gx-a" x="384" y="146">THE</text>
          <text className="w gx gx-b" x="384" y="146">THE</text>
          <text className="w main" x="384" y="146">THE</text>
        </g>
        <g className="wg w2">
          <rect className="hit" x="590" y="154" width="280" height="100" />
          <text className="w gx gx-a" x="604" y="236">GAME</text>
          <text className="w gx gx-b" x="604" y="236">GAME</text>
          <text className="w main" x="604" y="236">GAME</text>
        </g>
        <g className="wg w3">
          <rect className="hit" x="830" y="244" width="360" height="100" />
          <text className="w gx gx-a" x="844" y="326">CELLAR</text>
          <text className="w gx gx-b" x="844" y="326">CELLAR</text>
          <text className="w main" x="844" y="326">CELLAR</text>
        </g>
      </svg>
    </div>
  )
}

// The hero: the sign drawing itself and lighting tube by tube, the headline, the motes, and the glitch that
// hits sign and headline after the intro and then every 7 to 13 s on either at random.
export default function Hero() {
  const [motes] = useState(makeMotes)
  const headlineRef = useRef<HTMLSpanElement>(null)
  const signRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const ids = new Set<ReturnType<typeof setTimeout>>()
    const later = (ms: number, fn: () => void) => {
      const id = setTimeout(() => {
        ids.delete(id)
        fn()
      }, ms)
      ids.add(id)
    }
    later(2500, () => burst(signRef.current, later))
    later(2950, () => burst(headlineRef.current, later))
    // the first ambient burst 10 s after the headline's intro burst
    const loop = (wait: number) => later(wait, () => {
      burst(Math.random() < 0.5 ? signRef.current : headlineRef.current, later)
      loop(7000 + Math.random() * 6000)
    })
    loop(12950)
    return () => ids.forEach(clearTimeout)
  }, [])

  return (
    <section className="hero">
      <div className="motes" aria-hidden="true">
        {motes.map((m, i) => (
          <i key={i} className="mote" style={{ left: m.left, top: m.top, '--c': m.c, '--t': m.t, '--dl': m.dl, '--dx': m.dx } as CSSProperties} />
        ))}
      </div>
      <div className="hero-copy">
        <p className="eyebrow rise" style={{ '--i': 0 } as CSSProperties}>Game library tracker</p>
        <h1 className="rise" style={{ '--i': 1 } as CSSProperties}>
          <span className="glitch" ref={headlineRef} data-text={HEADLINE}>
            {'Your backlog,\n'}<span className="grad">finally</span>{'\nunder control.'}
          </span>
        </h1>
        <p className="lede rise" style={{ '--i': 2 } as CSSProperties}>
          Track every game you have played, want to play, or gave up on. Then let the cellar suggest what to pick up next, built from your own shelf rather than the charts.
        </p>
        <div className="ctas rise" style={{ '--i': 3 } as CSSProperties}>
          <span className="btn neon soon" aria-disabled="true">Coming soon</span>
          <a className="btn" href="#rooms">See how it works</a>
        </div>
      </div>

      <Sign signRef={signRef} />
    </section>
  )
}
