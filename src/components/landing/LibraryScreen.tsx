import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import { COLOR, LABEL, STATUSES } from './demo'
import type { DemoCellar, LibEntry, LibraryView } from './cellar'
import type { Status } from './fixture'
import { columnsOf, dustyFill, useRoomFit } from './fit'
import { useIsNew, useStartWhenSeen } from './hooks'
import { Cover, Fog, Rating, Screen, SearchField } from './parts'
import { cx, fitStyle } from './util'
import { prefersReducedMotion } from '../public/usePublicPageMotion'

interface Mote {
  x: string
  y: string
  dx: string
  d: string
  dl: string
}

function makeMotes(n: number): Mote[] {
  return Array.from({ length: n }, () => ({
    x: `${(Math.random() * 100).toFixed(1)}%`,
    y: `${(20 + Math.random() * 80).toFixed(1)}%`,
    dx: `${(Math.random() * 80 - 20).toFixed(0)}px`,
    d: `${(14 + Math.random() * 12).toFixed(1)}s`,
    dl: `${(-Math.random() * 20).toFixed(1)}s`,
  }))
}

function byName(a: LibEntry, b: LibEntry): number {
  return a.game.name.localeCompare(b.game.name)
}

interface CardProps {
  entry: LibEntry
  index: number
  version: number
  picked: boolean
  blowing: boolean
  // The screen has drawn before, so a card arriving on the Dusty wall enters clean and the dust settles on it.
  settleIn: boolean
}

function LibraryCard({ entry, index, version, picked, blowing, settleIn }: CardProps) {
  const isNew = useIsNew(version)
  const isDusty = entry.status === 'DUSTY'
  const [dusted, setDusted] = useState(() => isDusty && !settleIn)

  useEffect(() => {
    if (!isDusty || dusted) return
    const t = setTimeout(() => setDusted(true), 700)
    return () => clearTimeout(t)
  }, [isDusty, dusted])

  return (
    <article
      className={cx('card', isNew && 'new', isDusty && dusted && 'dusty', picked && 'pick', blowing && 'blow')}
      data-s={blowing ? 'PLAYING' : entry.status}
      style={{ '--i': index } as CSSProperties}
    >
      <div className="cv">
        <Cover game={entry.game} />
        {isDusty && <span className="dust" />}
      </div>
      <div className="cap">
        <span className="nm">{entry.game.name}</span>
        <Rating value={entry.rating} />
      </div>
    </article>
  )
}

interface LibraryScreenProps {
  cellar: DemoCellar
  // The Library's All tab with its status shelves, or its Dusty tab with the wall.
  tab: 'All' | 'DUSTY'
}

export default function LibraryScreen({ cellar, tab }: LibraryScreenProps) {
  const view: LibraryView = tab === 'DUSTY' ? 'dusty' : 'library'
  const snap = useSyncExternalStore(cellar.subscribe, cellar.getSnapshot)
  const wrapRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const fit = useRoomFit(screenRef, view)
  const [motes] = useState(() => (tab === 'DUSTY' ? makeMotes(26) : []))
  const started = snap.started[view]
  // The version this screen first drew its cards at: a card arriving after it enters the Dusty wall clean and
  // the dust settles on it, while the first draw shows the dust already there.
  const [drawnAt, setDrawnAt] = useState<number | null>(null)
  if (started && drawnAt === null) setDrawnAt(snap.version)

  useStartWhenSeen(wrapRef, () => cellar.start(view, !prefersReducedMotion()))

  useEffect(() => {
    if (!fit) return
    cellar.setFill(view, view === 'library' ? columnsOf(fit.width) : dustyFill(fit))
  }, [cellar, fit, view])

  const counts = useMemo(() => {
    const n: Partial<Record<Status, number>> = {}
    snap.entries.forEach((e) => {
      n[e.status] = (n[e.status] ?? 0) + 1
    })
    return n
  }, [snap.entries])

  const card = (e: LibEntry, i: number) => (
    <LibraryCard
      key={e.game.id}
      entry={e}
      index={i}
      version={snap.version}
      picked={snap.picks[view].has(e.game.id)}
      blowing={view === 'dusty' && snap.blowing.has(e.game.id)}
      settleIn={drawnAt !== null && snap.version > drawnAt}
    />
  )

  const shelves = STATUSES
    .map((s) => ({ s, items: snap.entries.filter((e) => e.status === s).sort(byName) }))
    .filter((sh) => sh.items.length > 0)

  return (
    <Screen room={view} screenRef={screenRef} wrapRef={wrapRef} rvStyle={fitStyle(fit)}>
      <Fog f1={tab === 'DUSTY' ? '#5c5445' : '#f72585'} f2={tab === 'DUSTY' ? '#7a6f5a' : '#6478ff'} />
      {tab === 'DUSTY' && (
        <div className="rmotes">
          {motes.map((m, i) => (
            <i key={i} className="rmote" style={{ '--x': m.x, '--y': m.y, '--dx': m.dx, '--d': m.d, '--dl': m.dl } as CSSProperties} />
          ))}
        </div>
      )}
      <div className="rc">
        <div className="bar">
          <div className="tabs">
            {(['All', ...STATUSES] as const).map((k) => (
              <span key={k} className={cx('tab', k === tab && 'on', k === 'All' && 'spec')} style={{ '--c': COLOR[k] } as CSSProperties}>
                {LABEL[k]}<b>{started ? (k === 'All' ? snap.entries.length : (counts[k] ?? 0)) : ''}</b>
              </span>
            ))}
          </div>
          <span className="spacer" />
          <SearchField />
        </div>
        <div className="bar bar2">
          <span className="btn filters-btn">Filters</span>
          <span className="sel-btn"><span className="k">Order by</span><span className="v">Status</span></span>
        </div>
        {tab === 'DUSTY' ? (
          <div className="host grid">{started && snap.entries.filter((e) => e.status === 'DUSTY').sort(byName).map(card)}</div>
        ) : (
          <div className="host">
            {started && shelves.map(({ s, items }, si) => (
              <section key={s} className="shelf" style={{ '--n': si } as CSSProperties}>
                <div className="shelf-h" style={{ '--c': COLOR[s] } as CSSProperties}>
                  <span className="lab">{LABEL[s]}</span>
                  <span className="tail" />
                  <span className="cnt">{items.length} {items.length === 1 ? 'game' : 'games'}</span>
                </div>
                <div className="srow">{items.map(card)}</div>
              </section>
            ))}
          </div>
        )}
      </div>
    </Screen>
  )
}
