import { describe, expect, test } from 'bun:test'
import { createApp } from '../src/app'

describe('authorization route enforcement', () => {
  test('returns 401 when principal is missing', async () => {
    const app = createApp({
      probeDb: async () => ({ status: 'up' }),
    })

    const res = await app.request('http://localhost/users')
    expect(res.status).toBe(401)

    const body = (await res.json()) as { code?: string }
    expect(body.code).toBe('UNAUTHENTICATED')
  })

  test('returns 403 when role does not allow action', async () => {
    const app = createApp({
      probeDb: async () => ({ status: 'up' }),
    })

    const res = await app.request('http://localhost/users', {
      headers: {
        'x-mock-user-id': 'u-viewer',
        'x-mock-roles': 'viewer',
      },
    })
    expect(res.status).toBe(403)

    const body = (await res.json()) as { code?: string }
    expect(body.code).toBe('FORBIDDEN')
  })

  test('returns 200 for manager reading users', async () => {
    const app = createApp({
      probeDb: async () => ({ status: 'up' }),
    })

    const res = await app.request('http://localhost/users', {
      headers: {
        'x-mock-user-id': 'u-manager',
        'x-mock-roles': 'manager',
      },
    })
    expect(res.status).toBe(200)
  })

  test('returns 201 for admin creating user', async () => {
    const app = createApp({
      probeDb: async () => ({ status: 'up' }),
    })

    const res = await app.request('http://localhost/users', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mock-user-id': 'u-admin',
        'x-mock-roles': 'admin',
      },
      body: JSON.stringify({
        userId: 'u-new',
        roles: ['viewer'],
      }),
    })

    expect(res.status).toBe(201)
  })
})
