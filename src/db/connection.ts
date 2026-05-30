import postgres from 'postgres'
import type { Sql } from 'postgres'
import type { AppEnv } from '../env'
import { toPostgresConfig } from './config'

const DEFAULT_POOL_OPTIONS = {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 5,
} as const

export const createPool = (env: AppEnv): Sql => {
  const cfg = toPostgresConfig(env)
  return postgres({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    ...DEFAULT_POOL_OPTIONS,
  })
}

let sharedPool: Sql | undefined

export const getPool = (env: AppEnv): Sql => {
  if (!sharedPool) {
    sharedPool = createPool(env)
  }
  return sharedPool
}

export const closePool = async (): Promise<void> => {
  if (sharedPool) {
    await sharedPool.end({ timeout: 5 })
    sharedPool = undefined
  }
}
