import type { Sql } from 'postgres'
import type { AppEnv } from '../../src/env'
import { runMigrations } from '../../src/db/migrate'

/**
 * Ensures migrations can run in tests even if employees was created outside the runner.
 */
export const prepareDatabase = async (sql: Sql, env: AppEnv): Promise<void> => {
  const [{ employeesReg }] = await sql<{ employeesReg: string | null }[]>`
    SELECT to_regclass('public.employees') AS employees_reg
  `

  if (employeesReg) {
    let applied: { id: string }[] = []
    const [{ migReg }] = await sql<{ migReg: string | null }[]>`
      SELECT to_regclass('public.schema_migrations') AS mig_reg
    `

    if (migReg) {
      applied = await sql<{ id: string }[]>`
        SELECT id
        FROM schema_migrations
        WHERE id = '001_create_employees'
      `
    }

    if (applied.length === 0) {
      await sql`DROP TABLE employees CASCADE`
    }
  }

  await runMigrations(env, { sql })
}

export const resetEmployeesMigration = async (sql: Sql): Promise<void> => {
  await sql`DROP TABLE IF EXISTS employees CASCADE`
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    DELETE FROM schema_migrations
    WHERE id = '001_create_employees'
  `
}
