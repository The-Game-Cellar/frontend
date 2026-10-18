import { useRef, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import { formatCount } from './demo'
import type { ExploreDemo } from './explore'
import { game } from './fixture'
import { useRoomFit } from './fit'
import { useIsNew, useStartWhenSeen } from './hooks'
import { Cover, Fog, Rating, Screen, SearchField } from './parts'
import { cx, fitStyle } from './util'
import { prefersReducedMotion } from '../public/usePublicPageMotion'

interface CardProps {
  id: number
  index: number
  version: number
}

function ExploreCard({ id, index, version }: CardProps) {
  const isNew = useIsNew(version)
  const g = game(id)
  return (
    <article className={cx('card', isNew && 'new')} style={{ '--i': index } as CSSProperties}>
      <div className="cv"><Cover game={g} /></div>
      <div className="cap">
        <span className="nm">{g.name}</span>
        {g.year !== null && <span className="rt none yr"><span>{g.year}</span></span>}
        <Rating value={g.score} fixed />
      </div>
    </article>
  )
}

interface ExploreScreenProps {
  demo: ExploreDemo
}

export default function ExploreScreen({ demo }: ExploreScreenProps) {
  const snap = useSyncExternalStore(demo.subscribe, demo.getSnapshot)
  const wrapRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const fit = useRoomFit(screenRef, 'explore')
  const searching = snap.query !== ''

  useStartWhenSeen(wrapRef, () => demo.start(!prefersReducedMotion()))

  return (
    <Screen room="explore" screenRef={screenRef} wrapRef={wrapRef} rvStyle={{ ...fitStyle(fit), '--f1': '#f72585' } as CSSProperties}>
      <Fog f1="#f72585" f2="#6478ff" />
      <div className="rc">
        <div className="bar">
          <div className="tabs">
            <span className="tab on tint">Browse</span>
            <span className="tab">Coming soon</span>
            <span className="tab">Wild Card</span>
          </div>
          <span className="spacer" />
          <SearchField query={snap.query} typing={snap.typing} />
        </div>
        <div className="bar bar2">
          <span className="btn filters-btn">Filters</span>
          <span className="sel-btn"><span className="k">Order by</span><span className="v">Popular</span></span>
          <span className="reset" hidden={!searching}>Reset filters</span>
          <span className="spacer" />
          <span className="count">{snap.started ? `${formatCount(snap.count)} games` : ''}</span>
        </div>
        <div className="empty" hidden={!snap.loading}>{snap.loading && <span className="h">Loading</span>}</div>
        <div className="grid">
          {snap.ids.map((id, i) => <ExploreCard key={id} id={id} index={i} version={snap.version} />)}
        </div>
      </div>
    </Screen>
  )
}
