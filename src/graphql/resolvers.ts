import { authorize } from '../auth/policy'
import { DuplicateEmailError, NotFoundError } from '../db/employees/errors'
import type { Employee } from '../db/employees/types'
import { employeeIdSchema, employeeWriteSchema } from '../employees/schema'
import type { GraphQLContext } from './context'
import { graphqlAppError, graphqlAuthError } from './errors'

const requireEmployeesService = (ctx: GraphQLContext) => {
  if (!ctx.employees) {
    throw graphqlAppError('Employee service is not configured', 'NOT_IMPLEMENTED', 501)
  }
  return ctx.employees
}

const requireAuthorized = (
  ctx: GraphQLContext,
  action: 'read' | 'create' | 'update' | 'delete',
  resource: 'employees',
): void => {
  const decision = authorize(ctx.principal, action, resource)
  if (decision.allow) {
    return
  }

  throw graphqlAuthError(
    decision.reason,
    decision.status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN',
  )
}

export const resolvers = {
  Employee: {
    __resolveReference: async (
      reference: { id: string },
      ctx: GraphQLContext,
    ): Promise<Employee | null> => {
      requireAuthorized(ctx, 'read', 'employees')
      const employees = requireEmployeesService(ctx)
      return employees.getEmployeeById(reference.id)
    },
  },

  Query: {
    health: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      const db = await ctx.probeDb()

      if (db.status !== 'up') {
        ctx.onDatabaseUnavailable?.()
        throw graphqlAppError(
          `Database unavailable: ${db.error}`,
          'DATABASE_UNAVAILABLE',
          503,
        )
      }

      return {
        status: 'ok' as const,
        timestamp: new Date().toISOString(),
        message: 'Service is healthy',
        db,
      }
    },

    employees: async (
      _parent: unknown,
      args: { name?: string | null; department?: string | null },
      ctx: GraphQLContext,
    ) => {
      requireAuthorized(ctx, 'read', 'employees')
      const employees = requireEmployeesService(ctx)
      return employees.listEmployees({
        name: args.name ?? undefined,
        department: args.department ?? undefined,
      })
    },
  },

  Mutation: {
    createEmployee: async (
      _parent: unknown,
      args: { input: unknown },
      ctx: GraphQLContext,
    ) => {
      requireAuthorized(ctx, 'create', 'employees')
      const parsed = employeeWriteSchema.safeParse(args.input)
      if (!parsed.success) {
        throw graphqlAppError(
          JSON.stringify(parsed.error.flatten().fieldErrors),
          'VALIDATION_ERROR',
          400,
        )
      }

      try {
        return await requireEmployeesService(ctx).createEmployee(parsed.data)
      } catch (error) {
        if (error instanceof DuplicateEmailError) {
          throw graphqlAppError(error.message, 'DUPLICATE_EMAIL', 409)
        }
        throw error
      }
    },

    updateEmployee: async (
      _parent: unknown,
      args: { id: string; input: unknown },
      ctx: GraphQLContext,
    ) => {
      requireAuthorized(ctx, 'update', 'employees')
      const idResult = employeeIdSchema.safeParse(args.id)
      if (!idResult.success) {
        throw graphqlAppError(
          JSON.stringify(idResult.error.flatten().fieldErrors),
          'VALIDATION_ERROR',
          400,
        )
      }

      const parsed = employeeWriteSchema.safeParse(args.input)
      if (!parsed.success) {
        throw graphqlAppError(
          JSON.stringify(parsed.error.flatten().fieldErrors),
          'VALIDATION_ERROR',
          400,
        )
      }

      try {
        return await requireEmployeesService(ctx).updateEmployee(
          idResult.data,
          parsed.data,
        )
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw graphqlAppError(error.message, 'NOT_FOUND', 404)
        }
        if (error instanceof DuplicateEmailError) {
          throw graphqlAppError(error.message, 'DUPLICATE_EMAIL', 409)
        }
        throw error
      }
    },

    deleteEmployee: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAuthorized(ctx, 'delete', 'employees')
      const idResult = employeeIdSchema.safeParse(args.id)
      if (!idResult.success) {
        throw graphqlAppError(
          JSON.stringify(idResult.error.flatten().fieldErrors),
          'VALIDATION_ERROR',
          400,
        )
      }

      try {
        await requireEmployeesService(ctx).deleteEmployee(idResult.data)
        return true
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw graphqlAppError(error.message, 'NOT_FOUND', 404)
        }
        throw error
      }
    },
  },
}
