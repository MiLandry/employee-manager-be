import { describe, expect, test } from 'bun:test'
import { createApp } from '../src/app'
import type { Employee } from '../src/db/employees/types'
import type { EmployeesService } from '../src/employees/service'

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

describe('employee routes', () => {
  test('GET /employees/list returns 401 without principal', async () => {
    const app = createTestApp(createMockEmployeesService())
    const res = await app.request('http://localhost/employees/list')
    expect(res.status).toBe(401)
  })

  test('GET /employees/list returns employees for viewer', async () => {
    const app = createTestApp(createMockEmployeesService())
    const res = await app.request('http://localhost/employees/list', {
      headers: viewerHeaders,
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { employees: Employee[] }
    expect(body.employees).toHaveLength(1)
  })

  test('POST /employees/list returns 403 for manager', async () => {
    const app = createTestApp(createMockEmployeesService())
    const res = await app.request('http://localhost/employees/list', {
      method: 'POST',
      headers: {
        ...managerHeaders,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'New Hire',
        email: 'new@example.com',
        department: 'Engineering',
        jobTitle: 'Engineer',
        employmentStatus: 'active',
        managerName: 'Lead',
        startDate: '2026-01-01',
      }),
    })
    expect(res.status).toBe(403)
  })

  test('POST /employees/list creates employee for admin', async () => {
    const app = createTestApp(createMockEmployeesService())
    const res = await app.request('http://localhost/employees/list', {
      method: 'POST',
      headers: {
        ...adminHeaders,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'New Hire',
        email: 'new@example.com',
        department: 'Engineering',
        jobTitle: 'Engineer',
        employmentStatus: 'active',
        managerName: 'Lead',
        startDate: '2026-01-01',
      }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as Employee
    expect(body.email).toBe('new@example.com')
  })

  test('PUT /employees/:id/edit updates for manager', async () => {
    const app = createTestApp(createMockEmployeesService())
    const res = await app.request(
      `http://localhost/employees/${sampleEmployee.id}/edit`,
      {
        method: 'PUT',
        headers: {
          ...managerHeaders,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          fullName: 'Ada Lovelace',
          email: 'ada@example.com',
          department: 'Engineering',
          jobTitle: 'Lead Engineer',
          employmentStatus: 'active',
          managerName: 'Charles Babbage',
          startDate: '1843-01-01',
        }),
      },
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as Employee
    expect(body.jobTitle).toBe('Lead Engineer')
  })

  test('DELETE /employees/:id returns 403 for manager', async () => {
    const app = createTestApp(createMockEmployeesService())
    const res = await app.request(
      `http://localhost/employees/${sampleEmployee.id}`,
      {
        method: 'DELETE',
        headers: managerHeaders,
      },
    )
    expect(res.status).toBe(403)
  })

  test('DELETE /employees/:id returns 204 for admin', async () => {
    const app = createTestApp(createMockEmployeesService())
    const res = await app.request(
      `http://localhost/employees/${sampleEmployee.id}`,
      {
        method: 'DELETE',
        headers: adminHeaders,
      },
    )
    expect(res.status).toBe(204)
  })

  test('GET /employees/list passes filters to service', async () => {
    let capturedFilters: { name?: string; department?: string } | undefined
    const app = createTestApp(
      createMockEmployeesService({
        listEmployees: async (filters) => {
          capturedFilters = filters
          return []
        },
      }),
    )

    await app.request(
      'http://localhost/employees/list?name=ada&department=Engineering',
      { headers: adminHeaders },
    )

    expect(capturedFilters).toEqual({
      name: 'ada',
      department: 'Engineering',
    })
  })
})
