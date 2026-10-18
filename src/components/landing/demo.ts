import type { Status } from './fixture'

export type Random = () => number

export const STATUSES: readonly Status[] = ['PLAYING', 'BACKLOG', 'WISHLIST', 'DUSTY', 'COMPLETED', 'DROPPED']

export const LABEL: Readonly<Record<Status | 'All', string>> = {
  All: 'All', PLAYING: 'Playing', BACKLOG: 'Backlog', WISHLIST: 'Wishlist', DUSTY: 'Dusty', COMPLETED: 'Completed', DROPPED: 'Dropped',
}

export const COLOR: Readonly<Record<Status | 'All', string>> = {
  All: 'var(--s2)', PLAYING: 'var(--st-playing)', BACKLOG: 'var(--st-backlog)', WISHLIST: 'var(--st-wishlist)',
  DUSTY: 'var(--st-dusty)', COMPLETED: 'var(--st-completed)', DROPPED: 'var(--st-dropped)',
}

// The demo library both Library screens show, before the fixture's reserve fills each shelf: [igdbId, status].
export const LIB_BASE: readonly [number, Status][] = [
  [119133, 'PLAYING'], [119171, 'PLAYING'], [113112, 'PLAYING'], [75235, 'PLAYING'],
  [26472, 'BACKLOG'], [11737, 'BACKLOG'], [14593, 'BACKLOG'], [26226, 'BACKLOG'],
  [305152, 'WISHLIST'], [110248, 'WISHLIST'],
  [7334, 'DUSTY'], [9927, 'DUSTY'], [19564, 'DUSTY'], [11208, 'DUSTY'], [76882, 'DUSTY'],
  [1942, 'COMPLETED'], [72, 'COMPLETED'], [74, 'COMPLETED'], [25076, 'COMPLETED'],
  [5606, 'DROPPED'],
]

// Recommend for that library: its biggest genres first, each shelf a pool the Refresh moves on through.
export const REC_SHELVES: readonly [string, readonly number[]][] = [
  ['Adventure', [1070, 1026, 1103, 7346, 1077, 119388, 26758, 26192, 112875, 1078, 1105, 565, 1009, 732, 7331, 1128]],
  ['Role-playing (RPG)', [1802, 116, 418, 434, 20, 126, 2155, 1221, 14, 75, 76, 43]],
  ['Indie', [12517, 1352, 7342, 17000, 9061, 1983, 1384, 11233]],
]

// A rating in the demo library is the game's score rounded to the half step the rating control takes.
export function halfStep(v: number): number {
  return Math.round(v * 2) / 2
}

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
  return a
}

// Thousands separated by a thin space, as Explore prints its count.
export function formatCount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Timers a demo starts, all cleared together when its screen goes.
export class Timers {
  private readonly ids = new Set<ReturnType<typeof setTimeout>>()
  private readonly loops = new Set<ReturnType<typeof setInterval>>()

  later(ms: number, fn: () => void): void {
    const id = setTimeout(() => {
      this.ids.delete(id)
      fn()
    }, ms)
    this.ids.add(id)
  }

  every(ms: number, fn: () => void): void {
    this.loops.add(setInterval(fn, ms))
  }

  clear(): void {
    this.ids.forEach(clearTimeout)
    this.loops.forEach(clearInterval)
    this.ids.clear()
    this.loops.clear()
  }
}

// A small external store: a snapshot replaced on every change, for useSyncExternalStore.
export abstract class Demo<S> {
  private readonly listeners = new Set<() => void>()
  protected readonly timers = new Timers()
  private snapshot: S | null = null

  protected abstract snap(): S

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): S => {
    if (this.snapshot === null) this.snapshot = this.snap()
    return this.snapshot
  }

  protected emit(): void {
    this.snapshot = this.snap()
    this.listeners.forEach((l) => l())
  }

  dispose(): void {
    this.timers.clear()
  }
}
