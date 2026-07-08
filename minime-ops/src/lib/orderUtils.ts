import type { OrderItem, Product } from '../types'

export function itemSubtotal(item: OrderItem): number {
  const addonsTotal = item.addons.reduce((s, a) => s + a.price, 0)
  return (item.unit_price + addonsTotal) * item.quantity
}

export function orderSubtotal(items: OrderItem[]): number {
  return items.reduce((s, i) => s + itemSubtotal(i), 0)
}

export function orderDiscount(subtotal: number, pct: number): number {
  return subtotal * (pct / 100)
}

export function orderTotal(subtotal: number, discountPct: number): number {
  return subtotal - orderDiscount(subtotal, discountPct)
}

export function depositDue(total: number): number {
  return total * 0.5
}

export function balanceDue(total: number, amountPaid: number): number {
  return Math.max(0, total - amountPaid)
}

export function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'delivered' || status === 'cancelled') return false
  return new Date(dueDate) < new Date()
}

export function daysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null
  const diff = new Date(dueDate).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getItemDisplayName(item: OrderItem, products: Product[]): string {
  if (item.product_id) {
    return products.find(p => p.id === item.product_id)?.name ?? 'Unknown product'
  }
  return item.custom_name ?? 'Custom item'
}

export function getItemImage(item: OrderItem, products: Product[]): string | null {
  if (item.custom_image_url) return item.custom_image_url
  if (item.product_id) return products.find(p => p.id === item.product_id)?.image_url ?? null
  return null
}
