import { RotateCcw } from 'lucide-react'
import { useCalculatorStore } from '../../store/calculatorStore'
import { formatLKR } from '../../lib/calculations'
import type { PrintRecord } from '../../types'

export default function SavedRecords() {
  const {
    savedRecords, printers, filaments, printTypes,
    setSelectedPrinterId, setSelectedFilamentId,
    setPrintTimeHours, setPrintTimeMinutes,
    setFilamentGrams, setMarkupMultiplier,
    setDeliveryCost, setPainterCost, setPackagingCost,
    setMode, setResult, setSelectedPrintTypeId,
  } = useCalculatorStore()

  if (savedRecords.length === 0) return null

  function loadRecord(record: PrintRecord) {
    const printer = printers.find(p => p.id === record.printer_id)
    const filament = filaments.find(f => f.id === record.filament_id)
    if (!printer || !filament) return

    setSelectedPrinterId(record.printer_id)
    setSelectedFilamentId(record.filament_id)
    setPrintTimeHours(Math.floor(record.print_time_minutes / 60))
    setPrintTimeMinutes(record.print_time_minutes % 60)
    setFilamentGrams(record.filament_grams)
    setMarkupMultiplier(record.markup_multiplier)
    setDeliveryCost(0)
    setPainterCost(0)
    setPackagingCost(0)
    setMode('full')

    setResult({
      costFilament: record.cost_filament,
      costElectricity: record.cost_electricity,
      costMaintenance: record.cost_machine,
      costLabour: 0,
      costDelivery: 0,
      costPainter: 0,
      costPackaging: 0,
      costTotal: record.cost_total,
      priceSuggested: record.price_suggested,
    })

    const matchedType = printTypes.find(t => t.markup_multiplier === record.markup_multiplier)
    if (matchedType) setSelectedPrintTypeId(matchedType.id)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function formatTime(minutes: number) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-LK', { day: 'numeric', month: 'short' })
  }

  return (
    <div style={{ marginTop: 'var(--sp-xxl)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'var(--sp-md)',
      }}>
        <div style={{
          fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--ink-m)',
        }}>
          Recent records
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ink-m)' }}>
          Tap to reload
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
        {savedRecords.map(record => {
          const printer = printers.find(p => p.id === record.printer_id)
          const filament = filaments.find(f => f.id === record.filament_id)

          return (
            <button
              key={record.id}
              onClick={() => loadRecord(record)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-md)',
                padding: 'var(--sp-lg)',
                background: 'var(--s1)',
                border: '1px solid var(--hairline-s)',
                borderRadius: 'var(--r-lg)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'border-color var(--dur-instant) var(--ease)',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--hairline)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--hairline-s)'}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: 'var(--r-full)',
                background: 'var(--s2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <RotateCcw size={15} strokeWidth={1.5} color="var(--ink-m)" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Geist, sans-serif', fontSize: '14px', fontWeight: 600,
                  color: 'var(--ink)', letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {record.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink-m)', marginTop: '3px', letterSpacing: '-0.01em' }}>
                  {filament?.name ?? '—'} · {printer?.name ?? '—'} · {formatTime(record.print_time_minutes)}
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontFamily: 'Geist, sans-serif', fontSize: '14px', fontWeight: 700,
                  color: 'var(--red)', letterSpacing: '-0.01em',
                }}>
                  {formatLKR(record.price_suggested)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ink-m)', marginTop: '3px' }}>
                  {formatDate(record.created_at)}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
