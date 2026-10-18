import { game, RESERVE } from './fixture'
import type { Game, Status } from './fixture'
import { Demo, LIB_BASE, STATUSES, halfStep } from './demo'
import type { Random } from './demo'

export type LibraryView = 'library' | 'dusty'

export interface LibEntry {
  game: Game
  status: Status
  rating: number | null
}

export interface CellarSnapshot {
  entries: readonly LibEntry[]
  version: number
  started: Readonly<Record<LibraryView, boolean>>
  // Cards wearing the lifted ring, per screen.
  picks: Readonly<Record<LibraryView, ReadonlySet<number>>>
  // Dusty cards losing their dust, shown in Playing's colour while it blows off.
  blowing: ReadonlySet<number>
}

interface MutableEntry {
  game: Game
  status: Status
  rating: number | null
}

const RATED: ReadonlySet<Status> = new Set<Status>(['PLAYING', 'COMPLETED', 'DROPPED'])
const LIBRARY_STEP_MS = 4600
const DUSTY_FIRST_MS = 2300
const DUSTY_STEP_MS = 6200

// The demo library the Library and Dusty screens share. Every move is a swap with Playing, so no shelf a screen
// shows ever loses a card. Library: one game leaves Playing for Backlog, Completed or Dropped as one from there
// takes its place, both wearing the lifted ring. Dusty: a dusty game is picked up and loses its dust while a
// Playing game turns Dusty and the dust settles on it.
export class DemoCellar extends Demo<CellarSnapshot> {
  private entries: MutableEntry[] = []
  private readonly fill: Record<LibraryView, number> = { library: 6, dusty: 6 }
  private readonly busy = new Set<number>()
  private readonly picks: Record<LibraryView, Set<number>> = { library: new Set(), dusty: new Set() }
  private readonly blowing = new Set<number>()
  private readonly started: Record<LibraryView, boolean> = { library: false, dusty: false }
  private version = 0
  private fillTimer: ReturnType<typeof setTimeout> | null = null
  private readonly random: Random

  constructor(random: Random = Math.random) {
    super()
    this.random = random
    this.build()
  }

  protected snap(): CellarSnapshot {
    return {
      entries: this.entries.map((e) => ({ ...e })),
      version: this.version,
      started: { ...this.started },
      picks: { library: new Set(this.picks.library), dusty: new Set(this.picks.dusty) },
      blowing: new Set(this.blowing),
    }
  }

  protected emit(): void {
    this.version++
    super.emit()
  }

  // Every shelf the Library screen shows is a whole row at its width: one row for Playing, since a second would
  // show, two for Backlog and Completed; the Dusty wall fills its screen with a row to spare.
  private build(): void {
    const c = this.fill.library
    const want: Record<Status, number> = { PLAYING: c, BACKLOG: 2 * c, WISHLIST: c, DUSTY: this.fill.dusty, COMPLETED: 2 * c, DROPPED: c }
    const out: MutableEntry[] = []
    STATUSES.forEach((s) => {
      const ids = LIB_BASE.filter(([, status]) => status === s).map(([id]) => id).concat(RESERVE[s])
      ids.slice(0, want[s]).forEach((id) => {
        const g = game(id)
        out.push({ game: g, status: s, rating: RATED.has(s) && g.score !== null ? halfStep(g.score) : null })
      })
    })
    this.entries = out
  }

  // Each screen reports how many cards its fit makes room for; a change rebuilds the library.
  setFill(view: LibraryView, size: number): void {
    if (this.fill[view] === size) return
    this.fill[view] = size
    if (this.fillTimer) clearTimeout(this.fillTimer)
    this.fillTimer = setTimeout(() => {
      this.fillTimer = null
      this.build()
      this.emit()
    }, 60)
  }

  start(view: LibraryView, motion: boolean): void {
    if (this.started[view]) return
    this.started[view] = true
    this.emit()
    if (!motion) return
    if (view === 'library') {
      this.timers.every(LIBRARY_STEP_MS, () => this.libraryStep())
    } else {
      this.timers.later(DUSTY_FIRST_MS, () => {
        this.dustyStep()
        this.timers.every(DUSTY_STEP_MS, () => this.dustyStep())
      })
    }
  }

  private pickOf(s: Status): MutableEntry | undefined {
    const c = this.entries.filter((e) => e.status === s && !this.busy.has(e.game.id))
    return c[Math.floor(this.random() * c.length)]
  }

  libraryStep(): void {
    const s = (['BACKLOG', 'COMPLETED', 'DROPPED'] as const)[Math.floor(this.random() * 3)]
    const a = this.pickOf('PLAYING')
    const b = this.pickOf(s)
    if (!a || !b) return
    const ids = [a.game.id, b.game.id]
    ids.forEach((id) => {
      this.busy.add(id)
      this.picks.library.add(id)
    })
    this.emit()
    this.timers.later(1100, () => {
      a.status = s
      b.status = 'PLAYING'
      this.emit()
      this.timers.later(1400, () => {
        ids.forEach((id) => {
          this.picks.library.delete(id)
          this.busy.delete(id)
        })
        this.emit()
      })
    })
  }

  dustyStep(): void {
    const d = this.pickOf('DUSTY')
    const p = this.pickOf('PLAYING')
    if (!d || !p) return
    const ids = [d.game.id, p.game.id]
    ids.forEach((id) => this.busy.add(id))
    this.picks.dusty.add(d.game.id)
    this.emit()
    this.timers.later(900, () => {
      this.blowing.add(d.game.id)
      this.emit()
      this.timers.later(1100, () => {
        d.status = 'PLAYING'
        p.status = 'DUSTY'
        this.blowing.delete(d.game.id)
        this.picks.dusty.delete(d.game.id)
        this.emit()
        this.timers.later(3000, () => ids.forEach((id) => this.busy.delete(id)))
      })
    })
  }

  dispose(): void {
    super.dispose()
    if (this.fillTimer) clearTimeout(this.fillTimer)
  }
}
