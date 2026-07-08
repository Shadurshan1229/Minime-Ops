export type Filament = {
  id: string
  name: string
  brand: string
  material: string
  cost_per_kg: number
  cost_per_gram: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type Printer = {
  id: string
  name: string
  wattage: number
  hourly_rate: number
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export type PrintRecord = {
  id: string
  name: string
  printer_id: string
  filament_id: string
  print_time_minutes: number
  filament_grams: number
  electricity_rate: number
  markup_multiplier: number
  cost_filament: number
  cost_electricity: number
  cost_machine: number
  cost_total: number
  price_suggested: number
  created_by: string
  created_at: string
}

export type OrderStatus = 'new' | 'confirmed' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
export type PaymentType = 'full' | 'deposit'

export type Addon = {
  name: string
  price: number
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
  custom_name: string | null
  custom_image_url: string | null
  quantity: number
  unit_price: number
  addons: Addon[]
  created_at: string
}

export type Order = {
  id: string
  order_number: number
  customer_name: string
  customer_contact: string | null
  brand: Brand
  status: OrderStatus
  due_date: string | null
  discount_pct: number
  payment_type: PaymentType
  amount_paid: number
  notes: string | null
  pinned: boolean
  created_by: string
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export type Product = {
  id: string
  name: string
  description: string | null
  base_price: number
  production_days: number
  image_url: string | null
  brand: Brand
  active: boolean
  created_at: string
}

export type Note = {
  id: string
  title: string
  body: string
  pinned: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type QuickQuoteConfig = {
  id: string
  size: 'small' | 'medium' | 'large' | 'xl'
  detail: 'simple' | 'moderate' | 'high'
  filament_grams_min: number
  filament_grams_max: number
  print_time_minutes_min: number
  print_time_minutes_max: number
  updated_at: string
}

export type PrintType = {
  id: string
  name: string
  slug: 'minime' | 'fantom'
  markup_multiplier: number
  packaging_cost_default: number
  logo_path: string
  created_at: string
}

export type MacroSettings = {
  id: string
  electricity_rate_kwh: number
  maintenance_rate_per_hour: number
  labour_rate_per_hour: number
  updated_at: string
}

export type TransactionType = 'income' | 'expense'
export type Brand = 'minime' | 'fantom' | 'general'
export type Account = 'business' | 'main' | 'cash'

export type Transaction = {
  id: string
  type: TransactionType
  brand: Brand
  account: Account
  category: string
  amount: number
  note: string | null
  date: string
  created_by: string
  created_at: string
}

export type FinanceCategory = {
  id: string
  type: TransactionType
  name: string
  color: string
}

export type Page = 'calculator' | 'orders' | 'notes' | 'finance' | 'settings'
