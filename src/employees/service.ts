import type { AppEnv } from '../env'
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  listEmployees,
  updateEmployee,
} from '../db/employeesRepository'
import type {
  CreateEmployeeInput,
  Employee,
  ListEmployeesFilters,
  UpdateEmployeeInput,
} from '../db/employees/types'

export type EmployeesService = {
  listEmployees: (filters?: ListEmployeesFilters) => Promise<Employee[]>
  getEmployeeById: (id: string) => Promise<Employee | null>
  createEmployee: (input: CreateEmployeeInput) => Promise<Employee>
  updateEmployee: (id: string, input: UpdateEmployeeInput) => Promise<Employee>
  deleteEmployee: (id: string) => Promise<void>
}

export const createEmployeesService = (env: AppEnv): EmployeesService => ({
  listEmployees: (filters) => listEmployees(filters, { env }),
  getEmployeeById: (id) => getEmployeeById(id, { env }),
  createEmployee: (input) => createEmployee(input, { env }),
  updateEmployee: (id, input) => updateEmployee(id, input, { env }),
  deleteEmployee: (id) => deleteEmployee(id, { env }),
})
