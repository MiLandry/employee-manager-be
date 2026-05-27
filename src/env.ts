import { z } from 'zod'

/**
 * Runtime environment for the BFF. PostgreSQL settings are required: the process
 * exits before listening if a connection cannot be established (see `src/index.ts`).
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  POSTGRES_HOST: z.string().trim().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive(),
  POSTGRES_USER: z.string().trim().min(1),
  /** Local dev may use an empty password; still required as a key in `.env`. */
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string().trim().min(1),
})

export type AppEnv = z.infer<typeof envSchema>

/**
 * Reads process environment (Bun loads `.env` from cwd automatically).
 */
export const loadEnv = (source: NodeJS.ProcessEnv = process.env): AppEnv => {
  return envSchema.parse({
    PORT: source.PORT,
    POSTGRES_HOST: source.POSTGRES_HOST,
    POSTGRES_PORT: source.POSTGRES_PORT,
    POSTGRES_USER: source.POSTGRES_USER,
    POSTGRES_PASSWORD: source.POSTGRES_PASSWORD ?? '',
    POSTGRES_DB: source.POSTGRES_DB,
  })
}
