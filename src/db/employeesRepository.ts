import postgres from 'postgres'
import type { Sql } from 'postgres'
import type { AppEnv } from '../env'
import { getPool } from './connection'
import { DuplicateEmailError, NotFoundError } from './employees/errors'
import { mapEmployeeRow, type EmployeeRow } from './employees/mapRow'
import type {
  CreateEmployeeInput,
  Employee,
  ListEmployeesFilters,
  UpdateEmployeeInput,
} from './employees/types'

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof postgres.PostgresError && error.code === '23505'

const employeeSelectColumns = `
  id,
  full_name,
  email,
  department,
  job_title,
  employment_status,
  manager_name,
  start_date,
  phone,
  location,
  created_at,
  updated_at
`

export type EmployeesRepositoryDeps = {
  sql?: Sql
  env?: AppEnv
}

const resolveSql = (deps: EmployeesRepositoryDeps): Sql => {
  if (deps.sql) {
    return deps.sql
  }
  if (!deps.env) {
    throw new Error('Employees repository requires sql or env')
  }
  return getPool(deps.env)
}

export const createEmployee = async (
  input: CreateEmployeeInput,
  deps: EmployeesRepositoryDeps = {},
): Promise<Employee> => {
  const sql = resolveSql(deps)

  try {
    const rows = await sql<EmployeeRow[]>`
      INSERT INTO employees (
        full_name,
        email,
        department,
        job_title,
        employment_status,
        manager_name,
        start_date,
        phone,
        location
      )
      VALUES (
        ${input.fullName},
        ${input.email},
        ${input.department},
        ${input.jobTitle},
        ${input.employmentStatus},
        ${input.managerName},
        ${input.startDate},
        ${input.phone ?? null},
        ${input.location ?? null}
      )
      RETURNING ${sql.unsafe(employeeSelectColumns)}
    `

    return mapEmployeeRow(rows[0]!)
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DuplicateEmailError(input.email)
    }
    throw error
  }
}

export const getEmployeeById = async (
  id: string,
  deps: EmployeesRepositoryDeps = {},
): Promise<Employee | null> => {
  const sql = resolveSql(deps)

  const rows = await sql<EmployeeRow[]>`
    SELECT ${sql.unsafe(employeeSelectColumns)}
    FROM employees
    WHERE id = ${id}
  `

  const row = rows[0]
  return row ? mapEmployeeRow(row) : null
}

export const updateEmployee = async (
  id: string,
  input: UpdateEmployeeInput,
  deps: EmployeesRepositoryDeps = {},
): Promise<Employee> => {
  const sql = resolveSql(deps)

  try {
    const rows = await sql<EmployeeRow[]>`
      UPDATE employees
      SET
        full_name = ${input.fullName},
        email = ${input.email},
        department = ${input.department},
        job_title = ${input.jobTitle},
        employment_status = ${input.employmentStatus},
        manager_name = ${input.managerName},
        start_date = ${input.startDate},
        phone = ${input.phone ?? null},
        location = ${input.location ?? null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING ${sql.unsafe(employeeSelectColumns)}
    `

    const row = rows[0]
    if (!row) {
      throw new NotFoundError(id)
    }

    return mapEmployeeRow(row)
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error
    }
    if (isUniqueViolation(error)) {
      throw new DuplicateEmailError(input.email)
    }
    throw error
  }
}

export const deleteEmployee = async (
  id: string,
  deps: EmployeesRepositoryDeps = {},
): Promise<void> => {
  const sql = resolveSql(deps)

  const rows = await sql<{ id: string }[]>`
    DELETE FROM employees
    WHERE id = ${id}
    RETURNING id
  `

  if (rows.length === 0) {
    throw new NotFoundError(id)
  }
}

export const listEmployees = async (
  filters: ListEmployeesFilters = {},
  deps: EmployeesRepositoryDeps = {},
): Promise<Employee[]> => {
  const sql = resolveSql(deps)
  const namePattern = filters.name?.trim()
    ? `%${filters.name.trim()}%`
    : undefined
  const department = filters.department?.trim() || undefined

  const rows = await sql<EmployeeRow[]>`
    SELECT ${sql.unsafe(employeeSelectColumns)}
    FROM employees
    WHERE
      (${namePattern ?? null}::text IS NULL OR LOWER(full_name) LIKE LOWER(${namePattern ?? ''}))
      AND (${department ?? null}::text IS NULL OR department = ${department ?? ''})
    ORDER BY full_name ASC
  `

  return rows.map(mapEmployeeRow)
}
