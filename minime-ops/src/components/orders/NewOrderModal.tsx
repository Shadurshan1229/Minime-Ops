import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useOrdersStore } from '../../store/ordersStore'
import type { Addon, Brand, PaymentType } from '../../types'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { X, Plus, Trash2, ChevronLeft, ChevronRight, ImagePlus, Loader } from 'lucide-react'

type DraftItem = {
  product_id: string | null
  custom_name: string
  custom_image_url: string
  quantity: number
  unit_price: number
  addons: Addon[]
}

const emptyItem = (): DraftItem => ({
  product_id: null, custom_name: '', custom_image_url: '',
  quantity: 1, unit_price: 0, addons: [],
})

type Props = { onClose: () => void }

export default function NewOrderModal({ onClose }: Props) {
  const { products, addOrder } = useOrdersStore()
  const [step, setStep] = useState(1)

  const [customerName, setCustomerName] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [brand, setBrand] = useState<Brand>('minime')
  const [dueDate, setDueDate] = useState('')

  const [items, setItems] = useState<DraftItem[]>([emptyItem()])

  const [discountPct, setDiscountPct] = useState(0)
  const [paymentType, setPaymentType] = useState<PaymentType>('full')
  const [amountPaid, setAmountPaid] = useState(0)
  const [notes, setNotes] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const fileRefs = useRef<(HTMLInputElement | null)[]>([])

  async function handleImageUpload(idx: number, file: File) {
    setUploadingIdx(idx)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `orders/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('order-images')
      .upload(path, file, { contentType: file.type })
    if (uploadErr) { setUploadingIdx(null); setError('Image upload failed'); return }
    const { data: { publicUrl } } = supabase.storage.from('order-images').getPublicUrl(path)
    setItem(idx, { custom_image_url: publicUrl })
    setUploadingIdx(null)
  }

  const subtotal = items.reduce((s, item) => {
    const addonsTotal = item.addons.reduce((a, b) => a + b.price, 0)
    return s + (item.unit_price + addonsTotal) * item.quantity
  }, 0)
  const discount = subtotal * (discountPct / 100)
  const total = subtotal - discount

  function setItem(idx: number, changes: Partial<DraftItem>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...changes } : it))
  }

  function selectProduct(idx: number, productId: string) {
    const product = products.find(p => p.id === productId)
    if (!product) return
    setItem(idx, { product_id: productId, custom_name: '', unit_price: product.base_price })
  }

  function addAddon(idx: number) {
    setItems(prev => prev.map((it, i) =>
      i === idx ? { ...it, addons: [...it.addons, { name: '', price: 0 }] } : it
    ))
  }

  function setAddon(itemIdx: number, addonIdx: number, changes: Partial<Addon>) {
    setItems(prev => prev.map((it, i) =>
      i === itemIdx ? {
        ...it,
        addons: it.addons.map((a, j) => j === addonIdx ? { ...a, ...changes } : a),
      } : it
    ))
  }

  function removeAddon(itemIdx: number, addonIdx: number) {
    setItems(prev => prev.map((it, i) =>
      i === itemIdx ? { ...it, addons: it.addons.filter((_, j) => j !== addonIdx) } : it
    ))
  }

  function validateStep1() {
    if (!customerName.trim()) { setError('Enter customer name'); return false }
    setError(''); return true
  }

  function validateStep2() {
    for (const item of items) {
      if (!item.product_id && !item.custom_name.trim()) {
        setError('Each item needs a product or custom name'); return false
      }
      if (item.unit_price <= 0) { setError('Each item needs a price'); return false }
    }
    setError(''); return true
  }

  async function handleSave() {
    if (!validateStep2()) return
    setSaving(true); setError('')

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_name: customerName.trim(),
        customer_contact: customerContact.trim() || null,
        brand, status: 'new',
        due_date: dueDate || null,
        discount_pct: discountPct,
        payment_type: paymentType,
        amount_paid: amountPaid,
        notes: notes.trim() || null,
      })
      .select()
      .single()

    if (orderErr || !order) { setError('Failed to create order'); setSaving(false); return }

    const itemRows = items.map(it => ({
      order_id: order.id,
      product_id: it.product_id || null,
      custom_name: it.custom_name.trim() || null,
      custom_image_url: it.custom_image_url.trim() || null,
      quantity: it.quantity,
      unit_price: it.unit_price,
      addons: it.addons,
    }))

    const { data: savedItems, error: itemsErr } = await supabase.from('order_items').insert(itemRows).select()
    if (itemsErr || !savedItems) {
      await supabase.from('orders').delete().eq('id', order.id)
      setError('Failed to save items. Please try again.')
      setSaving(false)
      return
    }

    addOrder({ ...order, items: savedItems })
    setSaving(false)
    onClose()
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    padding: 'var(--sp-lg)',
  }

  const modalStyle: React.CSSProperties = {
    background: 'var(--s2)', border: '1px solid var(--hairline)',
    borderRadius: 'var(--r-xl)', padding: 'var(--sp-xl)',
    width: '100%', maxWidth: '540px',
    maxHeight: '92dvh', overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)',
  }

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'var(--s1)', color: 'var(--ink)',
    border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)',
    fontFamily: 'Inter, sans-serif', fontSize: '14px',
    letterSpacing: '-0.01em', outline: 'none',
    minHeight: '44px', appearance: 'none', cursor: 'pointer',
  }

  const lbl = (text: string) => (
    <div style={{
      fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--ink-m)',
    }}>
      {text}
    </div>
  )

  const chipStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '8px 12px', borderRadius: 'var(--r-pill)',
    border: active ? '1px solid rgba(240,78,62,0.3)' : '1px solid var(--hairline)',
    background: active ? 'var(--red-dim)' : 'var(--s1)',
    color: active ? 'var(--red)' : 'var(--ink-m)',
    fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500,
    cursor: 'pointer', minHeight: '40px',
    transition: 'all var(--dur-fast) var(--ease)',
  })

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modalStyle}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{
              fontFamily: 'Geist, sans-serif', fontSize: '16px',
              fontWeight: 600, letterSpacing: '-0.015em',
            }}>
              New Order
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink-m)', marginTop: '2px' }}>
              Step {step} of 3
            </div>
          </div>
          <Button variant="icon" onClick={onClose}><X size={16} strokeWidth={1.5} /></Button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 'var(--sp-xs)' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: '3px', borderRadius: 'var(--r-full)',
              background: s <= step ? 'var(--red)' : 'var(--s1)',
              transition: 'background var(--dur-fast) var(--ease)',
            }} />
          ))}
        </div>

        {/* STEP 1: Customer details */}
        {step === 1 && (
          <>
            {lbl('Brand')}
            <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
              <button style={chipStyle(brand === 'minime')} onClick={() => setBrand('minime')}>Minime</button>
              <button style={chipStyle(brand === 'fantom')} onClick={() => setBrand('fantom')}>Fantom</button>
            </div>
            <Input label="Customer name" value={customerName} placeholder="e.g. Kavindu Perera"
              onChange={e => setCustomerName(e.target.value)} />
            <Input label="WhatsApp / contact" value={customerContact} placeholder="+94 77 000 0000"
              onChange={e => setCustomerContact(e.target.value)} />
            <Input label="Due date (optional)" type="date" value={dueDate}
              onChange={e => setDueDate(e.target.value)} />
          </>
        )}

        {/* STEP 2: Items */}
        {step === 2 && (
          <>
            {items.map((item, idx) => (
              <div key={idx} style={{
                background: 'var(--s1)', border: '1px solid var(--hairline-s)',
                borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)',
                display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    fontSize: '12px', fontWeight: 600,
                    color: 'var(--ink-m)', fontFamily: 'Geist, sans-serif',
                  }}>
                    Item {idx + 1}
                  </div>
                  {items.length > 1 && (
                    <button
                      onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-m)' }}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </div>

                {lbl('Product')}
                <select
                  value={item.product_id ?? ''}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      setItem(idx, { product_id: null, unit_price: 0 })
                    } else if (e.target.value) {
                      selectProduct(idx, e.target.value)
                    }
                  }}
                  style={selectStyle}
                >
                  <option value="">Select from catalog</option>
                  {products.filter(p => p.active && p.brand === brand).map(p => (
                    <option key={p.id} value={p.id}>{p.name} - Rs {p.base_price.toLocaleString()}</option>
                  ))}
                  <option value="__custom__">+ Custom product</option>
                </select>

                {!item.product_id && (
                  <>
                    <Input label="Custom product name" value={item.custom_name}
                      placeholder="e.g. Custom Diorama - Office Scene"
                      onChange={e => setItem(idx, { custom_name: e.target.value })} />

                    {/* Image upload */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-m)' }}>
                        Reference image (optional)
                      </div>
                      {item.custom_image_url ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-sm)' }}>
                          <div style={{ position: 'relative', borderRadius: 'var(--r-md)', overflow: 'hidden', width: '80px', height: '80px', flexShrink: 0 }}>
                            <img src={item.custom_image_url} alt="preview"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <button
                              onClick={() => setItem(idx, { custom_image_url: '' })}
                              style={{
                                position: 'absolute', top: 3, right: 3,
                                background: 'rgba(0,0,0,0.75)', border: 'none',
                                borderRadius: 'var(--r-full)',
                                width: '20px', height: '20px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <X size={10} strokeWidth={2.5} color="#fff" />
                            </button>
                          </div>
                          <button
                            onClick={() => fileRefs.current[idx]?.click()}
                            style={{
                              background: 'none', border: '1px dashed var(--hairline)',
                              borderRadius: 'var(--r-md)', padding: '6px 10px',
                              color: 'var(--ink-m)', fontSize: '12px', cursor: 'pointer',
                            }}
                          >
                            Replace
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileRefs.current[idx]?.click()}
                          disabled={uploadingIdx === idx}
                          style={{
                            width: '80px', height: '80px',
                            border: '1px dashed var(--hairline)',
                            borderRadius: 'var(--r-md)', background: 'var(--s2)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '4px', cursor: 'pointer', color: 'var(--ink-m)',
                          }}
                        >
                          {uploadingIdx === idx
                            ? <Loader size={18} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />
                            : <><ImagePlus size={18} strokeWidth={1.5} /><span style={{ fontSize: '10px' }}>Upload</span></>}
                        </button>
                      )}
                      <input
                        type="file" accept="image/*"
                        ref={el => { fileRefs.current[idx] = el }}
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(idx, file)
                          e.target.value = ''
                        }}
                      />
                    </div>
                  </>
                )}

                {item.product_id && products.find(p => p.id === item.product_id)?.image_url && (
                  <img
                    src={products.find(p => p.id === item.product_id)!.image_url!}
                    alt="product"
                    style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: 'var(--r-md)' }}
                  />
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-sm)' }}>
                  <Input label="Quantity" type="number" min={1} value={item.quantity}
                    onChange={e => setItem(idx, { quantity: Number(e.target.value) })} />
                  <Input label="Unit price (LKR)" type="number" min={0} value={item.unit_price || ''}
                    placeholder="0"
                    onChange={e => setItem(idx, { unit_price: Number(e.target.value) })} />
                </div>

                {item.addons.map((addon, ai) => (
                  <div key={ai} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto',
                    gap: 'var(--sp-sm)', alignItems: 'flex-end',
                  }}>
                    <Input label={ai === 0 ? 'Add-on name' : ''} value={addon.name}
                      placeholder="e.g. Premium wooden base"
                      onChange={e => setAddon(idx, ai, { name: e.target.value })} />
                    <Input label={ai === 0 ? 'Price' : ''} type="number" min={0}
                      value={addon.price || ''} placeholder="0"
                      style={{ width: '90px' }}
                      onChange={e => setAddon(idx, ai, { price: Number(e.target.value) })} />
                    <button
                      onClick={() => removeAddon(idx, ai)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--ink-m)', paddingBottom: '10px',
                      }}
                    >
                      <X size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}

                <button onClick={() => addAddon(idx)} style={{
                  background: 'none', border: '1px dashed var(--hairline)',
                  borderRadius: 'var(--r-md)', padding: '8px',
                  color: 'var(--ink-m)', fontSize: '12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <Plus size={13} strokeWidth={1.5} /> Add add-on
                </button>

                <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '13px', color: 'var(--ink-m)' }}>
                  Item total:{' '}
                  <span style={{
                    fontFamily: 'Geist, sans-serif', fontWeight: 600,
                    color: 'var(--ink)', marginLeft: '6px',
                  }}>
                    Rs {Math.round(
                      (item.unit_price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}

            <button
              onClick={() => setItems(prev => [...prev, emptyItem()])}
              style={{
                background: 'none', border: '1px dashed var(--hairline)',
                borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)',
                color: 'var(--ink-m)', fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', width: '100%',
              }}
            >
              <Plus size={16} strokeWidth={1.5} /> Add another item
            </button>
          </>
        )}

        {/* STEP 3: Payment + summary */}
        {step === 3 && (
          <>
            {/* Order summary */}
            <div style={{
              background: 'var(--s1)', border: '1px solid var(--hairline-s)',
              borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)',
            }}>
              {lbl('Order summary')}
              <div style={{ marginTop: 'var(--sp-md)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {items.map((it, i) => {
                  const prod = it.product_id ? products.find(p => p.id === it.product_id) : null
                  const name = prod?.name ?? it.custom_name ?? 'Custom'
                  const lineTotal = (it.unit_price + it.addons.reduce((s, a) => s + a.price, 0)) * it.quantity
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--ink-m)' }}>{name} ×{it.quantity}</span>
                      <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 600, color: 'var(--ink)' }}>
                        Rs {Math.round(lineTotal).toLocaleString()}
                      </span>
                    </div>
                  )
                })}
                <div style={{ height: '1px', background: 'var(--hairline-s)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--ink-m)' }}>Subtotal</span>
                  <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 600, color: 'var(--ink)' }}>
                    Rs {Math.round(subtotal).toLocaleString()}
                  </span>
                </div>
                {discountPct > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--status-printing-text)' }}>Discount ({discountPct}%)</span>
                    <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 600, color: 'var(--status-printing-text)' }}>
                      - Rs {Math.round(discount).toLocaleString()}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', marginTop: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Total</span>
                  <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, color: 'var(--red)' }}>
                    Rs {Math.round(total).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Discount slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {lbl('Discount')}
                <span style={{
                  fontSize: '13px', fontWeight: 600,
                  color: 'var(--ink)', fontFamily: 'Geist, sans-serif',
                }}>
                  {discountPct}%
                </span>
              </div>
              <input type="range" min={0} max={50} step={1} value={discountPct}
                onChange={e => {
                  const pct = Number(e.target.value)
                  setDiscountPct(pct)
                  const newTotal = subtotal * (1 - pct / 100)
                  if (paymentType === 'full') setAmountPaid(newTotal)
                  else if (paymentType === 'deposit') setAmountPaid(newTotal * 0.5)
                }}
                style={{ width: '100%', accentColor: 'var(--red)', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--ink-m)' }}>0%</span>
                <span style={{ fontSize: '11px', color: 'var(--ink-m)' }}>50%</span>
              </div>
            </div>

            {/* Payment type */}
            {lbl('Payment')}
            <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
              <button
                style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--r-md)',
                  border: paymentType === 'full' ? '1px solid rgba(240,78,62,0.3)' : '1px solid var(--hairline)',
                  background: paymentType === 'full' ? 'var(--red-dim)' : 'var(--s1)',
                  color: paymentType === 'full' ? 'var(--red)' : 'var(--ink-m)',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500,
                }}
                onClick={() => { setPaymentType('full'); setAmountPaid(total) }}
              >
                Full payment<br />
                <span style={{ fontSize: '12px', opacity: 0.7 }}>Rs {Math.round(total).toLocaleString()}</span>
              </button>
              <button
                style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--r-md)',
                  border: paymentType === 'deposit' ? '1px solid rgba(240,78,62,0.3)' : '1px solid var(--hairline)',
                  background: paymentType === 'deposit' ? 'var(--red-dim)' : 'var(--s1)',
                  color: paymentType === 'deposit' ? 'var(--red)' : 'var(--ink-m)',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500,
                }}
                onClick={() => { setPaymentType('deposit'); setAmountPaid(total * 0.5) }}
              >
                50% Deposit<br />
                <span style={{ fontSize: '12px', opacity: 0.7 }}>Rs {Math.round(total * 0.5).toLocaleString()} now</span>
              </button>
            </div>

            <Input label="Amount paid (LKR)" type="number" min={0}
              value={amountPaid || ''} placeholder="0"
              onChange={e => setAmountPaid(Number(e.target.value))} />

            <Input label="Notes (optional)" value={notes}
              placeholder="Special instructions, references, etc."
              onChange={e => setNotes(e.target.value)} />
          </>
        )}

        {error && <div style={{ fontSize: '13px', color: 'var(--red)' }}>{error}</div>}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 'var(--sp-sm)', justifyContent: 'space-between' }}>
          {step > 1 ? (
            <Button variant="ghost" onClick={() => { setError(''); setStep(s => s - 1) }}>
              <ChevronLeft size={16} strokeWidth={1.5} /> Back
            </Button>
          ) : <div />}

          {step < 3 ? (
            <Button variant="primary" onClick={() => {
              if (step === 1 && !validateStep1()) return
              if (step === 2 && !validateStep2()) return
              setStep(s => s + 1)
            }}>
              Next <ChevronRight size={16} strokeWidth={1.5} />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Creating...' : 'Create order'}
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}
