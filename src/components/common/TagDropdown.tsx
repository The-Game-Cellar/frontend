import { useEffect, useRef, useState } from 'react'

export interface MultiSelectOption {
  value: string
  label: string
}

interface TagDropdownProps {
  value: string[]
  options: MultiSelectOption[]
  onChange: (next: string[]) => void
  counts?: Record<string, number>
  emptyLabel?: string
}

export default function TagDropdown({ value, options, onChange, counts, emptyLabel = 'No options available.' }: TagDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const selectedSet = new Set(value)
  const triggerLabel = value.length === 0 ? 'All' : `${value.length} selected`

  const isUnavailable = (val: string): boolean =>
    counts !== undefined && !selectedSet.has(val) && (counts[val] ?? 0) === 0

  const sortedOptions = [...options].sort((a, b) => {
    const aOut = isUnavailable(a.value) ? 1 : 0
    const bOut = isUnavailable(b.value) ? 1 : 0
    if (aOut !== bOut) return aOut - bOut
    return 0
  })

  const toggle = (val: string) => {
    if (isUnavailable(val)) return
    const next = selectedSet.has(val) ? value.filter((t) => t !== val) : [...value, val]
    onChange(next)
  }

  const clearAll = () => onChange([])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`bg-[#111220] border rounded px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${
          value.length > 0
            ? 'border-[#f72585] text-[#f72585]'
            : 'border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]'
        }`}
      >
        <span>{triggerLabel}</span>
        <span className="text-xs opacity-60">▾</span>
      </button>

      {open && (
        <div
          style={{ width: 'max-content', maxWidth: '22rem' }}
          className="styled-scrollbar absolute z-40 top-full left-0 mt-1 max-h-80 overflow-y-auto bg-[#111220] border border-[#2a2d45] rounded shadow-[0_4px_12px_rgba(0,0,0,0.6)] py-1"
        >
          <button
            type="button"
            onClick={clearAll}
            className={`block w-full text-left px-4 py-2 text-sm whitespace-nowrap transition-colors ${
              value.length === 0
                ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                : 'text-[#e8e4dc] hover:bg-[#181a2e]'
            }`}
          >
            All
          </button>
          {options.length === 0 ? (
            <p className="px-4 py-2 text-sm text-[#4a5068]">{emptyLabel}</p>
          ) : (
            sortedOptions.map((opt) => {
              const picked = selectedSet.has(opt.value)
              const unavailable = isUnavailable(opt.value)
              const count = counts?.[opt.value]
              const stateClass = picked
                ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                : unavailable
                  ? 'text-[#3a3f5a]'
                  : 'text-[#e8e4dc] hover:bg-[#181a2e]'
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  disabled={unavailable}
                  aria-disabled={unavailable}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-sm whitespace-nowrap transition-colors ${stateClass}`}
                >
                  <span>{opt.label}</span>
                  <span className="flex items-center gap-2 text-xs">
                    {unavailable ? (
                      <span className="italic text-[#4a5068]">no match</span>
                    ) : (
                      count !== undefined && (
                        <span className={picked ? 'opacity-80' : 'text-[#8891a8]'}>
                          {count}
                        </span>
                      )
                    )}
                    {picked && <span className="text-xs">✓</span>}
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
