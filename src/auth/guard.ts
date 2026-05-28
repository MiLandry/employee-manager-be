import type { Context } from 'hono'
import { authorize } from './policy'
import type { AuthAction, AuthResource, Principal } from './types'

export const enforceAuthorization = (
  c: Context,
  principal: Principal | null,
  action: AuthAction,
  resource: AuthResource,
): Response | null => {
  const decision = authorize(principal, action, resource)
  if (decision.allow) {
    return null
  }

  return c.json(
    {
      error: decision.reason,
      code: decision.status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN',
    },
    decision.status,
  )
}
