import { useEffect, useState } from 'react'
import {
  useUserPlatforms,
  useAddPlatform,
  useRemovePlatform,
  useSetPlatformPrimary,
  useGenrePreferences,
  useUpdateGenrePreferences,
} from '../services/libraryService'
import { useGenres } from '../services/gameService'

const ALL_PLATFORMS: string[] = [
  'PC', 'PlayStation 5', 'PlayStation 4',
  'Xbox Series S/X', 'Xbox One', 'Nintendo Switch',
]

export default function Preferences() {
  const { data: platformsData, isError: platformsError } = useUserPlatforms()
  const platforms = platformsData ?? []
  const addPlatformMutation = useAddPlatform()
  const removePlatformMutation = useRemovePlatform()
  const setPrimaryMutation = useSetPlatformPrimary()
  const updateGenrePreferencesMutation = useUpdateGenrePreferences()

  const { data: storedGenrePreferences } = useGenrePreferences()
  const { data: genresData } = useGenres()
  const genreList: string[] = Array.isArray(genresData?.genres) ? genresData.genres : []

  const [adding, setAdding] = useState(false)
  const [addPlatformError, setAddPlatformError] = useState(false)
  const [removePlatformError, setRemovePlatformError] = useState(false)
  const [primaryError, setPrimaryError] = useState(false)

  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [genreInitialized, setGenreInitialized] = useState(false)
  const [genreSaving, setGenreSaving] = useState(false)
  const [genreError, setGenreError] = useState(false)
  const [genreSuccess, setGenreSuccess] = useState(false)

  useEffect(() => {
    if (!genreInitialized && Array.isArray(storedGenrePreferences)) {
      setSelectedGenres(storedGenrePreferences)
      setGenreInitialized(true)
    }
  }, [storedGenrePreferences, genreInitialized])

  function toggleGenre(genre: string) {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
    if (genreSuccess) setGenreSuccess(false)
    if (genreError) setGenreError(false)
  }

  async function saveGenrePreferences() {
    setGenreSaving(true)
    setGenreError(false)
    setGenreSuccess(false)
    try {
      await updateGenrePreferencesMutation.mutateAsync(selectedGenres)
      setGenreSuccess(true)
      setTimeout(() => setGenreSuccess(false), 2500)
    } catch {
      setGenreError(true)
      setTimeout(() => setGenreError(false), 3000)
    } finally {
      setGenreSaving(false)
    }
  }

  const storedSet = new Set(Array.isArray(storedGenrePreferences) ? storedGenrePreferences : [])
  const selectedSet = new Set(selectedGenres)
  const genresDirty =
    storedSet.size !== selectedSet.size ||
    [...storedSet].some((g) => !selectedSet.has(g))

  const ownedNames = platforms.map((p) => p.platformName ?? '')
  const available = ALL_PLATFORMS.filter((p) => !ownedNames.includes(p))

  async function handleRemovePlatform(platformId: number) {
    try {
      await removePlatformMutation.mutateAsync(platformId)
    } catch {
      setRemovePlatformError(true)
      setTimeout(() => setRemovePlatformError(false), 3000)
    }
  }

  async function handleTogglePrimary(platformId: number, nextPrimary: boolean) {
    try {
      await setPrimaryMutation.mutateAsync({ platformId, isPrimary: nextPrimary })
    } catch {
      setPrimaryError(true)
      setTimeout(() => setPrimaryError(false), 3000)
    }
  }

  async function handleAddPlatform(name: string) {
    setAdding(true)
    try {
      await addPlatformMutation.mutateAsync({ platformName: name, isPrimary: false })
    } catch {
      setAddPlatformError(true)
      setTimeout(() => setAddPlatformError(false), 3000)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Preferences</h1>
        <p className="text-xs text-[#8891a8]">
          The platforms you play on and the genres that shape your recommendations.
        </p>
      </div>

      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-4">
        <div className="space-y-1.5">
          <p className="text-xs text-[#8891a8] uppercase tracking-wider">Platforms</p>
          <p className="text-xs text-[#4a5068]">
            Star a platform to mark it as primary. Its games get extra weight in your recommendations.
          </p>
        </div>
        {platformsError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to load platforms.
          </p>
        )}
        {removePlatformError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to remove platform. Please try again.
          </p>
        )}
        {!platformsError && platforms.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => {
              const isPrimary = !!p.isPrimary
              return (
                <span key={p.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border bg-[#f7258510] border-[#f7258560] text-[#f72585]">
                  <button
                    type="button"
                    onClick={() => p.id != null && handleTogglePrimary(p.id, !isPrimary)}
                    disabled={setPrimaryMutation.isPending}
                    title={isPrimary ? 'Primary platform (click to unset)' : 'Set as primary'}
                    aria-label={isPrimary ? 'Unset primary platform' : 'Set as primary platform'}
                    aria-pressed={isPrimary}
                    className={`text-sm leading-none transition-[color,text-shadow] disabled:opacity-50 ${
                      isPrimary
                        ? 'text-[#f59e0b] [text-shadow:0_0_6px_#f59e0b80]'
                        : 'text-[#4a5068] hover:text-[#f59e0b]'
                    }`}
                  >
                    {isPrimary ? '★' : '☆'}
                  </button>
                  {p.platformName}
                  <button
                    type="button"
                    onClick={() => p.id != null && handleRemovePlatform(p.id)}
                    className="text-base leading-none text-[#4a5068] hover:text-[#ef4444] transition-colors"
                    title="Remove platform"
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        ) : (
          !platformsError && <p className="text-xs text-[#4a5068]">No platforms added yet.</p>
        )}
        {primaryError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to update primary platform. Please try again.
          </p>
        )}
        {addPlatformError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to add platform. Please try again.
          </p>
        )}
        {!platformsError && available.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-[#1e2035]">
            <p className="text-xs text-[#8891a8]">Add platform</p>
            <div className="flex flex-wrap gap-2">
              {available.map((name) => (
                <button
                  key={name}
                  onClick={() => handleAddPlatform(name)}
                  disabled={adding}
                  className="text-xs px-3 py-1.5 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] disabled:opacity-40 transition-colors"
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs text-[#8891a8] uppercase tracking-wider">Genre preferences</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#4a5068]">
            Selected{' '}
            <span
              className={
                selectedGenres.length > 0
                  ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                  : ''
              }
            >
              {selectedGenres.length}
            </span>
          </p>
        </div>
        <p className="text-xs text-[#4a5068]">
          Optional cold-start signal. Fades as you rate more games — pick 3+ for noticeable effect on your slate while your library is small.
        </p>
        {genreList.length === 0 ? (
          <p className="text-xs text-[#8891a8] text-center py-4">
            Couldn't load the genre catalog. Try again in a moment.
          </p>
        ) : (
          <div
            className="grid gap-2 max-h-64 overflow-y-auto styled-scrollbar pr-1 -mr-1"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}
          >
            {genreList.map((genre) => {
              const active = selectedSet.has(genre)
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  title={genre}
                  className={`px-3 py-1.5 rounded text-xs text-center truncate border transition-[border-color,color,background-color,box-shadow,text-shadow] duration-150 ${
                    active
                      ? 'bg-[#f7258515] border-[#f72585] text-[#f72585] [box-shadow:0_0_6px_#f7258540] [text-shadow:0_0_6px_#f7258560]'
                      : 'bg-[#0a0b14] border-[#3a3d58] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]'
                  }`}
                >
                  {genre}
                </button>
              )
            })}
          </div>
        )}
        {genreError && (
          <p className="text-xs text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to save genre preferences. Please try again.
          </p>
        )}
        {genreSuccess && (
          <p className="text-xs text-[#22c55e] bg-[#22c55e10] border border-[#22c55e30] rounded px-3 py-2">
            Genre preferences saved.
          </p>
        )}
        <div className="flex justify-end pt-1 border-t border-[#1e2035]">
          <button
            type="button"
            onClick={saveGenrePreferences}
            disabled={!genresDirty || genreSaving}
            className="mt-3 px-4 py-1.5 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-xs rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-[box-shadow,transform] duration-200"
          >
            {genreSaving ? '[ SAVING... ]' : 'Save preferences'}
          </button>
        </div>
      </section>
    </div>
  )
}
