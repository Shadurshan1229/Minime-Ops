import { type InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export default function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
      {label && (
        <label style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-m)',
        }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'var(--s1)',
          color: 'var(--ink)',
          border: error ? '1px solid var(--red)' : '1px solid var(--hairline)',
          borderRadius: 'var(--r-md)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          letterSpacing: '-0.01em',
          outline: 'none',
          transition: 'border-color var(--dur-instant) var(--ease)',
          minHeight: '44px',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--red)'
          e.currentTarget.style.boxShadow = '0 0 0 1px var(--red-ring)'
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--hairline)'
          e.currentTarget.style.boxShadow = 'none'
          props.onBlur?.(e)
        }}
      />
      {error && (
        <span style={{
          fontSize: '12px',
          color: 'var(--red)',
          fontFamily: 'Inter, sans-serif',
        }}>
          {error}
        </span>
      )}
    </div>
  )
}
