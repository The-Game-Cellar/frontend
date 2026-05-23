import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import {
  getGameById,
  gameKeys,
  useGameById,
  useByFranchise,
  useByCollection,
  useEditions,
} from '../services/gameService'
import { useUserGameByIgdb, useUpdateGame, useRemoveGame } from '../services/libraryService'
import { useSimilar } from '../services/recommendationService'
import GameCard from '../components/common/GameCard'
import CoverFallback from '../components/common/CoverFallback'
import TruncatedText from '../components/common/TruncatedText'
import AddGameModal from '../components/game/AddGameModal'
import RatingWidget from '../components/game/RatingWidget'
import type {
  AgeRatingDTO,
  GameResponse,
  GameStatus,
  MultiplayerModeDTO,
  RecommendationDTO,
  ReleaseDateDTO,
  UserGameDTO,
} from '../types/api'

type SelectableStatus = Exclude<GameStatus, 'DUSTY'>
type AddonKind = 'DLC' | 'EXPANSION'
type AddonPreview = GameResponse & { _kind: AddonKind }

const statusStyles: Record<GameStatus, string> = {
  PLAYING:   'bg-[#22c55e20] text-[#22c55e] border-[#22c55e40]',
  BACKLOG:   'bg-[#2563eb20] text-[#2563eb] border-[#2563eb40]',
  COMPLETED: 'bg-[#a855f720] text-[#a855f7] border-[#a855f740]',
  DROPPED:   'bg-[#ef444420] text-[#ef4444] border-[#ef444440]',
  WISHLIST:  'bg-[#f59e0b20] text-[#f59e0b] border-[#f59e0b40]',
  DUSTY:     'bg-[#8891a820] text-[#8891a8] border-[#8891a840]',
}

const statusGlowShadow: Record<GameStatus, string> = {
  PLAYING:   '0 0 8px #22c55e60',
  BACKLOG:   '0 0 8px #2563eb60',
  COMPLETED: '0 0 8px #a855f760',
  DROPPED:   '0 0 8px #ef444460',
  WISHLIST:  '0 0 8px #f59e0b60',
  DUSTY:     '0 0 8px #8891a860',
}

const ALL_STATUSES: SelectableStatus[] = ['PLAYING', 'BACKLOG', 'WISHLIST', 'COMPLETED', 'DROPPED']

interface SeriesPick {
  name: string
  kind: 'franchise' | 'collection'
}

function formatReleaseDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function pickBestSeries(gameName: string | undefined, franchises: string[] | undefined, collections: string[] | undefined): SeriesPick | null {
  const fr: SeriesPick[] = (Array.isArray(franchises) ? franchises : []).filter((n): n is string => !!n).map((n) => ({ name: n, kind: 'franchise' as const }))
  const co: SeriesPick[] = (Array.isArray(collections) ? collections : []).filter((n): n is string => !!n).map((n) => ({ name: n, kind: 'collection' as const }))
  const all = [...fr, ...co]
  if (all.length === 0) return null
  const fallback = fr[0] || co[0]
  if (!gameName) return fallback
  const lower = gameName.toLowerCase()
  const matches = all.filter((c) => lower.includes(c.name.toLowerCase()))
  if (matches.length === 0) return fallback
  return matches.slice().sort((a, b) => b.name.length - a.name.length)[0]
}

const CATEGORY_LABELS: Record<number, string> = {
  0:  'Edition of',
  3:  'Edition of',
  4:  'Standalone Expansion of',
  5:  'Modded version of',
  8:  'Remake of',
  9:  'Remaster of',
  10: 'Complete Edition of',
  14: 'Update for',
}

const CATEGORY_NOUNS: Record<number, string> = {
  0:  'Edition',
  4:  'Standalone Expansion',
  5:  'Mod',
  6:  'Episode',
  7:  'Season',
  8:  'Remake',
  9:  'Remaster',
  10: 'Complete Edition',
  11: 'Port',
  12: 'Fork',
  13: 'Pack',
  14: 'Update',
}

function categoryLabel(category: number | null | undefined): string | null {
  if (category == null) return null
  return CATEGORY_LABELS[category] ?? null
}

function categoryNoun(category: number | null | undefined): string {
  if (category == null) return 'Edition'
  return CATEGORY_NOUNS[category] ?? 'Edition'
}

function pickAgeRating(ageRatings: AgeRatingDTO[] | undefined): AgeRatingDTO | null {
  if (!Array.isArray(ageRatings) || ageRatings.length === 0) return null
  const labeled = ageRatings.filter((r) => r?.body && r?.label)
  if (labeled.length === 0) return null
  const pegi = labeled.find((r) => r.body === 'PEGI')
  if (pegi) return pegi
  const esrb = labeled.find((r) => r.body === 'ESRB')
  if (esrb) return esrb
  return labeled[0]
}

function summarizeModes(gameModes: string[] | undefined, multiplayerModes: MultiplayerModeDTO[] | undefined): string[] {
  interface ModeAggregate {
    onlineMax: number
    offlineMax: number
    onlineCoopMax: number
    offlineCoopMax: number
    lan: boolean
    splitscreen: boolean
    campaignCoop: boolean
    dropIn: boolean
  }
  if (Array.isArray(multiplayerModes) && multiplayerModes.length > 0) {
    const max = (a: number, b: number | undefined) => Math.max(a, b ?? 0)
    const initial: ModeAggregate = { onlineMax: 0, offlineMax: 0, onlineCoopMax: 0, offlineCoopMax: 0, lan: false, splitscreen: false, campaignCoop: false, dropIn: false }
    const agg = multiplayerModes.reduce<ModeAggregate>(
      (acc, m) => ({
        onlineMax: max(acc.onlineMax, m.onlineMax),
        offlineMax: max(acc.offlineMax, m.offlineMax),
        onlineCoopMax: max(acc.onlineCoopMax, m.onlineCoopMax),
        offlineCoopMax: max(acc.offlineCoopMax, m.offlineCoopMax),
        lan: acc.lan || !!m.lanCoop,
        splitscreen: acc.splitscreen || !!m.splitscreen,
        campaignCoop: acc.campaignCoop || !!m.campaignCoop,
        dropIn: acc.dropIn || !!m.dropIn,
      }),
      initial,
    )
    const chips: string[] = []
    if (agg.onlineMax > 1) chips.push(`Up to ${agg.onlineMax} online`)
    if (agg.offlineMax > 1) chips.push(`Up to ${agg.offlineMax} local`)
    if (agg.splitscreen) chips.push('Split-screen')
    if (agg.campaignCoop) chips.push('Co-op campaign')
    if (agg.dropIn) chips.push('Drop-in co-op')
    if (agg.lan) chips.push('LAN')
    if (chips.length === 0) return []
    if (chips.length <= 4) return chips
    return [...chips.slice(0, 3), `+${chips.length - 3} more`]
  }
  const gm = Array.isArray(gameModes) ? gameModes.map((s) => String(s).toLowerCase()) : []
  if (gm.length === 0) return []
  const hasSingle = gm.some((m) => m.includes('single'))
  const hasMulti = gm.some((m) =>
    m.includes('multiplayer') || m.includes('co-op') || m.includes('cooperative') ||
    m.includes('split screen') || m.includes('battle royale') || m.includes('mmo')
  )
  if (hasSingle && !hasMulti) return ['Single-player']
  return []
}

function formatReleaseDateRow(rd: ReleaseDateDTO | undefined): string {
  if (rd?.human) return rd.human
  return formatReleaseDate(rd?.date) ?? 'TBA'
}

function hasVariedReleaseDates(releaseDates: ReleaseDateDTO[] | undefined): boolean {
  if (!Array.isArray(releaseDates) || releaseDates.length < 2) return false
  const distinct = new Set(releaseDates.map((r) => r?.date ?? r?.human ?? ''))
  return distinct.size > 1
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
}

export default function GameDetail() {
  const { igdbId } = useParams<{ igdbId: string }>()
  const navigate = useNavigate()

  const isValidId = !!igdbId && /^\d+$/.test(String(igdbId)) && Number(igdbId) >= 1
  const numericId = isValidId ? Number(igdbId) : 0

  const { data: game, isPending: gameLoading, error: gameError } = useGameById(numericId, isValidId)
  const { data: libraryEntryData } = useUserGameByIgdb(numericId, isValidId)
  const libraryEntry: UserGameDTO | null = libraryEntryData ?? null
  const { data: similarData } = useSimilar(numericId, 50, isValidId)
  const similar: RecommendationDTO[] = similarData ?? []

  const updateGameMutation = useUpdateGame()
  const removeGameMutation = useRemoveGame()
  const updating = updateGameMutation.isPending

  const series = useMemo(
    () => pickBestSeries(game?.name, game?.franchises, game?.collections),
    [game?.name, game?.franchises, game?.collections],
  )
  const seriesName = series?.name ?? ''
  const isFranchise = series?.kind === 'franchise'
  const { data: franchiseDataF } = useByFranchise(seriesName, 50, numericId, !!series && isFranchise)
  const { data: franchiseDataC } = useByCollection(seriesName, 50, numericId, !!series && !isFranchise)
  const franchiseGames: GameResponse[] = (franchiseDataF ?? franchiseDataC ?? [])

  const editionsEnabled = isValidId && !!game && (game.category === 0 || game.category == null)
  const { data: editionsData } = useEditions(numericId, editionsEnabled)
  const editions: GameResponse[] = editionsData ?? []

  const addonTagged = useMemo<{ id: number; kind: AddonKind }[]>(
    () => [
      ...(Array.isArray(game?.expansionIds) ? game.expansionIds : []).map((id) => ({ id, kind: 'EXPANSION' as AddonKind })),
      ...(Array.isArray(game?.dlcIds) ? game.dlcIds : []).map((id) => ({ id, kind: 'DLC' as AddonKind })),
    ],
    [game?.expansionIds, game?.dlcIds],
  )
  const addonQueries = useQueries({
    queries: addonTagged.map((t) => ({
      queryKey: gameKeys.byId(t.id),
      queryFn: () => getGameById(t.id).then((r) => r.data),
    })),
  })
  const addonsLoading = addonQueries.some((q) => q.isLoading)
  const addonPreviews: AddonPreview[] = useMemo(
    () =>
      addonQueries
        .map((q, i): AddonPreview | null => (q.data ? { ...q.data, _kind: addonTagged[i].kind } : null))
        .filter((p): p is AddonPreview => p !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addonQueries.map((q) => q.dataUpdatedAt).join('|'), addonTagged],
  )
  const addons: AddonPreview[] | null = addonsLoading
    ? null
    : [...addonPreviews].sort((a, b) => {
        const da = a.released ? Date.parse(a.released) : -Infinity
        const db = b.released ? Date.parse(b.released) : -Infinity
        return db - da
      })

  const [showModal, setShowModal] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showAddons, setShowAddons] = useState(false)
  const [hoveredAddon, setHoveredAddon] = useState<number | null>(null)
  const [showFranchiseModal, setShowFranchiseModal] = useState(false)
  const [franchiseRowWidth, setFranchiseRowWidth] = useState(0)
  const franchiseRowRef = useRef<HTMLDivElement | null>(null)
  const [similarRowWidth, setSimilarRowWidth] = useState(0)
  const similarRowRef = useRef<HTMLDivElement | null>(null)
  const [releaseExpanded, setReleaseExpanded] = useState(false)
  const [editionsExpanded, setEditionsExpanded] = useState(false)

  // Reset per-igdb UI state on navigation between game-detail pages.
  useEffect(() => {
    setShowAddons(false)
    setHoveredAddon(null)
    setReleaseExpanded(false)
    setEditionsExpanded(false)
    setShowFranchiseModal(false)
  }, [igdbId])

  const showActionError = (msg: string) => {
    setActionError(msg)
    setTimeout(() => setActionError(null), 3000)
  }

  const loading = isValidId && gameLoading
  const error: string | null = !isValidId
    ? 'Invalid game id.'
    : gameError
    ? 'Failed to load game.'
    : null

  const fetchLibraryEntry = () => {
    // Library invalidation handled automatically by useAddGame's onSuccess.
    // Function kept as a no-op so AddGameModal's onAdded callback signature stays compatible.
  }

  const handleStatusChange = (newStatus: SelectableStatus) => {
    if (!libraryEntry || libraryEntry.id == null) return
    updateGameMutation.mutate(
      { gameId: libraryEntry.id, data: { status: newStatus } },
      {
        onError: () => showActionError('Failed to update status. Please try again.'),
        onSettled: () => setShowStatusMenu(false),
      },
    )
  }

  const handleRatingChange = (rating: number) => {
    if (!libraryEntry || libraryEntry.id == null) return
    updateGameMutation.mutate(
      { gameId: libraryEntry.id, data: { rating } },
      { onError: () => showActionError('Failed to save rating. Please try again.') },
    )
  }

  const screenshots: string[] = Array.isArray(game?.screenshotUrls) ? game.screenshotUrls : []
  const videos: string[] = Array.isArray(game?.videoIds) ? game.videoIds : []
  const dlcIds: number[] = Array.isArray(game?.dlcIds) ? game.dlcIds : []
  const expansionIds: number[] = Array.isArray(game?.expansionIds) ? game.expansionIds : []
  const addonCount = dlcIds.length + expansionIds.length

  const handleOpenAddons = () => {
    setShowAddons(true)
  }

  useEffect(() => {
    if (!showAddons) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowAddons(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showAddons])

  useEffect(() => {
    if (!showFranchiseModal) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowFranchiseModal(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showFranchiseModal])

  useEffect(() => {
    const el = franchiseRowRef.current
    if (!el) return
    setFranchiseRowWidth(el.clientWidth)
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width
      if (w) setFranchiseRowWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [franchiseGames.length])

  useEffect(() => {
    const el = similarRowRef.current
    if (!el) return
    setSimilarRowWidth(el.clientWidth)
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width
      if (w) setSimilarRowWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [similar.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      else if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : screenshots.length - 1))
      else if (e.key === 'ArrowRight') setLightboxIndex((i) => (i !== null && i < screenshots.length - 1 ? i + 1 : 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, screenshots.length])

  const handleRemove = () => {
    if (!libraryEntry || libraryEntry.id == null) return
    removeGameMutation.mutate(libraryEntry.id, {
      onSettled: () => setShowRemoveConfirm(false),
      onError: () => showActionError('Failed to remove game. Please try again.'),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#ef4444]">{error ?? 'Game not found.'}</p>
      </div>
    )
  }

  const showRating = libraryEntry && libraryEntry.status !== 'WISHLIST'
  const description = stripHtml(game.description)
  const hasMedia = screenshots.length > 0 || videos.length > 0
  const modalGame = game.igdbId != null && game.name != null
    ? { igdbId: game.igdbId, name: game.name, platforms: game.platforms ?? [] }
    : null

  return (
    <>
      {showModal && modalGame && (
        <AddGameModal
          game={modalGame}
          onClose={() => setShowModal(false)}
          onAdded={fetchLibraryEntry}
        />
      )}

      {/* Close status menu on outside click */}
      {showStatusMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
      )}

      {/* Screenshot lightbox */}
      {lightboxIndex !== null && screenshots[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-enter"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative inline-block"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={screenshots[lightboxIndex]}
              alt={`${game.name} screenshot ${lightboxIndex + 1}`}
              className="block max-h-[90vh] max-w-[90vw] rounded-lg border border-[#1e2035]"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute bottom-full right-0 mb-2 w-12 h-12 flex items-center justify-center rounded bg-[#111220] border border-[#2a2d45] text-[#e8e4dc] hover:text-[#f72585] hover:border-[#f72585] hover:[box-shadow:0_0_12px_#f7258560,0_0_24px_#f7258530] hover:[text-shadow:0_0_8px_#f72585] text-2xl leading-none transition-[color,border-color,box-shadow,text-shadow] duration-200"
              aria-label="Close"
            >
              ✕
            </button>
            {screenshots.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : screenshots.length - 1))}
                  className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded bg-[#111220] border border-[#2a2d45] text-[#e8e4dc] hover:text-[#f72585] hover:border-[#f72585] hover:[box-shadow:0_0_12px_#f7258560,0_0_24px_#f7258530] hover:[text-shadow:0_0_8px_#f72585] text-4xl leading-none transition-[color,border-color,box-shadow,text-shadow] duration-200"
                  aria-label="Previous screenshot"
                >
                  ‹
                </button>
                <button
                  onClick={() => setLightboxIndex((i) => (i !== null && i < screenshots.length - 1 ? i + 1 : 0))}
                  className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded bg-[#111220] border border-[#2a2d45] text-[#e8e4dc] hover:text-[#f72585] hover:border-[#f72585] hover:[box-shadow:0_0_12px_#f7258560,0_0_24px_#f7258530] hover:[text-shadow:0_0_8px_#f72585] text-4xl leading-none transition-[color,border-color,box-shadow,text-shadow] duration-200"
                  aria-label="Next screenshot"
                >
                  ›
                </button>
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs text-[#8891a8] bg-[#111220cc] backdrop-blur-sm px-2 py-1 rounded">
                  {lightboxIndex + 1} / {screenshots.length}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* DLC & Expansions modal */}
      {showAddons && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-enter"
          onClick={() => setShowAddons(false)}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg w-fit max-w-5xl max-h-[85vh] flex flex-col animate-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#1e2035]">
              <div className="space-y-0.5">
                <h2 className="text-lg font-medium text-[#e8e4dc]">DLC & Expansions</h2>
                <TruncatedText as="p" text={game.name ?? ''} className="text-xs text-[#4a5068]" />
              </div>
              <button
                onClick={() => setShowAddons(false)}
                className="text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] text-xl leading-none transition-[color,text-shadow] duration-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              {addonsLoading && (
                <div className="flex items-center justify-center h-32">
                  <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
                </div>
              )}
              {!addonsLoading && addons && addons.length === 0 && (
                <p className="text-sm text-[#8891a8] text-center py-8">No add-ons available in cache.</p>
              )}
              {!addonsLoading && addons && addons.length > 0 && (
                <div className="flex flex-wrap gap-4 justify-center">
                  {addons.map((a) => (
                    <div key={a.igdbId} className="relative">
                      <span
                        className="absolute top-2 left-2 z-10 text-[10px] px-1.5 py-0.5 rounded font-medium tracking-wider bg-[#111220] text-[#f59e0b] border border-[#f59e0b] [box-shadow:0_0_4px_#f59e0b]"
                      >
                        {a._kind}
                      </span>
                      <GameCard
                        game={a}
                        onClick={() => { setShowAddons(false); navigate(`/games/${a.igdbId}`) }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Franchise modal */}
      {showFranchiseModal && pickBestSeries(game.name, game.franchises, game.collections) && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-enter"
          onClick={() => setShowFranchiseModal(false)}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg w-fit max-w-5xl max-h-[85vh] flex flex-col animate-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#1e2035]">
              <div className="space-y-0.5">
                <h2 className="text-lg font-medium text-[#e8e4dc]">{pickBestSeries(game.name, game.franchises, game.collections)?.name} series</h2>
                <p className="text-xs text-[#4a5068]">{franchiseGames.length} games</p>
              </div>
              <button
                onClick={() => setShowFranchiseModal(false)}
                className="text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] text-xl leading-none transition-[color,text-shadow] duration-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <div className="flex flex-wrap gap-4 justify-center">
                {franchiseGames.map((g) => (
                  <GameCard
                    key={g.igdbId}
                    game={g}
                    onClick={() => { setShowFranchiseModal(false); navigate(`/games/${g.igdbId}`) }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirm modal */}
      {showRemoveConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-enter"
          onClick={() => setShowRemoveConfirm(false)}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-xs space-y-4 animate-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#e8e4dc]">Remove from library?</p>
              <p className="text-xs text-[#4a5068] truncate" title={game.name}>{game.name}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="px-4 py-1.5 border border-[#2a2d45] text-[#8891a8] text-xs rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                className="px-4 py-1.5 bg-[#ef444410] border border-[#ef4444] text-[#ef4444] text-xs rounded [box-shadow:0_0_8px_#ef444440,0_0_20px_#ef444420] hover:bg-[#ef444420] hover:[box-shadow:0_0_12px_#ef444450,0_0_25px_#ef444430] transition-[background-color,box-shadow] duration-200"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8 animate-enter">
        {actionError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            {actionError}
          </p>
        )}

        {/* Hero */}
        <div className="relative rounded-lg bg-[#111220] border border-[#1e2035]">
          {game.backgroundImage && (
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center scale-110 opacity-15 blur-sm"
                style={{ backgroundImage: `url("${encodeURI(game.backgroundImage)}")` }}
              />
            </div>
          )}

          <div className="relative flex flex-col-reverse md:grid md:grid-cols-3 gap-8 p-6">
            {/* Info */}
            <div className="md:col-span-2 flex flex-col gap-5">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">{game.name}</h1>

                {categoryLabel(game.category) && (game.parentGameId || game.parentGameName) && (
                  <p className="text-xs text-[#8891a8]">
                    {categoryLabel(game.category)}{' '}
                    {game.parentGameId ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/games/${game.parentGameId}`)}
                        className="text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-[color,text-shadow] duration-200"
                      >
                        {game.parentGameName ?? 'Unknown game'}
                      </button>
                    ) : (
                      <span>{game.parentGameName ?? 'Unknown game'}</span>
                    )}
                  </p>
                )}

                {(() => {
                  const baseLine = formatReleaseDate(game.released)
                  const expandable = hasVariedReleaseDates(game.releaseDates)
                  if (!baseLine && !expandable) return null
                  if (!expandable) {
                    return baseLine ? <p className="text-xs text-[#8891a8]">Released {baseLine}</p> : null
                  }
                  return (
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setReleaseExpanded((v) => !v)}
                        className="text-xs text-[#8891a8] hover:text-[#e8e4dc] transition-colors duration-200 inline-flex items-center gap-1"
                        aria-expanded={releaseExpanded}
                      >
                        Released {baseLine ?? formatReleaseDateRow(game.releaseDates?.[0])}
                        <span
                          className={`inline-block transition-transform duration-200 motion-reduce:transition-none ${releaseExpanded ? 'rotate-90' : ''}`}
                          aria-hidden="true"
                        >
                          ▸
                        </span>
                      </button>
                      {releaseExpanded && (
                        <ul className="text-xs text-[#8891a8] space-y-0.5 pl-3 motion-safe:animate-enter">
                          {[...(game.releaseDates ?? [])]
                            .sort((a, b) => (a?.date ?? '').localeCompare(b?.date ?? ''))
                            .map((rd, i) => (
                              <li key={`${rd.platform}-${i}`} className="flex gap-2">
                                <span className="text-[#4a5068] min-w-[8rem]">{rd.platform ?? 'Unknown'}</span>
                                <span>{formatReleaseDateRow(rd)}</span>
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  )
                })()}

                {editions.length > 0 && (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setEditionsExpanded((v) => !v)}
                      className="text-xs text-[#8891a8] hover:text-[#e8e4dc] transition-colors duration-200 inline-flex items-center gap-1"
                      aria-expanded={editionsExpanded}
                    >
                      {editions.length} {editions.length === 1 ? 'edition' : 'editions'}
                      <span
                        className={`inline-block transition-transform duration-200 motion-reduce:transition-none ${editionsExpanded ? 'rotate-90' : ''}`}
                        aria-hidden="true"
                      >
                        ▸
                      </span>
                    </button>
                    {editionsExpanded && (
                      <ul className="text-xs text-[#8891a8] space-y-0.5 pl-3 motion-safe:animate-enter">
                        {editions.map((e) => (
                          <li key={e.igdbId}>
                            <button
                              type="button"
                              onClick={() => navigate(`/games/${e.igdbId}`)}
                              className="text-left hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-[color,text-shadow] duration-200"
                            >
                              <span className="text-[#4a5068]">{categoryNoun(e.category)}:</span>{' '}
                              <span>{e.name}</span>
                              {formatReleaseDate(e.released) && (
                                <span className="text-[#4a5068]"> · {formatReleaseDate(e.released)}</span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {game.genres && game.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {game.genres.map((g) => (
                      <span key={g} className="text-xs px-2 py-0.5 rounded bg-[#1e2035] text-[#8891a8] border border-[#3a3d58]">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                {game.platforms && game.platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {game.platforms.map((p) => (
                      <span key={p} className="text-xs px-2 py-0.5 rounded bg-[#1e2035] text-[#8891a8] border border-[#3a3d58]">{p}</span>
                    ))}
                  </div>
                )}

                {(() => {
                  const chips = summarizeModes(game.gameModes, game.multiplayerModes)
                  if (chips.length === 0) return null
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      {chips.map((c) => (
                        <span key={c} className="text-xs px-2 py-0.5 rounded bg-[#1e2035] text-[#8891a8] border border-[#3a3d58]">
                          {c}
                        </span>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Library actions */}
              <div className="relative z-30 flex flex-wrap items-center gap-3">
                {!libraryEntry ? (
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] active:scale-[0.97] transition-[box-shadow,transform] duration-200"
                  >
                    + Add to Library
                  </button>
                ) : (
                  <>
                    <div className="relative z-20">
                      <button
                        onClick={() => setShowStatusMenu((v) => !v)}
                        disabled={updating}
                        className={`text-xs px-2 py-0.5 rounded border font-medium transition-[background-color,color,border-color,box-shadow] duration-200 disabled:opacity-40 ${libraryEntry.status ? statusStyles[libraryEntry.status] : ''}`}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = libraryEntry.status ? statusGlowShadow[libraryEntry.status] : '' }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '' }}
                      >
                        {libraryEntry.status} ▾
                      </button>

                      {showStatusMenu && (
                        <div className="absolute top-full left-0 mt-1 flex flex-col gap-1 z-20">
                          {ALL_STATUSES.filter((s) => s !== libraryEntry.status).map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(s)}
                              disabled={updating}
                              className={`text-xs px-2 py-0.5 rounded border font-medium transition-[background-color,color,border-color,box-shadow] duration-200 disabled:opacity-40 ${statusStyles[s]}`}
                              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = statusGlowShadow[s] }}
                              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '' }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setShowRemoveConfirm(true)}
                      className="px-3 py-1.5 bg-[#ef444415] border border-[#ef4444] text-[#ef4444] text-xs rounded [box-shadow:0_0_8px_#ef444440,0_0_20px_#ef444420] hover:bg-[#ef444425] hover:[box-shadow:0_0_16px_#ef4444,0_0_36px_#ef444460] transition-[background-color,box-shadow] duration-200"
                    >
                      Remove
                    </button>
                  </>
                )}

              </div>

              {(() => {
                const ageRating = pickAgeRating(game.ageRatings)
                const hasPills = ageRating || game.rating != null || game.totalRating != null
                if (!hasPills && !showRating) return null
                return (
                <div className="mt-auto space-y-3">
                  {hasPills && (
                    <div className="flex flex-wrap gap-2">
                      {ageRating && (
                        <span
                          title={ageRating.body === 'PEGI' ? 'Pan European Game Information rating' : 'Entertainment Software Rating Board rating'}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-[#1e2035] text-[#8891a8] border border-[#3a3d58]"
                        >
                          <span className="font-medium text-[#e8e4dc]">{ageRating.body}</span>
                          <span>{ageRating.label}</span>
                        </span>
                      )}
                      {game.rating != null && (
                        <span
                          title="Critic score"
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-[#f59e0b] bg-[#f59e0b30] [box-shadow:0_0_4px_#f59e0b80] text-[#f59e0b] [text-shadow:0_0_6px_#f59e0b]"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="8" r="6" />
                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                          </svg>
                          <span className="font-medium">★ {Number(game.rating).toFixed(1)}</span>
                        </span>
                      )}
                      {game.totalRating != null && (
                        <span
                          title="User score"
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-[#f72585] bg-[#f7258530] [box-shadow:0_0_4px_#f7258580] text-[#f72585] [text-shadow:0_0_6px_#f72585]"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          <span className="font-medium">★ {Number(game.totalRating).toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                  )}
                  {showRating && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-[#8891a8] uppercase tracking-wider">Your Rating</p>
                      <RatingWidget value={libraryEntry.rating} onChange={handleRatingChange} />
                    </div>
                  )}
                </div>
                )
              })()}
            </div>

            <div className="md:col-span-1">
              {(game.coverImageUrl || game.backgroundImage) ? (
                <img
                  src={game.coverImageUrl || game.backgroundImage}
                  alt={game.name}
                  className="w-full rounded-lg border border-[#1e2035]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border border-[#1e2035]">
                  <CoverFallback platforms={game.platforms} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* About + media row */}
        {(description || hasMedia) && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {description && (
              <div
                onClick={() => description.length > 300 && setDescExpanded((v) => !v)}
                className={`md:row-start-1 md:col-start-1 md:col-span-1 self-start bg-[#111220] border rounded-lg p-5 space-y-3 transition-[border-color,box-shadow] duration-200 ${
                  description.length > 300 ? 'cursor-pointer' : ''
                } ${
                  descExpanded
                    ? 'border-[#f72585] [box-shadow:0_0_15px_#f7258530]'
                    : 'border-[#1e2035] hover:border-[#f72585] hover:[box-shadow:0_0_15px_#f7258530]'
                }`}
              >
                <h2 className="text-lg font-medium text-[#e8e4dc]">About</h2>
                <p className={`text-sm text-[#8891a8] leading-relaxed ${descExpanded ? '' : 'line-clamp-[8]'}`}>
                  {description}
                </p>
              </div>
            )}
            {screenshots.length > 0 && (
              <div className="order-2 md:order-none md:row-start-1 md:col-start-2 md:col-span-1">
                <button
                  onClick={() => setLightboxIndex(0)}
                  className="group relative w-full aspect-video rounded-lg overflow-hidden border border-[#1e2035] hover:border-[#f72585] hover:[box-shadow:0_0_15px_#f7258530] active:scale-[0.98] transition-[border-color,box-shadow,transform] duration-200"
                  aria-label={screenshots.length > 1 ? `View ${screenshots.length} screenshots` : 'View screenshot'}
                >
                  <img
                    src={screenshots[0]}
                    alt={`${game.name} screenshot 1`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm text-[#e8e4dc] bg-[#111220cc] backdrop-blur-sm border border-[#f72585] [box-shadow:0_0_12px_#f7258540] px-3 py-1.5 rounded">
                      {screenshots.length > 1 ? `View all ${screenshots.length} screenshots` : 'View screenshot'}
                    </span>
                  </span>
                  {screenshots.length > 1 && (
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-xs text-[#e8e4dc] bg-[#111220cc] backdrop-blur-sm border border-[#3a3d58] px-2.5 py-1 rounded group-hover:opacity-0 transition-opacity duration-200">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                      <span className="font-medium">1 / {screenshots.length}</span>
                    </span>
                  )}
                </button>
              </div>
            )}
            {videos[0] && (
              <div className="order-1 md:order-none md:row-start-1 md:col-start-3 md:col-span-1">
                <div className="relative aspect-video rounded-lg overflow-hidden border border-[#1e2035] bg-[#111220]">
                  <iframe
                    src={`https://www.youtube.com/embed/${videos[0]}`}
                    title={`${game.name} trailer`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* DLC & Expansions */}
        {addonCount > 0 && addonPreviews.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-[#e8e4dc]">DLC & Expansions</h2>
                <button
                  onClick={handleOpenAddons}
                  className="text-xs text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-[color,text-shadow] duration-200 flex-shrink-0"
                >
                  View all {addonCount} →
                </button>
              </div>
              <div className={`relative rounded-lg border border-[#1e2035] bg-[#111220] ${
                addonPreviews.length === 1 ? 'w-[42.1875%] aspect-[3/4]' :
                addonPreviews.length === 2 ? 'w-[84.375%] aspect-[3/2]' :
                'w-full aspect-video'
              }`}>
                {(() => {
                  const stack = addonPreviews
                  const n = stack.length
                  const CARD_FRAC = n === 1 ? 1 : n === 2 ? 0.5 : 27 / 64
                  return stack.map((p, i) => {
                    const isTop = i === 0
                    const isHovered = hoveredAddon === i
                    const isBright = isHovered || (hoveredAddon === null && isTop)
                    const leftPct = n === 1
                      ? ((1 - CARD_FRAC) / 2) * 100
                      : (i * (1 - CARD_FRAC) / (n - 1)) * 100
                    const zIndex = isHovered
                      ? 100
                      : hoveredAddon !== null
                        ? n - Math.abs(i - hoveredAddon)
                        : n - i
                    const isFirst = i === 0
                    const isLast = i === n - 1
                    return (
                      <button
                        key={p.igdbId}
                        onClick={() => navigate(`/games/${p.igdbId}`)}
                        onMouseEnter={() => setHoveredAddon(i)}
                        title={p.name}
                        aria-label={p.name}
                        style={{
                          left: `${leftPct}%`,
                          zIndex,
                        }}
                        className={`absolute top-0 h-full aspect-[3/4] border-l border-r border-[#0a0b14] bg-[#1e2035] overflow-hidden cursor-pointer transition-[transform,filter,box-shadow] duration-200 ${
                          isFirst ? 'rounded-l-lg' : ''
                        } ${
                          isLast ? 'rounded-r-lg' : ''
                        } ${
                          isBright ? '' : 'brightness-50'
                        } ${
                          isHovered ? 'scale-[1.04] [box-shadow:0_0_18px_#f7258560,0_0_2px_#f72585]' : ''
                        }`}
                      >
                        {(p.coverImageUrl || p.backgroundImage) ? (
                          <img
                            src={p.coverImageUrl || p.backgroundImage}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[#4a5068] text-xs">No cover</span>
                          </div>
                        )}
                        {p._kind && (
                          <span className="absolute top-1.5 left-1.5 text-[9px] px-1 py-0.5 rounded font-medium tracking-wider bg-[#111220cc] backdrop-blur-sm text-[#f59e0b] border border-[#f59e0b] [box-shadow:0_0_4px_#f59e0b]">
                            {p._kind}
                          </span>
                        )}
                      </button>
                    )
                  })
                })()}
              </div>
            </div>
          </section>
        )}

        {/* More from franchise */}
        {franchiseGames.length > 0 && pickBestSeries(game.name, game.franchises, game.collections) && (() => {
          const CARD_W = 176
          const GAP = 12
          const SLOT = CARD_W + GAP
          const fits = Math.max(1, Math.floor((franchiseRowWidth + GAP) / SLOT))
          const needViewAll = franchiseGames.length > fits
          const visible = needViewAll ? franchiseGames.slice(0, fits) : franchiseGames
          const dynamicGap = fits > 1 && franchiseRowWidth > 0
            ? Math.max(GAP, (franchiseRowWidth - fits * CARD_W) / (fits - 1))
            : GAP
          return (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-[#e8e4dc]">{pickBestSeries(game.name, game.franchises, game.collections)?.name} series</h2>
                {needViewAll && (
                  <button
                    onClick={() => setShowFranchiseModal(true)}
                    className="text-xs text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-[color,text-shadow] duration-200 flex-shrink-0"
                  >
                    View all {franchiseGames.length} →
                  </button>
                )}
              </div>
              <div
                ref={franchiseRowRef}
                className="flex overflow-hidden"
                style={{ gap: `${dynamicGap}px` }}
              >
                {visible.map((g) => (
                  <GameCard
                    key={g.igdbId}
                    game={g}
                    onClick={() => navigate(`/games/${g.igdbId}`)}
                  />
                ))}
              </div>
            </section>
          )
        })()}

        {/* Similar games */}
        {similar.length > 0 && (() => {
          const CARD_W = 176
          const GAP = 12
          const SLOT = CARD_W + GAP
          const fits = Math.max(1, Math.floor((similarRowWidth + GAP) / SLOT))
          const visible = similar.slice(0, fits)
          const dynamicGap = fits > 1 && similarRowWidth > 0
            ? Math.max(GAP, (similarRowWidth - fits * CARD_W) / (fits - 1))
            : GAP
          return (
            <section className="space-y-3">
              <h2 className="text-lg font-medium text-[#e8e4dc]">Similar Games</h2>
              <div
                ref={similarRowRef}
                className="flex overflow-hidden"
                style={{ gap: `${dynamicGap}px` }}
              >
                {visible.map((g) => (
                  <GameCard
                    key={g.igdbId}
                    game={g}
                    onClick={() => navigate(`/games/${g.igdbId}`)}
                  />
                ))}
              </div>
            </section>
          )
        })()}
      </div>
    </>
  )
}
