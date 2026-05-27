import { join } from 'node:path'

/** Repo root (employee-manager-be). */
export const repoRoot = join(import.meta.dir, '..')

/**
 * Build outputs and tool caches only — safe for `clean`.
 * Does not touch source, lockfile, .env, or tests/.
 */
export const cleanPaths = [
  'dist',
  'build',
  join('node_modules', '.cache'),
] as const

/** Removed only by `nuke` (after clean). */
export const nukeOnlyPaths = ['node_modules'] as const
