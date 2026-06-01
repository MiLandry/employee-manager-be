# Employee Manager — Backend (BFF)

Bun runtime + **Hono** BFF implementing spec 002 health and Postgres connectivity.

Project constitution and specs live in the sibling [`system-specs`](../system-specs) repository (see `.specify/memory/constitution.md` there).

## Setup

PostgreSQL must be reachable before the server accepts traffic: startup runs a **`SELECT 1`** probe against the configured database. If it fails, the process **exits with code `1`** (nothing listens on `PORT`).

```bash
cd employee-manager-be
bun install
cp .env.example .env
# set all POSTGRES_* variables and ensure the database exists / is reachable
```

## Scripts

| Command       | Purpose                                  |
|---------------|------------------------------------------|
| `bun run dev` | Dev server with hot reload (`--watch`)   |
| `bun run start` | Production-style single run           |
| `bun run stop` | Stop process listening on `PORT` (from `.env`, default `3000`) |
| `bun test`    | Bun test suite                           |
| `bun run typecheck` | `tsc --noEmit`                     |
| `bun run build`     | Emit `dist/` (optional for containers) |
| `bun run clean`     | Remove `dist/`, `build/`, and tool caches under `node_modules` |
| `bun run nuke`      | `clean` plus remove `node_modules/`, then `bun install` |
| `bun run db:migrate` | Apply pending SQL migrations (spec 009) |
| `bun run db:seed`    | Load dev-only sample employees (idempotent) |
| `bun run db:reset`   | Truncate `employees` (local host only; see below) |

### Database (spec 009)

After Postgres is configured in `.env`:

```bash
bun run db:migrate   # creates employees + schema_migrations
bun run db:seed      # optional dev sample rows
```

`db:reset` truncates employee rows and refuses non-local `POSTGRES_HOST` unless `ALLOW_DB_RESET=true`.

Repository integration tests require a reachable Postgres instance and are skipped in CI (no service container yet). Route tests for spec 008 should mock the repository until CI Postgres is added (roadmap spec 007).

### Cleanup

| Command | Removes | Keeps |
|---------|---------|-------|
| `bun run clean` | `dist/`, `build/`, `node_modules/.cache/` | `node_modules/`, source, lockfile, `.env` |
| `bun run nuke` | everything `clean` removes, plus `node_modules/` (then reinstalls) | `src/`, `tests/`, `bun.lock`, `.env` |

After `nuke`, run `bun run dev` as usual.

## CI

This repo includes a backend-only GitHub Actions workflow at `.github/workflows/ci.yml`.

- Trigger: `pull_request` and pushes to `main`
- Checks: install dependencies, typecheck, test, build
- Scope: no service containers and no DB-backed integration services for this first rollout
- Deferred follow-up: frontend repo CI and any optional service-container integration jobs

CI command parity:

```bash
bun install --frozen-lockfile
bun run typecheck
bun test
bun run build
```

## Endpoints

- `GET /health` — **200** + [`HealthResponse`](../system-specs/specs/002-backend-connectivity/contracts/openapi.yaml) when Postgres responds; **503** + `ApiError` when the probe fails after startup (production server exits shortly afterward). See OpenAPI for schemas.
- Employee CRUD (spec 008): `GET/POST /employees/list`, `PUT /employees/{id}/edit`, `DELETE /employees/{id}` — see [`openapi.yaml`](../system-specs/specs/features/008-employee-crud-mui/contracts/openapi.yaml). Mock auth headers: `x-mock-user-id`, `x-mock-roles`.

## Frontend dev

Ensure `VITE_API_BASE_URL` in `employee-manager-fe` matches `PORT` (default `http://localhost:3000`). Run FE with `bun run dev` (MSW off) once the backend has bound successfully. If Postgres goes away while the backend is running, `GET /health` returns **503** and this process exits shortly after responding.
