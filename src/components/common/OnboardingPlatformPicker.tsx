import { useMemo, useState } from 'react'
import type { PlatformCatalogDTO } from '../../types/api'

interface OnboardingPlatformPickerProps {
  catalog: PlatformCatalogDTO[]
  selected: string[]
  onToggle: (name: string) => void
  isBusy?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  sony: 'Sony',
  microsoft: 'Microsoft',
  nintendo: 'Nintendo',
  pc: 'PC',
  mobile: 'Mobile',
  other: 'Other',
}

const CATEGORY_ORDER = ['sony', 'microsoft', 'nintendo', 'pc', 'mobile', 'other']

interface PlatformChipProps {
  name: string
  selected: boolean
  onToggle: (name: string) => void
  isBusy: boolean
}

function PlatformChip({ name, selected, onToggle, isBusy }: PlatformChipProps) {
  if (selected) {
    return (
      <button
        type="button"
        onClick={() => onToggle(name)}
        disabled={isBusy}
        className="text-sm px-3 py-2 rounded border bg-[#f7258510] border-[#f7258560] text-[#f72585] hover:border-[#f72585] disabled:opacity-50 transition-[border-color,color,background-color,transform] duration-150 active:scale-[0.97]"
      >
        {name}
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onToggle(name)}
      disabled={isBusy}
      className="text-sm px-3 py-2 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] disabled:opacity-40 transition-[border-color,color,background-color,transform] duration-150 active:scale-[0.97]"
    >
      + {name}
    </button>
  )
}

export default function OnboardingPlatformPicker({
  catalog,
  selected,
  onToggle,
  isBusy = false,
}: OnboardingPlatformPickerProps) {
  const [search, setSearch] = useState('')
  const [userOpened, setUserOpened] = useState<Set<string>>(new Set())
  const [userClosed, setUserClosed] = useState<Set<string>>(new Set())

  const isSearching = search.trim().length > 0
  const lowerSearch = search.trim().toLowerCase()

  const groups = useMemo(() => {
    const m = new Map<string, PlatformCatalogDTO[]>()
    for (const p of catalog) {
      if (!p.category) continue
      if (!m.has(p.category)) m.set(p.category, [])
      m.get(p.category)!.push(p)
    }
    return m
  }, [catalog])

  const ordered = useMemo(
    () =>
      CATEGORY_ORDER.flatMap((c) => {
        const items = groups.get(c)
        return items ? [[c, items] as const] : []
      }),
    [groups]
  )

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const selectedCategories = useMemo(() => {
    const s = new Set<string>()
    for (const p of catalog) {
      if (p.name && p.category && selectedSet.has(p.name)) s.add(p.category)
    }
    return s
  }, [catalog, selectedSet])

  const isCategoryOpen = (cat: string) => {
    if (userClosed.has(cat)) return false
    if (userOpened.has(cat)) return true
    return selectedCategories.has(cat)
  }

  const matches = (name: string) => !isSearching || name.toLowerCase().includes(lowerSearch)

  const toggleCategory = (cat: string) => {
    const currentlyOpen = isCategoryOpen(cat)
    if (currentlyOpen) {
      setUserOpened((prev) => {
        if (!prev.has(cat)) return prev
        const next = new Set(prev)
        next.delete(cat)
        return next
      })
      setUserClosed((prev) => {
        if (prev.has(cat)) return prev
        const next = new Set(prev)
        next.add(cat)
        return next
      })
    } else {
      setUserClosed((prev) => {
        if (!prev.has(cat)) return prev
        const next = new Set(prev)
        next.delete(cat)
        return next
      })
      setUserOpened((prev) => {
        if (prev.has(cat)) return prev
        const next = new Set(prev)
        next.add(cat)
        return next
      })
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search platforms..."
        className="w-full bg-[#0a0b14] border border-[#2a2d45] rounded px-4 py-3 text-lg text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none transition-colors"
      />

      <div className="space-y-2 max-h-[60vh] overflow-y-auto styled-scrollbar pr-1 -mr-1">
        {ordered.map(([category, items]) => {
          const filtered = items.filter((p) => matches(p.name ?? ''))
          if (isSearching && filtered.length === 0) return null
          const open = isSearching || isCategoryOpen(category)
          const total = items.length
          const selectedCount = items.reduce(
            (acc, p) => acc + (p.name && selectedSet.has(p.name) ? 1 : 0),
            0,
          )
          return (
            <div key={category} className="border border-[#2a2d45] rounded overflow-hidden">
              <button
                type="button"
                onClick={() => !isSearching && toggleCategory(category)}
                disabled={isSearching}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-[#0a0b14] hover:bg-[#1e2035] text-left transition-colors disabled:cursor-default disabled:hover:bg-[#0a0b14]"
              >
                <span className="flex items-baseline gap-2 min-w-0">
                  <span className="text-lg uppercase tracking-wider text-[#8891a8]">
                    {CATEGORY_LABELS[category] ?? category}
                  </span>
                  <span className="text-base text-[#4a5068] truncate">
                    · {total} platforms
                  </span>
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  {selectedCount > 0 && (
                    <span className="text-base px-2.5 py-0.5 rounded border bg-[#f7258510] border-[#f7258560] text-[#f72585] [text-shadow:0_0_6px_#f72585] tabular-nums">
                      {selectedCount}
                    </span>
                  )}
                  <span className="text-lg text-[#4a5068] w-3 text-center" aria-hidden="true">
                    {open ? '−' : '+'}
                  </span>
                </span>
              </button>
              {open && (
                <div className="p-3 flex flex-wrap gap-2">
                  {filtered.map((p) => {
                    const name = p.name ?? ''
                    return (
                      <PlatformChip
                        key={p.id}
                        name={name}
                        selected={selectedSet.has(name)}
                        onToggle={onToggle}
                        isBusy={isBusy}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
