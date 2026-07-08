import { create } from 'zustand'
import type { Order, Product } from '../types'

type OrdersStore = {
  orders: Order[]
  products: Product[]
  setOrders: (o: Order[]) => void
  setProducts: (p: Product[]) => void
  addOrder: (o: Order) => void
  updateOrder: (id: string, changes: Partial<Order>) => void
  removeOrder: (id: string) => void
}

export const useOrdersStore = create<OrdersStore>((set) => ({
  orders: [],
  products: [],
  setOrders: (orders) => set({ orders }),
  setProducts: (products) => set({ products }),
  addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
  updateOrder: (id, changes) => set((s) => ({
    orders: s.orders.map(o => o.id === id ? { ...o, ...changes } : o),
  })),
  removeOrder: (id) => set((s) => ({ orders: s.orders.filter(o => o.id !== id) })),
}))
