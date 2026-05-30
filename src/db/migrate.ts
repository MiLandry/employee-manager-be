import { readdir, readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import postgres from 'postgres'
import type { Sql } from 'postgres'
import { toPostgresConfig } from './config'
import type { AppEnv } from '../env'

const MIGRATIONS_TABLE = 'schema_migrations'

export const defaultMigrationsDir = (): string =>
  join(import.meta.dir, 'migrations')

export const migrationIdFromFilename = (filename: string): string =>
  basename(filename, '.sql')

export const listMigrationFiles = async (
  migrationsDir: string,
): Promise<string[]> => {
  const entries = await readdir(migrationsDir)
  return entries
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b))
}

const ensureMigrationsTable = async (sql: Sql): Promise<void> => {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

const loadAppliedMigrationIds = async (sql: Sql): Promise<Set<string>> => {
  const rows = await sql<{ id: string }[]>`
    SELECT id FROM ${sql(MIGRATIONS_TABLE)}
  `
  return new Set(rows.map((row) => row.id))
}

export type RunMigrationsOptions = {
  migrationsDir?: string
  sql?: Sql
}

/**
 * Applies pending SQL migrations in filename order. Each migration runs in a
 * transaction; failed SQL rolls back and is not recorded.
 */
export const runMigrations = async (
  env: AppEnv,
  options: RunMigrationsOptions = {},
): Promise<string[]> => {
  const migrationsDir = options.migrationsDir ?? defaultMigrationsDir()
  const ownsConnection = options.sql === undefined
  const sql =
    options.sql ??
    postgres({
      ...toPostgresConfig(env),
      max: 1,
      idle_timeout: 20,
      connect_timeout: 5,
    })

  try {
    await ensureMigrationsTable(sql)
    const applied = await loadAppliedMigrationIds(sql)
    const files = await listMigrationFiles(migrationsDir)
    const newlyApplied: string[] = []

    for (const file of files) {
      const id = migrationIdFromFilename(file)
      if (applied.has(id)) {
        continue
      }

      const migrationSql = await readFile(join(migrationsDir, file), 'utf8')

      await sql.begin(async (tx) => {
        await tx.unsafe(migrationSql)
        await tx`
          INSERT INTO schema_migrations (id)
          VALUES (${id})
        `
      })

      newlyApplied.push(id)
    }

    return newlyApplied
  } finally {
    if (ownsConnection) {
      await sql.end({ timeout: 5 })
    }
  }
}
