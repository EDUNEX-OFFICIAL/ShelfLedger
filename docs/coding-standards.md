# Coding Standards — ShelfLedger

**Version:** 1.0.0  
**Last Updated:** 2026-07-27

---

## TypeScript

- `strict: true`
- **No `any`**. Use `unknown` + narrow.
- Prefer `type` unless interface merging/extension is required.
- Exhaustive `switch` with `never` check.
- Branded IDs optional: `type VariantId = string & { readonly __brand: 'VariantId' }`
- No non-null assertions unless justified with comment.

## React / Next.js

- Server Components by default.
- `"use client"` only for interactivity, browser APIs, RHF, TanStack Table/Query client hooks.
- Functional components only.
- No business logic in components beyond presentation mapping.

## Architecture

- Feature-based modules.
- SOLID: especially Single Responsibility & Dependency Inversion (services depend on repository interfaces where useful).
- DRY / KISS — no clever abstractions without two real call sites.
- Composition over inheritance.
- UI → actions → services → repositories → Prisma.

## Async & Data

- Multi-step stock/money ops: Prisma `$transaction`.
- Avoid N+1: `include` / `select` deliberately.
- Paginate all large lists.

## Forms

- React Hook Form + Zod resolver.
- Same schema on server.

## Naming

- `getX` / `listX` / `createX` / `updateX` / `postX` / `voidX`
- Boolean props: `isLoading`, `hasStock`, `canOverride`

## Comments

- Comment **why**, not what.
- Do not narrate obvious code.

## Files

- One primary export per component file preferred.
- Keep files focused; split when &gt; ~300 lines of mixed concerns.

## Git

- Conventional, imperative commit subjects when committing (only on user request).
- Never commit secrets or `.env`.
