import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import type { RecommendDemo } from './recommend'
import { game } from './fixture'
import { recommendFit, useRoomFit } from './fit'
import { useStartWhenSeen } from './hooks'
import { Cover, Fog, Rating, Screen } from './parts'
import { cx, fitStyle } from './util'
import { prefersReducedMotion } from '../public/usePublicPageMotion'

interface RecommendScreenProps {
  demo: RecommendDemo
}

export default function RecommendScreen({ demo }: RecommendScreenProps) {
  const snap = useSyncExternalStore(demo.subscribe, demo.getSnapshot)
  const wrapRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const fit = useRoomFit(screenRef, 'recommend')

  useStartWhenSeen(wrapRef, () => demo.start(!prefersReducedMotion()))

  useEffect(() => {
    if (fit) demo.setFit(recommendFit(fit.width))
  }, [demo, fit])

  return (
    <Screen room="recommend" screenRef={screenRef} wrapRef={wrapRef} rvStyle={fitStyle(fit)}>
      <Fog f1="#a855f7" f2="#6478ff" />
      <div className="rc">
        <div className="shelves">
          {snap.shelves.map((shelf, i) => (
            <section key={shelf.label} className="shelf" style={{ '--n': i } as CSSProperties}>
              <div className="shelf-h">
                <span className="lab">{shelf.label}</span>
                <span className="tail" />
                <span className={cx('ghost', shelf.pressed && 'press', shelf.refreshing && 'busy')}>
                  &#8635; {shelf.refreshing ? 'Refreshing…' : 'Refresh'}
                </span>
              </div>
              <div className={cx('srow fit', shelf.refreshing && 'busy')} style={snap.started && snap.fit > 0 ? ({ '--fit': snap.fit } as CSSProperties) : undefined}>
                {shelf.ids.map((id, k) => {
                  const g = game(id)
                  return (
                    <article key={`${shelf.generation}-${k}`} className="card new" style={{ '--i': k } as CSSProperties}>
                      <div className="cv"><Cover game={g} /></div>
                      <div className="cap">
                        <span className="nm">{g.name}</span>
                        <Rating value={g.score} fixed />
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Screen>
  )
}
