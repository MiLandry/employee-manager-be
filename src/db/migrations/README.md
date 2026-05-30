# SQL migrations

Versioned, forward-only schema changes for `employee-manager-be`.

## Naming

- Pattern: `{sequence}_{description}.sql` (e.g. `001_create_employees.sql`)
- Sequences are zero-padded three digits
- One logical change per file

## Policy

- **Forward-only** in v1 — do not edit files after they have been applied in shared environments
- To reverse a change, add a new migration (e.g. `002_drop_employees.sql`) and apply only in controlled environments
- Applied migration IDs are recorded in `schema_migrations`

## Apply

```bash
bun run db:migrate
```
