import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'

export type Room = 'library' | 'dusty' | 'recommend' | 'explore'

// About this many px of the room's own height fill the frame; past MAXW px of room width the room grows instead
// of widening, so a wide frame shows the room bigger rather than a long empty shelf.
const TARGET: Readonly<Record<Room, number>> = { library: 600, explore: 470, recommend: 450, dusty: 600 }
const MAXW = 1600

export interface Fit {
  k: number
  width: number
  height: number
}

export function fitRoom(room: Room, w: number, h: number): Fit | null {
  if (w <= 0 || h <= 0) return null
  const k = Math.max(0.4, Math.min(0.8, Math.max(h / TARGET[room], w / MAXW)))
  return { k, width: w / k, height: h / k }
}

// Cards across a shelf at the room's own width: the 40 px side padding, 176 px cards and 16 px gaps.
export function columnsOf(width: number): number {
  return Math.max(2, Math.floor((width - 80 + 16) / 192))
}

// The Dusty wall: as many rows as the screen shows below the bars, plus one, so a card leaving never opens a gap.
export function dustyFill(fit: Fit): number {
  const cols = columnsOf(fit.width)
  const colW = (fit.width - 80 - (cols - 1) * 16) / cols
  return cols * (Math.ceil((fit.height - 144) / (colW * 4 / 3 + 46)) + 1)
}

// Recommend's one row: as many cards as fit, between 2 and 15.
export function recommendFit(width: number): number {
  return Math.min(15, columnsOf(width))
}

// Measures the screen inside its wrap and fits the room to it, refitted whenever the wrap changes size
// (including when its window is switched in).
export function useRoomFit(screenRef: RefObject<HTMLElement | null>, room: Room): Fit | null {
  const [fit, setFit] = useState<Fit | null>(null)

  useLayoutEffect(() => {
    const scr = screenRef.current
    const wrap = scr?.parentElement
    if (!scr || !wrap) return
    const measure = () => {
      const w = Math.min(scr.offsetWidth, wrap.clientWidth - scr.offsetLeft)
      const h = Math.min(scr.offsetHeight, wrap.clientHeight - scr.offsetTop)
      const next = fitRoom(room, w, h)
      if (!next) return
      setFit((prev) => (prev && prev.k === next.k && prev.width === next.width && prev.height === next.height ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [screenRef, room])

  return fit
}
