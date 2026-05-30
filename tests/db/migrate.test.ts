import { describe, expect, test } from 'bun:test'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import postgres from 'postgres'
import {
  listMigrationFiles,
  migrationIdFromFilename,
  runMigrations,
} from '../../src/db/migrate'
import { initPostgresTests } from './helpers'
import { resetEmployeesMigration } from './setup'

describe('migration helpers', () => {
  test('migrationIdFromFilename strips .sql extension', () => {
    expect(migrationIdFromFilename('001_create_employees.sql')).toBe(
      '001_create_employees',
    )
  })

  test('listMigrationFiles returns sorted sql files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'migrations-'))
    await writeFile(join(dir, '002_second.sql'), 'SELECT 1;')
    await writeFile(join(dir, '001_first.sql'), 'SELECT 1;')
    await writeFile(join(dir, 'README.md'), 'ignore')

    const files = await listMigrationFiles(dir)
    expect(files).toEqual(['001_first.sql', '002_second.sql'])
  })
})

const pg = await initPostgresTests()

pg.describe('runMigrations', () => {
  test('applies pending migrations and is idempotent on re-run', async () => {
    if (!pg.env) {
      throw new Error('Postgres test env missing')
    }

    const env = pg.env
    const sql = postgres({
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      database: env.POSTGRES_DB,
      max: 1,
    })

    try {
      await resetEmployeesMigration(sql)
      const first = await runMigrations(env, { sql })
      expect(first).toContain('001_create_employees')

      const second = await runMigrations(env, { sql })
      expect(second).toEqual([])

      const tables = await sql<{ tablename: string }[]>`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN ('employees', 'schema_migrations')
        ORDER BY tablename
      `
      expect(tables.map((row) => row.tablename)).toEqual([
        'employees',
        'schema_migrations',
      ])
    } finally {
      await sql.end({ timeout: 5 })
    }
  })
})
