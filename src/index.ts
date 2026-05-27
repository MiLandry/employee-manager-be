import { ZodError } from 'zod'
import { createApp } from './app'
import { createPostgresProbe } from './db/probe'
import { loadEnv } from './env'

const readEnv = () => {
  try {
    return loadEnv()
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Invalid environment:', error.flatten().fieldErrors)
    } else {
      console.error('Invalid environment:', error)
    }
    process.exit(1)
  }
}

const env = readEnv()
const probeDb = createPostgresProbe(env)

const bootstrap = async (): Promise<void> => {
  const initial = await probeDb()
  if (initial.status !== 'up') {
    console.error('PostgreSQL connection failed — exiting.', initial.error)
    process.exit(1)
  }

  const app = createApp({
    probeDb,
    onDatabaseUnavailable: () => {
      queueMicrotask(() => {
        console.error(
          'PostgreSQL became unreachable during a health check — exiting.',
        )
        process.exit(1)
      })
    },
  })

  Bun.serve({
    port: env.PORT,
    fetch: app.fetch,
  })

  console.log(
    `BFF listening on http://localhost:${env.PORT} (PostgreSQL OK at startup)`,
  )
}

void bootstrap()
