import { create } from 'zustand'
import type { Transaction, FinanceCategory, Account } from '../types'

type Period = 'week' | 'month' | '6month'
type BrandFilter = 'minime' | 'fantom' | 'all'

type FinanceStore = {
  transactions: Transaction[]
  categories: FinanceCategory[]
  period: Period
  brandFilter: BrandFilter
  lastAccount: Account
  lastCategory: string
  setTransactions: (t: Transaction[]) => void
  setCategories: (c: FinanceCategory[]) => void
  addTransaction: (t: Transaction) => void
  removeTransaction: (id: string) => void
  setPeriod: (p: Period) => void
  setBrandFilter: (b: BrandFilter) => void
  setLastAccount: (a: Account) => void
  setLastCategory: (c: string) => void
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  transactions: [],
  categories: [],
  period: 'month',
  brandFilter: 'all',
  lastAccount: 'business',
  lastCategory: '',
  setTransactions: (transactions) => set({ transactions }),
  setCategories: (categories) => set({ categories }),
  addTransaction: (t) => set((s) => ({ transactions: [t, ...s.transactions] })),
  removeTransaction: (id) => set((s) => ({ transactions: s.transactions.filter(t => t.id !== id) })),
  setPeriod: (period) => set({ period }),
  setBrandFilter: (brandFilter) => set({ brandFilter }),
  setLastAccount: (lastAccount) => set({ lastAccount }),
  setLastCategory: (lastCategory) => set({ lastCategory }),
}))
