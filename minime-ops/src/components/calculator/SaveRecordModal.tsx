import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useCalculatorStore } from '../../store/calculatorStore'
import type { CalcResult } from '../../lib/calculations'
import Input from '../ui/Input'
import Button from '../ui/Button'

type Props = {
  result: CalcResult
  onClose: () => void
}

export default function SaveRecordModal({ result, onClose }: Props) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const {
    selectedPrinterId, selectedFilamentId,
    printTimeHours, printTimeMinutes,
    filamentGrams, markupMultiplier, macroSettings,
    setSavedRecords,
  } = useCalculatorStore()

  async function handleSave() {
    if (!name.trim()) { setError('Enter a name'); return }
    setSaving(true)
    setError('')

    const { error: sbError } = await supabase.from('print_records').insert({
      name: name.trim(),
      printer_id: selectedPrinterId,
      filament_id: selectedFilamentId,
      print_time_minutes: printTimeHours * 60 + printTimeMinutes,
      filament_grams: filamentGrams,
      electricity_rate: macroSettings?.electricity_rate_kwh ?? 0,
      markup_multiplier: markupMultiplier,
      cost_filament: result.costFilament,
      cost_electricity: result.costElectricity,
      cost_machine: result.costMaintenance + result.costLabour,
      cost_total: result.costTotal,
      price_suggested: result.priceSuggested,
    })

    setSaving(false)
    if (sbError) { setError(sbError.message); return }

    const { data: updated } = await supabase
      .from('print_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    if (updated) setSavedRecords(updated)

    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: 'var(--sp-lg)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--s2)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-xl)',
        padding: 'var(--sp-xl)',
        width: '100%',
        maxWidth: '480px',
        display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '-0.015em' }}>
            Save print record
          </span>
          <Button variant="icon" onClick={onClose}>
            <X size={16} strokeWidth={1.5} />
          </Button>
        </div>

        <Input
          label="Name"
          placeholder="e.g. Zen Garden Tray v2"
          value={name}
          onChange={e => setName(e.target.value)}
          error={error}
          autoFocus
        />

        <Button variant="primary" onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Saving...' : 'Save record'}
        </Button>
      </div>
    </div>
  )
}
