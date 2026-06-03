import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { enforceAuthorization } from './auth/guard'
import { resolveMockPrincipal } from './auth/mockPrincipal'
import type { Principal } from './auth/types'
import type { DbProbeResult } from './db/probe'
import type { EmployeesService } from './employees/service'
import { createGraphQLYoga } from './graphql/yoga'

export type AppDeps = {
  probeDb: () => Promise<DbProbeResult>
  resolvePrincipal?: (request: Request) => Principal | null
  employees?: EmployeesService
  /**
   * Called when the health query detects Postgres is unreachable (before returning GraphQL error).
   * Wired in production to exit the process; omit in tests or use a no-op.
   */
  onDatabaseUnavailable?: () => void
}

export const createApp = (deps: AppDeps): Hono => {
  const app = new Hono()
  const resolvePrincipal = deps.resolvePrincipal ?? resolveMockPrincipal
  const yoga = createGraphQLYoga(deps)

  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: [
        'Content-Type',
        'Accept',
        'x-mock-user-id',
        'x-mock-roles',
        'x-mock-tenant-id',
      ],
    }),
  )

  app.all('/graphql', async (c) => {
    const response = await yoga.fetch(c.req.raw)
    return response
  })

  app.get('/users', (c) => {
    const principal = resolvePrincipal(c.req.raw)
    const denied = enforceAuthorization(c, principal, 'read', 'users')
    if (denied) {
      return denied
    }

    return c.json({
      users: [
        { id: 'u-admin', role: 'admin' },
        { id: 'u-manager', role: 'manager' },
        { id: 'u-viewer', role: 'viewer' },
      ],
    })
  })

  app.post('/users', async (c) => {
    const principal = resolvePrincipal(c.req.raw)
    const denied = enforceAuthorization(c, principal, 'create', 'users')
    if (denied) {
      return denied
    }

    const body = (await c.req.json().catch(() => ({}))) as {
      userId?: string
      roles?: string[]
      tenantId?: string
    }

    return c.json(
      {
        id: body.userId ?? 'generated-user',
        roles: body.roles ?? ['viewer'],
        tenantId: body.tenantId,
      },
      201,
    )
  })

  app.onError((err, c) => {
    console.error(err)
    return c.json(
      {
        error: err.message || 'Internal Server Error',
      },
      500,
    )
  })

  return app
}
