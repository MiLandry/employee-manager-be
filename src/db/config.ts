import type { AppEnv } from '../env'

export type PostgresConfig = {
  host: string
  port: number
  user: string
  password: string
  database: string
}

export const toPostgresConfig = (env: AppEnv): PostgresConfig => ({
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
})
