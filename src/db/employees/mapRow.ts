import type { Employee, EmploymentStatus } from './types'

export type EmployeeRow = {
  id: string
  full_name: string
  email: string
  department: string
  job_title: string
  employment_status: EmploymentStatus
  manager_name: string
  start_date: Date | string
  phone: string | null
  location: string | null
  created_at: Date | string
  updated_at: Date | string
}

const toIsoDate = (value: Date | string): string => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  return value.slice(0, 10)
}

const toIsoDateTime = (value: Date | string): string => {
  if (value instanceof Date) {
    return value.toISOString()
  }
  return new Date(value).toISOString()
}

export const mapEmployeeRow = (row: EmployeeRow): Employee => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  department: row.department,
  jobTitle: row.job_title,
  employmentStatus: row.employment_status,
  managerName: row.manager_name,
  startDate: toIsoDate(row.start_date),
  phone: row.phone ?? undefined,
  location: row.location ?? undefined,
  createdAt: toIsoDateTime(row.created_at),
  updatedAt: toIsoDateTime(row.updated_at),
})
