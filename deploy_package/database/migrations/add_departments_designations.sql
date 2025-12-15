-- Add required departments and designations
-- Run this BEFORE syncing users

-- Insert departments if they don't exist
INSERT IGNORE INTO departments (id, department_name, description, status) VALUES
(1, 'Teaching', 'Academic teaching staff', 'active'),
(2, 'Administration', 'Administrative staff', 'active'),
(3, 'Finance', 'Finance and accounts', 'active'),
(4, 'IT', 'Information Technology', 'active'),
(5, 'Support', 'Support staff', 'active');

-- Insert designations if they don't exist
INSERT IGNORE INTO designations (id, designation_name, description, status) VALUES
(1, 'Principal', 'School Principal', 'active'),
(2, 'Vice Principal', 'Vice Principal', 'active'),
(3, 'Senior Teacher', 'Senior teaching staff', 'active'),
(4, 'Teacher', 'Teaching staff', 'active'),
(5, 'Accountant', 'Finance staff', 'active'),
(6, 'Administrator', 'Administrative staff', 'active'),
(7, 'IT Officer', 'IT support', 'active'),
(8, 'Librarian', 'Library staff', 'active');

-- Insert employee categories if they don't exist
INSERT IGNORE INTO employee_categories (id, category_name, description) VALUES
(1, 'Permanent', 'Permanent staff'),
(2, 'Contract', 'Contract staff'),
(3, 'Part-time', 'Part-time staff');

-- Verify
SELECT 'Departments added' as Status, COUNT(*) as Count FROM departments
UNION ALL
SELECT 'Designations added', COUNT(*) FROM designations
UNION ALL
SELECT 'Categories added', COUNT(*) FROM employee_categories;
