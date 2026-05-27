import postgres from 'postgres'
import type { AppEnv } from '../env'

export type DbProbeResult = { status: 'up' } | { status: 'down'; error: string }

const toConfig = (env: AppEnv) => ({
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
})

/**
 * Runs `SELECT 1` with a short timeout. Used at startup (must succeed) and on `GET /health`.
 */
export const createPostgresProbe =
  (env: AppEnv) =>
  async (): Promise<DbProbeResult> => {
    const cfg = toConfig(env)

    let sql: ReturnType<typeof postgres> | undefined
    try {
      sql = postgres({
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        password: cfg.password,
        database: cfg.database,
        max: 1,
        idle_timeout: 20,
        connect_timeout: 2,
      })

      await Promise.race([
        sql`SELECT 1 as ok`,
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('PostgreSQL probe timeout')), 2500)
        }),
      ])

      return { status: 'up' }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown database probe error'
      return { status: 'down', error: message }
    } finally {
      if (sql) {
        await sql.end({ timeout: 2 }).catch(() => undefined)
      }
    }
  }
