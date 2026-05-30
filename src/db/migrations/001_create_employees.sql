CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  job_title TEXT NOT NULL,
  employment_status TEXT NOT NULL CHECK (employment_status IN ('active', 'inactive', 'on_leave')),
  manager_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employees_full_name ON employees (LOWER(full_name));
CREATE INDEX idx_employees_department ON employees (department);
