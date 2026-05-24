import { useEffect, useState } from 'react'
import {
  useUserPlatforms,
  useAddPlatform,
  useRemovePlatform,
  useSetPlatformPrimary,
  useGenrePreferences,
  useUpdateGenrePreferences,
  useTagPreferences,
  useUpdateTagPreferences,
  useReleaseYearPreferences,
  useUpdateReleaseYearPreferences,
} from '../services/libraryService'
import { useGenres, usePlatformCatalog, usePopularTags } from '../services/gameService'
import PreferencePlatformPicker from '../components/common/PreferencePlatformPicker'

const RELEASE_YEAR_BUCKETS: string[] = ['Pre-1990', '1990s', '2000s', '2010s', '2020s']

export default function Preferences() {
  const { data: platformsData, isError: platformsError } = useUserPlatforms()
  const platforms = platformsData ?? []
  const { data: catalogData, isError: catalogError } = usePlatformCatalog()
  const catalog = catalogData ?? []
  const addPlatformMutation = useAddPlatform()
  const removePlatformMutation = useRemovePlatform()
  const setPrimaryMutation = useSetPlatformPrimary()
  const updateGenrePreferencesMutation = useUpdateGenrePreferences()
  const updateTagPreferencesMutation = useUpdateTagPreferences()
  const updateReleaseYearPreferencesMutation = useUpdateReleaseYearPreferences()

  const { data: storedGenrePreferences } = useGenrePreferences()
  const { data: genresData } = useGenres()
  const genreList: string[] = Array.isArray(genresData?.genres) ? genresData.genres : []

  const { data: storedTagPreferences } = useTagPreferences()
  const { data: tagList = [] } = usePopularTags(50)

  const { data: storedReleaseYearPreferences } = useReleaseYearPreferences()

  const [adding, setAdding] = useState(false)
  const [addPlatformError, setAddPlatformError] = useState(false)
  const [removePlatformError, setRemovePlatformError] = useState(false)
  const [primaryError, setPrimaryError] = useState(false)

  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [genreInitialized, setGenreInitialized] = useState(false)
  const [genreSaving, setGenreSaving] = useState(false)
  const [genreError, setGenreError] = useState(false)
  const [genreSuccess, setGenreSuccess] = useState(false)

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInitialized, setTagInitialized] = useState(false)
  const [tagSaving, setTagSaving] = useState(false)
  const [tagError, setTagError] = useState(false)
  const [tagSuccess, setTagSuccess] = useState(false)

  const [selectedBuckets, setSelectedBuckets] = useState<string[]>([])
  const [bucketInitialized, setBucketInitialized] = useState(false)
  const [bucketSaving, setBucketSaving] = useState(false)
  const [bucketError, setBucketError] = useState(false)
  const [bucketSuccess, setBucketSuccess] = useState(false)

  useEffect(() => {
    if (!genreInitialized && Array.isArray(storedGenrePreferences)) {
      setSelectedGenres(storedGenrePreferences)
      setGenreInitialized(true)
    }
  }, [storedGenrePreferences, genreInitialized])

  useEffect(() => {
    if (!tagInitialized && Array.isArray(storedTagPreferences)) {
      setSelectedTags(storedTagPreferences)
      setTagInitialized(true)
    }
  }, [storedTagPreferences, tagInitialized])

  useEffect(() => {
    if (!bucketInitialized && Array.isArray(storedReleaseYearPreferences)) {
      setSelectedBuckets(storedReleaseYearPreferences)
      setBucketInitialized(true)
    }
  }, [storedReleaseYearPreferences, bucketInitialized])

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

  const storedTagSet = new Set(Array.isArray(storedTagPreferences) ? storedTagPreferences : [])
  const selectedTagSet = new Set(selectedTags)
  const tagsDirty =
    storedTagSet.size !== selectedTagSet.size ||
    [...storedTagSet].some((t) => !selectedTagSet.has(t))

  const storedBucketSet = new Set(Array.isArray(storedReleaseYearPreferences) ? storedReleaseYearPreferences : [])
  const selectedBucketSet = new Set(selectedBuckets)
  const bucketsDirty =
    storedBucketSet.size !== selectedBucketSet.size ||
    [...storedBucketSet].some((b) => !selectedBucketSet.has(b))

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
    if (tagSuccess) setTagSuccess(false)
    if (tagError) setTagError(false)
  }

  async function saveTagPreferences() {
    setTagSaving(true)
    setTagError(false)
    setTagSuccess(false)
    try {
      await updateTagPreferencesMutation.mutateAsync(selectedTags)
      setTagSuccess(true)
      setTimeout(() => setTagSuccess(false), 2500)
    } catch {
      setTagError(true)
      setTimeout(() => setTagError(false), 3000)
    } finally {
      setTagSaving(false)
    }
  }

  function toggleBucket(bucket: string) {
    setSelectedBuckets((prev) =>
      prev.includes(bucket) ? prev.filter((b) => b !== bucket) : [...prev, bucket]
    )
    if (bucketSuccess) setBucketSuccess(false)
    if (bucketError) setBucketError(false)
  }

  async function saveReleaseYearPreferences() {
    setBucketSaving(true)
    setBucketError(false)
    setBucketSuccess(false)
    try {
      await updateReleaseYearPreferencesMutation.mutateAsync(selectedBuckets)
      setBucketSuccess(true)
      setTimeout(() => setBucketSuccess(false), 2500)
    } catch {
      setBucketError(true)
      setTimeout(() => setBucketError(false), 3000)
    } finally {
      setBucketSaving(false)
    }
  }

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
          The platforms you play on, plus the genres and gameplay tags that shape your recommendations.
        </p>
      </div>

      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-4">
        <div className="space-y-1.5">
          <p className="text-xs text-[#8891a8] uppercase tracking-wider">Platforms</p>
          <p className="text-xs text-[#4a5068]">
            Pick the platforms you play on. Star one to mark it as primary.
          </p>
        </div>
        {platformsError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to load your platforms.
          </p>
        )}
        {catalogError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to load the platform catalog.
          </p>
        )}
        {removePlatformError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to remove platform. Please try again.
          </p>
        )}
        {addPlatformError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to add platform. Please try again.
          </p>
        )}
        {primaryError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to update primary platform. Please try again.
          </p>
        )}
        {!catalogError && (
          <PreferencePlatformPicker
            catalog={catalog}
            owned={platforms}
            onAdd={handleAddPlatform}
            onRemove={handleRemovePlatform}
            onTogglePrimary={handleTogglePrimary}
            isBusy={
              adding ||
              removePlatformMutation.isPending ||
              setPrimaryMutation.isPending
            }
          />
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
          Game genres you enjoy.
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
                  className={`px-3 py-1.5 rounded text-xs text-center truncate border capitalize transition-[border-color,color,background-color,box-shadow,text-shadow,transform] duration-150 active:scale-[0.97] ${
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

      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs text-[#8891a8] uppercase tracking-wider">Tag preferences</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#4a5068]">
            Selected{' '}
            <span
              className={
                selectedTags.length > 0
                  ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                  : ''
              }
            >
              {selectedTags.length}
            </span>
          </p>
        </div>
        <p className="text-xs text-[#4a5068]">
          Gameplay styles, atmospheres, and settings you enjoy.
        </p>
        {tagList.length === 0 ? (
          <p className="text-xs text-[#8891a8] text-center py-4">
            Couldn't load the tag catalog. Try again in a moment.
          </p>
        ) : (
          <div
            className="grid gap-2 max-h-64 overflow-y-auto styled-scrollbar pr-1 -mr-1"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}
          >
            {tagList.map((tag) => {
              const active = selectedTagSet.has(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  title={tag}
                  className={`px-3 py-1.5 rounded text-xs text-center truncate border capitalize transition-[border-color,color,background-color,box-shadow,text-shadow,transform] duration-150 active:scale-[0.97] ${
                    active
                      ? 'bg-[#f7258515] border-[#f72585] text-[#f72585] [box-shadow:0_0_6px_#f7258540] [text-shadow:0_0_6px_#f7258560]'
                      : 'bg-[#0a0b14] border-[#3a3d58] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        )}
        {tagError && (
          <p className="text-xs text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to save tag preferences. Please try again.
          </p>
        )}
        {tagSuccess && (
          <p className="text-xs text-[#22c55e] bg-[#22c55e10] border border-[#22c55e30] rounded px-3 py-2">
            Tag preferences saved.
          </p>
        )}
        <div className="flex justify-end pt-1 border-t border-[#1e2035]">
          <button
            type="button"
            onClick={saveTagPreferences}
            disabled={!tagsDirty || tagSaving}
            className="mt-3 px-4 py-1.5 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-xs rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-[box-shadow,transform] duration-200"
          >
            {tagSaving ? '[ SAVING... ]' : 'Save preferences'}
          </button>
        </div>
      </section>

      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs text-[#8891a8] uppercase tracking-wider">Release era preferences</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#4a5068]">
            Selected{' '}
            <span
              className={
                selectedBuckets.length > 0
                  ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                  : ''
              }
            >
              {selectedBuckets.length}
            </span>
          </p>
        </div>
        <p className="text-xs text-[#4a5068]">
          Game eras you enjoy.
        </p>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}
        >
          {RELEASE_YEAR_BUCKETS.map((bucket) => {
            const active = selectedBucketSet.has(bucket)
            return (
              <button
                key={bucket}
                type="button"
                onClick={() => toggleBucket(bucket)}
                title={bucket}
                className={`px-3 py-1.5 rounded text-xs text-center truncate border transition-[border-color,color,background-color,box-shadow,text-shadow,transform] duration-150 active:scale-[0.97] ${
                  active
                    ? 'bg-[#f7258515] border-[#f72585] text-[#f72585] [box-shadow:0_0_6px_#f7258540] [text-shadow:0_0_6px_#f7258560]'
                    : 'bg-[#0a0b14] border-[#3a3d58] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]'
                }`}
              >
                {bucket}
              </button>
            )
          })}
        </div>
        {bucketError && (
          <p className="text-xs text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to save release era preferences. Please try again.
          </p>
        )}
        {bucketSuccess && (
          <p className="text-xs text-[#22c55e] bg-[#22c55e10] border border-[#22c55e30] rounded px-3 py-2">
            Release era preferences saved.
          </p>
        )}
        <div className="flex justify-end pt-1 border-t border-[#1e2035]">
          <button
            type="button"
            onClick={saveReleaseYearPreferences}
            disabled={!bucketsDirty || bucketSaving}
            className="mt-3 px-4 py-1.5 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-xs rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-[box-shadow,transform] duration-200"
          >
            {bucketSaving ? '[ SAVING... ]' : 'Save preferences'}
          </button>
        </div>
      </section>
    </div>
  )
}
