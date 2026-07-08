import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useOrdersStore } from '../../store/ordersStore'
import type { Order, OrderStatus } from '../../types'
import {
  orderSubtotal, orderTotal, balanceDue,
  getItemDisplayName, getItemImage,
} from '../../lib/orderUtils'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { X, Copy, Check, CreditCard, Trash2, Pencil, ImagePlus, Loader } from 'lucide-react'

const STATUS_FLOW: OrderStatus[] = ['new', 'confirmed', 'in_progress', 'ready', 'delivered']

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New', confirmed: 'Confirmed', in_progress: 'In Progress',
  ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled',
}

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  new:         { bg: '#1A1A0E', color: '#C9A05A' },
  confirmed:   { bg: '#0E1A14', color: '#6DBF9A' },
  in_progress: { bg: '#0E1020', color: '#8B9FD4' },
  ready:       { bg: '#0E1520', color: '#6AA8D4' },
  delivered:   { bg: 'var(--red-dim)', color: 'var(--red)' },
  cancelled:   { bg: 'var(--s2)', color: 'var(--ink-m)' },
}

type Props = { order: Order; onClose: () => void }

export default function OrderDetail({ order, onClose }: Props) {
  const { products, updateOrder, removeOrder } = useOrdersStore()
  const [copied, setCopied] = useState(false)
  const [amountPaid, setAmountPaid] = useState(order.amount_paid)
  const [savingPayment, setSavingPayment] = useState(false)
  const [discountPct, setDiscountPct] = useState(order.discount_pct)
  const [savingDiscount, setSavingDiscount] = useState(false)
  const [mutError, setMutError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [uploadingItemIdx, setUploadingItemIdx] = useState<number | null>(null)
  const itemFileRefs = useRef<(HTMLInputElement | null)[]>([])
  // Customer edit state
  const [editingCustomer, setEditingCustomer] = useState(false)
  const [editName, setEditName] = useState(order.customer_name)
  const [editContact, setEditContact] = useState(order.customer_contact ?? '')
  const [editDueDate, setEditDueDate] = useState(order.due_date ?? '')
  const [savingCustomer, setSavingCustomer] = useState(false)

  const items = order.items ?? []
  const subtotal = orderSubtotal(items)
  // use local discountPct for live preview
  const total = orderTotal(subtotal, discountPct)
  // use local amountPaid for live balance
  const balance = balanceDue(total, amountPaid)

  async function changeStatus(status: OrderStatus) {
    const prev = order.status
    updateOrder(order.id, { status })
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', order.id)
    if (error) { updateOrder(order.id, { status: prev }); setMutError('Failed to update status') }
  }

  async function savePayment() {
    setSavingPayment(true)
    const prev = order.amount_paid
    updateOrder(order.id, { amount_paid: amountPaid })
    const { error } = await supabase.from('orders').update({ amount_paid: amountPaid }).eq('id', order.id)
    if (error) { updateOrder(order.id, { amount_paid: prev }); setAmountPaid(prev); setMutError('Failed to save payment') }
    setSavingPayment(false)
  }

  async function markFullyPaid() {
    const prev = order.amount_paid
    setAmountPaid(total)
    updateOrder(order.id, { amount_paid: total })
    const { error } = await supabase.from('orders').update({ amount_paid: total }).eq('id', order.id)
    if (error) { updateOrder(order.id, { amount_paid: prev }); setAmountPaid(prev); setMutError('Failed to mark paid') }
  }

  async function saveDiscount() {
    setSavingDiscount(true)
    const prev = order.discount_pct
    updateOrder(order.id, { discount_pct: discountPct })
    const { error } = await supabase.from('orders').update({ discount_pct: discountPct }).eq('id', order.id)
    if (error) { updateOrder(order.id, { discount_pct: prev }); setDiscountPct(prev); setMutError('Failed to save discount') }
    setSavingDiscount(false)
  }

  function copyContact() {
    if (!order.customer_contact) return
    navigator.clipboard.writeText(order.customer_contact)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function deleteOrder() {
    if (!confirm('Delete this order? This cannot be undone.')) return
    setDeleting(true)
    await supabase.from('order_items').delete().eq('order_id', order.id)
    const { error } = await supabase.from('orders').delete().eq('id', order.id)
    if (error) { setMutError('Failed to delete order'); setDeleting(false); return }
    removeOrder(order.id)
    onClose()
  }

  async function uploadItemImage(itemIdx: number, file: File) {
    setUploadingItemIdx(itemIdx)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `orders/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('order-images')
      .upload(path, file, { contentType: file.type })
    if (uploadErr) { setUploadingItemIdx(null); setMutError('Image upload failed'); return }
    const { data: { publicUrl } } = supabase.storage.from('order-images').getPublicUrl(path)

    const item = items[itemIdx]
    const { error } = await supabase.from('order_items')
      .update({ custom_image_url: publicUrl })
      .eq('id', item.id)
    if (error) { setUploadingItemIdx(null); setMutError('Failed to save image'); return }

    const updatedItems = items.map((it, i) =>
      i === itemIdx ? { ...it, custom_image_url: publicUrl } : it
    )
    updateOrder(order.id, { items: updatedItems })
    setUploadingItemIdx(null)
  }

  async function removeItemImage(itemIdx: number) {
    const item = items[itemIdx]
    const { error } = await supabase.from('order_items')
      .update({ custom_image_url: null })
      .eq('id', item.id)
    if (error) { setMutError('Failed to remove image'); return }
    const updatedItems = items.map((it, i) =>
      i === itemIdx ? { ...it, custom_image_url: '' } : it
    )
    updateOrder(order.id, { items: updatedItems })
  }

  async function saveCustomer() {
    if (!editName.trim()) return
    setSavingCustomer(true)
    const changes = {
      customer_name: editName.trim(),
      customer_contact: editContact.trim() || null,
      due_date: editDueDate || null,
    }
    updateOrder(order.id, changes)
    const { error } = await supabase.from('orders').update(changes).eq('id', order.id)
    if (error) {
      updateOrder(order.id, { customer_name: order.customer_name, customer_contact: order.customer_contact, due_date: order.due_date })
      setMutError('Failed to save customer info')
    } else {
      setEditingCustomer(false)
    }
    setSavingCustomer(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--canvas)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {mutError && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 2,
          background: 'var(--red-dim)', borderBottom: '1px solid rgba(240,78,62,0.3)',
          padding: '10px var(--sp-xl)',
          fontSize: '13px', color: 'var(--red)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {mutError}
          <button onClick={() => setMutError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '16px', lineHeight: 1 }}>×</button>
        </div>
      )}
      {/* Top bar */}
      <div style={{
        borderBottom: '1px solid var(--hairline-s)',
        flexShrink: 0, position: 'sticky', top: 0,
        background: 'var(--canvas)', zIndex: 1,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--sp-lg) var(--sp-xl)',
          maxWidth: '600px', width: '100%', margin: '0 auto',
        }}>
          <div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '-0.015em' }}>
              #{order.order_number} - {order.customer_name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink-m)', marginTop: '2px' }}>
              {order.brand.charAt(0).toUpperCase() + order.brand.slice(1)} order
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
            <Button variant="icon" onClick={deleteOrder} disabled={deleting}>
              <Trash2 size={15} strokeWidth={1.5} color="var(--ink-m)" />
            </Button>
            <Button variant="icon" onClick={onClose}><X size={16} strokeWidth={1.5} /></Button>
          </div>
        </div>
      </div>

      <div style={{
        padding: 'var(--sp-xl)',
        display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)',
        maxWidth: '600px', width: '100%', margin: '0 auto',
      }}>

        {/* Status pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)' }}>
            Status
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-xs)', flexWrap: 'wrap' }}>
            {STATUS_FLOW.map(s => {
              const cfg = STATUS_CONFIG[s]
              const active = order.status === s
              return (
                <button key={s} onClick={() => changeStatus(s)} style={{
                  padding: '7px 14px', borderRadius: 'var(--r-pill)',
                  border: active ? `1px solid ${cfg.color}40` : '1px solid var(--hairline)',
                  background: active ? cfg.bg : 'transparent',
                  color: active ? cfg.color : 'var(--ink-m)',
                  fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500,
                  cursor: 'pointer', minHeight: '44px',
                  transition: 'all var(--dur-fast) var(--ease)',
                }}>
                  {STATUS_LABELS[s]}
                </button>
              )
            })}
            <button onClick={() => changeStatus('cancelled')} style={{
              padding: '7px 14px', borderRadius: 'var(--r-pill)',
              border: order.status === 'cancelled' ? '1px solid var(--red)' : '1px solid var(--hairline)',
              background: order.status === 'cancelled' ? 'var(--red-dim)' : 'transparent',
              color: order.status === 'cancelled' ? 'var(--red)' : 'var(--ink-m)',
              fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', minHeight: '44px',
            }}>
              Cancelled
            </button>
          </div>
        </div>

        {/* Customer info */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--hairline-s)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)' }}>Customer</div>
            {!editingCustomer && (
              <button onClick={() => setEditingCustomer(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-m)', display: 'flex', padding: '4px' }}>
                <Pencil size={13} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {editingCustomer ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
              <Input label="Name" value={editName} onChange={e => setEditName(e.target.value)} />
              <Input label="Contact" value={editContact} placeholder="Phone or WhatsApp" onChange={e => setEditContact(e.target.value)} />
              <Input label="Due date" type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
              <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
                <Button variant="primary" onClick={saveCustomer} disabled={savingCustomer || !editName.trim()}>
                  {savingCustomer ? 'Saving…' : 'Save'}
                </Button>
                <Button variant="ghost" onClick={() => {
                  setEditName(order.customer_name)
                  setEditContact(order.customer_contact ?? '')
                  setEditDueDate(order.due_date ?? '')
                  setEditingCustomer(false)
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>
                {order.customer_name}
              </div>
              {order.customer_contact && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--ink-m)' }}>{order.customer_contact}</span>
                  <button onClick={copyContact} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-m)', display: 'flex' }}>
                    {copied ? <Check size={14} strokeWidth={1.5} color="var(--status-printing-text)" /> : <Copy size={14} strokeWidth={1.5} />}
                  </button>
                </div>
              )}
              {order.due_date && (
                <div style={{ fontSize: '13px', color: 'var(--ink-m)' }}>
                  Due: {new Date(order.due_date).toLocaleDateString('en-LK', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)' }}>Items</div>
          {items.map((item, i) => {
            const name = getItemDisplayName(item, products)
            const img = getItemImage(item, products)
            const addonsTotal = item.addons.reduce((s, a) => s + a.price, 0)
            const lineTotal = (item.unit_price + addonsTotal) * item.quantity
            const isUploading = uploadingItemIdx === i
            return (
              <div key={i} style={{ background: 'var(--s1)', border: '1px solid var(--hairline-s)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
                {/* Image area with upload overlay */}
                <div style={{ position: 'relative', width: '100%', height: '160px', background: 'var(--s2)' }}>
                  {img
                    ? <img src={img} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', opacity: 0.15 }}>📦</div>
                  }
                  {/* Upload / remove overlay */}
                  <div style={{
                    position: 'absolute', bottom: 8, right: 8,
                    display: 'flex', gap: '6px', alignItems: 'center',
                  }}>
                    {item.custom_image_url && (
                      <button
                        onClick={() => removeItemImage(i)}
                        style={{
                          background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 'var(--r-full)',
                          width: '30px', height: '30px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        title="Remove image"
                      >
                        <X size={13} strokeWidth={2} color="#fff" />
                      </button>
                    )}
                    <button
                      onClick={() => itemFileRefs.current[i]?.click()}
                      disabled={isUploading}
                      style={{
                        background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 'var(--r-pill)',
                        padding: '6px 10px', cursor: isUploading ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontSize: '11px', fontWeight: 500, color: '#fff',
                      }}
                      title={img ? 'Replace image' : 'Upload image'}
                    >
                      {isUploading
                        ? <Loader size={13} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />
                        : <ImagePlus size={13} strokeWidth={1.5} />}
                      {isUploading ? 'Uploading…' : img ? 'Replace' : 'Upload'}
                    </button>
                  </div>
                  <input
                    type="file" accept="image/*"
                    ref={el => { itemFileRefs.current[i] = el }}
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) uploadItemImage(i, file)
                      e.target.value = ''
                    }}
                  />
                </div>
                <div style={{ padding: 'var(--sp-md)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{name}</span>
                    <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>×{item.quantity}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-m)' }}>Rs {item.unit_price.toLocaleString()} each</div>
                  {item.addons.map((a, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-m)' }}>
                      <span>+ {a.name}</span>
                      <span>Rs {a.price.toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'Geist, sans-serif', marginTop: '4px' }}>
                    Rs {Math.round(lineTotal).toLocaleString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pricing summary */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--hairline-s)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)', marginBottom: 'var(--sp-xs)' }}>Pricing</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--ink-m)' }}>Subtotal</span>
            <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 600, color: 'var(--ink)' }}>Rs {Math.round(subtotal).toLocaleString()}</span>
          </div>

          {/* Editable discount */}
          <div style={{ borderTop: '1px solid var(--hairline-s)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: discountPct > 0 ? 'var(--status-printing-text)' : 'var(--ink-m)' }}>
                Discount {discountPct > 0 ? `(${discountPct}%)` : ''}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
                {discountPct > 0 && (
                  <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '12px', fontWeight: 600, color: 'var(--status-printing-text)' }}>
                    - Rs {Math.round(subtotal * discountPct / 100).toLocaleString()}
                  </span>
                )}
                {discountPct !== order.discount_pct && (
                  <button onClick={saveDiscount} disabled={savingDiscount} style={{
                    padding: '3px 8px', borderRadius: 'var(--r-pill)',
                    background: 'var(--red)', color: '#fff', border: 'none',
                    fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                  }}>
                    {savingDiscount ? '...' : 'Save'}
                  </button>
                )}
              </div>
            </div>
            <input type="range" min={0} max={50} step={1} value={discountPct}
              onChange={e => setDiscountPct(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--red)', cursor: 'pointer', height: '4px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', color: 'var(--ink-m)' }}>0%</span>
              <span style={{ fontSize: '10px', color: 'var(--ink-m)' }}>50%</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', paddingTop: '8px', borderTop: '1px solid var(--hairline-s)' }}>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Total</span>
            <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, color: 'var(--red)' }}>Rs {Math.round(total).toLocaleString()}</span>
          </div>
        </div>

        {/* Payment */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--hairline-s)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)' }}>Payment</div>
            {balance > 0 && order.status !== 'cancelled' && (
              <button onClick={markFullyPaid} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px', borderRadius: 'var(--r-pill)',
                background: 'var(--status-printing-bg)',
                border: '1px solid rgba(109,191,154,0.2)',
                color: 'var(--status-printing-text)',
                fontSize: '11px', fontWeight: 500, cursor: 'pointer',
              }}>
                <CreditCard size={12} strokeWidth={1.5} /> Mark fully paid
              </button>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--ink-m)' }}>Type</span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>
              {order.payment_type === 'full' ? 'Full payment' : '50% Deposit'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input label="Amount paid (LKR)" type="number" min={0}
                value={amountPaid || ''} placeholder="0"
                onChange={e => setAmountPaid(Number(e.target.value))} />
            </div>
            <Button variant="white" onClick={savePayment} disabled={savingPayment}
              style={{ padding: '10px 14px', minHeight: '44px', flexShrink: 0 }}>
              {savingPayment ? <Check size={14} /> : 'Update'}
            </Button>
          </div>
          {balance > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '10px 14px', background: '#1A1A0E', borderRadius: 'var(--r-md)' }}>
              <span style={{ color: '#C9A05A' }}>Balance due</span>
              <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#C9A05A' }}>Rs {Math.round(balance).toLocaleString()}</span>
            </div>
          )}
          {balance <= 0 && (
            <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--status-printing-text)', fontWeight: 500 }}>
              ✓ Fully paid
            </div>
          )}
        </div>

        {order.notes && (
          <div style={{ background: 'var(--s1)', border: '1px solid var(--hairline-s)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)', marginBottom: 'var(--sp-sm)' }}>Notes</div>
            <div style={{ fontSize: '14px', color: 'var(--ink-m)', lineHeight: 1.6 }}>{order.notes}</div>
          </div>
        )}

      </div>
    </div>
  )
}
