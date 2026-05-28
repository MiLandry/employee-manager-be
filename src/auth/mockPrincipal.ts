import { ROLES, type Principal, type Role } from './types'

const MOCK_USER_ID_HEADER = 'x-mock-user-id'
const MOCK_ROLES_HEADER = 'x-mock-roles'
const MOCK_TENANT_HEADER = 'x-mock-tenant-id'

const isRole = (value: string): value is Role => {
  return (ROLES as readonly string[]).includes(value)
}

const parseRoles = (rolesRaw: string | null): Role[] => {
  if (!rolesRaw) {
    return []
  }

  return rolesRaw
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is Role => isRole(value))
}

export const resolveMockPrincipal = (request: Request): Principal | null => {
  const userId = request.headers.get(MOCK_USER_ID_HEADER)
  const roles = parseRoles(request.headers.get(MOCK_ROLES_HEADER))
  const tenantId = request.headers.get(MOCK_TENANT_HEADER) ?? undefined

  if (!userId || roles.length === 0) {
    return null
  }

  return {
    userId,
    roles,
    tenantId,
  }
}
