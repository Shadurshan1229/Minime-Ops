# PHASES.md - Minime Ops Build Plan

> One phase at a time. Test checklist before advancing. Tag stable releases.

---

## Phase 0 - Governance + Scaffold
**Goal:** Repo exists. Docs written. No UI code yet.

### Deliverables
- [x] `docs/DESIGN.md`
- [x] `docs/DATA_MODELS.md`
- [x] `docs/PHASES.md`
- [x] `docs/CLAUDE.md`
- [x] `docs/DECISIONS.md`
- [ ] Vite + React + Tailwind v4 scaffold
- [ ] Supabase project created
- [ ] `.env.local` with Supabase keys
- [ ] DB tables + seed data run in Supabase
- [ ] Vercel project linked to repo
- [ ] Deploy empty shell - confirms pipeline works

### Test Checklist
- [ ] `npm run dev` starts with no errors
- [ ] `npm run build` produces no TS errors
- [ ] Vercel deploy succeeds
- [ ] Supabase connection confirmed (can query filaments table)

**Tag:** `v0.1.0-scaffold`

---

## Phase 1 - Shell + Design Tokens
**Goal:** App shell renders. All tokens in place. Nav works. No real data yet.

### Deliverables
- [ ] `src/styles/tokens.css` - all CSS vars from DESIGN.md
- [ ] `src/styles/global.css` - base resets, body bg, font imports
- [ ] `src/components/layout/Shell.tsx` - outer wrapper, canvas bg
- [ ] `src/components/layout/Nav.tsx` - 3-item bottom nav (Calculator / Orders / Notes)
- [ ] `src/components/ui/Button.tsx` - all 5 variants
- [ ] `src/components/ui/Card.tsx` - standard + elevated + spotlight variants
- [ ] `src/components/ui/StatusPill.tsx` - all 6 statuses
- [ ] `src/components/ui/Input.tsx` - text input with focus state
- [ ] `src/pages/Calculator.tsx` - empty placeholder
- [ ] `src/pages/Orders.tsx` - empty placeholder
- [ ] `src/pages/Notes.tsx` - empty placeholder
- [ ] `src/store/appStore.ts` - Zustand store scaffold (empty slices)
- [ ] `src/lib/supabase.ts` - Supabase client init

### Test Checklist
- [ ] Nav switches between 3 pages
- [ ] Active nav item shows red highlight
- [ ] Canvas bg is #090909
- [ ] Button variants all render correctly
- [ ] Status pills all 6 statuses render correctly
- [ ] Input focus ring shows red
- [ ] Responsive: mobile nav sits at bottom, no overflow
- [ ] No console errors
- [ ] Build passes

**Tag:** `v0.2.0-shell`

---

## Phase 2 - Cost Calculator
**Goal:** Full calculator works. Quick quote works. Results saveable.

### Deliverables
- [ ] `src/pages/Calculator.tsx` - full implementation
- [ ] `src/components/calculator/FullCalc.tsx` - detailed calculator form
- [ ] `src/components/calculator/QuickQuote.tsx` - size + detail chip selector
- [ ] `src/components/calculator/ResultCard.tsx` - breakdown + suggested price
- [ ] `src/components/calculator/MarkupSlider.tsx` - adjustable multiplier
- [ ] `src/components/calculator/SaveRecordModal.tsx` - name + save to Supabase
- [ ] `src/store/calculatorStore.ts` - calc state slice
- [ ] Supabase: read filaments, read printers, read quick_quote_config
- [ ] Supabase: write print_records on save

### Calculator Logic
```
filament_cost    = grams * (cost_per_kg / 1000)
electricity_cost = (print_time_h * wattage / 1000) * electricity_rate_kwh
machine_cost     = print_time_h * printer.hourly_rate
total_cost       = filament_cost + electricity_cost + machine_cost
suggested_price  = total_cost * markup_multiplier
```

### Quick Quote Logic
```
// Lookup config row for size+detail
// Use midpoint of ranges + cheapest filament for estimate
filament_mid     = (grams_min + grams_max) / 2
time_mid_h       = ((minutes_min + minutes_max) / 2) / 60
cost_min         = calculate(grams_min, time_min_h, cheapest_filament)
cost_max         = calculate(grams_max, time_max_h, cheapest_filament)
range_min        = cost_min * markup
range_max        = cost_max * markup
```

### Test Checklist
- [ ] Filament dropdown loads from Supabase
- [ ] Printer dropdown loads from Supabase
- [ ] Calc outputs update live as inputs change
- [ ] Electricity rate field pre-fills with last used value
- [ ] Markup slider moves suggested price in real time
- [ ] Quick quote: tap size chip -> result updates
- [ ] Quick quote: tap detail chip -> result updates
- [ ] Quick quote range displays correctly
- [ ] "Save result" modal opens, accepts name, saves to DB
- [ ] Saved record appears if navigated away and back (persisted)
- [ ] Mobile: all inputs reachable, no keyboard overlap issues
- [ ] No NaN or undefined in any output field
- [ ] Build passes

**Tag:** `v0.3.0-calculator`

---

## Phase 3 - Order Management
**Goal:** Create, view, update orders. Both standard + custom flows.

### Deliverables
- [ ] `src/pages/Orders.tsx` - order list view
- [ ] `src/components/orders/OrderCard.tsx` - list item card
- [ ] `src/components/orders/OrderDetail.tsx` - full detail panel / modal
- [ ] `src/components/orders/NewOrderModal.tsx` - create flow (standard)
- [ ] `src/components/orders/NewCustomOrderModal.tsx` - create flow (custom)
- [ ] `src/components/orders/StatusChanger.tsx` - tap to cycle status
- [ ] `src/store/ordersStore.ts` - orders state slice
- [ ] Supabase: full CRUD on orders table
- [ ] Optimistic updates on status change

### Status Flow
```
Standard: pending -> printing -> ready -> delivered
Custom:   pending -> quoted -> printing -> ready -> delivered
Both can -> cancelled at any point
```

### Test Checklist
- [ ] Order list loads from Supabase
- [ ] New standard order creates correctly
- [ ] New custom order creates correctly (with brief field)
- [ ] Status change saves to DB (optimistic update)
- [ ] Order detail shows all fields
- [ ] Customer contact copy button works (copies to clipboard)
- [ ] Custom order can link to a print record
- [ ] Cancelled orders visually distinct (muted)
- [ ] Empty state shows when no orders
- [ ] Mobile: modals scroll correctly, no cutoff
- [ ] Both Ajai and Vithuran accounts see same orders (shared workspace)
- [ ] Build passes

**Tag:** `v0.4.0-orders`

---

## Phase 4 - Notes
**Goal:** Create, read, pin, delete notes. Google Keep simplicity.

### Deliverables
- [ ] `src/pages/Notes.tsx` - grid of note cards
- [ ] `src/components/notes/NoteCard.tsx` - card with title + truncated body
- [ ] `src/components/notes/NoteEditor.tsx` - full screen tap-to-edit
- [ ] `src/components/notes/NewNoteButton.tsx` - FAB-style add button
- [ ] `src/store/notesStore.ts` - notes state slice
- [ ] Supabase: full CRUD on notes table
- [ ] Pinned notes sort to top

### Test Checklist
- [ ] Notes grid loads from Supabase
- [ ] New note creates on save
- [ ] Tap note card -> opens editor
- [ ] Edit saves on blur / back navigation
- [ ] Pin toggle works, pinned note moves to top + red highlight
- [ ] Delete with confirmation
- [ ] Empty state: prompt to add first note
- [ ] Long body truncates at 4 lines on card
- [ ] 2-col grid on desktop, 1-col on mobile
- [ ] Both accounts see same notes
- [ ] Build passes

**Tag:** `v0.5.0-notes`

---

## Phase 5 - Auth + Polish + Production Deploy
**Goal:** Proper auth. Error states. Loading states. Ship it.

### Deliverables
- [ ] `src/pages/Login.tsx` - Supabase email+password login
- [ ] Auth guard on all pages (redirect to login if no session)
- [ ] Loading skeletons on all list views
- [ ] Error states with retry on all Supabase fetches
- [ ] Empty states for all three main views
- [ ] Settings page: manage filaments, printers, electricity rate, quick quote config
- [ ] Toast notifications (save success, error)
- [ ] Full mobile pass: scroll, keyboard, tap targets 44px+
- [ ] RLS verified: no data leaks between unrelated accounts
- [ ] Environment vars confirmed on Vercel
- [ ] Production deploy

### Test Checklist
- [ ] Login page works for both accounts
- [ ] Logout works
- [ ] Direct URL to / redirects to login if not authenticated
- [ ] All loading states show skeleton, not blank
- [ ] All error states show message + retry button
- [ ] Filament add/edit/delete in Settings
- [ ] Printer hourly rate editable in Settings
- [ ] Electricity rate persists between sessions (stored in Supabase or localStorage)
- [ ] Quick quote config editable in Settings
- [ ] Toast appears on save, dismisses after 3s
- [ ] All tap targets >= 44px on mobile (check with DevTools)
- [ ] No Supabase keys exposed in client bundle
- [ ] Vercel production URL loads correctly
- [ ] Both accounts tested on real phone

**Tag:** `v1.0.0`

---

## Future (Post v1.0.0)

- Phase 6: Campaign tracker (product lineup development)
- Phase 7: WhatsApp message template generator from order detail
- Phase 8: Basic monthly revenue summary view
- Phase 9: Print record history browser
