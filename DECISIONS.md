# DECISIONS.md - Minime Ops

> Architecture decisions log. Why we chose things. Append only.

---

## 001 - No TanStack Query

**Date:** 2025-06
**Decision:** Use Zustand only, no TanStack Query.
**Reason:** App has ~5 data entities, no pagination, no complex cache invalidation. TanStack Query adds setup cost not justified here. Zustand + direct Supabase calls is simpler, faster to build, easier for the codebase to stay lean. Revisit if data complexity grows post v1.

---

## 002 - No component library

**Date:** 2025-06
**Decision:** All UI components built from scratch.
**Reason:** Design is tightly Framer DS adapted. No library matches. Forcing a library (shadcn, Radix, etc.) means fighting overrides constantly. Hand-rolled components stay lean, match tokens exactly, and are easier for Claude Code to modify per-prompt.

---

## 003 - Filament tracking at brand/material level only

**Date:** 2025-06
**Decision:** No per-color filament entries.
**Reason:** Ajai explicitly chose this. Price varies by brand and material, not color. Tracking colors adds rows with no pricing benefit. eSun PLA+ black and eSun PLA+ white cost the same per gram.

---

## 004 - Orders use JSONB items array

**Date:** 2025-06
**Decision:** Order items stored as JSONB column, not separate order_items table.
**Reason:** Orders at Minime scale (10-20 at a time) don't need relational item rows. JSONB is simpler to read/write, no joins needed. If order volume grows 10x, revisit with a proper items table.

---

## 005 - Shared workspace, no per-user data isolation

**Date:** 2025-06
**Decision:** Both Ajai and Vithuran see all data. RLS policy: authenticated = full access.
**Reason:** Minime is a two-person shared business operation. There's no scenario where Ajai hides orders from Vithuran or vice versa. Per-user isolation adds complexity with zero benefit. If a third person joins who needs restricted access, add role column and update RLS then.

---

## 006 - No markdown rendering in Notes v1

**Date:** 2025-06
**Decision:** Notes body is plain text only. No markdown.
**Reason:** Vithuran-proof constraint. Markdown editor adds complexity and cognitive load. Plain textarea is immediately understandable. Add markdown if explicitly requested post-launch.

---

## 007 - Campaigns deferred to post v1

**Date:** 2025-06
**Decision:** Campaign module not in v1 scope.
**Reason:** Three core modules (Calculator, Orders, Notes) are a complete useful product. Campaigns require linking across all three modules and adds design + build complexity. Ship the core, use it for real, then build campaigns from actual usage patterns.

---

## 008 - Electricity rate stored per print record, not global

**Date:** 2025-06
**Decision:** Each saved print_record stores the electricity_rate at time of calculation.
**Reason:** LKR electricity rates in Sri Lanka change periodically. A print record from 6 months ago should show the cost as it was calculated then, not recalculate with today's rate. Historical accuracy matters for pricing reference.

---

## 009 - Quick quote config user-calibrated

**Date:** 2025-06
**Decision:** Quick quote size+detail ranges are stored in DB and editable in Settings.
**Reason:** The heuristics (how many grams a "large high-detail" print uses) are specific to Minime's printer fleet and typical job types. Seeded with sensible defaults but must be tunable from real experience without a code deploy.
