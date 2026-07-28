# AI Memory — ShelfLedger

**Current Phase:** Phase 6.1 Quick Sale complete  
**Path:** `/srv/ShelfLedger`  
**Last Updated:** 2026-07-28

## Completed

- Phase 0–6: full functional V1 + deploy hardening
- WhatsApp invoice share via `wa.me` on invoice page
- **UI/UX overhaul:** design tokens, EmptyState/FormField/ListToolbar/ResponsiveDataList, Cmd+K global search, mobile sidebar, ops dashboard KPIs, filtered lists on all modules
- **Chrome polish:** sticky scrollable sidebar with Lucide icons + nav groups; Source Sans 3 + soft teal ink palette; sticky blurred top bar; soft card elevation (no neon)
- **charts (shadcn + Recharts):** Dashboard sales trend + payment mix; Reports GST/cashflow/expenses/stock charts; Expenses category chart
- **Custom Select:** Radix dropdown + searchable combobox for SKU/customer lists; native `<select>` removed from UI
- **Phase 6.1 Quick Sale:** `/sales/quick` + `saleService.createAndPost` / `createAndPostSaleAction`; nav “Quick Sale”; sticky mobile Punch CTA; draft form kept on `/sales`

## Seed users

| Email | Role | Password |
|-------|------|----------|
| owner@shelfledger.local | OWNER | ChangeMe!Owner1 |
| cashier@shelfledger.local | CASHIER | ChangeMe!Cashier1 |

## Inventory invariants

1. Only `applyStockMovement` mutates balances
2. Purchase inbound updates weighted avg; purchase return / sale return / exchange-in keep avg
3. Outbound snapshots avg as unitCost; never edits qty on variants
4. Sale post allocates `DocumentSequence` invoice no.; drafts use `DRAFT-{uuid}`
5. Quick Sale = createDraft + post (same path); no stock bypass

## Deploy notes

- Hostname: `shelfledger.edunexservices.in` — **live** (HTTPS health 200; Caddy `sites.d/shelfledger.caddy`)
- Loopback smoke: `http://127.0.0.1:3002/api/health?deep=1`
- CI deploy secrets: configured (GitHub Actions → VPS)
- Backups: `docs/backup.md`
- Security checklist: `docs/security-checklist.md`

## WhatsApp invoice share

- Invoice page: **Share on WhatsApp** opens `wa.me` with GST summary text; customer phone prefilled when present
- Copy text fallback; no WhatsApp Business API / no public unauthenticated invoice link

## UI notes

- Global search: `⌘K` / top-bar search (invoices, customers, SKUs, vendors, brands, articles)
- Lists: search + filters; mobile chip layout under `md`
- Dashboard: Today / 7d / 30d sales KPIs + recent sales; charts + catalog strip **user-togglable** (localStorage)
- **UI consistency (v1.4):** type/button/card tokens locked in `docs/design.md` §14 — `SectionHeader`, `SurfaceCard`, `buttonClassName`, segmented period
- **Sales pass done:** `/sales`, `/sales/quick`, invoice — shared Input/Textarea chrome, SurfaceCard forms, SectionHeader bands, Quick Sale primary CTAs
- **Purchases pass done:** `/purchases` — SectionHeader bands, SurfaceCard draft form, New purchase CTA → `#new-purchase`
- **Expenses pass done:** `/expenses` — Add expense CTA, SurfaceCard category + expense forms, chart + list SectionHeaders
- **Inventory + exchanges + stock ledger pass done:** SurfaceCard forms, SectionHeaders, opening/adjust CTAs; exchange New CTA; ledger en-IN timestamps
- **Masters pass done:** brands, categories, articles, vendors, customers — Add CTAs, SurfaceCard forms, SectionHeaders, empty-state links
- **UI leftovers pass done:** ListToolbar/ConfirmDialog/toast/command palette radius; Post sale/purchase ConfirmDialog; purchase return dialog (no prompt); login §14; dashboard P1 metrics (outstanding ₹, vs-prior %, `/sales?payment=OPEN`)
- **Sticky CTA + FormField pass:** shared `StickyFormActions` on Quick Sale, draft sale, purchase, exchange; FormField on those entry forms
- **Pre-burn-in polish:** masters FormField (brand/category/vendor/customer/article); dashboard Low stock → `/reports#low-stock`; success/error micro-UX on master forms
- **UI consistency page-by-page: complete** (dashboard through settings)
- **Mobile-first (locked):** phones/tablets are primary staff devices — ADR-012 / `docs/design.md`
- **Quick Sale:** `/sales/quick` — walk-in default, pay-in-full, sticky Punch sale → invoice; dashboard primary CTA

## Pending / follow-ups

- Phase 7+ optional: barcode, multi-branch UI, IGST (not requested)

## Never Forget

- Middleware uses `auth.config.ts` (no bcrypt on Edge); rate limit in middleware + authorize
- No Prisma in client components
- No IGST in V1
- No `0.0.0.0` app ports
- VIEWER is read-only
- UI is **mobile-first responsive** (client staff on phones)
- Stock only via `applyStockMovement`; Quick Sale must still post through sale service invariants
