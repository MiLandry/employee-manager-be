import { afterAll, beforeAll, beforeEach, expect, test } from 'bun:test'
import postgres from 'postgres'
import { closePool } from '../../src/db/connection'
import { createEmployee, listEmployees } from '../../src/db/employeesRepository'
import type { AppEnv } from '../../src/env'
import { initPostgresTests } from './helpers'
import { prepareDatabase } from './setup'

const pg = await initPostgresTests()

pg.describe('employeesRepository list', () => {
  let env: AppEnv
  let sql: ReturnType<typeof postgres>

  beforeAll(async () => {
    if (!pg.env) {
      throw new Error('Postgres test env missing')
    }
    env = pg.env
    sql = postgres({
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      database: env.POSTGRES_DB,
      max: 5,
    })
    await prepareDatabase(sql, env)
  })

  beforeEach(async () => {
    await sql`TRUNCATE employees`

    await createEmployee(
      {
        fullName: 'Anna Adams',
        email: 'anna@example.com',
        department: 'Engineering',
        jobTitle: 'Engineer',
        employmentStatus: 'active',
        managerName: 'Bob',
        startDate: '2020-01-01',
      },
      { sql },
    )
    await createEmployee(
      {
        fullName: 'Brian Baker',
        email: 'brian@example.com',
        department: 'Sales',
        jobTitle: 'Rep',
        employmentStatus: 'active',
        managerName: 'Carol',
        startDate: '2021-01-01',
      },
      { sql },
    )
    await createEmployee(
      {
        fullName: 'Alice Chen',
        email: 'alice@example.com',
        department: 'Engineering',
        jobTitle: 'Lead',
        employmentStatus: 'active',
        managerName: 'Dan',
        startDate: '2019-06-01',
      },
      { sql },
    )
  })

  afterAll(async () => {
    await sql.end({ timeout: 5 })
    await closePool()
  })

  test('filters by case-insensitive name substring', async () => {
    const rows = await listEmployees({ name: 'ann' }, { sql })
    expect(rows.map((row) => row.fullName)).toEqual(['Anna Adams'])
  })

  test('filters by exact department', async () => {
    const rows = await listEmployees({ department: 'Engineering' }, { sql })
    expect(rows.map((row) => row.fullName)).toEqual(['Alice Chen', 'Anna Adams'])
  })

  test('applies AND semantics for name and department', async () => {
    const rows = await listEmployees(
      { name: 'a', department: 'Engineering' },
      { sql },
    )
    expect(rows.map((row) => row.fullName)).toEqual(['Alice Chen', 'Anna Adams'])
  })

  test('defaults to fullName ascending sort', async () => {
    const rows = await listEmployees({}, { sql })
    expect(rows.map((row) => row.fullName)).toEqual([
      'Alice Chen',
      'Anna Adams',
      'Brian Baker',
    ])
  })
})
