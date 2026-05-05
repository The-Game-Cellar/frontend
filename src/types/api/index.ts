import type { components as GameComponents, paths as GamePaths } from './game'
import type { components as LibraryComponents, paths as LibraryPaths } from './library'
import type { components as RecommendationComponents, paths as RecommendationPaths } from './recommendation'

export type GameResponse = GameComponents['schemas']['GameResponse']
export type GameSearchResponse = GameComponents['schemas']['GameSearchResponse']
export type AgeRatingDTO = GameComponents['schemas']['AgeRatingDTO']
export type MultiplayerModeDTO = GameComponents['schemas']['MultiplayerModeDTO']
export type ReleaseDateDTO = GameComponents['schemas']['ReleaseDateDTO']
export type PlatformGroup = GameComponents['schemas']['PlatformGroup']
export type PlatformsResponse = GameComponents['schemas']['PlatformsResponse']

export type UserGameDTO = LibraryComponents['schemas']['UserGameDTO']
export type AddGameRequest = LibraryComponents['schemas']['AddGameRequest']
export type UpdateGameRequest = LibraryComponents['schemas']['UpdateGameRequest']
export type AddPlatformRequest = LibraryComponents['schemas']['AddPlatformRequest']
export type UserPlatformDTO = LibraryComponents['schemas']['UserPlatformDTO']
export type UserStatsDTO = LibraryComponents['schemas']['UserStatsDTO']
export type AccountExportDTO = LibraryComponents['schemas']['AccountExportDTO']

export type RecommendationDTO = RecommendationComponents['schemas']['RecommendationDTO']
export type BecauseYouLikedDTO = RecommendationComponents['schemas']['BecauseYouLikedDTO']
export type GroupedRecommendationsResponse = RecommendationComponents['schemas']['GroupedRecommendationsResponse']
export type RecommendationRow = RecommendationComponents['schemas']['RecommendationRow']
export type PersonalizedRequest = RecommendationComponents['schemas']['PersonalizedRequest']
export type GroupedRequest = RecommendationComponents['schemas']['GroupedRequest']
export type DashboardDTO = RecommendationComponents['schemas']['DashboardDTO']

export type GameStatus = NonNullable<UserGameDTO['status']>

export type GamePathsType = GamePaths
export type LibraryPathsType = LibraryPaths
export type RecommendationPathsType = RecommendationPaths
