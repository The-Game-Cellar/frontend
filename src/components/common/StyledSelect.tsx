import { useState, useEffect, useRef } from 'react'

export interface StyledSelectOption {
  value: string
  label: string
}

interface StyledSelectProps {
  value: string
  onChange: (next: string) => void
  options: StyledSelectOption[]
  disabled?: boolean
  alwaysActive?: boolean
  className?: string
  counts?: Record<string, number>
}

export default function StyledSelect({
  value,
  onChange,
  options,
  disabled = false,
  alwaysActive = false,
  className = '',
  counts,
}: StyledSelectProps) {
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

  const selected = options.find((o) => o.value === value)
  const triggerLabel = selected ? selected.label : (options[0]?.label ?? '')
  const defaultValue = options[0]?.value ?? ''
  const isActive = alwaysActive || (value !== '' && value != null && value !== defaultValue)

  const select = (next: string) => {
    onChange(next)
    setOpen(false)
  }

  const triggerColor = isActive
    ? 'border-[#f72585] text-[#f72585]'
    : 'border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]'

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`bg-[#111220] border rounded pl-3.5 pr-3.5 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 w-full text-left ${triggerColor}`}
      >
        <span className="truncate">{triggerLabel}</span>
        <span className="ml-auto text-xs opacity-60">▾</span>
      </button>

      {open && !disabled && (
        <div
          style={{ width: 'max-content', maxWidth: '20rem' }}
          className="styled-scrollbar absolute z-40 top-full left-0 mt-1 max-h-72 overflow-y-auto bg-[#111220] border border-[#2a2d45] rounded shadow-[0_4px_12px_rgba(0,0,0,0.6)] py-1 text-sm"
        >
          {sortByAvailability(options, value, counts).map((opt) => {
            const isPicked = opt.value === value
            const count = counts?.[opt.value]
            const unavailable = counts !== undefined && !isPicked && opt.value !== '' && (count ?? 0) === 0
            const stateClass = isPicked
              ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
              : unavailable
                ? 'text-[#3a3f5a]'
                : 'text-[#e8e4dc] hover:bg-[#181a2e]'
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => !unavailable && select(opt.value)}
                disabled={unavailable}
                aria-disabled={unavailable}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2 transition-colors whitespace-nowrap ${stateClass}`}
              >
                <span className="truncate">{opt.label}</span>
                {counts !== undefined && opt.value !== '' && (
                  unavailable ? (
                    <span className="italic text-[#4a5068]">no match</span>
                  ) : (
                    <span className={isPicked ? 'opacity-80' : 'text-[#8891a8]'}>{count ?? 0}</span>
                  )
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function sortByAvailability(
  options: StyledSelectOption[],
  value: string,
  counts?: Record<string, number>,
): StyledSelectOption[] {
  if (!counts) return options
  return [...options].sort((a, b) => {
    const aOut = a.value !== '' && a.value !== value && (counts[a.value] ?? 0) === 0 ? 1 : 0
    const bOut = b.value !== '' && b.value !== value && (counts[b.value] ?? 0) === 0 ? 1 : 0
    return aOut - bOut
  })
}
