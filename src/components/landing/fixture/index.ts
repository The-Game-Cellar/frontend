import data from './landing-games.json'
import poolText from './covers-pool.txt?raw'

export type Status = 'PLAYING' | 'BACKLOG' | 'WISHLIST' | 'DUSTY' | 'COMPLETED' | 'DROPPED'

export interface Game {
  id: number
  name: string
  year: number | null
  score: number | null
  cover: string | null
  // A search result from game_db rather than a game of the cover pool.
  db: boolean
}

export interface PoolCover {
  cover: string
  name: string
  family: string
}

type GameRow = [number, string, number | null, number | null, string | null]
type DbGameRow = [number, string, number | null, number | null, string | null, number]

export interface ExploreQuery {
  term: string
  count: number
  ids: number[]
}

interface FixtureFile {
  games: GameRow[]
  reserve: Record<Status, number[]>
  popular: number[]
  explore: { total: number; queries: [string, number, number[]][] }
  dbgames: DbGameRow[]
}

const fixture = data as unknown as FixtureFile

export const GAMES = new Map<number, Game>()
fixture.games.forEach(([id, name, year, score, cover]) => GAMES.set(id, { id, name, year, score, cover, db: false }))
fixture.dbgames.forEach(([id, name, year, score, cover]) => {
  if (!GAMES.has(id)) GAMES.set(id, { id, name, year, score, cover, db: true })
})

export function game(id: number): Game {
  const g = GAMES.get(id)
  if (!g) throw new Error(`Front page fixture has no game ${id}`)
  return g
}

export const RESERVE: Readonly<Record<Status, readonly number[]>> = fixture.reserve
export const POPULAR: readonly number[] = fixture.popular
export const EXPLORE_TOTAL = fixture.explore.total
export const EXPLORE_QUERIES: readonly ExploreQuery[] = fixture.explore.queries.map(([term, count, ids]) => ({ term, count, ids }))

// One line per game of the mosaic's pool: cover id, name, rating count, series key.
export const COVER_POOL: readonly PoolCover[] = poolText
  .split(/\r?\n/)
  .filter((line) => line.length > 0)
  .map((line) => {
    const [cover, name, , family] = line.split('|')
    return { cover, name, family }
  })

export function coverUrl(coverId: string): string {
  return `https://images.igdb.com/igdb/image/upload/t_cover_small_2x/${coverId}.jpg`
}
