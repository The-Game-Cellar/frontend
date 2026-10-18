import { EXPLORE_QUERIES, EXPLORE_TOTAL, POPULAR } from './fixture'
import type { ExploreQuery } from './fixture'
import { Demo } from './demo'
import type { Random } from './demo'

export interface ExploreSnapshot {
  version: number
  started: boolean
  query: string
  typing: boolean
  loading: boolean
  ids: readonly number[]
  count: number
}

// Explore's Browse: a search typed into the field, the wall cleared under the Loading line while the query runs,
// the answer rising in its place with the catalog's real count, then the field cleared and Popular back. The
// searches are game_db's own answers: every match counted, the first ones in the service's order.
export class ExploreDemo extends Demo<ExploreSnapshot> {
  private version = 0
  private started = false
  private query = ''
  private typing = false
  private loading = false
  private ids: readonly number[] = []
  private count = 0
  private next = 0
  private readonly random: Random
  private readonly queries: readonly ExploreQuery[]

  constructor(random: Random = Math.random, queries: readonly ExploreQuery[] = EXPLORE_QUERIES) {
    super()
    this.random = random
    this.queries = queries
  }

  protected snap(): ExploreSnapshot {
    return {
      version: this.version,
      started: this.started,
      query: this.query,
      typing: this.typing,
      loading: this.loading,
      ids: this.ids,
      count: this.count,
    }
  }

  protected emit(): void {
    this.version++
    super.emit()
  }

  start(motion: boolean): void {
    if (this.started) return
    this.started = true
    this.ids = POPULAR
    this.count = EXPLORE_TOTAL
    this.emit()
    if (motion) this.timers.later(2600, () => this.step())
  }

  private step(): void {
    if (!this.queries.length) return
    const item = this.queries[this.next++ % this.queries.length]
    this.type(item.term, () => {
      this.load(() => {
        this.ids = item.ids
        this.count = item.count
        this.emit()
        this.timers.later(4800, () => {
          this.query = ''
          this.typing = false
          this.emit()
          this.load(() => {
            this.ids = POPULAR
            this.count = EXPLORE_TOTAL
            this.emit()
            this.timers.later(3600, () => this.step())
          })
        })
      })
    })
  }

  private type(text: string, done: () => void): void {
    this.typing = true
    const at = (i: number) => {
      if (i > text.length) {
        done()
        return
      }
      this.query = text.slice(0, i)
      this.emit()
      this.timers.later(i === 0 ? 400 : 130 + this.random() * 110, () => at(i + 1))
    }
    at(0)
  }

  // The wall cleared under Loading while the query runs; the answer replaces Loading in the same frame.
  private load(done: () => void): void {
    this.ids = []
    this.loading = true
    this.emit()
    this.timers.later(1100, () => {
      this.loading = false
      done()
    })
  }
}
