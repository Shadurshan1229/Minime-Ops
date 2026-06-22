# DESIGN.md - Minime Ops Design System v1.0.0

> Based on Framer DS. Minime red replaces accent-blue as single chromatic signal.
> Dark-only. No light mode. No exceptions.

---

## 1. Foundation

### Design Principles
- **One thing at a time.** Each screen owns one job. No competing panels.
- **Vithuran-proof.** Primary action reachable in 2 taps max. Nothing hidden.
- **Framer canvas.** Dark is the whitespace. Surface lift = hierarchy.
- **Red is signal.** `#F04E3E` used only on: primary CTA, active nav, cost output, focus ring. Never decorative.

---

## 2. Color Tokens

```css
:root {
  /* Canvas & Surfaces (Framer unchanged) */
  --canvas:      #090909;
  --s1:          #141414;
  --s2:          #1c1c1c;
  --hairline:    #262626;
  --hairline-s:  #1a1a1a;

  /* Ink */
  --ink:         #ffffff;
  --ink-m:       #999999;

  /* Minime Red (replaces Framer accent-blue everywhere) */
  --red:         #F04E3E;
  --red-glow:    rgba(240, 78, 62, 0.15);
  --red-ring:    rgba(240, 78, 62, 0.25);
  --red-dim:     rgba(240, 78, 62, 0.08);
}
```

### Status Surface Tints
Not pastels. Dark tinted surfaces with muted text. Surface-lift approach.

| Status    | Background  | Text       | Use              |
|-----------|-------------|------------|------------------|
| Pending   | `#1E1A10`   | `#C9A05A`  | Awaiting action  |
| Printing  | `#0E1A14`   | `#6DBF9A`  | Active print job |
| Ready     | `#0E1520`   | `#6AA8D4`  | Done, not picked |
| Custom    | `#1A140E`   | `#C89060`  | Custom order     |
| Delivered | `--red-dim` | `--red`    | Complete         |
| Quoted    | `--s2`      | `--ink-m`  | Quote sent       |

### Rules
- Never use `--red` as background fill except `--red-dim` tint.
- Hierarchy = surface lift (canvas -> s1 -> s2). Not opacity on ink.
- No gradients on section backgrounds. Gradient = card only (spotlight card pattern).

---

## 3. Typography

### Font Stack
| Role         | Font    | Source       |
|--------------|---------|--------------|
| Display / UI | Geist   | Google Fonts |
| Body / Meta  | Inter   | Google Fonts |

```html
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

### Type Scale
| Token        | Font  | Size | Weight | Tracking  | Use                        |
|--------------|-------|------|--------|-----------|----------------------------|
| `display`    | Geist | 36px | 700    | -0.04em   | Page hero, monthly total   |
| `display-md` | Geist | 24px | 600    | -0.025em  | Section headers            |
| `heading`    | Geist | 16px | 600    | -0.015em  | Card titles, modal headers |
| `body`       | Inter | 14px | 400    | -0.01em   | Default body               |
| `body-sm`    | Inter | 13px | 400    | -0.01em   | Secondary info             |
| `caption`    | Inter | 12px | 500    | -0.01em   | Meta, labels, timestamps   |
| `micro`      | Inter | 11px | 400    | 0.08em UC | Status tags, eyebrows (UC) |
| `num-lg`     | Geist | 28px | 700    | -0.03em   | Cost outputs, key metrics  |
| `num-md`     | Geist | 20px | 700    | -0.02em   | Stat card numbers          |
| `btn`        | Inter | 14px | 500    | -0.01em   | All button labels          |

### Rules
- Geist for all numbers, headings, nav labels.
- Inter for descriptions, body, placeholder text, buttons.
- Uppercase + letter-spacing 0.08em+ only on: status eyebrows, section meta labels.
- Never mix bold weights within one UI block. Hierarchy via size, not weight ramp.

---

## 4. Spacing

Base unit: 4px.

| Token | Value | Use                         |
|-------|-------|-----------------------------|
| xs    | 4px   | Icon gap, micro padding     |
| sm    | 8px   | Tight internal gap          |
| md    | 12px  | Default internal padding    |
| lg    | 16px  | Card padding, section gap   |
| xl    | 20px  | Card padding (comfortable)  |
| xxl   | 32px  | Section vertical rhythm     |
| sec   | 48px  | Between major page sections |

---

## 5. Border Radius (Framer scale)

| Token  | Value  | Use                          |
|--------|--------|------------------------------|
| r-xs   | 4px    | Tags, chips                  |
| r-sm   | 6px    | Status pills                 |
| r-md   | 10px   | Inputs, small cards          |
| r-lg   | 15px   | Standard cards               |
| r-xl   | 20px   | Large cards, modals          |
| r-xxl  | 30px   | Spotlight gradient card      |
| r-pill | 100px  | All buttons                  |
| r-full | 9999px | Avatars, icon buttons        |

---

## 6. Elevation & Borders

No shadows. Depth via surface lift only.

```css
/* Default card */
border: 1px solid var(--hairline-s);
background: var(--s1);

/* Hover state */
border: 1px solid var(--hairline);

/* Focus / active input */
border: 1px solid var(--red);
box-shadow: 0 0 0 1px var(--red-ring);

/* Gradient spotlight card */
background: linear-gradient(135deg, #3D0A06 0%, #1A0804 60%, #0D0908 100%);
border: 1px solid rgba(240, 78, 62, 0.18);
```

---

## 7. Components

### Buttons
All buttons: r-pill. No border-radius exceptions.

| Variant   | BG      | Text    | Extra                                    |
|-----------|---------|---------|------------------------------------------|
| Primary   | --red   | white   | shadow: 0 0 0 1px red-ring + red-glow   |
| White     | white   | black   | save/confirm on dark bg                  |
| Secondary | --s1    | --ink   | none                                     |
| Ghost     | none    | --ink-m | border 1px --hairline                    |
| Icon      | --s1    | --ink   | 40px circle, r-full                      |

Padding: 10px 15px (text buttons).

### Inputs
```
bg:            --s1
border:        1px solid --hairline
border-radius: r-md (10px)
padding:       10px 14px
font:          Inter 14px -0.01em
focus:         border --red, box-shadow 0 0 0 1px --red-ring
```

### Cards
| Type       | BG        | Border           | Radius |
|------------|-----------|------------------|--------|
| Standard   | --s1      | 1px --hairline-s | r-lg   |
| Elevated   | --s2      | 1px --hairline   | r-xl   |
| Spotlight  | gradient  | 1px red-tinted   | r-xl   |

### Status Pills
```
padding:       4px 10px
border-radius: r-sm (6px)
font:          Inter 12px 500
structure:     [5px dot] [label]
```

### Navigation
```
Container: --canvas bg, 1px --hairline border, r-pill, 5px padding
Default:   --ink-m color, 8px 16px padding, r-pill
Active:    --red bg, white text, 0 2px 12px --red-glow shadow
```

### Spotlight / Hero Card (dashboard only)
```css
background: linear-gradient(135deg, #3D0A06 0%, #1A0804 60%, #0D0908 100%);
border: 1px solid rgba(240, 78, 62, 0.18);
border-radius: 20px;
padding: 24px;
overflow: hidden;
position: relative;

/* Glow blob via ::after */
bottom: -30px; right: -30px; width: 180px; height: 180px;
background: radial-gradient(ellipse, rgba(240,78,62,0.35) 0%, transparent 70%);
```

---

## 8. Icons

Library: Lucide React.
- Size: 16px dense / 20px default / 24px primary actions.
- Stroke: 1.5px. Never filled.
- Color: --ink-m default, --ink active, --red signal.

---

## 9. Motion

Minimal. Functional only.

| Name    | Value | Use                     |
|---------|-------|-------------------------|
| instant | 80ms  | Hover border/color      |
| fast    | 150ms | Button press, pill swap |
| base    | 200ms | Card appear, panel open |

Easing: cubic-bezier(0.4, 0, 0.2, 1) everywhere.
No bounce, no spring, no page transitions except fade.
prefers-reduced-motion: all durations -> 0ms.

---

## 10. Calculator Output Rules

- Cost price: --ink, num-lg
- Suggested price: --red, num-lg (only red number in app)
- Breakdown rows: body-sm, --ink-m label / --ink value
- Total row: --red-dim bg, red border tint, --red text
- Markup slider: --s2 track, --red thumb
- Quick quote range: --ink numbers, --ink-m dash separator

---

## 11. Notes Display Rules

- Grid: 2-col desktop / 1-col mobile
- Card: --s1 bg, 1px --hairline-s border, r-lg
- Pinned note: --red-dim bg, rgba(240,78,62,0.2) border, title --red
- No color picker v1. Pin = only differentiation.
- Body truncated 4 lines. Expand on tap.

---

## 12. Responsive Breakpoints

| Name    | Width  | Layout                              |
|---------|--------|-------------------------------------|
| Mobile  | <640px | Single col, bottom nav bar          |
| Tablet  | 640px+ | Two-col cards, nav bar              |
| Desktop | 1024px | Full layout, wider content area     |

Mobile-first. Build mobile. Enhance up.

---

## 13. Do / Don't

**Do:**
- Surface lift for hierarchy
- --red for signal moments only
- r-pill on all buttons
- Tight negative tracking on Geist display
- 3 nav items max (Calculator / Orders / Notes)

**Don't:**
- Light mode anything
- --red as decorative fill or section bg
- Add shadows (border + surface lift only)
- Round cards beyond r-xl except spotlight
- Add 4th nav item without removing one
- Color as only status differentiator (always: color + dot + label)
