import { useState } from 'react'
import type { CSSProperties } from 'react'
import { COVER_POOL, coverUrl } from './fixture'
import { drawMosaic } from './drawMosaic'

// The band of real covers behind the hero, greyed and toned to the spectrum; a cover that fails to load
// leaves its tile's gradient.
export default function Mosaic() {
  const [rows] = useState(() => drawMosaic(COVER_POOL, window.innerWidth, Math.random))
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set())

  return (
    <div className="bg bg-mosaic" aria-hidden="true">
      <div className="mosaic">
        {rows.map((row, r) => (
          <div key={r} className="row">
            {row.map((tile, c) => {
              const cover = tile.cover && !failed.has(tile.cover.cover) ? tile.cover : null
              return (
                <div key={c} className="tile" style={{ '--a': `var(--${tile.a})`, '--b': `var(--${tile.b})`, '--tile-o': tile.opacity } as CSSProperties}>
                  {cover && (
                    <>
                      <img
                        src={coverUrl(cover.cover)}
                        alt=""
                        title={cover.name}
                        decoding="async"
                        onError={() => setFailed((prev) => new Set(prev).add(cover.cover))}
                      />
                      <i className="tone" />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="scrim" />
    </div>
  )
}
