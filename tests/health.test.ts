import { describe, expect, test } from 'bun:test'
import { createApp } from '../src/app'
import { gqlRequest } from '../src/graphql/gqlRequest'

const HEALTH_QUERY = /* GraphQL */ `
  query Health {
    health {
      status
      timestamp
      message
      db {
        status
        error
      }
    }
  }
`

describe('GraphQL health query', () => {
  test('returns health when database probe succeeds', async () => {
    const app = createApp({
      probeDb: async () => ({ status: 'up' }),
    })

    const res = await gqlRequest(app, HEALTH_QUERY)
    expect(res.status).toBe(200)

    const body = (await res.json()) as {
      data?: {
        health: {
          status: string
          timestamp: string
          message?: string
          db: { status: string }
        }
      }
    }

    expect(body.data?.health.status).toBe('ok')
    expect(body.data?.health.timestamp.length).toBeGreaterThan(10)
    expect(body.data?.health.message).toBe('Service is healthy')
    expect(body.data?.health.db.status).toBe('up')
  })

  test('returns GraphQL error when database probe fails', async () => {
    const app = createApp({
      probeDb: async () => ({ status: 'down', error: 'boom' }),
    })

    const res = await gqlRequest(app, HEALTH_QUERY)
    expect(res.status).toBe(503)

    const body = (await res.json()) as {
      errors?: Array<{ extensions?: { code?: string }; message?: string }>
    }

    expect(body.errors?.[0]?.extensions?.code).toBe('DATABASE_UNAVAILABLE')
    expect(body.errors?.[0]?.message).toContain('boom')
  })
})
