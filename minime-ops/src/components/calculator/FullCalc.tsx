import { useEffect } from 'react'
import { useCalculatorStore } from '../../store/calculatorStore'
import { calculate } from '../../lib/calculations'
import Input from '../ui/Input'
import ResultCard from './ResultCard'
import PrintTypeSelector from './PrintTypeSelector'

export default function FullCalc() {
  const {
    filaments, printers, macroSettings,
    selectedPrintTypeId,
    selectedPrinterId, selectedFilamentId,
    printTimeHours, printTimeMinutes, filamentGrams,
    markupMultiplier, deliveryCost, painterCost, packagingCost,
    setSelectedPrinterId, setSelectedFilamentId,
    setPrintTimeHours, setPrintTimeMinutes, setFilamentGrams,
    setMarkupMultiplier, setDeliveryCost, setPainterCost, setPackagingCost,
    result, setResult,
  } = useCalculatorStore()

  useEffect(() => {
    const printer = printers.find(p => p.id === selectedPrinterId)
    const filament = filaments.find(f => f.id === selectedFilamentId)
    if (!printer || !filament || !macroSettings || filamentGrams <= 0) {
      setResult(null); return
    }
    const totalMinutes = printTimeHours * 60 + printTimeMinutes
    if (totalMinutes <= 0) { setResult(null); return }

    setResult(calculate({
      filamentGrams,
      costPerKg: filament.cost_per_kg,
      printTimeMinutes: totalMinutes,
      wattage: printer.wattage,
      electricityRateKwh: macroSettings.electricity_rate_kwh,
      maintenanceRatePerHour: macroSettings.maintenance_rate_per_hour,
      labourRatePerHour: macroSettings.labour_rate_per_hour,
      deliveryCost,
      painterCost,
      packagingCost,
      markupMultiplier,
    }))
  }, [
    selectedPrinterId, selectedFilamentId, printTimeHours, printTimeMinutes,
    filamentGrams, markupMultiplier, deliveryCost, painterCost, packagingCost,
    printers, filaments, macroSettings,
  ])

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'var(--s1)', color: 'var(--ink)',
    border: '1px solid var(--hairline)',
    borderRadius: 'var(--r-md)',
    fontFamily: 'Inter, sans-serif', fontSize: '14px',
    letterSpacing: '-0.01em', outline: 'none',
    minHeight: '44px', appearance: 'none', cursor: 'pointer',
  }

  const sectionLabel = (text: string) => (
    <div style={{
      fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--ink-m)',
      marginBottom: 'var(--sp-sm)',
    }}>
      {text}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }}>

      <PrintTypeSelector />

      <div>
        {sectionLabel('Printer')}
        <select value={selectedPrinterId} onChange={e => setSelectedPrinterId(e.target.value)} style={selectStyle}>
          <option value="">Select printer</option>
          {printers.filter(p => p.active).map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.wattage}W)</option>
          ))}
        </select>
      </div>

      <div>
        {sectionLabel('Filament')}
        <select value={selectedFilamentId} onChange={e => setSelectedFilamentId(e.target.value)} style={selectStyle}>
          <option value="">Select filament</option>
          {filaments.map(f => (
            <option key={f.id} value={f.id}>{f.name} — Rs {f.cost_per_kg.toLocaleString()}/kg</option>
          ))}
        </select>
      </div>

      <div>
        {sectionLabel('Print Time')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-sm)' }}>
          <Input label="Hours" type="number" min={0}
            value={printTimeHours || ''} placeholder="0"
            onChange={e => setPrintTimeHours(Number(e.target.value))} />
          <Input label="Minutes" type="number" min={0} max={59}
            value={printTimeMinutes || ''} placeholder="0"
            onChange={e => setPrintTimeMinutes(Number(e.target.value))} />
        </div>
      </div>

      <Input label="Filament Used (grams)" type="number" min={0}
        value={filamentGrams || ''} placeholder="e.g. 87"
        onChange={e => setFilamentGrams(Number(e.target.value))} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {sectionLabel('Markup')}
          <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
            {markupMultiplier}x
          </span>
        </div>
        <input type="range" min={1} max={5} step={0.1} value={markupMultiplier}
          onChange={e => setMarkupMultiplier(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--red)', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-m)' }}>1x</span>
          <span style={{ fontSize: '11px', color: 'var(--ink-m)' }}>5x</span>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid var(--hairline-s)',
        paddingTop: 'var(--sp-lg)',
        display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)',
      }}>
        <div style={{
          fontFamily: 'Geist, sans-serif', fontSize: '13px', fontWeight: 600,
          color: 'var(--ink-m)', letterSpacing: '-0.01em',
        }}>
          Additional costs (optional)
        </div>

        <Input label="Packaging (LKR)" type="number" min={0}
          value={packagingCost || ''} placeholder="0"
          onChange={e => setPackagingCost(Number(e.target.value))} />

        <Input label="Delivery cost (LKR)" type="number" min={0}
          value={deliveryCost || ''} placeholder="0"
          onChange={e => setDeliveryCost(Number(e.target.value))} />

        <Input label="Painter / finishing cost (LKR)" type="number" min={0}
          value={painterCost || ''} placeholder="0"
          onChange={e => setPainterCost(Number(e.target.value))} />
      </div>

      {result && selectedPrintTypeId && (
        <ResultCard result={result} markupMultiplier={markupMultiplier} />
      )}

      {!selectedPrintTypeId && filamentGrams > 0 && (
        <div style={{
          padding: 'var(--sp-lg)', borderRadius: 'var(--r-md)',
          background: 'var(--s1)', border: '1px solid var(--hairline-s)',
          fontSize: '13px', color: 'var(--ink-m)', textAlign: 'center',
        }}>
          Select a print type above to see results
        </div>
      )}
    </div>
  )
}
