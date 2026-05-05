type PlatformKey = 'playstation' | 'xbox' | 'nintendo' | 'pc' | 'unknown'

interface PlatformTint {
  label: string
  text: string
}

interface CoverFallbackProps {
  platforms?: string[] | null
}

const PLATFORM_PRIORITY: PlatformKey[] = ['playstation', 'xbox', 'nintendo', 'pc', 'unknown']

const PLATFORM_TINTS: Record<PlatformKey, PlatformTint> = {
  playstation: { label: 'PLAYSTATION', text: '#7a98c8' },
  xbox:        { label: 'XBOX',        text: '#7ac890' },
  nintendo:    { label: 'NINTENDO',    text: '#c87a7a' },
  pc:          { label: 'PC',          text: '#8891a8' },
  unknown:     { label: '?',           text: '#4a5068' },
}

function classify(name: string | null | undefined): PlatformKey | null {
  if (!name) return null
  const n = String(name).trim()
  if (n.startsWith('PlayStation')) return 'playstation'
  if (n.startsWith('Xbox')) return 'xbox'
  if (
    n.startsWith('Nintendo ') ||
    n.startsWith('Wii') ||
    n.startsWith('Game Boy') ||
    n.startsWith('Super Nintendo')
  ) return 'nintendo'
  if (n === 'PC') return 'pc'
  return null
}

function pickPlatform(platforms: string[] | null | undefined): PlatformKey {
  if (!Array.isArray(platforms) || platforms.length === 0) return 'unknown'
  const matched = new Set(platforms.map(classify).filter((p): p is PlatformKey => p !== null))
  if (matched.size === 0) return 'unknown'
  for (const p of PLATFORM_PRIORITY) {
    if (matched.has(p)) return p
  }
  return 'unknown'
}

export default function CoverFallback({ platforms }: CoverFallbackProps) {
  const key = pickPlatform(platforms)
  const tint = PLATFORM_TINTS[key]
  const ariaLabel = key === 'unknown'
    ? 'No cover art available'
    : `No cover art available, ${tint.label.toLowerCase()} title`

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="w-full h-full grid grid-rows-[3fr_2fr] bg-gradient-to-br from-[#1e2035] to-[#2a2d45] [container-type:inline-size]"
    >
      <div className="flex flex-col items-center justify-center gap-1.5 px-2 text-center">
        <span
          className="font-medium tracking-wider"
          style={{ color: tint.text, fontSize: 'clamp(0.625rem, 9cqw, 1.5rem)' }}
        >
          [ {tint.label} ]
        </span>
        <span
          className="uppercase text-[#4a5068]"
          style={{ fontSize: 'clamp(0.5rem, 3cqw, 0.75rem)', letterSpacing: '0.05em' }}
        >
          No cover art
        </span>
      </div>
      <div aria-hidden="true" />
    </div>
  )
}
