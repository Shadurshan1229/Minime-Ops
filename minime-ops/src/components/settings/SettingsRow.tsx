import { useState } from 'react'
import { Check } from 'lucide-react'
import Button from '../ui/Button'

type Field = {
  key: string
  label: string
  value: string | number
  type?: 'text' | 'number'
  suffix?: string
}

type Props = {
  fields: Field[]
  onSave: (values: Record<string, string | number>) => Promise<void>
  onDelete?: () => Promise<void>
}

export default function SettingsRow({ fields, onSave, onDelete }: Props) {
  const [values, setValues] = useState<Record<string, string | number>>(
    Object.fromEntries(fields.map(f => [f.key, f.value]))
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(values)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--hairline-s)',
      borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)',
      display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${fields.length}, 1fr)`,
        gap: 'var(--sp-sm)',
      }}>
        {fields.map(f => (
          <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
            <label style={{
              fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--ink-m)',
            }}>
              {f.label}{f.suffix ? ` (${f.suffix})` : ''}
            </label>
            <input
              type={f.type ?? 'text'}
              value={values[f.key]}
              onChange={e => setValues(v => ({
                ...v,
                [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
              }))}
              style={{
                width: '100%', padding: '8px 12px',
                background: 'var(--s2)', color: 'var(--ink)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--r-md)',
                fontFamily: 'Inter, sans-serif', fontSize: '14px',
                letterSpacing: '-0.01em', outline: 'none',
                minHeight: '40px',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'var(--red)'
                e.currentTarget.style.boxShadow = '0 0 0 1px var(--red-ring)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'var(--hairline)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-sm)', justifyContent: 'flex-end' }}>
        {onDelete && (
          <Button variant="ghost" onClick={onDelete}
            style={{ fontSize: '12px', padding: '6px 12px', minHeight: '36px', color: 'var(--red)', borderColor: 'transparent' }}>
            Delete
          </Button>
        )}
        <Button
          variant={saved ? 'secondary' : 'white'}
          onClick={handleSave}
          disabled={saving}
          style={{ fontSize: '12px', padding: '6px 14px', minHeight: '36px' }}
        >
          {saved ? (
            <><Check size={13} strokeWidth={2} /> Saved</>
          ) : saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
