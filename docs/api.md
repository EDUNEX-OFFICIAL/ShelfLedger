# API Conventions — ShelfLedger

**Version:** 1.0.0  
**Last Updated:** 2026-07-27

Primary UI mutations use **Server Actions**. Route Handlers are for health, future external clients, downloads, and webhooks.

---

## 1. Response Envelope (Route Handlers)

Success:

```json
{
  "success": true,
  "data": { },
  "meta": {
    "requestId": "uuid",
    "pagination": {
      "nextCursor": "…",
      "limit": 20
    }
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Not enough stock for SKU FW-42-BLK",
    "details": { "variantId": "…", "available": 2, "requested": 5 }
  },
  "meta": { "requestId": "uuid" }
}
```

Server Actions may throw typed errors mapped to toast messages; same error codes.

---

## 2. Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Zod failure |
| `UNAUTHORIZED` | 401 | No session |
| `FORBIDDEN` | 403 | RBAC |
| `NOT_FOUND` | 404 | Missing entity |
| `CONFLICT` | 409 | Duplicate invoice / unique |
| `BUSINESS_RULE_ERROR` | 422 | Domain rule |
| `INSUFFICIENT_STOCK` | 422 | Subtype of business |
| `RATE_LIMITED` | 429 | Auth/API abuse |
| `INTERNAL_ERROR` | 500 | Unexpected |

---

## 3. Versioning

- Browser Server Actions: unversioned, private.
- External HTTP API (future): `/api/v1/...`
- Breaking changes bump `v1` → `v2`; document in changelog.

---

## 4. Pagination

Prefer **cursor pagination** for ledger and large lists:

`GET /api/v1/stock-ledger?cursor=...&limit=50`

Sort stable: `(occurred_at DESC, id DESC)`.

Page/offset allowed for small admin tables (brands).

---

## 5. Validation

- Every Route Handler and Server Action parses input with Zod from `packages/validators`.
- Reject unknown keys (`strict` or `.strip()` consistently — prefer **strip** for forms, **strict** for external API).

---

## 6. Auth

- Cookie session required for all `/api/v1/*` except `/api/health` and `/api/auth/*`.
- CSRF: framework built-in for Server Actions; for Route Handlers use same-site cookies + custom header for mutating verbs if exposed cross-site (V1 same-origin only).

---

## 7. Resource Paths (future v1 sketch)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness |
| GET | `/api/v1/articles` | List |
| POST | `/api/v1/purchases` | Create draft |
| POST | `/api/v1/purchases/:id/post` | Post |
| POST | `/api/v1/sales` | Create draft |
| POST | `/api/v1/sales/:id/post` | Post |
| GET | `/api/v1/inventory/balances` | Stock |
| GET | `/api/v1/stock-ledger` | Ledger |

Exact handlers implemented per phase; services shared with Server Actions.

---

## 8. Idempotency (recommended Phase 4+)

Mutating post endpoints accept `Idempotency-Key` header for sale/purchase post to prevent double-submit. Store keys in DB with response snapshot (TTL 24h).
