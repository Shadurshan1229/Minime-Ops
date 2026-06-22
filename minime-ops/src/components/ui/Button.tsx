import { type ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'white' | 'secondary' | 'ghost' | 'icon'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--red)',
    color: '#ffffff',
    boxShadow: '0 0 0 1px var(--red-ring), 0 4px 20px var(--red-glow)',
    border: 'none',
  },
  white: {
    background: '#ffffff',
    color: '#000000',
    border: 'none',
  },
  secondary: {
    background: 'var(--s1)',
    color: 'var(--ink)',
    border: '1px solid var(--hairline)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--ink-m)',
    border: '1px solid var(--hairline)',
  },
  icon: {
    background: 'var(--s1)',
    color: 'var(--ink)',
    border: '1px solid var(--hairline)',
    width: '40px',
    height: '40px',
    padding: 0,
    borderRadius: 'var(--r-full)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  style,
  children,
  ...props
}: ButtonProps) {
  const isIcon = variant === 'icon'

  return (
    <button
      {...props}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: isIcon ? 0 : size === 'sm' ? '8px 12px' : '10px 15px',
        borderRadius: isIcon ? 'var(--r-full)' : 'var(--r-pill)',
        fontFamily: 'Inter, sans-serif',
        fontSize: size === 'sm' ? '12px' : '14px',
        fontWeight: 500,
        letterSpacing: '-0.01em',
        lineHeight: 1,
        cursor: 'pointer',
        transition: 'opacity var(--dur-fast) var(--ease)',
        minHeight: '44px',
        minWidth: isIcon ? '44px' : undefined,
        ...VARIANT_STYLES[variant],
        ...style,
      }}
    >
      {children}
    </button>
  )
}
