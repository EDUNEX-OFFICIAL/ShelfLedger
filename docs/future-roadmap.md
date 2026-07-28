# Future Roadmap — ShelfLedger

**Version:** 1.1.0  
**Last Updated:** 2026-07-28

Ordered by likely business value after V1 stability.

| Phase | Module | Notes |
|-------|--------|-------|
| **6.1** | **Quick Sale / POS punch** | Done: `/sales/quick`; `saleService.createAndPost`; sticky Punch CTA |
| **6.1** | **Mobile-first hardening** | Quick Sale touch targets + sticky CTA shipped; optional broader audit later |
| 7 | Barcode scanning | Use `article_variants.barcode`; USB/camera wedge into Quick Sale SKU field |
| 7 | Barcode printing | Label templates; Brother/Zebra compatible PDF/ZPL |
| 8 | Multi-branch UI | Branch switcher; transfers `TRANSFER_IN/OUT` |
| 8 | Warehouse | Multiple locations per branch; putaway rules light |
| 9 | WhatsApp Business API | Optional provider automation / low-stock alerts (beyond `wa.me` share on invoice) |
| 9 | Loyalty | Points ledger separate from stock ledger |
| 10 | Accounting | Chart of accounts; map purchases/sales/expenses to journals |
| 10 | Native mobile app | Optional; consume `/api/v1`; reuse domain — **not required** if responsive web is excellent |
| 11 | Advanced GST | Inter-state **IGST**, e-invoice / e-way bill integrations |
| 11 | Procurement | POs, GRN separate from vendor invoice |
| 12 | Multi-tenant SaaS | Only if productized beyond single-retailer VPS |

## Principles for future work

- Extend ledger movement types; do not bypass ledger.
- Keep domain package free of Next.js imports for mobile reuse.
- Feature-flag multi-branch until data migration tested.
- **Ship mobile-first:** every new UI screen must work on phone before desktop polish.
