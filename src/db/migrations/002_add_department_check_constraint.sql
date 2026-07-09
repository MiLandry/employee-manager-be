ALTER TABLE employees ADD CONSTRAINT employees_department_check CHECK (department IN ('Engineering', 'Sales', 'HR'));
