import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useFinanceStore } from '../store/financeStore'
import {
  filterByPeriod, getBrandTotals, getCategoryTotals,
  groupByWeek, formatLKR, formatDate,
  getAccountBalance, getAccountLastActivity,
} from '../lib/financeUtils'
import type { Account } from '../types'
import PageHeader from '../components/ui/PageHeader'
import PieChart from '../components/finance/PieChart'
import BarChart from '../components/finance/BarChart'
import AddTransactionModal from '../components/finance/AddTransactionModal'
import TransactionRow from '../components/finance/TransactionRow'
import Button from '../components/ui/Button'
import { Plus } from 'lucide-react'

type Period = 'week' | 'month' | '6month'
type BrandView = 'minime' | 'fantom' | 'all'

const PERIOD_LABELS: Record<Period, string> = { week: 'This week', month: 'This month', '6month': '6 months' }
const BRAND_LABELS: Record<BrandView, string> = { minime: 'Minime', fantom: 'Fantom', all: 'All' }

export default function Finance() {
  const { transactions, categories, setTransactions, setCategories, period, setPeriod, brandFilter, setBrandFilter } = useFinanceStore()
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('finance_categories').select('*'),
    ]).then(([{ data: tx }, { data: cats }]) => {
      if (tx) setTransactions(tx)
      if (cats) setCategories(cats)
      setLoading(false)
    })
  }, [])

  const periodTx = filterByPeriod(transactions, period)

  const viewTx = brandFilter === 'all'
    ? periodTx
    : periodTx.filter(t => t.brand === brandFilter || t.brand === 'general')

  const minimeTotals = getBrandTotals(periodTx, 'minime')
  const fantomTotals = getBrandTotals(periodTx, 'fantom')
  const totalIncome = periodTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = periodTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const activeBrand = brandFilter === 'all' ? undefined : brandFilter
  const expenseCats = getCategoryTotals(viewTx, 'expense', activeBrand)
  const pieSlices = expenseCats.map(c => ({
    name: c.name,
    amount: c.amount,
    color: categories.find(cat => cat.name === c.name)?.color ?? '#999',
  }))

  const weeklyIncome = groupByWeek(viewTx, 'income')
  const weeklyExpense = groupByWeek(viewTx, 'expense')

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 'var(--r-pill)',
    border: '1px solid var(--hairline)',
    fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500,
    cursor: 'pointer', background: active ? 'var(--s2)' : 'transparent',
    color: active ? 'var(--ink)' : 'var(--ink-m)',
    transition: 'all var(--dur-fast) var(--ease)',
  })

  return (
    <>
      <div>
        <PageHeader
          title="Finance"
          subtitle="Income, expenses and profit"
          action={
            <Button variant="primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} strokeWidth={1.5} /> Add
            </Button>
          }
        />

        <div style={{ padding: '0 var(--sp-xl) var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }}>

          {/* Account cards */}
          <div style={{ display: 'flex', gap: 'var(--sp-md)', overflowX: 'auto', paddingBottom: '2px' }}>
            {(['business', 'main', 'cash'] as Account[]).map(acc => {
              const ACCOUNT_LABELS: Record<Account, string> = { business: 'Business', main: 'Main', cash: 'Cash' }
              const balance = getAccountBalance(transactions, acc)
              const lastActivity = getAccountLastActivity(transactions, acc)
              return (
                <div key={acc} style={{
                  flexShrink: 0, minWidth: '160px',
                  background: 'var(--s1)', border: '1px solid var(--hairline-s)',
                  borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)', marginBottom: 'var(--sp-sm)' }}>
                    {ACCOUNT_LABELS[acc]}
                  </div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.03em', color: balance >= 0 ? 'var(--ink)' : 'var(--red)', lineHeight: 1 }}>
                    {formatLKR(balance)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-m)', marginTop: 'var(--sp-sm)' }}>
                    {lastActivity ? `Last: ${formatDate(lastActivity)}` : 'No activity'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Period filter */}
          <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
            {(['week', 'month', '6month'] as Period[]).map(p => (
              <button key={p} style={chipStyle(period === p)} onClick={() => setPeriod(p)}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          {/* Spotlight card */}
          <div style={{
            background: 'linear-gradient(135deg, #3D0A06 0%, #1A0804 60%, #0D0908 100%)',
            border: '1px solid rgba(240,78,62,0.18)',
            borderRadius: 'var(--r-xl)', padding: 'var(--sp-xl)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', bottom: -30, right: -30, width: 180, height: 180, background: 'radial-gradient(ellipse, rgba(240,78,62,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)', marginBottom: 'var(--sp-sm)' }}>
                Net profit · {PERIOD_LABELS[period]}
              </div>
              <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--ink)', lineHeight: 1 }}>
                {formatLKR(totalIncome - totalExpense)}
              </div>
              <div style={{ display: 'flex', gap: 'var(--sp-xl)', marginTop: 'var(--sp-lg)' }}>
                <div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '16px', fontWeight: 700, color: 'var(--status-printing-text)' }}>{formatLKR(totalIncome)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-m)', marginTop: '2px' }}>Income</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '16px', fontWeight: 700, color: 'var(--red)' }}>{formatLKR(totalExpense)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-m)', marginTop: '2px' }}>Expenses</div>
                </div>
              </div>
            </div>
          </div>

          {/* Brand breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }}>
            {([
              { brand: 'minime' as const, totals: minimeTotals, label: 'Minime' },
              { brand: 'fantom' as const, totals: fantomTotals, label: 'Fantom' },
            ]).map(({ brand, totals, label }) => (
              <div key={brand} style={{
                background: 'var(--s1)', border: '1px solid var(--hairline-s)',
                borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-m)', marginBottom: 'var(--sp-sm)', fontFamily: 'Geist, sans-serif' }}>{label}</div>
                <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '18px', fontWeight: 700, color: totals.profit >= 0 ? 'var(--ink)' : 'var(--red)', letterSpacing: '-0.02em' }}>
                  {formatLKR(totals.profit)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ink-m)', marginTop: '4px' }}>
                  +{formatLKR(totals.income)} / -{formatLKR(totals.expense)}
                </div>
              </div>
            ))}
          </div>

          {/* Brand filter */}
          <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
            {(['all', 'minime', 'fantom'] as BrandView[]).map(b => (
              <button key={b} style={chipStyle(brandFilter === b)} onClick={() => setBrandFilter(b)}>
                {BRAND_LABELS[b]}
              </button>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }}>
            {/* Expense pie */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--hairline-s)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)', marginBottom: 'var(--sp-md)' }}>Expenses by category</div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart slices={pieSlices} size={140} />
              </div>
              <div style={{ marginTop: 'var(--sp-md)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pieSlices.slice(0, 5).map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ink-m)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{formatLKR(s.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly bar charts */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--hairline-s)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)', marginBottom: 'var(--sp-md)' }}>Weekly income</div>
              <BarChart bars={weeklyIncome.map(w => ({ label: w.week, amount: w.amount }))} color="var(--status-printing-text)" />
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)', margin: 'var(--sp-md) 0 var(--sp-sm)' }}>Weekly expenses</div>
              <BarChart bars={weeklyExpense.map(w => ({ label: w.week, amount: w.amount }))} color="var(--red)" />
            </div>
          </div>

          {/* Transaction list */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)', marginBottom: 'var(--sp-md)' }}>
              Transactions
            </div>
            {loading && <div style={{ fontSize: '13px', color: 'var(--ink-m)' }}>Loading...</div>}
            {!loading && viewTx.length === 0 && (
              <div style={{ fontSize: '13px', color: 'var(--ink-m)', textAlign: 'center', padding: 'var(--sp-xxl) 0' }}>
                No transactions for this period
              </div>
            )}
            <div>
              {viewTx.map(t => <TransactionRow key={t.id} t={t} />)}
            </div>
          </div>

        </div>
      </div>

      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} />}
    </>
  )
}
