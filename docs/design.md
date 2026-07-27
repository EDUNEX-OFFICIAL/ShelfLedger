# Design System — ShelfLedger

**Version:** 1.1.0  
**Last Updated:** 2026-07-27

Internal ERP UI for **ShelfLedger**: **simple, professional, fast, minimal, enterprise**. Not a marketing site — design rules for promotional landings do not apply. Optimize for density, clarity, and keyboard speed at the counter.

Brand in chrome: **ShelfLedger** (wordmark in sidebar). Avoid category-specific product naming in the shell.

---

## 1. Design Principles

1. **Clarity over decoration** — no gratuitous cards, glow, or purple gradients.
2. **One primary action per view** — e.g. “Post Sale”.
3. **Dense but breathable** — tables first; forms scannable.
4. **Keyboard-first** for sales and purchase entry.
5. **Consistent chrome** — same shell, nav, page header pattern.
6. **Trustworthy** — numbers aligned, status badges restrained.

---

## 2. Typography

| Token | Use | Suggested |
|-------|-----|-----------|
| `font-sans` | UI body | `IBM Plex Sans` or `Source Sans 3` |
| `font-mono` | SKUs, invoice nos, amounts in tables | `IBM Plex Mono` or `JetBrains Mono` |
| `text-xs` | Meta, table secondary | 12px |
| `text-sm` | Forms, table body | 14px |
| `text-base` | Body | 16px |
| `text-lg` | Section titles | 18px |
| `text-xl` / `text-2xl` | Page titles | 20–24px |

Avoid Inter/Roboto/Arial as primary brand fonts; still keep system-ui fallback stack.

**Do not** use display serifs or newspaper layouts for this ERP.

---

## 3. Spacing Scale

Tailwind default 4px grid:

`0, 1 (4), 2 (8), 3 (12), 4 (16), 5 (20), 6 (24), 8 (32), 10 (40), 12 (48)`

- Page padding: `p-4 md:p-6`
- Section gap: `gap-6`
- Form field gap: `gap-4`
- Table cell: compact `py-2 px-3`

---

## 4. Color Tokens

Neutral enterprise palette with **one accent** (teal/slate-blue — not purple).

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 25% 12%;
  --muted: 210 20% 96%;
  --muted-foreground: 215 12% 40%;
  --border: 214 16% 88%;
  --card: 0 0% 100%;
  --primary: 199 75% 32%;          /* deep teal */
  --primary-foreground: 0 0% 100%;
  --secondary: 210 18% 93%;
  --accent: 199 40% 94%;
  --destructive: 0 72% 48%;
  --success: 152 60% 32%;
  --warning: 38 92% 42%;
  --ring: 199 75% 32%;
  --sidebar: 210 25% 10%;
  --sidebar-foreground: 210 20% 92%;
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

Minimal:

- `shadow-sm` — dropdowns, popovers
- `shadow-md` — modals only  
Avoid multi-layer dramatic shadows.

---

## 6. Radius

```css
--radius: 0.375rem; /* 6px — slightly sharp enterprise */
```

Buttons/inputs: `rounded-md`. Avoid `rounded-full` pills for primary nav.

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

## 10. Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| &lt; md | Collapsible nav, stacked forms, horizontal scroll tables |
| md | Persistent sidebar optional collapse |
| lg+ | Full tables, split panes (list + detail) where useful |

Counter billing: prioritize **desktop**; mobile usable for reports/masters.

---

## 11. Component Naming

- shadcn primitives: `components/ui/button.tsx`
- Composites: `PageHeader`, `DataTable`, `StatusBadge`, `ConfirmDialog`, `MoneyText`, `SkuText`
- Feature-specific: `features/sales/components/SaleLineEditor.tsx`

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
