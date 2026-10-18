import type { CSSProperties } from 'react'
import { useRevealClass } from './reveal'

// The closing: the last steps of the sign's stair line down to a door left ajar, drawn on reveal.
export default function Closing() {
  const reveal = useRevealClass()
  return (
    <section className="band closing">
      <div className={reveal('door')} data-reveal="door" style={{ '--i': 0 } as CSSProperties}>
        <svg className="door-art" viewBox="0 0 260 120" aria-hidden="true">
          <defs>
            <linearGradient id="specDoor" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="260" y2="120">
              <stop offset="0" style={{ stopColor: 'var(--s4)' }} />
              <stop offset=".5" style={{ stopColor: 'var(--s3)' }} />
              <stop offset="1" style={{ stopColor: 'var(--s1)' }} />
            </linearGradient>
          </defs>
          <ellipse className="spill" cx="212" cy="104" rx="34" ry="8" />
          <polyline className="ln steps" pathLength={1} points="0,12 46,12 46,42 92,42 92,72 138,72 138,102 176,102" />
          <path className="ln frame" pathLength={1} d="M186 102 V42 H234 V102" />
          <path className="ln leaf" pathLength={1} d="M234 42 L254 52 V112 L234 102" />
        </svg>
      </div>
      <p className={`kicker ${reveal('closing-kicker')}`} data-reveal="closing-kicker" style={{ '--i': 1 } as CSSProperties}>Get started</p>
      <h2 className={reveal('closing-title')} data-reveal="closing-title" style={{ '--i': 2 } as CSSProperties}>The door is open.</h2>
      <p className={`sub ${reveal('closing-sub')}`} data-reveal="closing-sub" style={{ '--i': 3 } as CSSProperties}>
        One rated game and the cellar has an opinion.<br />Five and it knows you.
      </p>
      <div className={`ctas ${reveal('closing-cta')}`} data-reveal="closing-cta" style={{ '--i': 4 } as CSSProperties}>
        <span className="btn neon soon" aria-disabled="true">Coming soon</span>
      </div>
    </section>
  )
}
