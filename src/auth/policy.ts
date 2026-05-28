import type { AuthAction, AuthDecision, AuthResource, Principal, Role } from './types'

const PERMISSIONS: Record<AuthResource, Record<AuthAction, Role[]>> = {
  health: {
    read: ['admin', 'manager', 'viewer'],
    create: [],
  },
  users: {
    read: ['admin', 'manager'],
    create: ['admin'],
  },
}

export const authorize = (
  principal: Principal | null,
  action: AuthAction,
  resource: AuthResource,
): AuthDecision => {
  if (!principal) {
    return { allow: false, status: 401, reason: 'Missing authentication principal' }
  }

  const actionRules = PERMISSIONS[resource]?.[action]
  if (!actionRules || actionRules.length === 0) {
    return { allow: false, status: 403, reason: 'Access denied by default policy' }
  }

  const hasRole = principal.roles.some((role) => actionRules.includes(role))
  if (!hasRole) {
    return { allow: false, status: 403, reason: 'Principal role does not permit this action' }
  }

  return { allow: true }
}
