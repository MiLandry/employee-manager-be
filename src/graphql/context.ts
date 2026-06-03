import type { Principal } from '../auth/types'
import type { DbProbeResult } from '../db/probe'
import type { EmployeesService } from '../employees/service'

export type GraphQLContext = {
  request: Request
  principal: Principal | null
  probeDb: () => Promise<DbProbeResult>
  employees?: EmployeesService
  onDatabaseUnavailable?: () => void
}
