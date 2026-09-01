import type { RecommendationDTO } from '../types/api'

// The connection behind a recommendation, read off the DTO and never invented. Three rungs:
// a rated seed with the features it shares, shared features alone, or the service's own reason.
export type RecommendationConnection =
  | { kind: 'seed'; seedIgdbId: number; seedName: string; seedRating: number; tags: string[] }
  | { kind: 'tags'; tags: string[] }
  | { kind: 'reason'; text: string; tags: string[] }

export const MAX_REASON_TAGS = 2

type ConnectionFields = Pick<RecommendationDTO, 'seedIgdbId' | 'seedName' | 'seedRating' | 'sharedTags' | 'reason'>

export const describeConnection = (rec: ConnectionFields): RecommendationConnection => {
  const tags = (rec.sharedTags ?? []).filter((t): t is string => typeof t === 'string' && t.length > 0).slice(0, MAX_REASON_TAGS)
  // A seed without a rating is a catalog anchor ("Similar to X"), which the reason already names.
  if (rec.seedIgdbId != null && rec.seedName && rec.seedRating != null && tags.length > 0) {
    return { kind: 'seed', seedIgdbId: rec.seedIgdbId, seedName: rec.seedName, seedRating: rec.seedRating, tags }
  }
  if (rec.seedIgdbId == null && tags.length > 0) {
    return { kind: 'tags', tags }
  }
  return { kind: 'reason', text: rec.reason ?? '', tags }
}

export const connectionText = (c: RecommendationConnection): string => {
  switch (c.kind) {
    case 'seed':
      return `Because you rated ${c.seedName} ${c.seedRating} · ${c.tags.join(', ')}`
    case 'tags':
      return `Matches your taste for ${c.tags.join(', ')}`
    case 'reason':
      return c.text
  }
}
