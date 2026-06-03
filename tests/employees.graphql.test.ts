import { describe, expect, test } from 'bun:test'
import { createApp } from '../src/app'
import type { Employee } from '../src/db/employees/types'
import type { EmployeesService } from '../src/employees/service'
import { gqlRequest } from '../src/graphql/gqlRequest'

const sampleEmployee: Employee = {
  id: '11111111-1111-1111-1111-111111111111',
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  department: 'Engineering',
  jobTitle: 'Engineer',
  employmentStatus: 'active',
  managerName: 'Charles Babbage',
  startDate: '1843-01-01',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const adminHeaders = {
  'x-mock-user-id': 'u-admin',
  'x-mock-roles': 'admin',
}

const managerHeaders = {
  'x-mock-user-id': 'u-manager',
  'x-mock-roles': 'manager',
}

const viewerHeaders = {
  'x-mock-user-id': 'u-viewer',
  'x-mock-roles': 'viewer',
}

const EMPLOYEES_QUERY = /* GraphQL */ `
  query Employees($name: String, $department: String) {
    employees(name: $name, department: $department) {
      id
      fullName
      email
    }
  }
`

const CREATE_EMPLOYEE = /* GraphQL */ `
  mutation CreateEmployee($input: EmployeeInput!) {
    createEmployee(input: $input) {
      id
      email
    }
  }
`

const UPDATE_EMPLOYEE = /* GraphQL */ `
  mutation UpdateEmployee($id: ID!, $input: EmployeeInput!) {
    updateEmployee(id: $id, input: $input) {
      id
      jobTitle
    }
  }
`

const DELETE_EMPLOYEE = /* GraphQL */ `
  mutation DeleteEmployee($id: ID!) {
    deleteEmployee(id: $id)
  }
`

const employeeInput = {
  fullName: 'New Hire',
  email: 'new@example.com',
  department: 'Engineering',
  jobTitle: 'Engineer',
  employmentStatus: 'active',
  managerName: 'Lead',
  startDate: '2026-01-01',
}

const createMockEmployeesService = (
  overrides: Partial<EmployeesService> = {},
): EmployeesService => ({
  listEmployees: async () => [sampleEmployee],
  createEmployee: async (input) => ({
    ...sampleEmployee,
    ...input,
    id: '22222222-2222-2222-2222-222222222222',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  }),
  updateEmployee: async (id, input) => ({
    ...sampleEmployee,
    ...input,
    id,
    updatedAt: '2026-01-03T00:00:00.000Z',
  }),
  deleteEmployee: async () => undefined,
  ...overrides,
})

const createTestApp = (employees: EmployeesService) =>
  createApp({
    probeDb: async () => ({ status: 'up' }),
    employees,
  })

const gqlBody = async (res: Response) =>
  (await res.json()) as {
    data?: Record<string, unknown>
    errors?: Array<{ extensions?: { code?: string } }>
  }

describe('GraphQL employee operations', () => {
  test('employees query returns UNAUTHENTICATED without principal', async () => {
    const app = createTestApp(createMockEmployeesService())
    const res = await gqlRequest(app, EMPLOYEES_QUERY)
    const body = await gqlBody(res)
    expect(body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED')
  })

  test('employees query returns data for viewer', async () => {
    const app = createTestApp(createMockEmployeesService())
    const res = await gqlRequest(app, EMPLOYEES_QUERY, undefined, viewerHeaders)
    const body = await gqlBody(res)
    const employees = body.data?.employees as Employee[]
    expect(employees).toHaveLength(1)
  })

  test('createEmployee returns FORBIDDEN for manager', async () => {
    const app = createTestApp(createMockEmployeesService())
    const res = await gqlRequest(
      app,
      CREATE_EMPLOYEE,
      { input: employeeInput },
      managerHeaders,
    )
    const body = await gqlBody(res)
    expect(body.errors?.[0]?.extensions?.code).toBe('FORBIDDEN')
  })

  test('createEmployee succeeds for admin', async () => {
    const app = createTestApp(createMockEmployeesService())
    const res = await gqlRequest(
      app,
      CREATE_EMPLOYEE,
      { input: employeeInput },
      adminHeaders,
    )
    const body = await gqlBody(res)
    const created = body.data?.createEmployee as { email: string }
    expect(created.email).toBe('new@example.com')
  })

  test('updateEmployee succeeds for manager', async () => {
    const app = createTestApp(createMockEmployeesService())
    const res = await gqlRequest(
      app,
      UPDATE_EMPLOYEE,
      {
        id: sampleEmployee.id,
        input: {
          fullName: 'Ada Lovelace',
          email: 'ada@example.com',
          department: 'Engineering',
          jobTitle: 'Lead Engineer',
          employmentStatus: 'active',
          managerName: 'Charles Babbage',
          startDate: '1843-01-01',
        },
      },
      managerHeaders,
    )
    const body = await gqlBody(res)
    const updated = body.data?.updateEmployee as { jobTitle: string }
    expect(updated.jobTitle).toBe('Lead Engineer')
  })

  test('deleteEmployee returns FORBIDDEN for manager', async () => {
    const app = createTestApp(createMockEmployeesService())
    const res = await gqlRequest(
      app,
      DELETE_EMPLOYEE,
      { id: sampleEmployee.id },
      managerHeaders,
    )
    const body = await gqlBody(res)
    expect(body.errors?.[0]?.extensions?.code).toBe('FORBIDDEN')
  })

  test('deleteEmployee succeeds for admin', async () => {
    const app = createTestApp(createMockEmployeesService())
    const res = await gqlRequest(
      app,
      DELETE_EMPLOYEE,
      { id: sampleEmployee.id },
      adminHeaders,
    )
    const body = await gqlBody(res)
    expect(body.data?.deleteEmployee).toBe(true)
  })

  test('employees query passes filters to service', async () => {
    let capturedFilters: { name?: string; department?: string } | undefined
    const app = createTestApp(
      createMockEmployeesService({
        listEmployees: async (filters) => {
          capturedFilters = filters
          return []
        },
      }),
    )

    await gqlRequest(
      app,
      EMPLOYEES_QUERY,
      { name: 'ada', department: 'Engineering' },
      adminHeaders,
    )

    expect(capturedFilters).toEqual({
      name: 'ada',
      department: 'Engineering',
    })
  })
})
