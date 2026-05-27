import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { DbProbeResult } from './db/probe'

export type AppDeps = {
  probeDb: () => Promise<DbProbeResult>
  /**
   * Called when `GET /health` detects Postgres is unreachable (before returning 503).
   * Wired in production to exit the process; omit in tests or use a no-op.
   */
  onDatabaseUnavailable?: () => void
}

export const createApp = (deps: AppDeps): Hono => {
  const app = new Hono()

  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Accept'],
    }),
  )

  app.get('/health', async (c) => {
    const db = await deps.probeDb()

    if (db.status !== 'up') {
      deps.onDatabaseUnavailable?.()
      return c.json(
        {
          error: `Database unavailable: ${db.error}`,
          code: 'DATABASE_UNAVAILABLE',
        },
        503,
      )
    }

    return c.json({
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      message: 'Service is healthy',
      db,
    })
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
