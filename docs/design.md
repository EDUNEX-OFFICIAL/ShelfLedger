# Design System — ShelfLedger

**Version:** 1.4.0  
**Last Updated:** 2026-07-28

Internal ERP UI for **ShelfLedger**: **simple, professional, fast, minimal, enterprise**. Not a marketing site — design rules for promotional landings do not apply. Optimize for **mobile-first counter speed** (phones/tablets first), with denser layouts and keyboard shortcuts as desktop enhancements.

Brand in chrome: **ShelfLedger** wordmark + **SL** monogram in sidebar. Avoid category-specific product naming in the shell.

Visual direction: **quiet ink & paper** — cool slate canvas, deep teal accent, soft card elevation. No neon, purple gradients, or glow.

---

## 1. Design Principles

1. **Mobile-first, fully responsive** — owner and staff use phones as the primary device; every primary flow (especially sale punch) must be excellent on a phone-sized viewport. Desktop is enhancement, not the design baseline.
2. **Clarity over decoration** — no gratuitous cards, glow, or purple gradients.
3. **One primary action per view** — e.g. “Punch sale” / “Post Sale”.
4. **Dense but breathable** — tables on `md+`; stacked chip lists and large tap targets on mobile.
5. **Touch-first + keyboard** — thumb-reachable CTAs on mobile; hotkeys on desktop for power users.
6. **Consistent chrome** — sticky sidebar (drawer on mobile) + sticky top bar, same page header pattern.
7. **Trustworthy** — numbers aligned, status badges restrained.
8. **Scannable nav** — Lucide icons + grouped sections (Operations / Insights / Catalog / Admin).

---

## 2. Typography

| Token | Use | Suggested |
|-------|-----|-----------|
| `font-sans` | UI body | `Source Sans 3` |
| `font-mono` | SKUs, invoice nos, amounts | `IBM Plex Mono` |
| See **§14** | Full type / button / card scale | Locked tokens — prefer shared components |

Avoid Inter/Roboto/Arial as primary brand fonts; still keep system-ui fallback stack.

**Do not** use display serifs or newspaper layouts for this ERP.

---

## 3. Spacing Scale

Tailwind default 4px grid:

`0, 1 (4), 2 (8), 3 (12), 4 (16), 5 (20), 6 (24), 8 (32), 10 (40), 12 (48)`

- Page padding: `p-4 md:px-8 md:py-7`
- Section gap: `gap-6` / `gap-7`
- Form field gap: `gap-4`
- Table cell: compact `py-2 px-3`

---

## 4. Color Tokens

Neutral enterprise palette with **one accent** (deep teal — not cyan neon, not purple).

```css
:root {
  --background: 220 24% 96.5%;
  --foreground: 222 30% 12%;
  --muted: 220 18% 93%;
  --muted-foreground: 215 14% 42%;
  --border: 220 16% 88%;
  --card: 0 0% 100%;
  --primary: 173 48% 28%;          /* deep teal ink */
  --primary-foreground: 0 0% 100%;
  --secondary: 220 16% 92%;
  --accent: 173 32% 94%;
  --destructive: 0 68% 46%;
  --success: 152 48% 30%;
  --warning: 36 88% 40%;
  --ring: 173 48% 28%;
  --sidebar: 222 28% 11%;
  --sidebar-foreground: 210 20% 94%;
  --radius: 0.625rem;
}
```

Semantic status:

| Status | Color |
|--------|-------|
| DRAFT | muted |
| POSTED | success |
| VOIDED | destructive |
| Low stock | warning |

Dark mode: provide tokens (sidebar-friendly); default theme **light** for shop lighting.

---

## 5. Shadows

Restrained:

- `shadow-card` — list panels, KPI cards
- `shadow-sm` — buttons, search, dropdowns
- `shadow-md` / `shadow-xl` — modals / mobile drawer only  
Avoid neon glow or multi-layer dramatic shadows.

---

## 5b. App chrome

- **Sidebar:** `sticky top-0 h-svh`; brand header + footer fixed; **nav scrolls** (`overflow-y-auto`) inside the sidebar.
- **Top bar:** `sticky top-0` with light blur (`bg-card/85 backdrop-blur-md`).
- **Nav items:** icon (16px) + label; active state uses soft teal wash + left accent bar.

### Charts (shadcn)

- Primitive: `components/ui/chart.tsx` (Recharts + `ChartContainer` / tooltip / legend)
- Feature charts: `features/reports/charts.tsx`
- Use on Dashboard, Reports, Expenses — not on dense entry forms

### Selects

- Shared `components/ui/select.tsx` (Radix Select + searchable Popover combobox)
- Short lists: custom dropdown; long lists (≥8 or `searchable`): typeahead
- Do not use native `<select>` in app UI

## 6. Radius

```css
--radius: 0.625rem; /* 10px — cards / panels; buttons use rounded-lg */
```

Buttons/inputs: `rounded-lg`. Avoid `rounded-full` pills for primary nav.  
Dialogs, toolbars, command palette: `rounded-xl` to match `SurfaceCard`.

---

## 7. Animations & Motion

Principles:

1. Motion for **feedback** (save success, panel open), not decoration.
2. Duration 150–200ms for micro; 250ms for panels.
3. Prefer opacity + translateY(4px); no bounce.
4. Respect `prefers-reduced-motion`.

Ship intentional motions:

- Sidebar collapse width transition
- Toast enter/exit
- Dialog overlay fade

---

## 8. Dark Mode

- Class strategy (`html.dark`) via next-themes optional in Settings
- Ensure table contrast WCAG AA
- Charts (later) use colorblind-safe palette

---

## 9. Accessibility

- WCAG AA contrast
- Focus rings visible (`ring-2 ring-ring`)
- Labels on all inputs; errors linked with `aria-describedby`
- Tables: proper `<th>` scope
- Dialogs: focus trap (shadcn)
- Sales hotkeys documented in UI

---

## 10. Responsive Breakpoints (mobile-first)

| Breakpoint | Layout |
|------------|--------|
| default (&lt; md) | **Primary target.** Drawer nav, stacked forms, `ResponsiveDataList` chip rows, sticky bottom primary CTA on document/entry screens |
| md | Persistent sidebar optional collapse; denser forms |
| lg+ | Full tables, split panes (list + detail) where useful |

### Mobile-first rules (locked)

- Design and QA counter flows at **~375px width first**, then enhance upward.
- Primary actions: min touch target **44×44px**; prefer full-width buttons on small screens.
- Sale punch (**Quick Sale**): mobile — customer → SKU lines → payment/total → sticky **Punch sale**; `lg+` — items left, sticky right rail (customer + payment + totals + punch).
- Avoid hover-only affordances; no desktop-only critical paths.
- Safe-area aware bottom bars (`env(safe-area-inset-bottom)`) for punch CTAs.
- Desktop may add keyboard shortcuts and denser tables; never remove the mobile path.

### Quick Sale enhancements (desktop progressive)

- Width: `max-w-lg` → `md:max-w-3xl` / `lg:max-w-5xl`
- `md+` denser item rows: SKU | Qty | Price | line total (incl. GST preview) in one ticket surface
- SKU auto-focus; selecting on last row adds next line (barcode-ready); search matches SKU + barcode keywords
- Phone lookup autofills name when customer exists; stock as Badge (muted / warning / destructive)
- Shortcuts: **F2** punch · **1/2/3** Cash/UPI/Card · **+** add line (when not typing)
- Disabled Punch shows why (name / mobile / SKU); “Full draft sale” is a quiet text link
- Look: single checkout rail card; hero total; filled primary payment chips + icons; stronger Punch + spinner / Posted flash; mobile sticky mini total strip; `animate-qs-row-in` / `animate-qs-punch-ok`

### Quick Sale vs full draft form

| Mode | When | Screen |
|------|------|--------|
| **Quick Sale** (`/sales/quick`) | Walk-in, 1–few lines, paid now | Mobile-first punch; create+post one tap |
| **Draft sale** (`/sales`) | Overrides, unpaid/partial, heavy edits | Existing multi-field form + Post from list |

---

## 11. Component Naming

- shadcn primitives: `components/ui/button.tsx`
- Composites: `PageHeader`, `SectionHeader`, `SurfaceCard`, `SegmentedControl`, `StickyFormActions`, `FilteredDataList` / `ResponsiveDataList`, `StatusBadge`, `ConfirmDialog`, `MoneyText`, `SkuText`, `EmptyState`, `FormField`, `ListToolbar`, `CommandPalette`
- Button chrome: `Button` + `buttonClassName()` for link-styled CTAs
- Feature-specific: `features/sales/sales-list.tsx` etc.

### UI state checklist (required)

| State | Pattern |
|-------|---------|
| Empty list | `EmptyState` + CTA |
| Search / filter no match | “No results…” + Clear |
| Field invalid | `FormField` error + `aria-invalid` |
| Action pending | Button disabled + “Saving…” / SpinnerButton |
| Confirm destructive | `ConfirmDialog` (not raw `window.confirm` for deletes) |
| Global find | Top bar + `⌘K` / `Ctrl+K` command palette |

### Responsive lists

- `md+`: dense table
- `&lt;md`: stacked chip rows (title, meta, key fields, actions)


---

## 12. Layout Patterns

**App shell:** fixed sidebar + top bar (user, branch name, quick actions).  
**List pages:** PageHeader + filters + DataTable + pagination.  
**Document pages:** header meta + lines table + totals sticky footer + primary CTA.  
**No dashboard-card spam:** dashboard = few KPIs + today’s sales chart/list.

---

## 13. Anti-patterns (do not)

- Purple-on-white AI aesthetic
- Cream + terracotta brochure look
- Broadsheet/newspaper dense chrome
- Hero marketing layouts
- Emoji as UI icons (use lucide-react)

---

## 14. UI consistency tokens (locked)

Source of truth for spacing, type, and control chrome. Prefer shared components over one-off Tailwind.

### Type scale

| Role | Class / size | Notes |
|------|----------------|-------|
| Page title | `text-2xl` (24px) `font-semibold tracking-tight` | `PageHeader` |
| Page description | `text-sm text-muted-foreground` | |
| Section title | `text-base font-semibold tracking-tight` | `SectionHeader` — page-level bands |
| In-card title | `text-sm font-semibold tracking-tight` | Charts, nested panels |
| Body / forms / table | `text-sm` | |
| Meta / helper | `text-xs text-muted-foreground` | |
| Eyebrow / KPI label | `text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground` | |
| KPI / hero number | `text-2xl md:text-[1.75rem] font-semibold tabular-nums leading-none` | Money: `MoneyText` / `compact` on dense cards |
| Secondary stat | `text-lg font-semibold tabular-nums` | Catalog counts, quiet metrics |

### Buttons (`components/ui/button.tsx`)

| Size | Height | Padding | Type |
|------|--------|---------|------|
| `sm` | `h-8` | `px-3` | `text-sm` — toolbars, filters |
| `md` | `h-10` | `px-4` | `text-sm` — default |
| `lg` | `h-11` | `px-4` | `text-sm` — primary mobile CTAs (≈44px touch) |

Variants: `primary` | `secondary` | `ghost` | `danger`.  
Primary hover: `hover:bg-primary/90` (never hard-coded HSL).  
Links that look like buttons: `buttonClassName()` + `<Link>`.

### Cards / surfaces (`SurfaceCard`)

| Padding | Class | Use |
|---------|-------|-----|
| `none` | — | Custom inner layout (forms) |
| `sm` | `px-4 py-3.5` | Compact stats, list chrome |
| `md` | `p-5` | KPI cards, default panels |
| `lg` | `p-5 md:p-6` | Rare — empty states / emphasis |

Shared chrome: `rounded-xl border border-border/80 bg-card shadow-card`.  
Interactive (link/button wrapper): hover `border-primary/20 shadow-md`; no hover-only critical affordances.

### Status surfaces (KPI / alerts)

| Tone | Text | Extra surface |
|------|------|----------------|
| `neutral` | `text-muted-foreground` | default card |
| `good` | `text-success` | optional; keep clean white by default |
| `warn` | `text-warning` | `bg-warning/5` + `border-l-4 border-l-warning` |
| `alert` | `text-destructive` | `bg-destructive/5` + `border-l-4 border-l-destructive` |

### Page rhythm

- Page stack: `space-y-6` (not mixed `space-y-7` + header `mb-7`)
- `PageHeader`: no bottom margin — spacing comes from parent stack only
- Section gap inside grids: `gap-3` (compact) / `gap-4` (default)

### Dashboard layout (ops)

1. Header: period control + **one** primary CTA (**Quick Sale** → `/sales/quick`); secondary actions overflow/secondary
2. KPI band (mobile `grid-cols-2`, `xl:grid-cols-4`)
3. Optional charts (user toggle; persist preference)
4. Optional catalog/masters strip (user toggle; persist preference)
5. Recent activity list with `SectionHeader`

---

## 15. Dashboard metrics (P1 — shipped)

| Item | Status | Notes |
|------|--------|--------|
| Unpaid **₹ outstanding** | Done | `opsSummary.unpaidOutstanding` = total − payments on UNPAID/PARTIAL |
| Sales **vs previous period** | Done | `previousSalesTotal` + `salesDeltaPct` vs prior window of same length |
| Deep-link filters | Done | Dashboard unpaid → `/sales?payment=OPEN`; list supports OPEN/PAID/PARTIAL/UNPAID |
| Compact money on KPIs | Done | `MoneyText compact` / `formatInr` |
