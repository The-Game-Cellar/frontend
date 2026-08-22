import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAddPlatform, useCompleteOnboarding, useUpdateGenrePreferences } from '../services/libraryService'
import { useGenres, usePlatformCatalog } from '../services/gameService'
import OnboardingPlatformPicker from '../components/common/OnboardingPlatformPicker'
import TopBar from '../components/common/TopBar'

type Step = 'platforms' | 'genres'

export default function Onboarding() {
  const navigate = useNavigate()
  const addPlatformMutation = useAddPlatform()
  const updateGenrePreferencesMutation = useUpdateGenrePreferences()
  const completeOnboardingMutation = useCompleteOnboarding()

  const [step, setStep] = useState<Step>('platforms')

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [platformLoading, setPlatformLoading] = useState(false)
  const [platformError, setPlatformError] = useState<string | null>(null)

  const [confirmSkipOpen, setConfirmSkipOpen] = useState(false)

  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [genreLoading, setGenreLoading] = useState(false)
  const [genreError, setGenreError] = useState<string | null>(null)

  const { data: genresData, isLoading: genresLoading } = useGenres()
  const genreList: string[] = Array.isArray(genresData?.genres) ? genresData.genres : []

  const { data: platformCatalog, isLoading: catalogLoading, isError: catalogError } = usePlatformCatalog()

  function togglePlatform(platform: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  function toggleGenre(genre: string) {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    )
  }

  async function handlePlatformContinue() {
    if (selectedPlatforms.length === 0) return

    setPlatformLoading(true)
    setPlatformError(null)

    const results = await Promise.allSettled(
      selectedPlatforms.map((platform) =>
        addPlatformMutation.mutateAsync({ platformName: platform, isPrimary: false })
      )
    )

    const failed = results
      .map((r, i) => (r.status === 'rejected' ? selectedPlatforms[i] : null))
      .filter((p): p is string => p !== null)

    if (failed.length > 0) {
      setSelectedPlatforms(failed)
      setPlatformError(`Failed to save ${failed.length} platform(s). Please try again.`)
      setPlatformLoading(false)
      return
    }

    setPlatformLoading(false)
    setStep('genres')
  }

  async function handleGenreContinue() {
    if (selectedGenres.length === 0) return
    await saveGenresAndExit(selectedGenres)
  }

  // Skipping the platform step abandons onboarding outright, which leaves recommendations with no
  // signal at all, so it asks first. The genre step keeps its plain skip: platforms are already saved by then.
  function handleSkipOnboarding() {
    setConfirmSkipOpen(true)
  }

  async function confirmSkipOnboarding() {
    setConfirmSkipOpen(false)
    try {
      await completeOnboardingMutation.mutateAsync()
      navigate('/dashboard')
    } catch {
      // Leaving without the flag written would drop the user straight back here, so
      // stay put and say so rather than bouncing them between two screens.
      setPlatformError('Could not save your choice. Please try again.')
    }
  }

  async function handleSkipGenres() {
    await saveGenresAndExit([])
  }

  async function saveGenresAndExit(genresToSave: string[]) {
    setGenreLoading(true)
    setGenreError(null)
    try {
      await updateGenrePreferencesMutation.mutateAsync(genresToSave)
      await completeOnboardingMutation.mutateAsync()
      navigate('/dashboard')
    } catch {
      setGenreError('Failed to save genre preferences. Please try again.')
      setGenreLoading(false)
    }
  }

  useEffect(() => {
    if (!confirmSkipOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirmSkipOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmSkipOpen])

  const stepCopy =
    step === 'platforms'
      ? 'Select the platforms you own so we can recommend the right games'
      : 'Pick a few genres you enjoy to seed your first recommendations'

  return (
    <div className="min-h-screen bg-[#0a0b14] text-[#e8e4dc] font-mono flex items-center justify-center px-6 pb-6 pt-24">
      <TopBar />
      <div className="bg-[#111220] border border-[#1e2035] rounded-xl p-10 w-full max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold text-[#e8e4dc] tracking-wider">
            Welcome to the Cellar
          </h1>
          <p className="text-base text-[#4a5068]">{stepCopy}</p>
        </div>

        <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.25em] text-[#4a5068]">
          <span
            className={
              step === 'platforms'
                ? 'text-[#f72585] [text-shadow:0_0_8px_#f72585]'
                : ''
            }
          >
            Platforms
          </span>
          <span className="text-[#2a2d45]">/</span>
          <span
            className={
              step === 'genres'
                ? 'text-[#f72585] [text-shadow:0_0_8px_#f72585]'
                : ''
            }
          >
            Genres
          </span>
        </div>

        {step === 'platforms' && (
          <>
            {catalogLoading ? (
              <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585] text-center py-8 tracking-wider">
                [ LOADING... ]
              </p>
            ) : catalogError ? (
              <p className="text-sm text-[#8891a8] text-center py-8">
                Couldn't load the platform catalog. Refresh and try again.
              </p>
            ) : !platformCatalog || platformCatalog.length === 0 ? (
              <p className="text-sm text-[#8891a8] text-center py-8">
                The platform catalog is still being built, so there is nothing to
                pick just yet.
              </p>
            ) : (
              <OnboardingPlatformPicker
                catalog={platformCatalog}
                selected={selectedPlatforms}
                onToggle={togglePlatform}
                isBusy={platformLoading}
              />
            )}

            {platformError && (
              <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
                {platformError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSkipOnboarding}
                disabled={platformLoading}
                className="flex-1 px-5 py-3 border border-[#2a2d45] text-[#8891a8] text-base rounded hover:border-[#8891a8] hover:text-[#e8e4dc] disabled:opacity-40 disabled:cursor-not-allowed transition-[border-color,color] duration-200 active:scale-[0.97]"
              >
                Skip for now
              </button>
              <button
                onClick={handlePlatformContinue}
                disabled={selectedPlatforms.length === 0 || platformLoading}
                className="flex-1 px-5 py-3 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-base rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] disabled:opacity-40 disabled:cursor-not-allowed transition-[box-shadow,transform] duration-200 active:scale-[0.97]"
              >
                {platformLoading
                  ? '[ SAVING... ]'
                  : `Continue (${selectedPlatforms.length} selected)`}
              </button>
            </div>
          </>
        )}

        {step === 'genres' && (
          <>
            {genresLoading ? (
              <p className="text-sm text-[#f72585] [text-shadow:0_0_8px_#f72585] text-center py-8 tracking-wider">
                [ LOADING... ]
              </p>
            ) : genreList.length === 0 ? (
              <p className="text-sm text-[#8891a8] text-center py-8">
                Couldn't load the genre catalog. Skip this step; you can set preferences later from Profile.
              </p>
            ) : (
              <div
                className="grid gap-2 max-h-80 overflow-y-auto styled-scrollbar pr-1 -mr-1"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
              >
                {genreList.map((genre) => {
                  const active = selectedGenres.includes(genre)
                  return (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      title={genre}
                      className={`px-3 py-2 rounded text-sm text-center truncate border capitalize transition-[border-color,color,background-color,box-shadow,text-shadow] duration-150 ${
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

            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[#4a5068] pt-1">
              <span>Optional · skip ok</span>
              <span>
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
              </span>
            </div>

            {genreError && (
              <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
                {genreError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSkipGenres}
                disabled={genreLoading}
                className="flex-1 px-5 py-3 border border-[#2a2d45] text-[#8891a8] text-base rounded hover:border-[#8891a8] hover:text-[#e8e4dc] disabled:opacity-40 disabled:cursor-not-allowed transition-[border-color,color] duration-200 active:scale-[0.97]"
              >
                {genreLoading ? '[ ... ]' : 'Skip for now'}
              </button>
              <button
                onClick={handleGenreContinue}
                disabled={selectedGenres.length === 0 || genreLoading}
                className="flex-1 px-5 py-3 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-base rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] disabled:opacity-40 disabled:cursor-not-allowed transition-[box-shadow,transform] duration-200 active:scale-[0.97]"
              >
                {genreLoading
                  ? '[ SAVING... ]'
                  : `Enter the Cellar (${selectedGenres.length})`}
              </button>
            </div>
          </>
        )}
      </div>

      {confirmSkipOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-enter"
          onClick={() => setConfirmSkipOpen(false)}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg p-10 w-full max-w-2xl space-y-8 animate-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <p className="text-2xl font-semibold text-[#e8e4dc]">Skip setup?</p>
              <p className="text-lg text-[#8891a8] leading-relaxed">
                Recommendations are built from the platforms and genres you pick. With none of
                them set, the Cellar has nothing to go on and you will mostly see random games.
              </p>
              <p className="text-base text-[#4a5068] leading-relaxed">
                You can set your platforms and genres later:{' '}
                <span className="whitespace-nowrap">Profile → Preferences</span>.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmSkipOnboarding}
                className="flex-1 px-6 py-4 border border-[#2a2d45] text-[#8891a8] text-lg rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-[border-color,color] duration-200 active:scale-[0.97]"
              >
                Skip anyway
              </button>
              <button
                onClick={() => setConfirmSkipOpen(false)}
                className="flex-1 px-6 py-4 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-lg rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] transition-[box-shadow,transform] duration-200 active:scale-[0.97]"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
