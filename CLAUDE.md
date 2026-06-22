# CLAUDE.md - Minime Ops

> Read this file before writing any code. Every session. No exceptions.

---

## Project

**Minime Ops** - internal management tool for Minime, a 3D printing and custom miniatures business based in Sri Lanka. Two users: Ajai and Vithuran. Shared workspace. Dark-only.

---

## Stack

```
Frontend:   React 19 + TypeScript + Vite
Styling:    Tailwind v4 + custom CSS tokens (src/styles/tokens.css)
State:      Zustand (no TanStack Query - simple enough without it)
Backend:    Supabase (auth + postgres + RLS)
Deploy:     Vercel
Icons:      Lucide React (stroke 1.5px, never filled)
Fonts:      Geist (display/UI) + Inter (body) - Google Fonts
```

---

## File Structure

```
src/
  components/
    layout/       Shell.tsx, Nav.tsx
    ui/           Button.tsx, Card.tsx, Input.tsx, StatusPill.tsx, Toast.tsx
    calculator/   FullCalc.tsx, QuickQuote.tsx, ResultCard.tsx, MarkupSlider.tsx, SaveRecordModal.tsx
    orders/       OrderCard.tsx, OrderDetail.tsx, NewOrderModal.tsx, StatusChanger.tsx
    notes/        NoteCard.tsx, NoteEditor.tsx
  pages/
    Calculator.tsx
    Orders.tsx
    Notes.tsx
    Settings.tsx
    Login.tsx
  store/
    appStore.ts         (app-wide: auth, active page, toast)
    calculatorStore.ts  (calc inputs, results, saved records)
    ordersStore.ts      (orders list, active order, filters)
    notesStore.ts       (notes list, active note)
  lib/
    supabase.ts         (client init)
    calculations.ts     (pure calc logic, no side effects)
  styles/
    tokens.css          (all CSS vars from DESIGN.md)
    global.css          (resets, font imports, body)
  types/
    index.ts            (all TypeScript types from DATA_MODELS.md)
```

---

## Critical Rules

### 1. Read before writing
Before any prompt, read:
- `docs/DESIGN.md` - design tokens and component rules
- `docs/DATA_MODELS.md` - all types and DB schema
- The relevant phase in `docs/PHASES.md`

### 2. One prompt = one concern
Each Claude Code prompt handles exactly one component or feature. No combining. If a prompt feels too big, split it.

### 3. No inline styles
All styling via Tailwind classes + CSS vars from tokens.css. No `style={{}}` in JSX except for dynamic values that cannot be expressed in Tailwind (e.g. computed widths from JS).

### 4. Calculation logic is pure
All print cost calculations live in `src/lib/calculations.ts` as pure functions. No Supabase calls, no store access inside calculation functions. Input -> output only. Easier to test and debug.

### 5. Optimistic updates on all mutations
Store updates happen immediately. Supabase writes happen async. On error: revert store + show toast. Pattern from MECH Finance.

### 6. Mobile-first always
Build the mobile layout first. Tablet/desktop enhancements via responsive modifiers. Test on 375px viewport before marking a component done.

### 7. 44px minimum tap targets
All interactive elements on mobile must be >= 44px tall. Especially: status pills (add padding), nav items, buttons.

### 8. Never expose .env values
Supabase keys only via `import.meta.env.VITE_*`. Never hardcoded. Never logged.

### 9. TypeScript strict
No `any`. No `// @ts-ignore`. If type is unknown, define it in `src/types/index.ts`.

### 10. Red is signal only
`#F04E3E` (--red) on: primary button, active nav, suggested price output, input focus ring. Nowhere else. If tempted to add red elsewhere, don't.

---

## Design Tokens Quick Ref

```css
/* Surfaces */
--canvas: #090909    /* page background */
--s1:     #141414    /* cards */
--s2:     #1c1c1c    /* elevated cards, modals */
--hairline:   #262626
--hairline-s: #1a1a1a

/* Ink */
--ink:   #ffffff
--ink-m: #999999

/* Brand */
--red:      #F04E3E
--red-glow: rgba(240,78,62,0.15)
--red-ring: rgba(240,78,62,0.25)
--red-dim:  rgba(240,78,62,0.08)
```

Full token list in `src/styles/tokens.css` (generated from DESIGN.md).

---

## Calculator Logic (reference)

```ts
// All in src/lib/calculations.ts
filament_cost    = grams * (cost_per_kg / 1000)
electricity_cost = (print_time_h * wattage / 1000) * electricity_rate_kwh
machine_cost     = print_time_h * printer.hourly_rate
total_cost       = filament_cost + electricity_cost + machine_cost
suggested_price  = total_cost * markup_multiplier

// Quick quote uses midpoint of config ranges
// See DATA_MODELS.md -> QuickQuoteConfig
```

---

## Supabase Tables (reference)

```
filaments         id, name, brand, material, cost_per_kg, cost_per_gram, notes
printers          id, name, wattage, hourly_rate, notes, active
print_records     id, name, printer_id, filament_id, print_time_minutes, filament_grams,
                  electricity_rate, markup_multiplier, cost_*, price_suggested, created_by
orders            id, type, status, customer_name, customer_contact, items (jsonb),
                  brief, print_record_id, quoted_price, final_price, notes, created_by
notes             id, title, body, pinned, created_by
quick_quote_config  id, size, detail, filament/time ranges
```

Full schema + seed SQL in `docs/DATA_MODELS.md`.

---

## Commit Convention

```
feat: add quick quote calculator
fix: correct electricity cost formula
style: update nav active state token
chore: add supabase types
docs: update phases checklist
```

---

## Before Marking a Phase Done

1. Run through the test checklist in PHASES.md for that phase
2. `npm run build` - zero errors
3. Test on mobile viewport (375px)
4. Verify Supabase data persists after page refresh
5. Git tag the release
6. Only then start next phase
