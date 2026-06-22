import { useCalculatorStore } from '../../store/calculatorStore'

export default function CalcModeTabs() {
  const { mode, setMode } = useCalculatorStore()

  const tab = (label: string, value: 'full' | 'quick') => (
    <button
      onClick={() => setMode(value)}
      style={{
        flex: 1,
        padding: '8px 14px',
        borderRadius: 'var(--r-pill)',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '-0.01em',
        minHeight: '44px',
        background: mode === value ? 'var(--s2)' : 'transparent',
        color: mode === value ? 'var(--ink)' : 'var(--ink-m)',
        transition: 'background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease)',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{
      display: 'flex',
      background: 'var(--s1)',
      border: '1px solid var(--hairline-s)',
      borderRadius: 'var(--r-pill)',
      padding: '4px',
      gap: '4px',
      marginBottom: 'var(--sp-xl)',
    }}>
      {tab('Full Calc', 'full')}
      {tab('Quick Quote', 'quick')}
    </div>
  )
}
