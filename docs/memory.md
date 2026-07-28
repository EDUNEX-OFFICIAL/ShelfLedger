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

- Invoice page: **Share on WhatsApp** opens `wa.me` with structured GST summary (bold invoice no, en-IN date/amounts, item blocks, CGST/SGST, human payment label)
- Copy text fallback; no WhatsApp Business API / no public unauthenticated invoice link

## UI notes

- Global search: `⌘K` / top-bar search (invoices, customers, SKUs, vendors, brands, articles)
- Lists: search + filters; mobile chip layout under `md`
- Dashboard: Today / 7d / 30d sales KPIs + recent sales; charts + catalog strip **user-togglable** (localStorage; catalog **default off**); Needs attention peeks; GST meta + draft link; mobile recent chips open invoice
- **UI consistency (v1.4):** type/button/card tokens locked in `docs/design.md` §14 — `SectionHeader`, `SurfaceCard`, `buttonClassName`, segmented period
- **Sales pass done:** `/sales` — find/post/dues first; Advanced draft collapsed; invoice date; Post→invoice; Quick Sale primary; `/sales/quick` → `#new-draft`
- **Purchases pass done:** `/purchases` — vendor invoice # + bill date searchable; drafts-to-receive meta; form stays open (create is primary); list-first + New purchase CTA
- **Expenses pass done:** `/expenses` — period filter (Today/30d/Month/All) + period total; log form with today default + FormField; categories collapsed; list with amount trailing + category filter; chart after list
- **Invoice print pass:** GST tax invoice layout — seller/GSTIN/state, invoice no+date, place of supply, reverse charge No, amount in words, signatory; print CSS no longer hides document header (`header` blanket rule fixed)
- **Reports pass done:** `/reports` — Today/7d/30d/Month + Custom; sales invoice + low-stock mobile lists; GST detail without IGST row; purchases/expenses link-out; `#low-stock` / `#sales-gst` anchors
- **Settings pass done:** `/settings` — org FormField + address2/email; FY month select; sticky Save; VIEWER read-only profile; tax list-first + auto CGST/SGST split; sequence cards; Staff CTA
- **Staff pass done:** `/staff` — list-first; human roles; You badge; self lock; dirty Save; role hints; Settings CTA; create form below
- **Inventory + exchanges + stock ledger pass done:** Inventory list-first + Ledger→`?sku=`; Exchanges invoice-first; opening/adjust collapsed; **stock ledger** audit list (type/dir/period filters, ±qty color, sale→invoice, `?sku=` deep link)
- **Masters pass done:** **articles** list-first + SKU search; **brands** list-first + code suggest + Articles CTA; **categories** tree list (root→sub) + roots-only parent select; customers phone/WhatsApp; vendors GSTIN/Net terms
- **UI leftovers pass done:** ListToolbar/ConfirmDialog/toast/command palette radius; Post sale/purchase ConfirmDialog; purchase return dialog (no prompt); login §14; dashboard P1 metrics (outstanding ₹, vs-prior %, `/sales?payment=OPEN`)
- **Sticky CTA + FormField pass:** shared `StickyFormActions` on Quick Sale, draft sale, purchase, exchange; FormField on those entry forms
- **Pre-burn-in polish:** masters FormField (brand/category/vendor/customer/article); dashboard Low stock → `/reports#low-stock`; success/error micro-UX on master forms
- **UI consistency page-by-page: complete** (dashboard through settings)
- **Mobile-first (locked):** phones/tablets are primary staff devices — ADR-012 / `docs/design.md`
- **Quick Sale:** `/sales/quick` — walk-in default, pay-in-full, sticky Punch sale → invoice; dashboard primary CTA
- **Quick Sale UX (desktop):** wider layout + `lg` 2-col sticky rail; denser item rows; phone lookup; stock hint; F2/1/2/3/+ shortcuts; punch block hints
- **Quick Sale look:** unified checkout rail; hero total; payment icons + filled selected; Punch spinner/Posted; items ticket + stock badges; mobile sticky mini total; micro-motion utilities

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
