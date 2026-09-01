import { describe, expect, it } from 'vitest'
import { connectionText, describeConnection } from '../../services/recommendationReason'

describe('describeConnection', () => {
  it('names the seed with its rating and up to two shared tags', () => {
    const c = describeConnection({
      seedIgdbId: 1, seedName: 'Hades', seedRating: 9,
      sharedTags: ['Roguelike', 'Action', 'Indie'], reason: 'Based on your ratings',
    })
    expect(c).toEqual({ kind: 'seed', seedIgdbId: 1, seedName: 'Hades', seedRating: 9, tags: ['Roguelike', 'Action'] })
    expect(connectionText(c)).toBe('Because you rated Hades 9 · Roguelike, Action')
  })

  it('falls back to the shared tags when no seed qualified', () => {
    const c = describeConnection({ sharedTags: ['Role-playing (RPG)', 'Fantasy'], reason: 'Based on your ratings' })
    expect(c).toEqual({ kind: 'tags', tags: ['Role-playing (RPG)', 'Fantasy'] })
    expect(connectionText(c)).toBe('Matches your taste for Role-playing (RPG), Fantasy')
  })

  it('falls back to the reason when the data carries no connection', () => {
    const c = describeConnection({ sharedTags: [], reason: 'Popular on your platforms' })
    expect(c).toEqual({ kind: 'reason', text: 'Popular on your platforms', tags: [] })
    expect(connectionText(c)).toBe('Popular on your platforms')
  })

  it('keeps a catalog anchor on its own reason, since it is not a rated game', () => {
    const c = describeConnection({
      seedIgdbId: 1, seedName: 'The Witcher 3', sharedTags: ['Role-playing (RPG)'], reason: 'Similar to The Witcher 3',
    })
    expect(c).toEqual({ kind: 'reason', text: 'Similar to The Witcher 3', tags: ['Role-playing (RPG)'] })
  })

  it('never invents a connection from an empty DTO', () => {
    expect(describeConnection({})).toEqual({ kind: 'reason', text: '', tags: [] })
  })
})
