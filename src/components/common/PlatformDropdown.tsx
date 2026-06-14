import { useState, useEffect, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { PlatformGroup } from '../../types/api'

interface PlatformDropdownProps {
  value: string
  groups: PlatformGroup[]
  others: string[]
  onChange: (next: string) => void
}

interface FlyoutPosition {
  top: number
  left: number
}

// Umbrella select fires onChange with CSV of child names; backend OR-matches via IN clause.
// Flyout uses position:fixed because the panel's overflow-y clips both axes.
export default function PlatformDropdown({ value, groups, others, onChange }: PlatformDropdownProps) {
  const [open, setOpen] = useState(false)
  const [hoveredUmbrella, setHoveredUmbrella] = useState<string | null>(null)
  const [flyoutPos, setFlyoutPos] = useState<FlyoutPosition>({ top: 0, left: 0 })
  const rootRef = useRef<HTMLDivElement | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setHoveredUmbrella(null)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setHoveredUmbrella(null)
      }
    }
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [open])

  useEffect(() => () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
  }, [])

  const triggerLabel = resolveTriggerLabel(value, groups, others)

  const select = (next: string) => {
    onChange(next)
    setOpen(false)
    setHoveredUmbrella(null)
  }

  const scheduleClose = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => setHoveredUmbrella(null), 120)
  }

  const cancelClose = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
  }

  const showFlyout = (label: string, rowEl: HTMLElement | null) => {
    cancelClose()
    setHoveredUmbrella(label)
    if (rowEl) {
      const rect = rowEl.getBoundingClientRect()
      setFlyoutPos({ top: rect.top, left: rect.right + 4 })
    }
  }

  const isPicked = (candidate: string) => candidate === value

  const activeGroup = hoveredUmbrella
    ? groups.find((g) => g.label === hoveredUmbrella)
    : null

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`bg-[#111220] border rounded px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${
          value
            ? 'border-[#f72585] text-[#f72585]'
            : 'border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]'
        }`}
      >
        <span>{triggerLabel}</span>
        <span className="text-xs opacity-60">▾</span>
      </button>

      {open && (
        <div
          style={{ width: 'max-content', maxWidth: '20rem' }}
          className="styled-scrollbar absolute z-40 top-full left-0 mt-1 max-h-80 overflow-y-auto bg-[#111220] border border-[#2a2d45] rounded shadow-[0_4px_12px_rgba(0,0,0,0.6)] py-1"
        >
          <button
            type="button"
            onClick={() => select('')}
            onMouseEnter={scheduleClose}
            className={`block w-full text-left px-4 py-2 text-sm whitespace-nowrap transition-colors ${
              value === ''
                ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                : 'text-[#e8e4dc] hover:bg-[#181a2e]'
            }`}
          >
            All
          </button>

          {groups.map((group) => {
            const platforms = group.platforms ?? []
            const childrenJoined = platforms.join(',')
            const umbrellaPicked = group.umbrella === true && isPicked(childrenJoined)
            const isFlyoutOpen = hoveredUmbrella === group.label
            const showCaret = group.umbrella === true && platforms.length > 1
            const baseClass = 'w-full flex items-center justify-between gap-3 px-4 py-2 text-sm whitespace-nowrap transition-colors'
            const activeColorClass =
              (group.umbrella === true && umbrellaPicked) ||
              (group.umbrella !== true && isPicked(platforms[0] ?? ''))
                ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                : isFlyoutOpen
                  ? 'bg-[#181a2e] text-[#e8e4dc]'
                  : 'text-[#e8e4dc] hover:bg-[#181a2e]'

            return (
              <button
                type="button"
                key={group.label}
                onClick={() =>
                  group.umbrella === true ? select(childrenJoined) : select(platforms[0] ?? '')
                }
                onMouseEnter={(e: ReactMouseEvent<HTMLButtonElement>) =>
                  group.umbrella === true ? showFlyout(group.label ?? '', e.currentTarget) : scheduleClose()
                }
                className={`${baseClass} ${activeColorClass}`}
              >
                <span>{group.label}</span>
                {showCaret && <span className="text-xs opacity-60">▸</span>}
              </button>
            )
          })}

          {others.length > 0 && (
            <>
              <div className="my-1 border-t border-[#1e2035]" />
              {others.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => select(name)}
                  onMouseEnter={scheduleClose}
                  className={`block w-full text-left px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                    isPicked(name)
                      ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                      : 'text-[#e8e4dc] hover:bg-[#181a2e]'
                  }`}
                >
                  {name}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {open && activeGroup && activeGroup.umbrella === true && (
        <div
          className="styled-scrollbar fixed z-50 max-h-80 overflow-y-auto bg-[#111220] border border-[#2a2d45] rounded shadow-[0_4px_12px_rgba(0,0,0,0.6)] py-1"
          style={{ top: flyoutPos.top, left: flyoutPos.left, width: 'max-content', maxWidth: '20rem' }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <button
            type="button"
            onClick={() => select((activeGroup.platforms ?? []).join(','))}
            className={`block w-full text-left px-4 py-2 text-sm whitespace-nowrap transition-colors ${
              isPicked((activeGroup.platforms ?? []).join(','))
                ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                : 'text-[#e8e4dc] hover:bg-[#181a2e]'
            }`}
          >
            All {activeGroup.label}
          </button>
          <div className="my-1 border-t border-[#1e2035]" />
          {(activeGroup.platforms ?? []).map((child) => (
            <button
              key={child}
              type="button"
              onClick={() => select(child)}
              className={`block w-full text-left px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                isPicked(child)
                  ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                  : 'text-[#8891a8] hover:bg-[#181a2e] hover:text-[#e8e4dc]'
              }`}
            >
              {child}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function resolveTriggerLabel(value: string, groups: PlatformGroup[], others: string[]): string {
  if (!value) return 'All'
  if (value.includes(',')) {
    const match = groups.find((g) => g.umbrella === true && (g.platforms ?? []).join(',') === value)
    if (match && match.label) return match.label
  }
  for (const g of groups) {
    if ((g.platforms ?? []).includes(value)) return value
  }
  if (others.includes(value)) return value
  return value
}
