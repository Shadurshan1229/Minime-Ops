import { useState } from 'react'
import type { CalcResult } from '../../lib/calculations'
import { formatLKR } from '../../lib/calculations'
import Button from '../ui/Button'
import SaveRecordModal from './SaveRecordModal'

type Props = { result: CalcResult; markupMultiplier: number }

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid var(--hairline-s)', fontSize: '13px',
    }}>
      <span style={{ color: 'var(--ink-m)', letterSpacing: '-0.01em' }}>{label}</span>
      <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 600, color: 'var(--ink)' }}>
        {value}
      </span>
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'var(--ink-m)',
      paddingTop: 'var(--sp-md)', paddingBottom: 'var(--sp-xs)',
    }}>
      {children}
    </div>
  )
}

export default function ResultCard({ result, markupMultiplier }: Props) {
  const [showSave, setShowSave] = useState(false)

  return (
    <>
      <div style={{
        background: 'var(--s1)', border: '1px solid var(--hairline-s)',
        borderRadius: 'var(--r-lg)', padding: 'var(--sp-xl)',
        marginTop: 'var(--sp-sm)',
      }}>
        <SectionLabel>Material</SectionLabel>
        <Row label="Filament" value={formatLKR(result.costFilament)} />

        <SectionLabel>Print costs</SectionLabel>
        <Row label="Electricity" value={formatLKR(result.costElectricity)} />
        <Row label="Maintenance" value={formatLKR(result.costMaintenance)} />
        <Row label="Labour" value={formatLKR(result.costLabour)} />

        {(result.costPackaging > 0 || result.costDelivery > 0 || result.costPainter > 0) && (
          <>
            <SectionLabel>Additional</SectionLabel>
            {result.costPackaging > 0 && <Row label="Packaging" value={formatLKR(result.costPackaging)} />}
            {result.costDelivery > 0 && <Row label="Delivery" value={formatLKR(result.costDelivery)} />}
            {result.costPainter > 0 && <Row label="Painter / finishing" value={formatLKR(result.costPainter)} />}
          </>
        )}

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 0', fontSize: '13px', marginTop: 'var(--sp-xs)',
        }}>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Total cost</span>
          <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, color: 'var(--ink)', fontSize: '15px' }}>
            {formatLKR(result.costTotal)}
          </span>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px',
          background: 'var(--red-dim)',
          border: '1px solid rgba(240, 78, 62, 0.15)',
          borderRadius: 'var(--r-md)',
          marginTop: 'var(--sp-md)',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--red)', letterSpacing: '-0.01em' }}>
            Suggested price ({markupMultiplier}x)
          </span>
          <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '22px', fontWeight: 700, color: 'var(--red)', letterSpacing: '-0.02em' }}>
            {formatLKR(result.priceSuggested)}
          </span>
        </div>

        <Button variant="white" onClick={() => setShowSave(true)}
          style={{ width: '100%', marginTop: 'var(--sp-lg)' }}>
          Save print record
        </Button>
      </div>

      {showSave && <SaveRecordModal result={result} onClose={() => setShowSave(false)} />}
    </>
  )
}
