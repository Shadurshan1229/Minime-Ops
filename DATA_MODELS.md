# DATA_MODELS.md - Minime Ops v1.0.0

> All data shapes. Source of truth for DB schema + TypeScript types.
> Supabase Postgres. RLS enabled on all tables.

---

## Users

Supabase Auth handles users. No custom users table needed.
Both Ajai and Vithuran get accounts. RLS: all data scoped to authenticated users (shared workspace - both see everything).

---

## Filaments

```ts
type Filament = {
  id: string              // uuid
  name: string            // "eSun PLA+"
  brand: string           // "eSun"
  material: string        // "PLA+" | "PETG" | "ABS" | "TPU" | "Silk PLA" | "Marble PLA" | string
  cost_per_kg: number     // LKR, e.g. 4700
  cost_per_gram: number   // derived: cost_per_kg / 1000, stored for perf
  notes: string | null
  created_at: string
  updated_at: string
}
```

Rows: ~5-10 max. No per-color tracking. Brand/material level only.

---

## Printers

```ts
type Printer = {
  id: string
  name: string            // "Bambu A1" | "Creality Hi" | "Creality K1 Max"
  wattage: number         // power draw in watts, e.g. 350
  hourly_rate: number     // LKR machine time charge per hour
  notes: string | null
  active: boolean         // soft disable without delete
  created_at: string
  updated_at: string
}
```

Rows: 3 (fixed fleet). Rarely changes.

---

## Print Records

Saved outputs from calculator. Reusable cost reference.

```ts
type PrintRecord = {
  id: string
  name: string            // "Zen Garden Tray v2"
  printer_id: string      // FK -> printers
  filament_id: string     // FK -> filaments
  print_time_minutes: number   // e.g. 200 for 3h20m
  filament_grams: number       // e.g. 87
  electricity_rate: number     // LKR per kWh at time of calc
  markup_multiplier: number    // e.g. 2.5
  // computed (stored for reference)
  cost_filament: number
  cost_electricity: number
  cost_machine: number
  cost_total: number
  price_suggested: number
  created_by: string      // user id
  created_at: string
}
```

---

## Quick Quote Config

User-calibrated heuristics for quick estimates. One row per size+detail combo.

```ts
type QuickQuoteConfig = {
  id: string
  size: 'small' | 'medium' | 'large' | 'xl'
  detail: 'simple' | 'moderate' | 'high'
  // estimated ranges based on real jobs
  filament_grams_min: number
  filament_grams_max: number
  print_time_minutes_min: number
  print_time_minutes_max: number
  updated_at: string
}
```

12 rows total (4 sizes x 3 detail levels). Seed with sensible defaults on first run.
User can update via Settings to calibrate from real experience.

---

## Orders

```ts
type OrderType = 'standard' | 'custom'

type OrderStatus =
  | 'pending'    // received, not started
  | 'quoted'     // custom: quote sent, awaiting approval
  | 'printing'   // on printer
  | 'ready'      // done, not collected
  | 'delivered'  // collected / shipped
  | 'cancelled'

type Order = {
  id: string
  type: OrderType
  status: OrderStatus
  customer_name: string
  customer_contact: string | null  // phone/WhatsApp
  // items: denormalized array for simplicity
  items: OrderItem[]               // JSONB in Supabase
  // custom order fields
  brief: string | null             // description for custom orders
  print_record_id: string | null   // FK -> print_records (optional link)
  // pricing
  quoted_price: number | null      // what customer was told
  final_price: number | null       // actual charged
  // meta
  notes: string | null             // internal note on this order
  created_by: string
  created_at: string
  updated_at: string
}

type OrderItem = {
  name: string          // "Zen Garden Tray"
  quantity: number
  unit_price: number | null
}
```

---

## Notes

```ts
type Note = {
  id: string
  title: string
  body: string          // plain text, no markdown rendering v1
  pinned: boolean
  created_by: string
  created_at: string
  updated_at: string
}
```

No tags v1. No linking to orders v1. Simple scratchpad.
Tags + links come in v2 if needed.

---

## Supabase Tables Summary

```sql
-- Run in Supabase SQL editor to scaffold

create table filaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null,
  material text not null,
  cost_per_kg numeric not null,
  cost_per_gram numeric generated always as (cost_per_kg / 1000) stored,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table printers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  wattage numeric not null,
  hourly_rate numeric not null,
  notes text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table print_records (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  printer_id uuid references printers(id),
  filament_id uuid references filaments(id),
  print_time_minutes numeric not null,
  filament_grams numeric not null,
  electricity_rate numeric not null,
  markup_multiplier numeric not null default 2.5,
  cost_filament numeric not null,
  cost_electricity numeric not null,
  cost_machine numeric not null,
  cost_total numeric not null,
  price_suggested numeric not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('standard','custom')),
  status text not null default 'pending'
    check (status in ('pending','quoted','printing','ready','delivered','cancelled')),
  customer_name text not null,
  customer_contact text,
  items jsonb not null default '[]',
  brief text,
  print_record_id uuid references print_records(id),
  quoted_price numeric,
  final_price numeric,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  pinned boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table quick_quote_config (
  id uuid primary key default gen_random_uuid(),
  size text not null check (size in ('small','medium','large','xl')),
  detail text not null check (detail in ('simple','moderate','high')),
  filament_grams_min numeric not null,
  filament_grams_max numeric not null,
  print_time_minutes_min numeric not null,
  print_time_minutes_max numeric not null,
  updated_at timestamptz default now(),
  unique(size, detail)
);

-- RLS: enable on all tables, policy: authenticated users only
alter table filaments enable row level security;
alter table printers enable row level security;
alter table print_records enable row level security;
alter table orders enable row level security;
alter table notes enable row level security;
alter table quick_quote_config enable row level security;

-- Shared workspace: all authenticated users read+write everything
create policy "authenticated full access" on filaments for all using (auth.role() = 'authenticated');
create policy "authenticated full access" on printers for all using (auth.role() = 'authenticated');
create policy "authenticated full access" on print_records for all using (auth.role() = 'authenticated');
create policy "authenticated full access" on orders for all using (auth.role() = 'authenticated');
create policy "authenticated full access" on notes for all using (auth.role() = 'authenticated');
create policy "authenticated full access" on quick_quote_config for all using (auth.role() = 'authenticated');
```

---

## Seed Data

Run after table creation:

```sql
-- Printers
insert into printers (name, wattage, hourly_rate) values
  ('Bambu A1', 350, 150),
  ('Creality Hi', 300, 120),
  ('Creality K1 Max', 400, 180);

-- Filaments
insert into filaments (name, brand, material, cost_per_kg) values
  ('eSun PLA+', 'eSun', 'PLA+', 4700),
  ('Polychroma Marble', 'Polychroma', 'Marble PLA', 7000);

-- Quick quote defaults (calibrate from real jobs over time)
insert into quick_quote_config (size, detail, filament_grams_min, filament_grams_max, print_time_minutes_min, print_time_minutes_max) values
  ('small',  'simple',   20,  50,   60,  180),
  ('small',  'moderate', 30,  70,   90,  240),
  ('small',  'high',     40,  90,  120,  360),
  ('medium', 'simple',   60, 120,  180,  360),
  ('medium', 'moderate', 80, 160,  240,  480),
  ('medium', 'high',    100, 200,  300,  600),
  ('large',  'simple',  150, 280,  360,  720),
  ('large',  'moderate',180, 350,  480,  960),
  ('large',  'high',    220, 420,  600, 1320),
  ('xl',     'simple',  300, 500,  720, 1440),
  ('xl',     'moderate',380, 620,  960, 1800),
  ('xl',     'high',    450, 800, 1200, 2400);
```
