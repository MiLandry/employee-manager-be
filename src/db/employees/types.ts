export type EmploymentStatus = 'active' | 'inactive' | 'on_leave'

export type Employee = {
  id: string
  fullName: string
  email: string
  department: string
  jobTitle: string
  employmentStatus: EmploymentStatus
  managerName: string
  startDate: string
  phone?: string
  location?: string
  createdAt: string
  updatedAt: string
}

export type CreateEmployeeInput = {
  fullName: string
  email: string
  department: string
  jobTitle: string
  employmentStatus: EmploymentStatus
  managerName: string
  startDate: string
  phone?: string
  location?: string
}

export type UpdateEmployeeInput = CreateEmployeeInput

export type ListEmployeesFilters = {
  name?: string
  department?: string
}
