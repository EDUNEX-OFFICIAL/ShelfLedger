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
- **Item codes / SKUs:** `AsyncSkuCombobox` — server debounced search (do not hydrate full catalog into Select)
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
- Sale punch (**Quick Sale**): mobile — **one fluid counter surface** (items + live buyer/pay strip + sticky Punch). Not a step wizard. Default **Walk-in**; “Save contact” expands name/phone only when needed. `lg+` — items left, sticky right rail.
- Avoid hover-only affordances; no desktop-only critical paths.
- Safe-area aware bottom bars (`env(safe-area-inset-bottom)`) for punch CTAs.
- Desktop may add keyboard shortcuts and denser tables; never remove the mobile path.

### Quick Sale enhancements (desktop progressive)

- Width: `max-w-lg` → `md:max-w-3xl` / `lg:max-w-5xl`
- `md+` denser item rows: SKU | Qty | Price | line total (incl. GST preview) in one ticket surface
- SKU auto-focus; selecting on last row adds next line; **AsyncSkuCombobox** (debounced server search); Enter exact barcode/SKU pick; duplicate SKU bumps qty
- Seed options = recent/frequent only — no full-catalog hydrate on page load
- **Walk-in chip**: default on (remembered); **Save contact** expands name+mobile inline — no wizard steps
- After punch: stay on `/sales/quick` with success strip (Invoice / Print `?print=1` / WhatsApp / Next sale) — no forced navigate away
- **Adjust** / Discount: optional, collapsed
- Phone lookup autofills name when customer exists; stock as Badge (muted / warning / destructive)
- Shortcuts: **F2** punch · **⇧F2** punch & print · **F3** focus item · **Esc** clear cart · **1/2/3** Cash/UPI/Card · **+** add line (desktop progressive; mobile uses big touch CTAs)
- **Size** opens article → size/colour matrix (primary footwear pick path; no barcode)
- Article chips (recent/frequent) open matrix; item-code chips still bump qty
- **Counter mode** toggle hides sidebar/topbar/bottom nav (kiosk)
- Dual sticky CTA: **Punch** + **Print** (punch & print)
- Mobile checkout: buyer mode + pay chips in one strip under items (dynamic fields only when “Save contact”)

### Quick Sale vs full draft form

| Mode | When | Screen |
|------|------|--------|
| **Quick Sale** (`/sales/quick`) | Walk-in or named+phone, 1–few lines, paid now | Mobile-first punch; create+post one tap; stay for next bill |
| **Draft sale** (`/sales#new-draft`) | Overrides, unpaid/partial, heavy edits | List-first page; form below; Post from list |

### Sales list page (`/sales`)

Primary job: find invoices, post leftover drafts, chase open dues. Punching bills lives on **Quick Sale**.

1. Header: **Quick Sale** primary + **New draft** → opens collapsed Advanced draft (`#new-draft`)
2. Quiet meta: drafts to post + open dues (deep links)
3. Deep-link banner when `?payment=` / `?status=` (Show all → `/sales`)
4. **All sales** list (invoice date column; mobile posted chips open invoice; Post → invoice)
5. **Advanced draft** collapsed by default (unpaid / override / multi-line)

### Purchases list page (`/purchases`)

Primary job: enter a vendor bill and receive stock in one action (draft still available).

1. Header: **New purchase** → `#new-purchase` (form stays visible — create is core here)
2. Quiet meta: drafts waiting to receive → `?status=DRAFT`
3. Deep-link banner when `?status=`
4. **All purchases** list with **vendor invoice # + bill date** (searchable) + Post / Return
5. **New vendor bill** form: primary **Save & receive stock** (create+post); secondary **Save draft**; last vendor (localStorage) + last unit rates autofill; tax Select behind **Tax override**
6. Post / Return: Post confirm supports **Don’t ask again today**; Return uses multi-line checklist

### Expenses page (`/expenses`)

Primary job: log shop spend fast; review period totals. Does not affect inventory.

1. Header: **Add expense** + period segmented (Today / 30d / Month / All; default Month)
2. Quiet meta: period total ₹ + entry count
3. **Log expense** form (date defaults today; amount autofocus; FormField + sticky CTA)
4. **Manage categories** collapsed (open when none exist)
5. Expenses list (amount trailing on mobile; category filter; notes column)
6. By-category chart last (same period)

### Inventory page (`/inventory`)

Primary job (mobile Stock tab): find SKU on-hand qty. Opening/adjust are rare ledger posts.

1. Header: Opening / Adjust CTAs + Ledger link
2. Quiet meta: on-hand value + low-stock count → `?stock=low`
3. **On-hand balances** first (qty prominent on mobile; Low badge; size/color searchable; **Ledger** → `/stock-ledger?sku=`)
4. **Opening stock** + **Adjustments** collapsed panels (`#opening-stock` / `#adjustments`)

### Stock ledger page (`/stock-ledger`)

Primary job: audit **why** qty changed (read-only). Create stock on Inventory, not here.

1. Header: **Balances** + Post stock (opening)
2. Quiet meta: last N movements · in/out counts · optional `?sku=` cue
3. List: human movement labels; **Qty Δ** green/red; article under SKU; clickable **Source** (sale → invoice)
4. Filters: Type family · Direction · When (Today/7d/30d); search SKU/article/notes

### Reports page (`/reports`)

Primary job: owner/manager period insights + low-stock attention (not a floor punch screen).

1. Quiet meta: period label · low-stock jump · section anchors
2. Period: **Today / 7d / 30d / Month** presets + Custom dates (preserve hash on apply)
3. KPIs → sales / `#sales-gst` / low-stock or inventory
4. Charts → cashflow; Purchases/Expenses cards link out
5. **Sales & GST** mobile list with invoice tap-through (CGST+SGST only; no IGST row)
6. **Low stock** list (qty trailing) → Inventory / Ledger `?sku=`
7. Top stock value peek (snapshot)

### Settings page (`/settings`)

Primary job: org identity for invoices + tax rates + invoice prefixes (admin, not floor punch).

1. Header: **Staff** link (OWNER/MANAGER)
2. Section jumps: Organization · Tax rates · Sequences
3. **Organization** form first (invoice header): GSTIN · state code · address2/email restored; FY month select; sticky Save; VIEWER gets read-only profile (not empty)
4. **Tax rates** list first (mobile total % trailing); add form below with CGST/SGST auto-split from total
5. **Sequences** as cards (prefix edit; next # read-only)

### Staff page (`/staff`)

Primary job: find team + change role/active; add users occasionally.

1. Header: **Add user** + Settings
2. Quiet meta: active count · by role
3. **Team list first** (search name/email; role & status filters; human role labels; **You** badge)
4. Row edit: role + Active; Save only when dirty; self row locks role/deactivate
5. Create form below: FormField; role hints; temp password; default Cashier

### Exchanges page (`/exchanges`)

Primary job (mobile Exchange tab): return / size-swap against a posted invoice (create+post one shot).

1. Header: **New exchange** → `#new-exchange` (form stays open — create is the tab job)
2. Form: **Original invoice first** (searchable); customer filters invoices
3. **Return checklist**: each invoice line with checkbox + qty (max = sold); **Return all**; at least one checked required
4. **Live Δ** hero: Collect / Refund / Even (replace − return, incl. GST) before Post
5. Deep link: `/exchanges?sale=` from invoice **Exchange / return**; replacement lines optional; recent list shows difference

### Customers page (`/customers`)

Primary job: find by phone/name; add named buyers for WhatsApp / invoices.

1. Header: **Add customer** → `#new-customer`
2. Quiet meta: named count + with-phone count
3. **List first** (phone search / `tel:` / WhatsApp; Named vs Walk-in filter)
4. Add form below: **Name + phone** primary; GSTIN/address collapsed under More details

### Vendors page (`/vendors`)

Primary job: manage suppliers for purchases (GSTIN + terms matter more than WhatsApp).

1. Header: **Add vendor** + **New purchase**
2. Quiet meta: vendor count · with GSTIN
3. **List first** (GSTIN search/filter; Net terms column; Purchase action; `tel:`)
4. Form: **Name + GSTIN + phone + payment terms**; email/address/notes under More details

### Articles page (`/articles`)

Primary job: catalog styles + size×color SKUs (qty is Inventory, not here).

1. Header: **Add article** + Stock link
2. Quiet meta: style count · SKU count
3. **List first** (search SKU/size/code; brand & category filters; variant count trailing)
4. Form below: style + brand/category; Tax/HSN collapsed; variants with SKU suggest from code-size-color

### Brands page (`/brands`)

Primary job: tiny master before articles — name (+ optional code).

1. Header: **Add brand** + **Add article**
2. Quiet meta: brand count · with code
3. **List first** (code trailing; Articles row action)
4. Compact form: name autofocus; code auto-suggested; success → Add article

### Categories page (`/categories`)

Primary job: nested groups for articles (root → optional subcategory). Not a flat Brands clone.

1. Header: **Add category** + **Add article**
2. Quiet meta: root count · subcategory count
3. **List first**, tree order (root then children); Root/Sub trailing; filter Root only / Subcategories
4. Form below: parent select = **roots only** (2-level tree); success → Add article

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
3. Quiet meta: period GST (CGST+SGST) + draft-sales link when relevant
4. Needs attention (low stock + unpaid peeks) — hide when all clear
5. Optional charts (user toggle; persist preference; Customize menu)
6. Optional catalog/masters strip (user toggle; **default off**; persist preference)
7. Recent activity list with `SectionHeader` (mobile chips open invoice)

---

## 15. Dashboard metrics (P1 — shipped)

| Item | Status | Notes |
|------|--------|--------|
| Unpaid **₹ outstanding** | Done | `opsSummary.unpaidOutstanding` = total − payments on UNPAID/PARTIAL |
| Sales **vs previous period** | Done | `previousSalesTotal` + `salesDeltaPct` vs prior window of same length |
| Deep-link filters | Done | Dashboard unpaid → `/sales?payment=OPEN`; list supports OPEN/PAID/PARTIAL/UNPAID |
| Compact money on KPIs | Done | `MoneyText compact` / `formatInr` |
