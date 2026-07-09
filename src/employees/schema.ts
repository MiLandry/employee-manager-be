import { z } from 'zod'

export const employmentStatusSchema = z.enum(['active', 'inactive', 'on_leave'])
export const departmentSchema = z.enum(['Engineering', 'Sales', 'HR'])

export const employeeWriteSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().trim().email(),
  department: departmentSchema,
  jobTitle: z.string().trim().min(1),
  employmentStatus: employmentStatusSchema,
  managerName: z.string().trim().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().trim().optional(),
  location: z.string().trim().optional(),
})

export type EmployeeWriteInput = z.infer<typeof employeeWriteSchema>

export const employeeIdSchema = z.string().uuid()
