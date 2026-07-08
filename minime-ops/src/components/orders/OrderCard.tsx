import { useState } from 'react'
import type { Order, Product } from '../../types'
import {
  orderTotal, orderSubtotal, balanceDue,
  isOverdue, daysUntilDue, getItemImage, getItemDisplayName,
} from '../../lib/orderUtils'
import { Calendar, AlertCircle, Pin, CheckCircle2 } from 'lucide-react'

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  new:         { bg: '#1A1A0E', color: '#C9A05A', label: 'New' },
  confirmed:   { bg: '#0E1A14', color: '#6DBF9A', label: 'Confirmed' },
  in_progress: { bg: '#0E1020', color: '#8B9FD4', label: 'In Progress' },
  ready:       { bg: '#0E1520', color: '#6AA8D4', label: 'Ready' },
  delivered:   { bg: 'var(--red-dim)', color: 'var(--red)', label: 'Delivered' },
  cancelled:   { bg: 'var(--s2)', color: 'var(--ink-m)', label: 'Cancelled' },
}

const BRAND_CONFIG: Record<string, { color: string }> = {
  minime:  { color: '#F04E3E' },
  fantom:  { color: '#6AA8D4' },
  general: { color: '#999999' },
}

type Props = {
  order: Order
  products: Product[]
  onClick: () => void
  onPin: () => void
}

export default function OrderCard({ order, products, onClick, onPin }: Props) {
  const [hovered, setHovered] = useState(false)
  const items = order.items ?? []
  const subtotal = orderSubtotal(items)
  const total = orderTotal(subtotal, order.discount_pct)
  const balance = balanceDue(total, order.amount_paid)
  const overdue = isOverdue(order.due_date, order.status)
  const daysLeft = daysUntilDue(order.due_date)
  const dueSoon = !overdue && daysLeft !== null && daysLeft <= 3 && order.status !== 'delivered' && order.status !== 'cancelled'
  const statusCfg = STATUS_CONFIG[order.status]
  const brandCfg = BRAND_CONFIG[order.brand] ?? BRAND_CONFIG.general

  const firstItem = items[0]
  const thumbUrl = firstItem ? getItemImage(firstItem, products) : null
  const firstItemName = firstItem ? getItemDisplayName(firstItem, products) : 'No items'
  const isDelivered = order.status === 'delivered'
  const isCancelled = order.status === 'cancelled'

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        background: 'var(--s1)',
        border: order.pinned
          ? '1px solid rgba(240,78,62,0.35)'
          : overdue ? '1px solid rgba(240,78,62,0.4)' : '1px solid var(--hairline-s)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        transition: 'border-color var(--dur-instant) var(--ease)',
        display: 'flex', flexDirection: 'column',
        opacity: isCancelled ? 0.55 : 1,
      }}
      onMouseEnter={e => {
        setHovered(true)
        e.currentTarget.style.borderColor = order.pinned
          ? 'rgba(240,78,62,0.6)'
          : overdue ? 'rgba(240,78,62,0.65)' : 'var(--hairline)'
      }}
      onMouseLeave={e => {
        setHovered(false)
        e.currentTarget.style.borderColor = order.pinned
          ? 'rgba(240,78,62,0.35)'
          : overdue ? 'rgba(240,78,62,0.4)' : 'var(--hairline-s)'
      }}
    >
      {/* Status color strip */}
      <div style={{
        height: '3px',
        background: overdue ? 'var(--red)' : dueSoon ? '#C9A05A' : statusCfg.color,
        opacity: isCancelled ? 0.3 : 0.8,
        flexShrink: 0,
      }} />

      {/* Square thumbnail */}
      <div style={{
        width: '100%', aspectRatio: '1',
        background: 'var(--s2)',
        overflow: 'hidden', position: 'relative', flexShrink: 0,
      }}>
        {thumbUrl ? (
          <img src={thumbUrl} alt={firstItemName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px', opacity: 0.2,
          }}>
            📦
          </div>
        )}

        {/* Delivered overlay */}
        {isDelivered && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(9,9,9,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle2 size={36} strokeWidth={1.5} color="rgba(255,255,255,0.7)" />
          </div>
        )}

        {/* Brand badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          padding: '4px 8px', borderRadius: 'var(--r-pill)',
          background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center',
        }}>
          {order.brand === 'minime' || order.brand === 'fantom' ? (
            <img
              src={`/${order.brand}_logo.svg`}
              alt={order.brand}
              style={{ height: '13px', width: 'auto', display: 'block' }}
            />
          ) : (
            <span style={{
              fontSize: '10px', fontWeight: 600, fontFamily: 'Geist, sans-serif',
              color: brandCfg.color, letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {order.brand}
            </span>
          )}
        </div>

        {/* Order number */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          padding: '3px 8px', borderRadius: 'var(--r-pill)',
          background: 'rgba(0,0,0,0.6)',
          fontSize: '10px', fontWeight: 600, fontFamily: 'Geist, sans-serif',
          color: 'var(--ink-m)',
        }}>
          #{order.order_number}
        </div>

        {/* Due soon badge */}
        {dueSoon && !overdue && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            padding: '3px 8px', borderRadius: 'var(--r-pill)',
            background: 'rgba(201,160,90,0.9)',
            fontSize: '10px', fontWeight: 600, fontFamily: 'Geist, sans-serif',
            color: '#000', display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Calendar size={9} strokeWidth={2} />
            {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d left`}
          </div>
        )}

        {/* Overdue badge */}
        {overdue && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            padding: '3px 8px', borderRadius: 'var(--r-pill)',
            background: 'rgba(240,78,62,0.9)',
            fontSize: '10px', fontWeight: 600, fontFamily: 'Geist, sans-serif',
            color: '#fff', display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <AlertCircle size={10} strokeWidth={2} /> Overdue
          </div>
        )}

        {/* Pin button */}
        <button
          onClick={e => { e.stopPropagation(); onPin() }}
          style={{
            position: 'absolute', bottom: 4, left: 4,
            width: '36px', height: '36px',
            borderRadius: 'var(--r-full)',
            background: order.pinned ? 'rgba(240,78,62,0.85)' : 'rgba(0,0,0,0.5)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'opacity var(--dur-fast) var(--ease)',
            opacity: order.pinned || hovered ? 1 : 0,
          }}
        >
          <Pin size={14} strokeWidth={2} color="#fff" />
        </button>
      </div>

      {/* Content */}
      <div style={{
        padding: 'var(--sp-md)',
        display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)', flex: 1,
      }}>
        {/* Customer + status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-sm)' }}>
          <div style={{
            fontFamily: 'Geist, sans-serif', fontSize: '14px', fontWeight: 600,
            color: 'var(--ink)', letterSpacing: '-0.01em', flex: 1,
          }}>
            {order.customer_name}
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '3px 8px', borderRadius: 'var(--r-sm)',
            background: statusCfg.bg, color: statusCfg.color,
            fontSize: '11px', fontWeight: 500, flexShrink: 0,
          }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: statusCfg.color }} />
            {statusCfg.label}
          </span>
        </div>

        {/* Product name + item count */}
        <div style={{ fontSize: '12px', color: 'var(--ink-m)', letterSpacing: '-0.01em' }}>
          {firstItemName}{items.length > 1 ? ` +${items.length - 1} more` : ''}
        </div>

        {/* Due date row (only if not already shown as badge) */}
        {order.due_date && !dueSoon && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '11px',
            color: overdue ? 'var(--red)' : 'var(--ink-m)',
          }}>
            <Calendar size={11} strokeWidth={1.5} />
            {overdue
              ? `Overdue by ${Math.abs(daysLeft ?? 0)}d`
              : `Due in ${daysLeft}d`}
          </div>
        )}

        {/* Price + payment */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 'auto', paddingTop: 'var(--sp-xs)',
        }}>
          <div style={{
            fontFamily: 'Geist, sans-serif', fontSize: '15px', fontWeight: 700,
            color: 'var(--ink)', letterSpacing: '-0.02em',
          }}>
            Rs {Math.round(total).toLocaleString()}
          </div>
          {balance > 0 && !isCancelled && (
            <div style={{ fontSize: '11px', color: '#C9A05A' }}>
              Rs {Math.round(balance).toLocaleString()} due
            </div>
          )}
          {balance === 0 && !isCancelled && (
            <div style={{ fontSize: '11px', color: 'var(--status-printing-text)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CheckCircle2 size={11} strokeWidth={2} /> Paid
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
