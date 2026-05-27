import { useCallback, useMemo } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'

interface YearRangeSliderProps {
  min: number
  max: number
  value: [number, number]
  onChange: (next: [number, number]) => void
  className?: string
}

export default function YearRangeSlider({
  min,
  max,
  value,
  onChange,
  className = '',
}: YearRangeSliderProps) {
  const [from, to] = value
  const span = max - min
  const fromActive = from > min
  const toActive = to < max
  const anyActive = fromActive || toActive

  const fromPct = useMemo(() => (span === 0 ? 0 : ((from - min) / span) * 100), [from, min, span])
  const toPct = useMemo(() => (span === 0 ? 100 : ((to - min) / span) * 100), [to, min, span])

  const handleFromChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const next = Math.min(parseInt(e.target.value, 10), to)
      if (next !== from) onChange([next, to])
    },
    [from, to, onChange],
  )

  const handleToChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const next = Math.max(parseInt(e.target.value, 10), from)
      if (next !== to) onChange([from, next])
    },
    [from, to, onChange],
  )

  const inactive = '#8891a8'
  const active = '#f72585'
  const fromColor = fromActive ? active : inactive
  const toColor = toActive ? active : inactive

  return (
    <div className={`flex items-center gap-4 px-4 py-2.5 w-80 bg-[#111220] border rounded text-sm transition-colors ${
      anyActive ? 'border-[#f72585]' : 'border-[#2a2d45]'
    } ${className}`}>
      <span className="tabular-nums font-medium transition-colors" style={{ color: fromColor }}>{from}</span>
      <div className="relative flex-1 h-5">
        <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded bg-[#2a2d45]" />
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded transition-colors"
          style={{
            left: `${fromPct}%`,
            width: `${toPct - fromPct}%`,
            background: anyActive ? 'rgba(247, 37, 133, 0.35)' : 'transparent',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={from}
          onChange={handleFromChange}
          className="year-range-thumb absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent pointer-events-none"
          style={{ '--thumb-color': fromColor, height: '18px' } as CSSProperties}
          aria-label="Release year from"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={to}
          onChange={handleToChange}
          className="year-range-thumb absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent pointer-events-none"
          style={{ '--thumb-color': toColor, height: '18px' } as CSSProperties}
          aria-label="Release year to"
        />
      </div>
      <span className="tabular-nums font-medium transition-colors" style={{ color: toColor }}>{to}</span>
    </div>
  )
}
