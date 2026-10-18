const STAIR = '2,5 8.5,5 8.5,12 15.5,12 15.5,19 22,19'

interface BrandMarkProps {
  // The spectrum gradient is defined once per page, in the nav's mark; the footer's mark reuses it.
  withGradient?: boolean
}

export default function BrandMark({ withGradient = false }: BrandMarkProps) {
  return (
    <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
      {withGradient && (
        <defs>
          <linearGradient id="specMark" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24" spreadMethod="repeat">
            <stop offset="0" style={{ stopColor: 'var(--s1)' }} />
            <stop offset=".25" style={{ stopColor: 'var(--s2)' }} />
            <stop offset=".5" style={{ stopColor: 'var(--s3)' }} />
            <stop offset=".75" style={{ stopColor: 'var(--s4)' }} />
            <stop offset="1" style={{ stopColor: 'var(--s5)' }} />
            <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="-24 -24" dur="8s" repeatCount="indefinite" />
          </linearGradient>
        </defs>
      )}
      <polyline className="halo" points={STAIR} />
      <polyline className="core" points={STAIR} />
    </svg>
  )
}
