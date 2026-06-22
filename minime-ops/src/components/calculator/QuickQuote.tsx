import { useState } from 'react'
import { useCalculatorStore } from '../../store/calculatorStore'
import { calculateQuickQuote, formatLKR } from '../../lib/calculations'
import Input from '../ui/Input'

const SIZES = ['small', 'medium', 'large', 'xl'] as const
const DETAILS = ['simple', 'moderate', 'high'] as const

const SIZE_LABELS: Record<typeof SIZES[number], string> = {
  small: 'Small', medium: 'Medium', large: 'Large', xl: 'XL',
}
const DETAIL_LABELS: Record<typeof DETAILS[number], string> = {
  simple: 'Simple', moderate: 'Moderate', high: 'High detail',
}

export default function QuickQuote() {
  const {
    filaments, printers, quickQuoteConfigs, macroSettings,
    printTypes, selectedPrintTypeId,
    qqSize, qqDetail, markupMultiplier,
    setQqSize, setQqDetail,
  } = useCalculatorStore()

  const defaultPackaging = printTypes.find(t => t.id === selectedPrintTypeId)?.packaging_cost_default ?? 0

  const [packagingCost, setPackagingCost] = useState(defaultPackaging)
  const [paintingCost, setPaintingCost] = useState(0)
  const [deliveryCost, setDeliveryCost] = useState(0)

  const quoteResult = (() => {
    if (!qqSize || !qqDetail || quickQuoteConfigs.length === 0 || filaments.length === 0) return null
    const config = quickQuoteConfigs.find(c => c.size === qqSize && c.detail === qqDetail)
    if (!config || !macroSettings) return null

    const cheapestFilament = filaments.reduce((a, b) => a.cost_per_kg < b.cost_per_kg ? a : b)
    const avgWattage = printers.length > 0
      ? printers.reduce((sum, p) => sum + p.wattage, 0) / printers.length
      : 300

    return calculateQuickQuote({
      filamentGramsMin: config.filament_grams_min,
      filamentGramsMax: config.filament_grams_max,
      printTimeMinutesMin: config.print_time_minutes_min,
      printTimeMinutesMax: config.print_time_minutes_max,
      costPerKg: cheapestFilament.cost_per_kg,
      wattage: avgWattage,
      electricityRateKwh: macroSettings.electricity_rate_kwh,
      maintenanceRatePerHour: macroSettings.maintenance_rate_per_hour,
      labourRatePerHour: macroSettings.labour_rate_per_hour,
      packagingCost,
      markupMultiplier,
    })
  })()

  const totalAddons = paintingCost + deliveryCost
  const finalMin = (quoteResult?.priceMin ?? 0) + totalAddons
  const finalMax = (quoteResult?.priceMax ?? 0) + totalAddons
  const hasAddons = totalAddons > 0

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: 'var(--r-pill)',
    border: `1px solid ${active ? 'transparent' : 'var(--hairline)'}`,
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    background: active ? 'var(--red)' : 'transparent',
    color: active ? '#ffffff' : 'var(--ink-m)',
    boxShadow: active ? '0 2px 10px var(--red-glow)' : 'none',
    transition: 'all var(--dur-fast) var(--ease)',
    minHeight: '44px',
  })

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--ink-m)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }}>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
        <div style={labelStyle}>Size</div>
        <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
          {SIZES.map(s => (
            <button key={s} style={chipStyle(qqSize === s)} onClick={() => setQqSize(s)}>
              {SIZE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
        <div style={labelStyle}>Detail level</div>
        <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
          {DETAILS.map(d => (
            <button key={d} style={chipStyle(qqDetail === d)} onClick={() => setQqDetail(d)}>
              {DETAIL_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {quoteResult ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>

          {/* Add-ons */}
          <div style={{
            background: 'var(--s1)', border: '1px solid var(--hairline-s)',
            borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)',
            display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)',
          }}>
            <div style={labelStyle}>Add-on costs (optional)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-sm)' }}>
              <Input
                label="Packaging"
                type="number" min={0}
                value={packagingCost || ''}
                placeholder="0"
                onChange={e => setPackagingCost(Number(e.target.value))}
              />
              <Input
                label="Painting"
                type="number" min={0}
                value={paintingCost || ''}
                placeholder="0"
                onChange={e => setPaintingCost(Number(e.target.value))}
              />
              <Input
                label="Delivery"
                type="number" min={0}
                value={deliveryCost || ''}
                placeholder="0"
                onChange={e => setDeliveryCost(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Range output */}
          <div style={{
            background: 'var(--red-dim)',
            border: '1px solid rgba(240, 78, 62, 0.15)',
            borderRadius: 'var(--r-lg)',
            padding: 'var(--sp-xl)',
            textAlign: 'center',
          }}>
            {hasAddons && (
              <div style={{ fontSize: '12px', color: 'var(--ink-m)', marginBottom: 'var(--sp-sm)' }}>
                Base {formatLKR(quoteResult.priceMin)} – {formatLKR(quoteResult.priceMax)}
                {' '}+ Rs {Math.round(totalAddons).toLocaleString()} add-ons
              </div>
            )}
            <div style={{ ...labelStyle, marginBottom: 'var(--sp-sm)' }}>
              {hasAddons ? 'Final estimated range' : 'Estimated range'}
            </div>
            <div style={{
              fontFamily: 'Geist, sans-serif', fontSize: '28px', fontWeight: 700,
              color: 'var(--ink)', letterSpacing: '-0.03em',
            }}>
              {formatLKR(finalMin)}
              <span style={{ color: 'var(--ink-m)', margin: '0 8px', fontWeight: 400 }}>–</span>
              {formatLKR(finalMax)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink-m)', marginTop: 'var(--sp-sm)' }}>
              {qqSize} · {qqDetail} detail · {markupMultiplier}x markup
            </div>
          </div>

        </div>
      ) : (
        <div style={{
          background: 'var(--s1)', border: '1px solid var(--hairline-s)',
          borderRadius: 'var(--r-lg)', padding: 'var(--sp-xl)',
          textAlign: 'center', color: 'var(--ink-m)', fontSize: '13px',
        }}>
          Select size and detail level to get an estimate
        </div>
      )}

      <div style={{ fontSize: '12px', color: 'var(--ink-m)', letterSpacing: '-0.01em', lineHeight: 1.5 }}>
        Quick estimate uses average filament cost and printer settings. Use Full Calc for exact pricing.
      </div>
    </div>
  )
}
