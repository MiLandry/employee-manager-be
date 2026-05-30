INSERT INTO employees (
  full_name,
  email,
  department,
  job_title,
  employment_status,
  manager_name,
  start_date,
  phone,
  location
)
VALUES
  (
    'Anna Adams',
    'seed.anna@example.com',
    'Engineering',
    'Software Engineer',
    'active',
    'Bob Manager',
    '2020-01-15',
    '555-1001',
    'Remote'
  ),
  (
    'Brian Baker',
    'seed.brian@example.com',
    'Sales',
    'Account Executive',
    'active',
    'Carol Lead',
    '2021-03-01',
    NULL,
    'New York'
  ),
  (
    'Alice Chen',
    'seed.alice@example.com',
    'HR',
    'People Partner',
    'active',
    'Dan Director',
    '2019-06-01',
    '555-1003',
    'San Francisco'
  )
ON CONFLICT (email) DO NOTHING;
