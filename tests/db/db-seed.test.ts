import { expect, test } from 'bun:test'
import { assertLocalResetAllowed } from '../../scripts/db-reset'
import { initPostgresTests, mockAppEnv } from './helpers'
import { prepareDatabase } from './setup'

test('assertLocalResetAllowed refuses non-local host without override', () => {
  expect(() =>
    assertLocalResetAllowed(
      mockAppEnv({
        POSTGRES_HOST: 'prod-db.example.com',
      }),
    ),
  ).toThrow(/Refusing db:reset/)
})

test('assertLocalResetAllowed allows override flag', () => {
  const previous = process.env.ALLOW_DB_RESET
  process.env.ALLOW_DB_RESET = 'true'

  try {
    expect(() =>
      assertLocalResetAllowed(
        mockAppEnv({
          POSTGRES_HOST: 'prod-db.example.com',
        }),
      ),
    ).not.toThrow()
  } finally {
    if (previous === undefined) {
      delete process.env.ALLOW_DB_RESET
    } else {
      process.env.ALLOW_DB_RESET = previous
    }
  }
})

const pg = await initPostgresTests()

pg.describe('runSeed', () => {
  test('applies seed idempotently', async () => {
    if (!pg.env) {
      throw new Error('Postgres test env missing')
    }

    const { runSeed } = await import('../../scripts/db-seed')
    const postgres = (await import('postgres')).default
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
      await sql`TRUNCATE employees`
      await prepareDatabase(sql, env)
      await runSeed()
      const first = await sql<{ count: string }[]>`
        SELECT COUNT(*)::text AS count FROM employees
      `
      await runSeed()
      const second = await sql<{ count: string }[]>`
        SELECT COUNT(*)::text AS count FROM employees
      `
      expect(first[0]?.count).toBe('3')
      expect(second[0]?.count).toBe('3')
    } finally {
      await sql`TRUNCATE employees`
      await sql.end({ timeout: 5 })
    }
  })
})
