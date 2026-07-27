# Folder Structure — ShelfLedger

**Version:** 1.0.0  
**Last Updated:** 2026-07-27

Target structure after Phase 1 scaffold (not all folders exist during Phase 0).

```
/srv/ShelfLedger/
├── .cursor/
│   └── rules/
│       ├── architecture.mdc
│       ├── typescript.mdc
│       ├── react.mdc
│       ├── nextjs.mdc
│       ├── prisma.mdc
│       ├── database.mdc
│       ├── api.mdc
│       ├── ui.mdc
│       ├── forms.mdc
│       ├── testing.mdc
│       ├── git.mdc
│       ├── security.mdc
│       ├── performance.mdc
│       ├── documentation.mdc
│       └── project.mdc
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/
│       │   │   │   └── login/
│       │   │   ├── (app)/
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── dashboard/
│       │   │   │   ├── purchases/
│       │   │   │   ├── sales/
│       │   │   │   ├── inventory/
│       │   │   │   ├── stock-ledger/
│       │   │   │   ├── articles/
│       │   │   │   ├── brands/
│       │   │   │   ├── categories/
│       │   │   │   ├── vendors/
│       │   │   │   ├── customers/
│       │   │   │   ├── exchanges/
│       │   │   │   ├── expenses/
│       │   │   │   ├── staff/
│       │   │   │   ├── reports/
│       │   │   │   └── settings/
│       │   │   ├── api/
│       │   │   │   ├── health/
│       │   │   │   └── auth/
│       │   │   ├── layout.tsx
│       │   │   └── globals.css
│       │   ├── components/
│       │   │   ├── ui/                 # shadcn
│       │   │   ├── layout/
│       │   │   ├── data-table/
│       │   │   └── shared/
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   ├── purchases/
│       │   │   ├── sales/
│       │   │   ├── inventory/
│       │   │   ├── articles/
│       │   │   └── …/
│       │   │       ├── components/
│       │   │       ├── hooks/
│       │   │       ├── actions.ts      # Server Actions
│       │   │       └── columns.tsx
│       │   ├── lib/
│       │   │   ├── auth.ts
│       │   │   ├── utils.ts
│       │   │   └── query-keys.ts
│       │   └── types/
│       ├── public/
│       ├── package.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── tsconfig.json
├── packages/
│   ├── db/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── repositories/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── domain/
│   │   ├── src/
│   │   │   ├── costing/
│   │   │   ├── gst/
│   │   │   ├── inventory/
│   │   │   └── services/          # or keep app services in web/server
│   │   └── package.json
│   ├── validators/
│   │   └── src/
│   ├── errors/
│   │   └── src/
│   └── tsconfig/
├── docs/
├── docker/
│   ├── Dockerfile.web
│   └── compose files as needed
├── scripts/
├── pnpm-workspace.yaml
├── package.json
├── turbo.json                    # optional
├── .env.example
├── README.md
└── VPS notes referenced to /srv guidelines
```

## Rules

1. Feature code stays under `features/<name>`.
2. Cross-feature imports go through packages or `components/shared`, not sibling feature deep imports when avoidable.
3. Prisma schema lives in `packages/db` only.
4. Do not create a second Next app in V1.
5. `types/` at app level only for UI-specific types; domain types in packages.
