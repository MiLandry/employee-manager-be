import { describe, expect, test } from 'bun:test'
import { authorize } from '../src/auth/policy'

describe('authorization policy', () => {
  test('allows users read for manager role', () => {
    const result = authorize(
      { userId: 'u-manager', roles: ['manager'] },
      'read',
      'users',
    )

    expect(result.allow).toBe(true)
  })

  test('denies users create for viewer role', () => {
    const result = authorize(
      { userId: 'u-viewer', roles: ['viewer'] },
      'create',
      'users',
    )

    expect(result.allow).toBe(false)
    if (!result.allow) {
      expect(result.status).toBe(403)
    }
  })

  test('denies by default when principal is missing', () => {
    const result = authorize(null, 'read', 'users')

    expect(result.allow).toBe(false)
    if (!result.allow) {
      expect(result.status).toBe(401)
    }
  })

  test('denies by default for unconfigured action/resource pair', () => {
    const result = authorize(
      { userId: 'u-admin', roles: ['admin'] },
      'create',
      'health',
    )

    expect(result.allow).toBe(false)
    if (!result.allow) {
      expect(result.status).toBe(403)
      expect(result.reason).toContain('default')
    }
  })
})
