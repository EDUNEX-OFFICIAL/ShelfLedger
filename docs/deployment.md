# Deployment — ShelfLedger

**Version:** 1.1.0  
**Last Updated:** 2026-07-27  
**Target:** Hostinger VPS under `/srv` with Caddy edge

Align with [`/srv/VPS_MULTI_PROJECT_GUIDELINE.md`](/srv/VPS_MULTI_PROJECT_GUIDELINE.md) and [`/srv/scripts/PORT_REGISTRY.md`](/srv/scripts/PORT_REGISTRY.md).

---

## 1. Principles

1. Only `green-city-caddy` binds public 80 / 127.0.0.1:8443.
2. ShelfLedger web container joins **`vps_edge`** (thin edge) + **`shelfledger_internal`**.
3. DB on **shared** `edunex-postgres` via **`postgres_shared`**, with **dedicated** role + database `shelfledger` (never superuser `edunex` in app URL).
4. Never publish app ports to `0.0.0.0`.
5. Update `PORT_REGISTRY.md` before any new localhost bind.

---

## 2. Topology

```
Internet → Caddy → shelfledger-web:3000 (Docker DNS on vps_edge)
                      │
                      └─ postgres_shared → edunex-postgres
                           DB: shelfledger  ROLE: shelfledger
```

### Compose

| Item | Value |
|------|-------|
| Path | `/srv/ShelfLedger` |
| Project name | `shelfledger` |
| Web service | `shelfledger-web` |
| Private network | `shelfledger_internal` |
| Edge network | `vps_edge` (external) |
| DB network | `postgres_shared` (external) |

### Localhost ports

Prefer **no** host port for web in production (Caddy → Docker network).  
If debug bind needed later: reserve in `PORT_REGISTRY.md` first (e.g. candidate `127.0.0.1:3002` — confirm free at Phase 6).

---

## 3. Postgres (locked)

Same container as other VPS apps (`edunex-postgres`), **different database**:

```sql
CREATE ROLE shelfledger LOGIN PASSWORD '...';
CREATE DATABASE shelfledger OWNER shelfledger;
REVOKE CONNECT ON DATABASE shelfledger FROM PUBLIC;
GRANT CONNECT ON DATABASE shelfledger TO shelfledger;
-- GRANT schema/table privileges after migrate as needed
```

```
DATABASE_URL=postgresql://shelfledger:...@edunex-postgres:5432/shelfledger?schema=public
```

---

## 4. Caddy

Site file: `/srv/automation/deploy/caddy/sites.d/shelfledger.caddy` (Phase 6)

```caddy
shelfledger.edunexservices.in {
  reverse_proxy shelfledger-web:3000
}
```

- Upstream must resolve on `vps_edge` (Caddy already joins it).
- DNS: CNAME/A for `shelfledger.edunexservices.in` when going live.
- Alternate subdomain string OK if stakeholder prefers (`erp.…`, `billing.…`) — update this doc + `memory.md`.

---

## 5. Docker Image

- Multi-stage: deps → build → standalone Next.js output
- Run as non-root
- `NODE_ENV=production`
- Healthcheck: `GET /api/health`

---

## 6. Environment

Required:

- `DATABASE_URL`
- `AUTH_SECRET` (32+ bytes)
- `APP_URL=https://shelfledger.edunexservices.in`
- `NODE_ENV`

Never commit real `.env`. Use `.env.example` only.

---

## 7. Migrations

- `prisma migrate deploy` as release step
- Seed only on fresh installs

---

## 8. Backups

See [backup.md](./backup.md) for dump/restore commands and post-restore checks.

- Include database `shelfledger` in VPS Postgres backup procedures
- Restore drill documented; run periodically

---

## 9. Staggered Boot

Register ShelfLedger after Postgres is healthy; verify `/api/health` before marking live.

---

## 10. CI / CD (GitHub Actions)

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `.github/workflows/ci.yml` | PRs + non-`main` pushes | lint, format, typecheck, build |
| `.github/workflows/deploy-vps.yml` | push to `main` + manual | same verify → SSH → `scripts/deploy-vps.sh` |

Deploy path on VPS: `git fetch` → Docker build `shelfledger-web` → `pnpm db:migrate:deploy` → `curl 127.0.0.1:3002/api/health`.

### GitHub repo secrets

| Secret | Value (this VPS) |
|--------|------------------|
| `VPS_HOST` | `187.127.143.207` |
| `VPS_USER` | `root` |
| `VPS_PORT` | `2222` (preferred; `:22` often blocked from GitHub runners) |
| `VPS_SSH_KEY_B64` | output of `tr -d '\n' < /root/.ssh/github_actions_deploy.b64` |

Same deploy key as other Edunex projects (`github-actions-greencity-deploy` in `authorized_keys`).

Optional alternate: `VPS_SSH_KEY` (raw PEM) instead of B64.

### Before first deploy

1. Create shared Postgres role/DB `shelfledger` (section 3).
2. Write `/srv/ShelfLedger/.env` with production `DATABASE_URL` (host `edunex-postgres`), `AUTH_SECRET`, `AUTH_URL`, `APP_URL`.
3. Ensure Caddy loads `sites.d/shelfledger.caddy` and DNS points `shelfledger.edunexservices.in` here.
4. Add the four secrets above in GitHub → Settings → Secrets and variables → Actions.
