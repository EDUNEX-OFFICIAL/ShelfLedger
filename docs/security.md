# Security — ShelfLedger

**Version:** 1.0.0  
**Last Updated:** 2026-07-27

---

## 1. Principles

1. Never trust client input.  
2. Authenticate, then authorize.  
3. Least privilege (DB role, user roles).  
4. Fail closed.  
5. No stack traces to clients.

---

## 2. Authentication

- HttpOnly, Secure, SameSite=Lax (or Strict) session cookies
- Strong `AUTH_SECRET`
- Password hashing: Argon2id preferred (or bcrypt cost ≥ 12)
- Lockout / rate limit on login (e.g. 5/min/IP)
- Invalidate sessions on deactivate user

---

## 3. Authorization

- Role checks in services or policy helpers for every mutation
- Branch scoping: users only see their org; branch filter when multi-branch enabled
- CASHIER cannot void/adjust without permission matrix

---

## 4. Input Validation

- Zod on all boundaries
- Max length on text fields
- File uploads (future): type/size allowlist

---

## 5. Injection & XSS

- Prisma parameterized queries only — no raw SQL unless tagged and reviewed
- React escapes by default; never `dangerouslySetInnerHTML` for user content
- CSP headers in Next/Caddy (Phase 6)

---

## 6. CSRF

- Server Actions: Next.js built-in protections
- Same-origin ERP; mutating REST requires CSRF strategy if cookies used cross-site

---

## 7. Data Protection

- Soft delete + void; no silent hard deletes
- Audit who posted financial docs (`createdBy`)
- Secrets only in env / Docker secrets
- Logs without passwords, full card numbers (N/A), or GSTIN dump spam

---

## 8. Network

- App not on public ports
- TLS terminated at Caddy
- Postgres not exposed publicly (localhost ops bind only)

---

## 9. Dependency Hygiene

- Pin versions; audit occasionally (`pnpm audit`)
- Do not install unnecessary packages

---

## 10. Checklist Before Production

- [ ] AUTH_SECRET rotated and strong  
- [ ] Default seed password changed  
- [ ] HTTPS only  
- [ ] Rate limit on auth  
- [ ] DB role non-superuser  
- [ ] Backup verified  
- [ ] Error responses sanitized  
