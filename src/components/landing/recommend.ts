import { Demo, REC_SHELVES, shuffle } from './demo'
import type { Random } from './demo'

export interface RecShelf {
  label: string
  ids: readonly number[]
  // Bumped whenever the row is drawn anew, so its cards rise again.
  generation: number
  pressed: boolean
  refreshing: boolean
}

export interface RecommendSnapshot {
  started: boolean
  // The columns every row is laid out in, also where a short pool leaves slots empty.
  fit: number
  shelves: readonly RecShelf[]
}

interface Row {
  label: string
  pool: number[]
  at: number
  generation: number
  pressed: boolean
  refreshing: boolean
}

const REFRESH_EVERY_MS = 6400

// Recommend: the shelves for the demo library, one row that fits each; a Refresh dims the first row while the
// call runs and the next games of its pool rise in it.
export class RecommendDemo extends Demo<RecommendSnapshot> {
  private started = false
  private fit = 0
  private readonly rows: Row[]

  constructor(random: Random = Math.random) {
    super()
    this.rows = REC_SHELVES.map(([label, ids]) => ({ label, pool: shuffle(ids, random), at: 0, generation: 0, pressed: false, refreshing: false }))
  }

  protected snap(): RecommendSnapshot {
    return {
      started: this.started,
      fit: this.fit,
      shelves: this.rows.map((r) => ({
        label: r.label,
        ids: this.started ? this.visible(r) : [],
        generation: r.generation,
        pressed: r.pressed,
        refreshing: r.refreshing,
      })),
    }
  }

  private visible(r: Row): number[] {
    const out: number[] = []
    for (let k = 0; k < Math.min(this.fit, r.pool.length); k++) out.push(r.pool[(r.at + k) % r.pool.length])
    return out
  }

  // How many cards fit one row at the screen's width; a change draws every row anew.
  setFit(n: number): void {
    if (n === this.fit) return
    this.fit = n
    this.rows.forEach((r) => r.generation++)
    this.emit()
  }

  start(motion: boolean): void {
    if (this.started) return
    this.started = true
    this.rows.forEach((r) => r.generation++)
    this.emit()
    if (motion) this.timers.every(REFRESH_EVERY_MS, () => this.refresh(this.rows[0]))
  }

  private refresh(r: Row): void {
    r.pressed = true
    this.emit()
    this.timers.later(350, () => {
      r.pressed = false
      r.refreshing = true
      this.emit()
      this.timers.later(1200, () => {
        r.at = (r.at + this.fit) % r.pool.length
        r.refreshing = false
        r.generation++
        this.emit()
      })
    })
  }
}
