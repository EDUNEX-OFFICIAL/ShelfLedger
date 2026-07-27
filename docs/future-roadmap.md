# Future Roadmap — ShelfLedger

**Version:** 1.0.0  
**Last Updated:** 2026-07-27

Ordered by likely business value after V1 stability.

| Phase | Module | Notes |
|-------|--------|-------|
| 7 | Barcode scanning | Use `article_variants.barcode`; USB scanner = keyboard wedge in sale UI |
| 7 | Barcode printing | Label templates; Brother/Zebra compatible PDF/ZPL |
| 8 | Multi-branch UI | Branch switcher; transfers `TRANSFER_IN/OUT` |
| 8 | Warehouse | Multiple locations per branch; putaway rules light |
| 9 | WhatsApp automation | Invoice link / low stock alerts via provider API (Route Handlers) |
| 9 | Loyalty | Points ledger separate from stock ledger |
| 10 | Accounting | Chart of accounts; map purchases/sales/expenses to journals |
| 10 | Mobile app | Consume `/api/v1`; reuse domain package |
| 11 | Advanced GST | Inter-state **IGST**, e-invoice / e-way bill integrations |
| 11 | Procurement | POs, GRN separate from vendor invoice |
| 12 | Multi-tenant SaaS | Only if productized beyond single-retailer VPS |

## Principles for future work

- Extend ledger movement types; do not bypass ledger.
- Keep domain package free of Next.js imports for mobile reuse.
- Feature-flag multi-branch until data migration tested.
