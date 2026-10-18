import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { DemoCellar } from './cellar'
import { ExploreDemo } from './explore'
import { RecommendDemo } from './recommend'
import type { Room } from './fit'
import LibraryScreen from './LibraryScreen'
import ExploreScreen from './ExploreScreen'
import RecommendScreen from './RecommendScreen'
import { useRevealClass } from './reveal'
import { cx } from './util'
import { prefersReducedMotion } from '../public/usePublicPageMotion'

const ROOM_ORDER: readonly Room[] = ['library', 'dusty', 'recommend', 'explore']
const ROTATE_MS = 15000
const TICK_MS = 250

interface RailLinkProps {
  room: Room
  label: string
  active: boolean
  sub?: boolean
  run: boolean
  runKey: number
  onGo: (room: Room) => void
  children?: ReactNode
}

function RailLink({ room, label, active, sub = false, run, runKey, onGo, children }: RailLinkProps) {
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    onGo(room)
  }
  return (
    <a className={cx(sub && 'sub', active && 'active')} href="#rooms" data-go={room} onClick={go}>
      {children}
      <span>{label}</span>
      {/* remounted on every switch, so the hairline starts filling from empty */}
      <i key={active ? `run-${runKey}` : 'idle'} className={cx('prog', active && run && 'run')} />
    </a>
  )
}

interface WindowProps {
  room: Room
  current: Room
  title: string
  pills: ReactNode
  copy: string
  children: ReactNode
}

function RoomWindow({ room, current, title, pills, copy, children }: WindowProps) {
  const reveal = useRevealClass()
  return (
    <article className={cx('tile-card', reveal(`card-${room}`), room === current && 'cur')} data-card={room} data-reveal={`card-${room}`} style={{ '--i': 1 } as CSSProperties}>
      <div className="label">
        <h3>{title}</h3>
        <div className="pills">{pills}</div>
        <p>{copy}</p>
      </div>
      {children}
    </article>
  )
}

// The app's rail beside one window that shows one room at a time. The window moves on every 15 s in the rail's
// order, the clock restarting on every switch and held while the pointer is over the rail or the window.
export default function Rooms() {
  const [cellar] = useState(() => new DemoCellar())
  const [explore] = useState(() => new ExploreDemo())
  const [recommend] = useState(() => new RecommendDemo())
  const [current, setCurrent] = useState<Room>('library')
  const [switches, setSwitches] = useState(0)
  const [held, setHeld] = useState(false)
  const [motion] = useState(() => !prefersReducedMotion())
  const currentRef = useRef<Room>('library')
  const heldRef = useRef(false)
  const elapsed = useRef(0)
  const reveal = useRevealClass()

  useEffect(() => () => {
    cellar.dispose()
    explore.dispose()
    recommend.dispose()
  }, [cellar, explore, recommend])

  const go = useCallback((room: Room) => {
    elapsed.current = 0
    currentRef.current = room
    setCurrent(room)
    setSwitches((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!motion) return
    const id = setInterval(() => {
      if (heldRef.current) return
      elapsed.current += TICK_MS
      if (elapsed.current >= ROTATE_MS) go(ROOM_ORDER[(ROOM_ORDER.indexOf(currentRef.current) + 1) % ROOM_ORDER.length])
    }, TICK_MS)
    return () => clearInterval(id)
  }, [go, motion])

  const hold = (on: boolean) => {
    heldRef.current = on
    setHeld(on)
  }

  const link = (room: Room, label: string, children?: ReactNode, sub = false) => (
    <RailLink room={room} label={label} active={current === room} sub={sub} run={motion} runKey={switches} onGo={go}>
      {children}
    </RailLink>
  )

  return (
    <div className="bento" onPointerEnter={() => hold(true)} onPointerLeave={() => hold(false)}>
      <nav className={cx('rooms-rail', reveal('rail'), held && 'held')} data-reveal="rail" aria-label="Rooms" style={{ '--rot': `${ROTATE_MS / 1000}s` } as CSSProperties}>
        <div className="grp"><span className="word">Rooms</span><span className="tail" /></div>
        {link('library', 'Library', <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5v15" /><path d="M9.7 3.5v16.5" /><path d="M14.3 6v14" /><path d="M19 4.5v15.5" /></svg>)}
        {link('dusty', 'Dusty', undefined, true)}
        {link('recommend', 'Recommend', <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 5.5 6.5 6.5L6 18.5" /><path d="M17.5 5.5v13" /></svg>)}
        {link('explore', 'Explore', <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>)}
      </nav>

      <RoomWindow
        room="library"
        current={current}
        title="Library"
        pills={(
          <>
            <span className="pill" data-s="PLAYING">Playing</span>
            <span className="pill" data-s="BACKLOG">Backlog</span>
            <span className="pill" data-s="WISHLIST">Wishlist</span>
            <span className="pill" data-s="DUSTY">Dusty</span>
            <span className="pill" data-s="COMPLETED">Completed</span>
            <span className="pill" data-s="DROPPED">Dropped</span>
          </>
        )}
        copy="Keep track of what you are playing, what is waiting and what you have finished."
      >
        <LibraryScreen cellar={cellar} tab="All" />
      </RoomWindow>

      <RoomWindow
        room="explore"
        current={current}
        title="Explore"
        pills={(
          <>
            <span className="pill">Browse</span>
            <span className="pill dim">Coming soon</span>
            <span className="pill dim">Wild Card</span>
          </>
        )}
        copy="Browse the catalog, see what is coming soon, or let Wild Card deal you a hand."
      >
        <ExploreScreen demo={explore} />
      </RoomWindow>

      <RoomWindow
        room="recommend"
        current={current}
        title="Recommend"
        pills={(
          <>
            <span className="pill">Your shelf</span>
            <span className="pill dim">No charts</span>
          </>
        )}
        copy="Picks built from what you rated, not from what is trending."
      >
        <RecommendScreen demo={recommend} />
      </RoomWindow>

      <RoomWindow
        room="dusty"
        current={current}
        title="Dusty"
        pills={(
          <>
            <span className="pill">90 days</span>
            <span className="pill dim">Automatic</span>
          </>
        )}
        copy="Sit on a game long enough and the cellar marks it Dusty. Pick it up and the dust comes off."
      >
        <LibraryScreen cellar={cellar} tab="DUSTY" />
      </RoomWindow>
    </div>
  )
}
