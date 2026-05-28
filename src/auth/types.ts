export const ROLES = ['admin', 'manager', 'viewer'] as const

export type Role = (typeof ROLES)[number]

export type Principal = {
  userId: string
  roles: Role[]
  tenantId?: string
}

export type AuthAction = 'read' | 'create'
export type AuthResource = 'health' | 'users'

export type AuthDecision =
  | { allow: true }
  | { allow: false; status: 401 | 403; reason: string }
