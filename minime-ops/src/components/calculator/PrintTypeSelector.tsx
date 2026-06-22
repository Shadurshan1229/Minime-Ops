import { useCalculatorStore } from '../../store/calculatorStore'

export default function PrintTypeSelector() {
  const {
    printTypes,
    selectedPrintTypeId,
    setSelectedPrintTypeId,
    setMarkupMultiplier,
    setPackagingCost,
  } = useCalculatorStore()

  function select(typeId: string) {
    const pt = printTypes.find(t => t.id === typeId)
    if (!pt) return
    setSelectedPrintTypeId(typeId)
    setMarkupMultiplier(pt.markup_multiplier)
    setPackagingCost(pt.packaging_cost_default)
  }

  return (
    <div style={{ marginBottom: 'var(--sp-xl)' }}>
      <div style={{
        fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--ink-m)',
        marginBottom: 'var(--sp-sm)',
      }}>
        Print Type
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-sm)' }}>
        {printTypes.map(pt => {
          const active = selectedPrintTypeId === pt.id
          return (
            <button
              key={pt.id}
              onClick={() => select(pt.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--sp-sm)',
                padding: 'var(--sp-lg)',
                borderRadius: 'var(--r-lg)',
                border: `1px solid ${active ? 'var(--red)' : 'var(--hairline)'}`,
                background: active ? 'var(--red-dim)' : 'var(--s1)',
                cursor: 'pointer',
                transition: 'all var(--dur-fast) var(--ease)',
                minHeight: '88px',
              }}
            >
              <img
                src={pt.logo_path}
                alt={pt.name}
                style={{
                  height: '28px',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: active ? 'none' : 'brightness(0.5)',
                  transition: 'filter var(--dur-fast) var(--ease)',
                }}
              />
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                color: active ? 'var(--red)' : 'var(--ink-m)',
                letterSpacing: '-0.01em',
              }}>
                {pt.markup_multiplier}x markup
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
