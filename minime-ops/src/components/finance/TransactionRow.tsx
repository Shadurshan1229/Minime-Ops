import type { Transaction } from '../../types'
import { useFinanceStore } from '../../store/financeStore'
import { supabase } from '../../lib/supabase'
import { formatLKR, formatDate } from '../../lib/financeUtils'
import { Trash2 } from 'lucide-react'

const BRAND_LABEL: Record<string, string> = { minime: 'Minime', fantom: 'Fantom', general: 'General' }
const ACCOUNT_LABEL: Record<string, string> = { business: 'Business', main: 'Main', cash: 'Cash' }

export default function TransactionRow({ t }: { t: Transaction }) {
  const { removeTransaction, categories } = useFinanceStore()
  const cat = categories.find(c => c.name === t.category)

  async function handleDelete() {
    if (!confirm('Delete this transaction?')) return
    removeTransaction(t.id)
    await supabase.from('transactions').delete().eq('id', t.id)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--sp-md)',
      padding: 'var(--sp-md) 0',
      borderBottom: '1px solid var(--hairline-s)',
    }}>
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: cat?.color ?? 'var(--ink-m)', flexShrink: 0,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          {t.category}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--ink-m)', marginTop: '2px' }}>
          {BRAND_LABEL[t.brand]} · {ACCOUNT_LABEL[t.account]} · {formatDate(t.date)}
          {t.note && ` · ${t.note}`}
        </div>
      </div>

      <div style={{
        fontFamily: 'Geist, sans-serif', fontSize: '14px', fontWeight: 700,
        color: t.type === 'income' ? 'var(--status-printing-text)' : 'var(--red)',
        letterSpacing: '-0.01em', flexShrink: 0,
      }}>
        {t.type === 'income' ? '+' : '-'}{formatLKR(t.amount)}
      </div>

      <button
        onClick={handleDelete}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--ink-m)', padding: '4px', flexShrink: 0,
          display: 'flex', alignItems: 'center',
        }}
      >
        <Trash2 size={14} strokeWidth={1.5} />
      </button>
    </div>
  )
}
