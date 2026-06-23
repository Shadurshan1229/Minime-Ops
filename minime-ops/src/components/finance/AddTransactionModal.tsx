import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useFinanceStore } from '../../store/financeStore'
import type { TransactionType, Brand, Account } from '../../types'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { X } from 'lucide-react'

type Props = { onClose: () => void }

const ACCOUNTS: Account[] = ['business', 'main', 'cash']
const ACCOUNT_LABELS: Record<Account, string> = {
  business: 'Business Account', main: 'Main Account', cash: 'Cash',
}
const BRANDS: Brand[] = ['minime', 'fantom', 'general']
const BRAND_LABELS: Record<Brand, string> = {
  minime: 'Minime', fantom: 'Fantom', general: 'General',
}

export default function AddTransactionModal({ onClose }: Props) {
  const { categories, addTransaction, lastAccount, lastCategory, setLastAccount, setLastCategory } = useFinanceStore()
  const [type, setType] = useState<TransactionType>('income')
  const [brand, setBrand] = useState<Brand>('minime')
  const [account, setAccount] = useState<Account>(lastAccount)
  const [category, setCategory] = useState(lastCategory)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filteredCats = categories.filter(c => c.type === type)

  function handleTypeChange(t: TransactionType) {
    setType(t)
    setCategory('')
  }

  function handleAccountChange(a: Account) {
    setAccount(a)
    setLastAccount(a)
  }

  function handleCategoryChange(c: string) {
    setCategory(c)
    setLastCategory(c)
  }

  async function handleSave() {
    if (!amount || !category) { setError('Fill amount and category'); return }
    setSaving(true)
    setError('')

    const { data, error: sbError } = await supabase
      .from('transactions')
      .insert({ type, brand, account, category, amount: Number(amount), note: note || null, date })
      .select().single()

    setSaving(false)
    if (sbError || !data) { setError('Failed to save'); return }
    setLastAccount(account)
    setLastCategory(category)
    addTransaction(data)
    onClose()
  }

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'var(--s1)', color: 'var(--ink)',
    border: '1px solid var(--hairline)',
    borderRadius: 'var(--r-md)',
    fontFamily: 'Inter, sans-serif', fontSize: '14px',
    letterSpacing: '-0.01em', outline: 'none',
    minHeight: '44px', appearance: 'none', cursor: 'pointer',
  }

  const chipStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '8px 12px', borderRadius: 'var(--r-pill)',
    border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    fontSize: '13px', fontWeight: 500, minHeight: '40px',
    background: active ? 'var(--s2)' : 'transparent',
    color: active ? 'var(--ink)' : 'var(--ink-m)',
    transition: 'all var(--dur-fast) var(--ease)',
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: 'var(--sp-lg)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--s2)', border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-xl)', padding: 'var(--sp-xl)',
        width: '100%', maxWidth: '480px',
        display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)',
        maxHeight: '90dvh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '-0.015em' }}>
            Add transaction
          </span>
          <Button variant="icon" onClick={onClose}><X size={16} strokeWidth={1.5} /></Button>
        </div>

        {/* Type toggle */}
        <div style={{ display: 'flex', background: 'var(--s1)', border: '1px solid var(--hairline-s)', borderRadius: 'var(--r-pill)', padding: '4px', gap: '4px' }}>
          <button style={chipStyle(type === 'income')} onClick={() => handleTypeChange('income')}>Income</button>
          <button style={chipStyle(type === 'expense')} onClick={() => handleTypeChange('expense')}>Expense</button>
        </div>

        {/* Brand */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)', marginBottom: 'var(--sp-xs)' }}>Brand</div>
          <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
            {BRANDS.map(b => (
              <button
                key={b}
                onClick={() => setBrand(b)}
                style={{
                  ...chipStyle(brand === b),
                  flex: 1,
                  background: brand === b ? 'var(--red-dim)' : 'var(--s1)',
                  color: brand === b ? 'var(--red)' : 'var(--ink-m)',
                  border: brand === b ? '1px solid rgba(240,78,62,0.2)' : '1px solid var(--hairline-s)',
                  borderRadius: 'var(--r-md)',
                }}
              >
                {BRAND_LABELS[b]}
              </button>
            ))}
          </div>
        </div>

        {/* Account */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)', marginBottom: 'var(--sp-xs)' }}>Account</div>
          <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
            {ACCOUNTS.map(a => (
              <button
                key={a}
                onClick={() => handleAccountChange(a)}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: 'var(--r-md)',
                  border: account === a ? '1px solid rgba(240,78,62,0.2)' : '1px solid var(--hairline-s)',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  fontSize: '12px', fontWeight: 500, minHeight: '44px',
                  background: account === a ? 'var(--red-dim)' : 'var(--s1)',
                  color: account === a ? 'var(--red)' : 'var(--ink-m)',
                  transition: 'all var(--dur-fast) var(--ease)',
                }}
              >
                {ACCOUNT_LABELS[a]}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)', marginBottom: 'var(--sp-xs)' }}>Category</div>
          <select value={category} onChange={e => handleCategoryChange(e.target.value)} style={selectStyle}>
            <option value="">Select category</option>
            {filteredCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        {/* Amount + Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-sm)' }}>
          <Input label="Amount (LKR)" type="number" min={0}
            value={amount} placeholder="0"
            onChange={e => setAmount(e.target.value)} />
          <Input label="Date" type="date"
            value={date}
            onChange={e => setDate(e.target.value)} />
        </div>

        {/* Note */}
        <Input label="Note (optional)" value={note} placeholder="e.g. eSun PLA+ restock"
          onChange={e => setNote(e.target.value)} />

        {error && <div style={{ fontSize: '13px', color: 'var(--red)' }}>{error}</div>}

        <Button variant="primary" onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Saving...' : 'Add transaction'}
        </Button>
      </div>
    </div>
  )
}
