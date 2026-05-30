import { loadEnv } from '../src/env'
import { runMigrations } from '../src/db/migrate'
import { toPostgresConfig } from '../src/db/config'
import postgres from 'postgres'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

export const assertLocalResetAllowed = (env: ReturnType<typeof loadEnv>): void => {
  const host = env.POSTGRES_HOST.trim().toLowerCase()
  const override = process.env.ALLOW_DB_RESET === 'true'

  if (override) {
    return
  }

  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(
      `Refusing db:reset against non-local POSTGRES_HOST (${env.POSTGRES_HOST}). Set ALLOW_DB_RESET=true to override.`,
    )
  }
}

export const runReset = async (): Promise<void> => {
  const env = loadEnv()
  assertLocalResetAllowed(env)

  const sql = postgres({
    ...toPostgresConfig(env),
    max: 1,
    idle_timeout: 20,
    connect_timeout: 5,
  })

  try {
    await runMigrations(env, { sql })
    await sql`TRUNCATE employees`
  } finally {
    await sql.end({ timeout: 5 })
  }
}

const main = async (): Promise<void> => {
  await runReset()
  console.log('Truncated employees table.')
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('Reset failed:', error)
    process.exit(1)
  })
}
