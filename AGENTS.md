# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Closed GraphQL enums (`EmploymentStatus`, `Department`, ...)

When a field's GraphQL type is a real `enum` (not `String`), invalid values are
rejected by GraphQL's own variable-coercion step *before* the resolver runs —
the request never reaches the Zod schema in `src/employees/schema.ts`. The
resulting error is a bare `GraphQLError` (message only, no `extensions.code`),
not the resolver's `graphqlAppError(..., 'VALIDATION_ERROR', 400)`. Tests for
an invalid enum value should assert on `errors[0].message` / `data` being
undefined, not on `extensions.code`. The Zod `z.enum(...)` check on these
fields is intentionally kept anyway, mirroring the existing pattern, even
though a truly invalid value can no longer reach it through GraphQL.

Local dev Postgres: `psql`/`pg_ctl` available via `/opt/homebrew/opt/libpq/bin`
(not on default PATH); a local server is often already running on `5432` with
`employee_management` and `employee_payroll` databases and `postgres`/`postgres`
credentials matching `.env.example`.
