import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { cleanPaths, repoRoot } from './paths.ts'

export function runClean(): string[] {
  const removed: string[] = []

  for (const relativePath of cleanPaths) {
    const fullPath = join(repoRoot, relativePath)
    if (!existsSync(fullPath)) {
      continue
    }
    rmSync(fullPath, { recursive: true, force: true })
    removed.push(relativePath)
  }

  return removed
}

if (import.meta.main) {
  const removed = runClean()
  if (removed.length === 0) {
    console.log('Nothing to clean.')
  } else {
    for (const path of removed) {
      console.log(`Removed ${path}`)
    }
  }
}
