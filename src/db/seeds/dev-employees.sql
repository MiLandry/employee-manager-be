INSERT INTO employees (
  id,
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
    '11111111-1111-1111-1111-111111111111',
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
    '22222222-2222-2222-2222-222222222222',
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
    '33333333-3333-3333-3333-333333333333',
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
