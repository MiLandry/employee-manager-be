import { describe, expect, test } from 'bun:test'
import { createApp } from '../src/app'

describe('GET /health', () => {
  test('returns 200 when database probe succeeds', async () => {
    const app = createApp({
      probeDb: async () => ({ status: 'up' }),
    })

    const res = await app.request('http://localhost/health')

    expect(res.status).toBe(200)

    const body = (await res.json()) as {
      status: string
      timestamp: string
      message?: string
      db: { status: string; error?: string }
    }

    expect(body.status).toBe('ok')
    expect(body.timestamp.length).toBeGreaterThan(10)
    expect(body.message).toBe('Service is healthy')
    expect(body.db.status).toBe('up')
  })

  test('returns 503 when database probe fails', async () => {
    const app = createApp({
      probeDb: async () => ({ status: 'down', error: 'boom' }),
    })

    const res = await app.request('http://localhost/health')

    expect(res.status).toBe(503)

    const body = (await res.json()) as { error?: string; code?: string }

    expect(body.code).toBe('DATABASE_UNAVAILABLE')
    expect(body.error).toContain('boom')
  })
})
