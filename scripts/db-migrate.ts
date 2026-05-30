import { loadEnv } from '../src/env'
import { runMigrations } from '../src/db/migrate'

const main = async (): Promise<void> => {
  const env = loadEnv()
  const applied = await runMigrations(env)

  if (applied.length === 0) {
    console.log('No pending migrations.')
    return
  }

  console.log(`Applied migrations: ${applied.join(', ')}`)
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
}
