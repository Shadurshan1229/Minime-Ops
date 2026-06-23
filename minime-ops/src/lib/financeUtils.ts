import type { Transaction, Brand, Account } from '../types'

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getDateRange(period: 'week' | 'month' | '6month'): { from: Date; to: Date } {
  const to = new Date()
  const from = new Date()
  if (period === 'week') from.setDate(from.getDate() - 7)
  else if (period === 'month') from.setMonth(from.getMonth() - 1)
  else from.setMonth(from.getMonth() - 6)
  return { from, to }
}

// Compare date strings to avoid UTC vs local timezone mismatch.
// t.date is stored as "YYYY-MM-DD" in local time; from is converted to the same format.
export function filterByPeriod(transactions: Transaction[], period: 'week' | 'month' | '6month') {
  const { from } = getDateRange(period)
  const fromStr = toLocalDateStr(from)
  return transactions.filter(t => t.date >= fromStr)
}

export function getEffectiveAmount(t: Transaction, brand: Brand): number {
  if (t.brand === brand) return t.amount
  if (t.brand === 'general') return t.amount / 2
  return 0
}

export function getBrandTotals(transactions: Transaction[], brand: Brand) {
  const filtered = transactions.filter(t => t.brand === brand || t.brand === 'general')
  const income = filtered
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + getEffectiveAmount(t, brand), 0)
  const expense = filtered
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + getEffectiveAmount(t, brand), 0)
  return { income, expense, profit: income - expense }
}

// Uses getEffectiveAmount so general transactions are split 50/50 per brand,
// consistent with the brand breakdown cards.
export function getCategoryTotals(
  transactions: Transaction[],
  type: 'income' | 'expense',
  brand?: Brand,
) {
  const map: Record<string, number> = {}
  transactions
    .filter(t => t.type === type)
    .forEach(t => {
      const amount = brand ? getEffectiveAmount(t, brand) : t.amount
      if (amount > 0) map[t.category] = (map[t.category] ?? 0) + amount
    })
  return Object.entries(map)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
}

// Fix: treat Sunday (getDay() === 0) as day 7 so it maps to the preceding Monday,
// not the next Monday.
export function groupByWeek(transactions: Transaction[], type: 'income' | 'expense') {
  const map: Record<string, number> = {}
  transactions
    .filter(t => t.type === type)
    .forEach(t => {
      const d = new Date(t.date)
      const monday = new Date(d)
      const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay()
      monday.setDate(d.getDate() - dayOfWeek + 1)
      const key = toLocalDateStr(monday)
      map[key] = (map[key] ?? 0) + t.amount
    })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, amount]) => ({ week, amount }))
}

export function getAccountBalance(transactions: Transaction[], account: Account): number {
  return transactions
    .filter(t => t.account === account)
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
}

export function getAccountLastActivity(transactions: Transaction[], account: Account): string | null {
  const accountTx = transactions.filter(t => t.account === account)
  if (accountTx.length === 0) return null
  return accountTx.reduce((latest, t) => t.date > latest ? t.date : latest, accountTx[0].date)
}

export function formatLKR(amount: number) {
  return `Rs ${Math.round(amount).toLocaleString('en-LK')}`
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-LK', { day: 'numeric', month: 'short' })
}
