import { describe } from 'bun:test'
import { loadEnv } from '../../src/env'
import { createPostgresProbe } from '../../src/db/probe'

export const isPostgresAvailable = async (): Promise<boolean> => {
  try {
    const env = loadEnv()
    const probe = createPostgresProbe(env)
    const result = await probe()
    return result.status === 'up'
  } catch {
    return false
  }
}

export const describeIfPostgres = async (): Promise<typeof describe> => {
  return (await isPostgresAvailable()) ? describe : describe.skip
}
