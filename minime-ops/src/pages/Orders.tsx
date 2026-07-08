import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useOrdersStore } from '../store/ordersStore'
import type { Order, OrderStatus } from '../types'
import { orderSubtotal, orderTotal, balanceDue, isOverdue, daysUntilDue, getItemImage } from '../lib/orderUtils'
import PageHeader from '../components/ui/PageHeader'
import OrderCard from '../components/orders/OrderCard'
import OrderDetail from '../components/orders/OrderDetail'
import NewOrderModal from '../components/orders/NewOrderModal'
import Button from '../components/ui/Button'
import { Plus, LayoutGrid, LayoutList, Pin, Calendar, AlertCircle } from 'lucide-react'

type SortMode = 'newest' | 'oldest' | 'due_soon' | 'total_high'
type ViewMode = 'card' | 'list'

const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
]

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  new:         { color: '#C9A05A', label: 'New' },
  confirmed:   { color: '#6DBF9A', label: 'Confirmed' },
  in_progress: { color: '#8B9FD4', label: 'In Progress' },
  ready:       { color: '#6AA8D4', label: 'Ready' },
  delivered:   { color: 'var(--red)', label: 'Delivered' },
  cancelled:   { color: 'var(--ink-m)', label: 'Cancelled' },
}

function applySort(orders: Order[], sort: SortMode): Order[] {
  return [...orders].sort((a, b) => {
    if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (sort === 'due_soon') {
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }
    if (sort === 'total_high') {
      const aT = orderTotal(orderSubtotal(a.items ?? []), a.discount_pct)
      const bT = orderTotal(orderSubtotal(b.items ?? []), b.discount_pct)
      return bT - aT
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export default function Orders() {
  const { orders, products, setOrders, setProducts, updateOrder } = useOrdersStore()
  // Derive activeOrder from the store so status/payment changes reflect immediately without refresh
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const activeOrder = orders.find(o => o.id === activeOrderId) ?? null
  const [showNew, setShowNew] = useState(false)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [sort, setSort] = useState<SortMode>('newest')
  const [view, setView] = useState<ViewMode>('card')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false }),
      supabase.from('products').select('*').eq('active', true),
    ]).then(([{ data: orderData }, { data: productData }]) => {
      if (orderData) setOrders(orderData)
      if (productData) setProducts(productData)
      setLoading(false)
    })
  }, [])

  async function togglePin(order: Order) {
    const newPinned = !order.pinned
    updateOrder(order.id, { pinned: newPinned })
    const { error } = await supabase.from('orders').update({ pinned: newPinned }).eq('id', order.id)
    if (error) updateOrder(order.id, { pinned: order.pinned })
  }

  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)
  const sorted = applySort(filtered, sort)
  // pinned always float top, preserving relative sort within each group
  const displayed = [
    ...sorted.filter(o => o.pinned),
    ...sorted.filter(o => !o.pinned),
  ]

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 'var(--r-pill)',
    border: '1px solid var(--hairline)',
    fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500,
    cursor: 'pointer', background: active ? 'var(--s2)' : 'transparent',
    color: active ? 'var(--ink)' : 'var(--ink-m)',
    transition: 'all var(--dur-fast) var(--ease)',
    whiteSpace: 'nowrap' as const,
  })

  const viewBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--s2)' : 'transparent',
    border: '1px solid var(--hairline)',
    borderRadius: 'var(--r-sm)',
    padding: '6px', cursor: 'pointer',
    color: active ? 'var(--ink)' : 'var(--ink-m)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all var(--dur-fast) var(--ease)',
  })

  return (
    <>
      <div>
        <PageHeader
          title="Orders"
          subtitle={`${orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length} active`}
          action={
            <Button variant="primary" onClick={() => setShowNew(true)}>
              <Plus size={16} strokeWidth={1.5} /> New order
            </Button>
          }
        />

        <div style={{
          padding: '0 var(--sp-xl) var(--sp-xl)',
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)',
        }}>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: 'var(--sp-sm)', overflowX: 'auto', paddingBottom: '4px' }}>
            {STATUS_FILTERS.map(f => (
              <button key={f.value} style={chipStyle(statusFilter === f.value)}
                onClick={() => setStatusFilter(f.value)}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort + view toggle row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortMode)}
              style={{
                padding: '5px 10px', background: 'var(--s1)', color: 'var(--ink-m)',
                border: '1px solid var(--hairline)', borderRadius: 'var(--r-pill)',
                fontFamily: 'Inter, sans-serif', fontSize: '12px',
                outline: 'none', cursor: 'pointer', appearance: 'none',
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="due_soon">Due soon</option>
              <option value="total_high">Total: high → low</option>
            </select>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button style={viewBtnStyle(view === 'card')} onClick={() => setView('card')}>
                <LayoutGrid size={16} strokeWidth={1.5} />
              </button>
              <button style={viewBtnStyle(view === 'list')} onClick={() => setView('list')}>
                <LayoutList size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {loading && <div style={{ fontSize: '13px', color: 'var(--ink-m)' }}>Loading...</div>}

          {!loading && displayed.length === 0 && (
            <div style={{
              textAlign: 'center', padding: 'var(--sp-sec) 0',
              color: 'var(--ink-m)', fontSize: '14px',
            }}>
              No orders {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}
            </div>
          )}

          {/* Card grid */}
          {view === 'card' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 'var(--sp-md)',
            }}>
              {displayed.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  products={products}
                  onClick={() => setActiveOrderId(order.id)}
                  onPin={() => togglePin(order)}
                />
              ))}
            </div>
          )}

          {/* List view */}
          {view === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {displayed.map(order => {
                const items = order.items ?? []
                const subtotal = orderSubtotal(items)
                const total = orderTotal(subtotal, order.discount_pct)
                const balance = balanceDue(total, order.amount_paid)
                const overdue = isOverdue(order.due_date, order.status)
                const daysLeft = daysUntilDue(order.due_date)
                const cfg = STATUS_CONFIG[order.status]
                const thumbUrl = items[0] ? getItemImage(items[0], products) : null

                return (
                  <div
                    key={order.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--sp-md)',
                      padding: 'var(--sp-md) var(--sp-lg)',
                      background: 'var(--s1)',
                      border: order.pinned
                        ? '1px solid rgba(240,78,62,0.25)'
                        : overdue ? '1px solid rgba(240,78,62,0.2)' : '1px solid var(--hairline-s)',
                      borderRadius: 'var(--r-md)',
                      cursor: 'pointer',
                      transition: 'border-color var(--dur-instant) var(--ease)',
                    }}
                    onClick={() => setActiveOrderId(order.id)}
                    onMouseEnter={e => e.currentTarget.style.borderColor = order.pinned ? 'rgba(240,78,62,0.45)' : 'var(--hairline)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = order.pinned ? 'rgba(240,78,62,0.25)' : overdue ? 'rgba(240,78,62,0.2)' : 'var(--hairline-s)'}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: '44px', height: '44px', flexShrink: 0,
                      borderRadius: 'var(--r-sm)', overflow: 'hidden',
                      background: 'var(--s2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {thumbUrl
                        ? <img src={thumbUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '18px', opacity: 0.25 }}>📦</span>}
                    </div>

                    {/* Pin */}
                    <button
                      onClick={e => { e.stopPropagation(); togglePin(order) }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: order.pinned ? 'var(--red)' : 'var(--ink-m)',
                        opacity: order.pinned ? 1 : 0.3,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0', width: '44px', height: '44px',
                        flexShrink: 0,
                        transition: 'opacity var(--dur-fast) var(--ease)',
                      }}
                      onMouseEnter={e => { if (!order.pinned) e.currentTarget.style.opacity = '1' }}
                      onMouseLeave={e => { if (!order.pinned) e.currentTarget.style.opacity = '0.3' }}
                    >
                      <Pin size={14} strokeWidth={1.5} />
                    </button>

                    {/* Brand logo */}
                    {(order.brand === 'minime' || order.brand === 'fantom') && (
                      <img
                        src={`/${order.brand}_logo.svg`}
                        alt={order.brand}
                        style={{ height: '12px', width: 'auto', flexShrink: 0, opacity: 0.85 }}
                      />
                    )}

                    {/* Order# */}
                    <div style={{ fontSize: '11px', color: 'var(--ink-m)', fontFamily: 'Geist, sans-serif', flexShrink: 0, width: '28px' }}>
                      #{order.order_number}
                    </div>

                    {/* Customer */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.customer_name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-m)', marginTop: '1px' }}>
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Due date */}
                    {order.due_date && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '11px', flexShrink: 0,
                        color: overdue ? 'var(--red)' : daysLeft !== null && daysLeft <= 3 ? '#C9A05A' : 'var(--ink-m)',
                      }}>
                        {overdue ? <AlertCircle size={10} strokeWidth={2} /> : <Calendar size={10} strokeWidth={1.5} />}
                        {overdue ? `${Math.abs(daysLeft ?? 0)}d overdue`
                          : daysLeft === 0 ? 'Today'
                          : daysLeft === 1 ? 'Tomorrow'
                          : `${daysLeft}d`}
                      </div>
                    )}

                    {/* Status */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      fontSize: '11px', fontWeight: 500, flexShrink: 0,
                      color: cfg.color,
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.color }} />
                      {cfg.label}
                    </div>

                    {/* Total + balance */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                        Rs {Math.round(total).toLocaleString()}
                      </div>
                      {balance > 0 && order.status !== 'cancelled' && (
                        <div style={{ fontSize: '10px', color: '#C9A05A', marginTop: '1px' }}>
                          Rs {Math.round(balance).toLocaleString()} due
                        </div>
                      )}
                      {balance === 0 && order.status !== 'cancelled' && (
                        <div style={{ fontSize: '10px', color: 'var(--status-printing-text)', marginTop: '1px' }}>Paid</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showNew && <NewOrderModal onClose={() => setShowNew(false)} />}
      {activeOrder && (
        <OrderDetail
          order={activeOrder}
          onClose={() => setActiveOrderId(null)}
        />
      )}
    </>
  )
}
