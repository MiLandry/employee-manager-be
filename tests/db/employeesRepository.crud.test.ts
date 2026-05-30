import { afterAll, beforeAll, beforeEach, expect, test } from 'bun:test'
import postgres from 'postgres'
import { closePool } from '../../src/db/connection'
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  updateEmployee,
} from '../../src/db/employeesRepository'
import { DuplicateEmailError, NotFoundError } from '../../src/db/employees/errors'
import { loadEnv } from '../../src/env'
import { describeIfPostgres } from './helpers'
import { prepareDatabase } from './setup'

const sampleInput = {
  fullName: 'Ada Lovelace',
  email: 'ada.lovelace@example.com',
  department: 'Engineering',
  jobTitle: 'Engineer',
  employmentStatus: 'active' as const,
  managerName: 'Charles Babbage',
  startDate: '1843-01-01',
  phone: '555-0100',
  location: 'London',
}

const pgDescribe = await describeIfPostgres()

pgDescribe('employeesRepository CRUD', () => {
  const env = loadEnv()
  let sql: ReturnType<typeof postgres>

  beforeAll(async () => {
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
  })

  afterAll(async () => {
    await sql.end({ timeout: 5 })
    await closePool()
  })

  test('createEmployee persists camelCase-mapped fields', async () => {
    const created = await createEmployee(sampleInput, { sql })

    expect(created.fullName).toBe(sampleInput.fullName)
    expect(created.email).toBe(sampleInput.email)
    expect(created.id.length).toBeGreaterThan(0)
    expect(created.createdAt.length).toBeGreaterThan(10)
    expect(created.updatedAt.length).toBeGreaterThan(10)
  })

  test('getEmployeeById returns persisted employee', async () => {
    const created = await createEmployee(sampleInput, { sql })
    const found = await getEmployeeById(created.id, { sql })

    expect(found?.email).toBe(sampleInput.email)
  })

  test('updateEmployee refreshes updatedAt', async () => {
    const created = await createEmployee(sampleInput, { sql })
    await new Promise((resolve) => setTimeout(resolve, 5))

    const updated = await updateEmployee(
      created.id,
      { ...sampleInput, jobTitle: 'Lead Engineer' },
      { sql },
    )

    expect(updated.jobTitle).toBe('Lead Engineer')
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.updatedAt).getTime(),
    )
  })

  test('deleteEmployee removes row', async () => {
    const created = await createEmployee(sampleInput, { sql })
    await deleteEmployee(created.id, { sql })

    const found = await getEmployeeById(created.id, { sql })
    expect(found).toBeNull()
  })

  test('createEmployee throws DuplicateEmailError for duplicate email', async () => {
    await createEmployee(sampleInput, { sql })

    await expect(createEmployee(sampleInput, { sql })).rejects.toBeInstanceOf(
      DuplicateEmailError,
    )
  })

  test('updateEmployee throws NotFoundError for missing id', async () => {
    await expect(
      updateEmployee(
        '00000000-0000-0000-0000-000000000099',
        sampleInput,
        { sql },
      ),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  test('deleteEmployee throws NotFoundError for missing id', async () => {
    await expect(
      deleteEmployee('00000000-0000-0000-0000-000000000099', { sql }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
