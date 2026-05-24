import { useMemo, useState } from 'react'
import type { PlatformCatalogDTO, UserPlatformDTO } from '../../types/api'

interface PreferencePlatformPickerProps {
  catalog: PlatformCatalogDTO[]
  owned: UserPlatformDTO[]
  onAdd: (name: string) => void
  onRemove: (id: number) => void
  onTogglePrimary: (id: number, nextPrimary: boolean) => void
  isBusy: boolean
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
  owned: boolean
  isPrimary: boolean
  ownedId: number | null
  onAdd: (name: string) => void
  onRemove: (id: number) => void
  onTogglePrimary: (id: number, nextPrimary: boolean) => void
  isBusy: boolean
}

function PlatformChip({
  name,
  owned,
  isPrimary,
  ownedId,
  onAdd,
  onRemove,
  onTogglePrimary,
  isBusy,
}: PlatformChipProps) {
  if (owned) {
    return (
      <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border bg-[#f7258510] border-[#f7258560] text-[#f72585]">
        <button
          type="button"
          onClick={() => ownedId != null && onTogglePrimary(ownedId, !isPrimary)}
          disabled={isBusy}
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
        {name}
        <button
          type="button"
          onClick={() => ownedId != null && onRemove(ownedId)}
          disabled={isBusy}
          className="text-base leading-none text-[#4a5068] hover:text-[#ef4444] transition-colors disabled:opacity-50"
          title="Remove platform"
          aria-label={`Remove ${name}`}
        >
          ×
        </button>
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onAdd(name)}
      disabled={isBusy}
      className="text-xs px-3 py-1.5 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] disabled:opacity-40 transition-[border-color,color,background-color,transform] duration-150 active:scale-[0.97]"
    >
      + {name}
    </button>
  )
}

export default function PreferencePlatformPicker({
  catalog,
  owned,
  onAdd,
  onRemove,
  onTogglePrimary,
  isBusy,
}: PreferencePlatformPickerProps) {
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

  const catalogNames = useMemo(
    () => new Set(catalog.map((p) => p.name).filter((n): n is string => !!n)),
    [catalog]
  )

  const orphaned = useMemo(
    () => owned.filter((o) => o.platformName && !catalogNames.has(o.platformName)),
    [owned, catalogNames]
  )

  const ownedByName = useMemo(() => {
    const m = new Map<string, UserPlatformDTO>()
    for (const o of owned) if (o.platformName) m.set(o.platformName, o)
    return m
  }, [owned])

  const ownedCategories = useMemo(() => {
    const s = new Set<string>()
    for (const p of catalog) {
      if (p.name && p.category && ownedByName.has(p.name)) s.add(p.category)
    }
    return s
  }, [catalog, ownedByName])

  const isCategoryOpen = (cat: string) => {
    if (userClosed.has(cat)) return false
    if (userOpened.has(cat)) return true
    return cat === 'sony' || ownedCategories.has(cat)
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
        className="w-full bg-[#0a0b14] border border-[#2a2d45] rounded px-3 py-2 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none transition-colors"
      />

      {orphaned.length > 0 && (
        <div className="border border-[#f59e0b40] bg-[#f59e0b08] rounded p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#f59e0b]">
            Legacy &mdash; no longer in catalog
          </p>
          <div className="flex flex-wrap gap-2">
            {orphaned.map((o) => (
              <PlatformChip
                key={o.id}
                name={o.platformName ?? ''}
                owned={true}
                isPrimary={!!o.isPrimary}
                ownedId={o.id ?? null}
                onAdd={onAdd}
                onRemove={onRemove}
                onTogglePrimary={onTogglePrimary}
                isBusy={isBusy}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {ordered.map(([category, items]) => {
          const filtered = items.filter((p) => matches(p.name ?? ''))
          if (isSearching && filtered.length === 0) return null
          const open = isSearching || isCategoryOpen(category)
          return (
            <div key={category} className="border border-[#2a2d45] rounded overflow-hidden">
              <button
                type="button"
                onClick={() => !isSearching && toggleCategory(category)}
                disabled={isSearching}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#0a0b14] hover:bg-[#1e2035] text-left transition-colors disabled:cursor-default disabled:hover:bg-[#0a0b14]"
              >
                <span className="text-xs uppercase tracking-wider text-[#8891a8]">
                  {CATEGORY_LABELS[category] ?? category}
                </span>
                <span className="text-xs text-[#4a5068]">{open ? '−' : '+'}</span>
              </button>
              {open && (
                <div className="p-3 flex flex-wrap gap-2">
                  {filtered.map((p) => {
                    const name = p.name ?? ''
                    const ownedRow = ownedByName.get(name)
                    return (
                      <PlatformChip
                        key={p.id}
                        name={name}
                        owned={!!ownedRow}
                        isPrimary={!!ownedRow?.isPrimary}
                        ownedId={ownedRow?.id ?? null}
                        onAdd={onAdd}
                        onRemove={onRemove}
                        onTogglePrimary={onTogglePrimary}
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
