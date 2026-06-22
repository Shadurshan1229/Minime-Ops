type CardVariant = 'standard' | 'elevated' | 'spotlight'

type CardProps = {
  variant?: CardVariant
  children: React.ReactNode
  style?: React.CSSProperties
  onClick?: () => void
}

const VARIANT_STYLES: Record<CardVariant, React.CSSProperties> = {
  standard: {
    background: 'var(--s1)',
    border: '1px solid var(--hairline-s)',
    borderRadius: 'var(--r-lg)',
  },
  elevated: {
    background: 'var(--s2)',
    border: '1px solid var(--hairline)',
    borderRadius: 'var(--r-xl)',
  },
  spotlight: {
    background: 'linear-gradient(135deg, #3D0A06 0%, #1A0804 60%, #0D0908 100%)',
    border: '1px solid rgba(240, 78, 62, 0.18)',
    borderRadius: 'var(--r-xl)',
    position: 'relative',
    overflow: 'hidden',
  },
}

export default function Card({ variant = 'standard', children, style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 'var(--sp-xl)',
        ...VARIANT_STYLES[variant],
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {variant === 'spotlight' && (
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          right: '-30px',
          width: '180px',
          height: '180px',
          background: 'radial-gradient(ellipse, rgba(240,78,62,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
