import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { repoRoot } from './paths.ts'

const DEFAULT_PORT = 3000

const resolvePort = (): number => {
  const fromEnv = process.env.PORT?.trim()
  if (fromEnv) {
    const parsed = Number(fromEnv)
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed
    }
  }

  const envPath = join(repoRoot, '.env')
  if (existsSync(envPath)) {
    const match = readFileSync(envPath, 'utf8').match(/^PORT=(\d+)\s*$/m)
    if (match) {
      return Number(match[1])
    }
  }

  return DEFAULT_PORT
}

const findListenerPids = async (port: number): Promise<number[]> => {
  const probe = Bun.spawn(['lsof', '-ti', `tcp:${port}`], {
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const exitCode = await probe.exited
  const stdout = (await new Response(probe.stdout).text()).trim()

  if (exitCode !== 0 && !stdout) {
    return []
  }

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((pid) => Number(pid))
    .filter((pid) => Number.isInteger(pid) && pid > 0)
}

const stopPort = async (): Promise<void> => {
  const port = resolvePort()
  const pids = await findListenerPids(port)

  if (pids.length === 0) {
    console.log(`No process listening on port ${port}.`)
    return
  }

  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM')
      console.log(`Sent SIGTERM to PID ${pid} (port ${port}).`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`Could not stop PID ${pid}: ${message}`)
    }
  }
}

if (import.meta.main) {
  await stopPort()
}
