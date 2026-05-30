import { describe } from 'bun:test'
import { ZodError } from 'zod'
import { loadEnv, type AppEnv } from '../../src/env'
import { createPostgresProbe } from '../../src/db/probe'

export const tryLoadEnv = (): AppEnv | null => {
  try {
    return loadEnv()
  } catch (error) {
    if (error instanceof ZodError) {
      return null
    }
    throw error
  }
}

export const isPostgresAvailable = async (): Promise<boolean> => {
  const env = tryLoadEnv()
  if (!env) {
    return false
  }

  try {
    const probe = createPostgresProbe(env)
    const result = await probe()
    return result.status === 'up'
  } catch {
    return false
  }
}

export type PostgresTestContext = {
  describe: typeof describe
  env: AppEnv | null
}

/**
 * Returns `describe.skip` when Postgres env is missing or unreachable (e.g. CI).
 * Callers MUST NOT invoke `loadEnv()` in the describe callback body — use `env`
 * from this result inside hooks/tests only.
 */
export const initPostgresTests = async (): Promise<PostgresTestContext> => {
  const env = tryLoadEnv()
  if (!env) {
    return { describe: describe.skip, env: null }
  }

  const available = await isPostgresAvailable()
  if (!available) {
    return { describe: describe.skip, env: null }
  }

  return { describe, env }
}

/** @deprecated Use initPostgresTests() */
export const describeIfPostgres = async (): Promise<typeof describe> => {
  const ctx = await initPostgresTests()
  return ctx.describe
}

export const mockAppEnv = (overrides: Partial<AppEnv> = {}): AppEnv => ({
  PORT: 3000,
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: 5432,
  POSTGRES_USER: 'postgres',
  POSTGRES_PASSWORD: '',
  POSTGRES_DB: 'employee_management',
  ...overrides,
})
