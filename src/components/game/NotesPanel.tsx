import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { useUpdateGame } from '../../services/libraryService'
import type { UserGameDTO } from '../../types/api'

interface NotesPanelProps {
  entry: UserGameDTO
  onError?: (message: string) => void
}

const MAX_CHARS = 10000
const SAVE_DEBOUNCE_MS = 500
const SAVED_INDICATOR_MS = 2000
const MODAL_EXIT_MS = 200

type SaveState = 'idle' | 'saving' | 'saved'

export default function NotesPanel({ entry, onError }: NotesPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [value, setValue] = useState<string>(entry.notes ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const lastSavedValueRef = useRef<string>(entry.notes ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const updateMutation = useUpdateGame()

  useEffect(() => {
    setValue(entry.notes ?? '')
    lastSavedValueRef.current = entry.notes ?? ''
    setSaveState('idle')
  }, [entry.id, entry.notes])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (savedIndicatorTimerRef.current) clearTimeout(savedIndicatorTimerRef.current)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (textareaRef.current) {
      textareaRef.current.focus({ preventScroll: true })
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [isOpen])

  const flushSave = (next: string) => {
    if (entry.id == null) return
    if (next === lastSavedValueRef.current) return
    setSaveState('saving')
    updateMutation.mutate(
      { gameId: entry.id, data: { notes: next } },
      {
        onSuccess: () => {
          lastSavedValueRef.current = next
          setSaveState('saved')
          if (savedIndicatorTimerRef.current) clearTimeout(savedIndicatorTimerRef.current)
          savedIndicatorTimerRef.current = setTimeout(() => setSaveState('idle'), SAVED_INDICATOR_MS)
        },
        onError: () => {
          setSaveState('idle')
          onError?.('Failed to save notes. Please try again.')
        },
      },
    )
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value.slice(0, MAX_CHARS)
    setValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => flushSave(next), SAVE_DEBOUNCE_MS)
  }

  const handleClose = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    flushSave(value)
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      setIsOpen(false)
    }, MODAL_EXIT_MS)
  }


  const indicatorText =
    saveState === 'saving' ? '[ SAVING... ]'
    : saveState === 'saved' ? '[ SAVED ]'
    : ''

  const indicatorColorClass =
    saveState === 'saving' ? 'text-[#8891a8]'
    : saveState === 'saved' ? 'text-[#22c55e] [text-shadow:0_0_6px_#22c55e80]'
    : 'text-transparent'

  const charCount = value.length
  const counterColorClass =
    charCount >= MAX_CHARS ? 'text-[#ef4444]'
    : charCount > MAX_CHARS * 0.9 ? 'text-[#8891a8]'
    : 'text-[#4a5068]'

  const modal = isOpen ? createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className={`bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-2xl space-y-4 ${closing ? 'animate-exit' : 'animate-enter'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#e8e4dc]">Notes</h2>
            <p className="text-xs text-[#8891a8] mt-0.5">Personal notes about this game</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-[#4a5068] hover:text-[#f72585] hover:[text-shadow:0_0_6px_#f72585] transition-[color,text-shadow] text-xl leading-none flex-shrink-0"
            aria-label="Close notes"
          >
            ×
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          maxLength={MAX_CHARS}
          rows={10}
          placeholder="Anything you want to remember about this game..."
          className="w-full bg-[#0a0b14] border border-[#2a2d45] rounded px-3 py-2 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none focus:[box-shadow:0_0_8px_#f7258540] transition-[border-color,box-shadow] duration-200 resize-y min-h-[14rem] font-mono leading-relaxed"
        />

        <div className="flex items-center justify-between text-xs">
          <span className={`font-mono transition-opacity duration-300 ${indicatorColorClass}`}>
            {indicatorText || ' '}
          </span>
          <span className={`font-mono ${counterColorClass}`}>
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs text-[#8891a8] border border-[#4a5068] rounded px-3 py-1 hover:border-[#f72585] hover:text-[#f72585] hover:[box-shadow:0_0_12px_#f72585,0_0_24px_#f7258540] active:scale-[0.97] transition-[border-color,box-shadow,color,transform] duration-200"
      >
        Notes
      </button>
      {modal}
    </>
  )
}
