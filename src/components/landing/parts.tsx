import type { CSSProperties, ReactNode, RefObject } from 'react'
import { coverUrl } from './fixture'
import type { Game } from './fixture'
import { cx } from './util'

interface FogProps {
  f1: string
  f2: string
}

export function Fog({ f1, f2 }: FogProps) {
  return (
    <div className="rfog" style={{ '--f1': f1, '--f2': f2 } as CSSProperties}>
      <div className="rblob rblob-1" />
      <div className="rblob rblob-2" />
      <div className="rblob rblob-3" />
      <div className="rblob rblob-4" />
    </div>
  )
}

interface SearchFieldProps {
  query?: string
  typing?: boolean
}

export function SearchField({ query = '', typing = false }: SearchFieldProps) {
  return (
    <label className={cx('search', typing && 'typing')}>
      <svg className="mag" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5 5" /></svg>
      <span className="q">{query}</span>
      <span className="clear" hidden={query === ''}>&times;</span>
    </label>
  )
}

interface CoverProps {
  game: Game
}

export function Cover({ game }: CoverProps) {
  return game.cover ? <img alt="" src={coverUrl(game.cover)} /> : <span className="nocv">{game.name}</span>
}

interface RatingProps {
  value: number | null
  // Scores print with one decimal; a member's rating prints as the half step it is.
  fixed?: boolean
}

export function Rating({ value, fixed = false }: RatingProps) {
  return (
    <span className={cx('rt', value === null && 'none')}>
      <span className="glyph">&#9733;</span>
      <span>{value === null ? '–' : <b>{fixed ? value.toFixed(1) : String(value)}</b>}/10</span>
    </span>
  )
}

interface ScreenProps {
  room: string
  screenRef: RefObject<HTMLDivElement | null>
  wrapRef: RefObject<HTMLDivElement | null>
  rvStyle: CSSProperties | undefined
  children: ReactNode
}

// The CRT frame and the scaled room inside it.
export function Screen({ room, screenRef, wrapRef, rvStyle, children }: ScreenProps) {
  return (
    <div className="screen-wrap" ref={wrapRef}>
      <div className="screen" ref={screenRef}>
        <div className="rv" data-room={room} style={rvStyle}>
          {children}
        </div>
      </div>
    </div>
  )
}
