import type { Hono } from 'hono'
import { ZodError } from 'zod'
import { enforceAuthorization } from '../auth/guard'
import type { Principal } from '../auth/types'
import { DuplicateEmailError, NotFoundError } from '../db/employees/errors'
import { employeeIdSchema, employeeWriteSchema } from './schema'
import type { EmployeesService } from './service'

type EmployeeRouteDeps = {
  resolvePrincipal: (request: Request) => Principal | null
  employees: EmployeesService
}

const validationError = (c: Parameters<typeof enforceAuthorization>[0], error: ZodError) =>
  c.json(
    {
      error: error.flatten().fieldErrors,
      code: 'VALIDATION_ERROR',
    },
    400,
  )

export const registerEmployeeRoutes = (
  app: Hono,
  deps: EmployeeRouteDeps,
): void => {
  app.get('/employees/list', async (c) => {
    const principal = deps.resolvePrincipal(c.req.raw)
    const denied = enforceAuthorization(c, principal, 'read', 'employees')
    if (denied) {
      return denied
    }

    const name = c.req.query('name') ?? undefined
    const department = c.req.query('department') ?? undefined

    const employees = await deps.employees.listEmployees({ name, department })
    return c.json({ employees })
  })

  app.post('/employees/list', async (c) => {
    const principal = deps.resolvePrincipal(c.req.raw)
    const denied = enforceAuthorization(c, principal, 'create', 'employees')
    if (denied) {
      return denied
    }

    const body: unknown = await c.req.json().catch(() => null)
    const parsed = employeeWriteSchema.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    try {
      const employee = await deps.employees.createEmployee(parsed.data)
      return c.json(employee, 201)
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        return c.json({ error: error.message, code: 'DUPLICATE_EMAIL' }, 409)
      }
      throw error
    }
  })

  app.put('/employees/:id/edit', async (c) => {
    const principal = deps.resolvePrincipal(c.req.raw)
    const denied = enforceAuthorization(c, principal, 'update', 'employees')
    if (denied) {
      return denied
    }

    const idResult = employeeIdSchema.safeParse(c.req.param('id'))
    if (!idResult.success) {
      return validationError(c, idResult.error)
    }

    const body: unknown = await c.req.json().catch(() => null)
    const parsed = employeeWriteSchema.safeParse(body)
    if (!parsed.success) {
      return validationError(c, parsed.error)
    }

    try {
      const employee = await deps.employees.updateEmployee(idResult.data, parsed.data)
      return c.json(employee)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.message, code: 'NOT_FOUND' }, 404)
      }
      if (error instanceof DuplicateEmailError) {
        return c.json({ error: error.message, code: 'DUPLICATE_EMAIL' }, 409)
      }
      throw error
    }
  })

  app.delete('/employees/:id', async (c) => {
    const principal = deps.resolvePrincipal(c.req.raw)
    const denied = enforceAuthorization(c, principal, 'delete', 'employees')
    if (denied) {
      return denied
    }

    const idResult = employeeIdSchema.safeParse(c.req.param('id'))
    if (!idResult.success) {
      return validationError(c, idResult.error)
    }

    try {
      await deps.employees.deleteEmployee(idResult.data)
      return c.body(null, 204)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.message, code: 'NOT_FOUND' }, 404)
      }
      throw error
    }
  })
}
