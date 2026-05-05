interface LoginTransitionProps {
  leaving?: boolean
  durationMs?: number
}

export default function LoginTransition({ leaving = false, durationMs = 700 }: LoginTransitionProps) {
  // Pad the bar so it visibly reaches 100% and rests there for ~120ms before
  // the leaving fade. With no padding, the cross-fade clips the final frames
  // and the bar reads as "not quite full."
  const barMs = Math.max(durationMs - 120, 150)
  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#0a0b14] transition-opacity duration-[250ms] ease-out ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden={leaving ? 'true' : 'false'}
    >
      <p className="text-sm tracking-wider text-[#e8e4dc]">
        [ AUTHENTICATED · ENTERING CELLAR ]
      </p>
      <div className="relative mt-4 h-px w-60 overflow-hidden">
        <span
          className="absolute inset-y-0 left-1/2 h-px w-0 -translate-x-1/2 bg-[#f72585] [box-shadow:0_0_6px_#f72585,0_0_12px_#f7258540] animate-cellar-hairline"
          style={{ animationDuration: `${barMs}ms` }}
        />
      </div>
    </div>
  )
}
