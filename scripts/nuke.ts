import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { runClean } from './clean.ts'
import { nukeOnlyPaths, repoRoot } from './paths.ts'

if (import.meta.main) {
  const cleaned = runClean()
  for (const path of cleaned) {
    console.log(`Removed ${path}`)
  }

  for (const relativePath of nukeOnlyPaths) {
    const fullPath = join(repoRoot, relativePath)
    if (!existsSync(fullPath)) {
      continue
    }
    rmSync(fullPath, { recursive: true, force: true })
    console.log(`Removed ${relativePath}`)
  }

  console.log('Running bun install…')
  const install = Bun.spawn(['bun', 'install'], {
    cwd: repoRoot,
    stdio: ['inherit', 'inherit', 'inherit'],
  })
  const exitCode = await install.exited
  if (exitCode !== 0) {
    console.error(`bun install failed with exit code ${exitCode}`)
    process.exit(exitCode)
  }
  console.log('Nuke complete.')
}
