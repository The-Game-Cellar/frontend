import { useEffect, useRef, useState } from 'react'
import type { ElementType } from 'react'
import { createPortal } from 'react-dom'

const SHOW_DELAY_MS = 400
const HIDE_DELAY_MS = 100
const REOPEN_GRACE_MS = 100

let lastHideAt = 0

type Placement = 'top' | 'bottom'

interface TooltipPosition {
  top: number
  left: number
  placement: Placement
}

interface TruncatedTextProps {
  text: string
  className?: string
  as?: ElementType
}

export default function TruncatedText({ text, className = '', as: Tag = 'span' }: TruncatedTextProps) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const [isTruncated, setIsTruncated] = useState(false)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0, placement: 'top' })
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const el = triggerRef.current
    if (!el) return
    const measure = () => setIsTruncated(el.scrollWidth > el.clientWidth + 1)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text])

  const computePosition = (): TooltipPosition | null => {
    const el = triggerRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const tooltipApproxH = 40
    const above = r.top - tooltipApproxH - 8 > 0
    return {
      top: above ? r.top - 8 : r.bottom + 8,
      left: r.left + r.width / 2,
      placement: above ? 'top' : 'bottom',
    }
  }

  const show = ({ instant = false }: { instant?: boolean } = {}) => {
    if (!isTruncated) return
    if (hideTimer.current) clearTimeout(hideTimer.current)
    const grace = Date.now() - lastHideAt < REOPEN_GRACE_MS
    const delay = instant || grace ? 0 : SHOW_DELAY_MS
    showTimer.current = setTimeout(() => {
      const pos = computePosition()
      if (pos) setPosition(pos)
      setVisible(true)
    }, delay)
  }

  const hide = () => {
    if (showTimer.current) clearTimeout(showTimer.current)
    hideTimer.current = setTimeout(() => {
      setVisible(false)
      lastHideAt = Date.now()
    }, HIDE_DELAY_MS)
  }

  useEffect(() => {
    if (!visible) return
    const onMove = () => {
      const pos = computePosition()
      if (pos) setPosition(pos)
    }
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTimer.current) clearTimeout(showTimer.current)
        if (hideTimer.current) clearTimeout(hideTimer.current)
        setVisible(false)
        lastHideAt = Date.now()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible])

  useEffect(() => () => {
    if (showTimer.current) clearTimeout(showTimer.current)
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }, [])

  return (
    <>
      <Tag
        ref={triggerRef}
        className={`truncate ${className}`}
        onMouseEnter={() => show()}
        onMouseLeave={hide}
        onFocus={() => show({ instant: true })}
        onBlur={hide}
      >
        {text}
      </Tag>
      {visible && createPortal(
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 max-w-[280px]"
          style={{
            top: position.top,
            left: position.left,
            transform: position.placement === 'top'
              ? 'translate(-50%, -100%)'
              : 'translate(-50%, 0)',
          }}
        >
          <div className="relative bg-[#181a2e] border border-[#1e2035] rounded text-xs text-[#e8e4dc] px-2.5 py-1.5 leading-snug break-words text-left motion-safe:animate-enter">
            {text}
            {position.placement === 'top' && (
              <div
                aria-hidden="true"
                className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-2 h-2 rotate-45 bg-[#181a2e] border-r border-b border-[#1e2035]"
              />
            )}
            {position.placement === 'bottom' && (
              <div
                aria-hidden="true"
                className="absolute left-1/2 -translate-x-1/2 -top-[5px] w-2 h-2 rotate-45 bg-[#181a2e] border-l border-t border-[#1e2035]"
              />
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
