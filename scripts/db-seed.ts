import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import postgres from 'postgres'
import { loadEnv } from '../src/env'
import { runMigrations } from '../src/db/migrate'
import { toPostgresConfig } from '../src/db/config'

const seedPath = join(import.meta.dir, '../src/db/seeds/dev-employees.sql')

export const runSeed = async (): Promise<void> => {
  const env = loadEnv()
  const sql = postgres({
    ...toPostgresConfig(env),
    max: 1,
    idle_timeout: 20,
    connect_timeout: 5,
  })

  try {
    await runMigrations(env, { sql })
    const seedSql = await readFile(seedPath, 'utf8')
    await sql.unsafe(seedSql)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

const main = async (): Promise<void> => {
  await runSeed()
  console.log('Dev seed applied (idempotent).')
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
}
