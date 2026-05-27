# Employee Manager — Backend (BFF)

Bun runtime + **Hono** BFF implementing spec 002 health and Postgres connectivity.

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

### Cleanup

| Command | Removes | Keeps |
|---------|---------|-------|
| `bun run clean` | `dist/`, `build/`, `node_modules/.cache/` | `node_modules/`, source, lockfile, `.env` |
| `bun run nuke` | everything `clean` removes, plus `node_modules/` (then reinstalls) | `src/`, `tests/`, `bun.lock`, `.env` |

After `nuke`, run `bun run dev` as usual.

## Endpoints

- `GET /health` — **200** + [`HealthResponse`](../system-specs/specs/002-backend-connectivity/contracts/openapi.yaml) when Postgres responds; **503** + `ApiError` when the probe fails after startup (production server exits shortly afterward). See OpenAPI for schemas.

## Frontend dev

Ensure `VITE_API_BASE_URL` in `employee-manager-fe` matches `PORT` (default `http://localhost:3000`). Run FE with `bun run dev` (MSW off) once the backend has bound successfully. If Postgres goes away while the backend is running, `GET /health` returns **503** and this process exits shortly after responding.
