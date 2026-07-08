import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/appStore'
import { orderSubtotal, orderTotal, balanceDue, isOverdue, daysUntilDue } from '../lib/orderUtils'
import type { Order, Note } from '../types'
import { AlertCircle, Calendar, TrendingUp, Package, Wallet, ArrowRight } from 'lucide-react'

type MonthFinance = { income: number; expense: number }

const STATUS_COLOR: Record<string, string> = {
  new: '#C9A05A', confirmed: '#6DBF9A', in_progress: '#8B9FD4',
  ready: '#6AA8D4', delivered: 'var(--red)', cancelled: 'var(--ink-m)',
}
const STATUS_LABEL: Record<string, string> = {
  new: 'New', confirmed: 'Confirmed', in_progress: 'In Progress',
  ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-LK', { weekday: 'short', day: 'numeric', month: 'short' })
}

function fmtLKR(n: number) {
  if (n >= 1000) return `Rs ${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `Rs ${Math.round(n).toLocaleString()}`
}

export default function Dashboard() {
  const { setActivePage } = useAppStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [finance, setFinance] = useState<MonthFinance>({ income: 0, expense: 0 })
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    Promise.all([
      supabase.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false }),
      supabase.from('transactions').select('type,amount').gte('date', monthStart.toISOString().slice(0, 10)),
      supabase.from('notes').select('*').eq('pinned', true).order('updated_at', { ascending: false }).limit(3),
    ]).then(([{ data: orderData }, { data: txData }, { data: noteData }]) => {
      if (orderData) setOrders(orderData)
      if (txData) {
        const income = txData.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const expense = txData.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        setFinance({ income, expense })
      }
      if (noteData) setPinnedNotes(noteData)
      setLoading(false)
    })
  }, [])

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
  const overdueOrders = activeOrders.filter(o => isOverdue(o.due_date, o.status))
  const outstandingBalance = activeOrders.reduce((s, o) => {
    const sub = orderSubtotal(o.items ?? [])
    return s + balanceDue(orderTotal(sub, o.discount_pct), o.amount_paid)
  }, 0)
  const netProfit = finance.income - finance.expense

  // Urgent orders: overdue first, then due soon, then in_progress/confirmed/new
  const urgentOrders = [...activeOrders]
    .sort((a, b) => {
      const aOver = isOverdue(a.due_date, a.status) ? 0 : 1
      const bOver = isOverdue(b.due_date, b.status) ? 0 : 1
      if (aOver !== bOver) return aOver - bOver
      const aDays = daysUntilDue(a.due_date) ?? 999
      const bDays = daysUntilDue(b.due_date) ?? 999
      return aDays - bDays
    })
    .slice(0, 5)

  const statCard = (label: string, value: string, sub: string, color: string, icon: React.ReactNode) => (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--hairline-s)',
      borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)',
      display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-m)' }}>
          {label}
        </div>
        <div style={{ color: 'var(--ink-m)', opacity: 0.5 }}>{icon}</div>
      </div>
      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.04em', color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--ink-m)' }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }}>

      {/* Header */}
      <div style={{ paddingTop: 'var(--sp-sm)' }}>
        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
          {greeting()}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ink-m)', marginTop: '2px' }}>{formatDate()}</div>
      </div>

      {loading ? (
        <div style={{ fontSize: '13px', color: 'var(--ink-m)' }}>Loading…</div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
            {statCard('Active', String(activeOrders.length), `${overdueOrders.length} overdue`, 'var(--ink)', <Package size={14} strokeWidth={1.5} />)}
            {statCard('Overdue', String(overdueOrders.length), overdueOrders.length > 0 ? 'needs attention' : 'all on track',
              overdueOrders.length > 0 ? 'var(--red)' : 'var(--ink)', <AlertCircle size={14} strokeWidth={1.5} />)}
            {statCard('Balance due', fmtLKR(outstandingBalance), 'across active orders', 'var(--ink)', <Wallet size={14} strokeWidth={1.5} />)}
            {statCard('Net this month', fmtLKR(Math.abs(netProfit)), netProfit >= 0 ? 'profit' : 'loss',
              netProfit >= 0 ? 'var(--ink)' : 'var(--red)', <TrendingUp size={14} strokeWidth={1.5} />)}
          </div>

          {/* Urgent orders */}
          {urgentOrders.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-md)' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)' }}>
                  Active orders
                </div>
                <button onClick={() => setActivePage('orders')} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '12px', color: 'var(--ink-m)',
                }}>
                  See all <ArrowRight size={12} strokeWidth={1.5} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {urgentOrders.map(order => {
                  const overdue = isOverdue(order.due_date, order.status)
                  const daysLeft = daysUntilDue(order.due_date)
                  const sub = orderSubtotal(order.items ?? [])
                  const total = orderTotal(sub, order.discount_pct)
                  const balance = balanceDue(total, order.amount_paid)
                  const color = STATUS_COLOR[order.status] ?? 'var(--ink-m)'

                  return (
                    <button
                      key={order.id}
                      onClick={() => setActivePage('orders')}
                      style={{
                        width: '100%', textAlign: 'left',
                        background: 'var(--s1)', border: overdue ? '1px solid rgba(240,78,62,0.25)' : '1px solid var(--hairline-s)',
                        borderRadius: 'var(--r-md)',
                        padding: '12px var(--sp-lg)',
                        display: 'flex', alignItems: 'center', gap: 'var(--sp-md)',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Status dot */}
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: overdue ? 'var(--red)' : color, flexShrink: 0 }} />

                      {/* Brand + order# */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                        {(order.brand === 'minime' || order.brand === 'fantom') && (
                          <img src={`/${order.brand}_logo.svg`} alt={order.brand} style={{ height: '11px', width: 'auto', opacity: 0.7 }} />
                        )}
                        <span style={{ fontSize: '11px', color: 'var(--ink-m)', fontFamily: 'Geist, sans-serif' }}>#{order.order_number}</span>
                      </div>

                      {/* Customer */}
                      <div style={{ flex: 1, minWidth: 0, fontFamily: 'Geist, sans-serif', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.customer_name}
                      </div>

                      {/* Due indicator */}
                      {order.due_date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', flexShrink: 0, color: overdue ? 'var(--red)' : daysLeft !== null && daysLeft <= 3 ? '#C9A05A' : 'var(--ink-m)' }}>
                          {overdue ? <AlertCircle size={10} strokeWidth={2} /> : <Calendar size={10} strokeWidth={1.5} />}
                          {overdue
                            ? `${Math.abs(daysLeft ?? 0)}d late`
                            : daysLeft === 0 ? 'Today'
                            : daysLeft === 1 ? 'Tomorrow'
                            : `${daysLeft}d`}
                        </div>
                      )}

                      {/* Status label */}
                      <div style={{ fontSize: '11px', fontWeight: 500, color, flexShrink: 0 }}>
                        {STATUS_LABEL[order.status]}
                      </div>

                      {/* Balance */}
                      {balance > 0 && (
                        <div style={{ fontSize: '11px', color: '#C9A05A', flexShrink: 0 }}>
                          {fmtLKR(balance)} due
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Finance this month */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-md)' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)' }}>
                Finance · this month
              </div>
              <button onClick={() => setActivePage('finance')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '12px', color: 'var(--ink-m)',
              }}>
                Details <ArrowRight size={12} strokeWidth={1.5} />
              </button>
            </div>
            <div style={{ background: 'var(--s1)', border: '1px solid var(--hairline-s)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              {/* Income / expense row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-m)', marginBottom: '4px' }}>Income</div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--status-printing-text)' }}>
                    {fmtLKR(finance.income)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-m)', marginBottom: '4px' }}>Expenses</div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--red)' }}>
                    {fmtLKR(finance.expense)}
                  </div>
                </div>
              </div>

              {/* Bar */}
              {(finance.income > 0 || finance.expense > 0) && (() => {
                const max = Math.max(finance.income, finance.expense)
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px', height: '6px', borderRadius: 'var(--r-full)', overflow: 'hidden', background: 'var(--s2)' }}>
                      <div style={{ width: `${(finance.income / max) * 100}%`, background: 'var(--status-printing-text)', borderRadius: 'var(--r-full)', transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '4px', height: '6px', borderRadius: 'var(--r-full)', overflow: 'hidden', background: 'var(--s2)' }}>
                      <div style={{ width: `${(finance.expense / max) * 100}%`, background: 'var(--red)', borderRadius: 'var(--r-full)', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )
              })()}

              {/* Net */}
              <div style={{ borderTop: '1px solid var(--hairline-s)', paddingTop: 'var(--sp-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--ink-m)' }}>Net profit</span>
                <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.03em', color: netProfit >= 0 ? 'var(--ink)' : 'var(--red)' }}>
                  {netProfit < 0 ? '-' : ''}{fmtLKR(Math.abs(netProfit))}
                </span>
              </div>
            </div>
          </div>

          {/* Pinned notes */}
          {pinnedNotes.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-md)' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)' }}>
                  Pinned notes
                </div>
                <button onClick={() => setActivePage('notes')} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '12px', color: 'var(--ink-m)',
                }}>
                  All notes <ArrowRight size={12} strokeWidth={1.5} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                {pinnedNotes.map(note => (
                  <button
                    key={note.id}
                    onClick={() => setActivePage('notes')}
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      background: 'var(--s1)', border: '1px solid var(--hairline-s)',
                      borderRadius: 'var(--r-md)', padding: '12px var(--sp-lg)',
                      display: 'flex', flexDirection: 'column', gap: '4px',
                    }}
                  >
                    <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                      {note.title || 'Untitled'}
                    </div>
                    {note.body && (
                      <div style={{ fontSize: '12px', color: 'var(--ink-m)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {note.body.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '')}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {activeOrders.length === 0 && pinnedNotes.length === 0 && finance.income === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--sp-sec) 0', color: 'var(--ink-m)', fontSize: '14px' }}>
              Nothing yet — create your first order to get started.
            </div>
          )}
        </>
      )}
    </div>
  )
}
