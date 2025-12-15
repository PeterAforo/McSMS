-- ============================================
-- Sync Users to Employees & Add Test Data
-- ============================================

-- Step 1: Add employee_id to teachers table if not exists
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS employee_id INT NULL,
ADD CONSTRAINT fk_teacher_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Step 2: Ensure user_id in employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS user_id INT NULL,
ADD CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Step 3: Create departments if not exist
INSERT IGNORE INTO departments (id, department_name, description, status) VALUES
(1, 'Teaching', 'Academic teaching staff', 'active'),
(2, 'Administration', 'Administrative staff', 'active'),
(3, 'Finance', 'Finance and accounts', 'active'),
(4, 'IT', 'Information Technology', 'active'),
(5, 'Support', 'Support staff', 'active');

-- Step 4: Create designations if not exist
INSERT IGNORE INTO designations (id, designation_name, description, status) VALUES
(1, 'Principal', 'School Principal', 'active'),
(2, 'Vice Principal', 'Vice Principal', 'active'),
(3, 'Senior Teacher', 'Senior teaching staff', 'active'),
(4, 'Teacher', 'Teaching staff', 'active'),
(5, 'Accountant', 'Finance staff', 'active'),
(6, 'Administrator', 'Administrative staff', 'active'),
(7, 'IT Officer', 'IT support', 'active'),
(8, 'Librarian', 'Library staff', 'active');

-- Step 5: Create employee categories if not exist
INSERT IGNORE INTO employee_categories (id, category_name, description) VALUES
(1, 'Permanent', 'Permanent staff'),
(2, 'Contract', 'Contract staff'),
(3, 'Part-time', 'Part-time staff');

-- Step 6: Sync existing teachers to employees
INSERT INTO employees (
    user_id, employee_number, first_name, last_name, email, phone,
    department_id, designation_id, category_id, employment_type,
    join_date, basic_salary, status
)
SELECT 
    t.user_id,
    CONCAT('EMP', LPAD(t.id, 4, '0')) as employee_number,
    t.first_name,
    t.last_name,
    t.email,
    t.phone,
    1, -- Teaching department
    4, -- Teacher designation
    1, -- Permanent category
    'full_time',
    COALESCE(t.created_at, NOW()),
    3000.00, -- Default salary
    'active'
FROM teachers t
WHERE NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.user_id = t.user_id
)
AND t.user_id IS NOT NULL;

-- Step 7: Update teachers with employee_id
UPDATE teachers t
JOIN employees e ON t.user_id = e.user_id
SET t.employee_id = e.id
WHERE t.employee_id IS NULL;

-- Step 8: Sync admin users to employees
INSERT INTO employees (
    user_id, employee_number, first_name, last_name, email,
    department_id, designation_id, category_id, employment_type,
    join_date, basic_salary, status
)
SELECT 
    u.id,
    CONCAT('EMP', LPAD(u.id + 1000, 4, '0')) as employee_number,
    SUBSTRING_INDEX(u.name, ' ', 1) as first_name,
    SUBSTRING_INDEX(u.name, ' ', -1) as last_name,
    u.email,
    2, -- Administration department
    6, -- Administrator designation
    1, -- Permanent category
    'full_time',
    u.created_at,
    4000.00, -- Default salary
    u.status
FROM users u
WHERE u.user_type = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.user_id = u.id
);

-- ============================================
-- ADD TEST DATA
-- ============================================

-- Test Employees (Non-teaching staff)
INSERT INTO employees (
    employee_number, first_name, last_name, email, phone,
    department_id, designation_id, category_id, employment_type,
    join_date, basic_salary, status
) VALUES
('EMP2001', 'Sarah', 'Johnson', 'sarah.johnson@school.com', '0244111111', 3, 5, 1, 'full_time', '2023-01-15', 4500.00, 'active'),
('EMP2002', 'Michael', 'Brown', 'michael.brown@school.com', '0244222222', 4, 7, 1, 'full_time', '2023-03-01', 3800.00, 'active'),
('EMP2003', 'Emily', 'Davis', 'emily.davis@school.com', '0244333333', 5, 8, 1, 'full_time', '2023-06-01', 3200.00, 'active'),
('EMP2004', 'David', 'Wilson', 'david.wilson@school.com', '0244444444', 2, 6, 2, 'contract', '2024-01-01', 3500.00, 'active'),
('EMP2005', 'Lisa', 'Martinez', 'lisa.martinez@school.com', '0244555555', 5, 8, 3, 'part_time', '2024-02-01', 2000.00, 'active');

-- Leave Types
INSERT IGNORE INTO leave_types (id, leave_type_name, max_days_per_year, carry_forward, status) VALUES
(1, 'Annual Leave', 21, 1, 'active'),
(2, 'Sick Leave', 14, 0, 'active'),
(3, 'Casual Leave', 7, 0, 'active'),
(4, 'Maternity Leave', 90, 0, 'active'),
(5, 'Paternity Leave', 14, 0, 'active'),
(6, 'Study Leave', 30, 0, 'active');

-- Sample Leave Applications
INSERT INTO leave_applications (
    employee_id, leave_type_id, start_date, end_date, total_days,
    reason, contact_during_leave, status, applied_date
) VALUES
(1, 1, '2024-12-20', '2024-12-24', 5, 'Christmas vacation', '0244111111', 'pending', NOW()),
(2, 2, '2024-12-10', '2024-12-12', 3, 'Medical appointment', '0244222222', 'pending', NOW()),
(3, 3, '2024-12-15', '2024-12-15', 1, 'Personal matter', '0244333333', 'pending', NOW());

-- Salary Components
INSERT IGNORE INTO salary_components (id, component_name, component_type, description, status) VALUES
(1, 'Basic Salary', 'earning', 'Basic monthly salary', 'active'),
(2, 'House Rent Allowance', 'earning', 'HRA - 20% of basic', 'active'),
(3, 'Transport Allowance', 'earning', 'Monthly transport allowance', 'active'),
(4, 'Medical Allowance', 'earning', 'Medical allowance', 'active'),
(5, 'Tax Deduction', 'deduction', 'Income tax', 'active'),
(6, 'Provident Fund', 'deduction', 'PF - 12% of basic', 'active'),
(7, 'Insurance', 'deduction', 'Health insurance', 'active');

-- Employee Salary Structure (for first 3 employees)
INSERT INTO employee_salary_structure (
    employee_id, component_id, amount, effective_from, status
) VALUES
-- Employee 1
(1, 2, 600.00, '2024-01-01', 'active'),  -- HRA
(1, 3, 300.00, '2024-01-01', 'active'),  -- Transport
(1, 4, 200.00, '2024-01-01', 'active'),  -- Medical
(1, 5, 450.00, '2024-01-01', 'active'),  -- Tax
(1, 6, 360.00, '2024-01-01', 'active'),  -- PF
-- Employee 2
(2, 2, 900.00, '2024-01-01', 'active'),  -- HRA
(2, 3, 300.00, '2024-01-01', 'active'),  -- Transport
(2, 4, 200.00, '2024-01-01', 'active'),  -- Medical
(2, 5, 675.00, '2024-01-01', 'active'),  -- Tax
(2, 6, 540.00, '2024-01-01', 'active'),  -- PF
-- Employee 3
(3, 2, 760.00, '2024-01-01', 'active'),  -- HRA
(3, 3, 300.00, '2024-01-01', 'active'),  -- Transport
(3, 4, 200.00, '2024-01-01', 'active'),  -- Medical
(3, 5, 570.00, '2024-01-01', 'active'),  -- Tax
(3, 6, 456.00, '2024-01-01', 'active');  -- PF

-- Sample Attendance for today
INSERT INTO employee_attendance (
    employee_id, attendance_date, check_in_time, check_out_time,
    working_hours, status, marked_by
) VALUES
(1, CURDATE(), '08:00:00', '16:00:00', 8.0, 'present', 1),
(2, CURDATE(), '08:15:00', '16:30:00', 8.25, 'present', 1),
(3, CURDATE(), '08:30:00', NULL, NULL, 'present', 1),
(4, CURDATE(), '09:00:00', '17:00:00', 8.0, 'late', 1);

-- Sample Performance Reviews
INSERT INTO performance_reviews (
    employee_id, review_period_start, review_period_end, reviewer_id,
    work_quality, productivity, communication, teamwork, punctuality,
    overall_rating, strengths, areas_for_improvement, status, review_date
) VALUES
(1, '2024-01-01', '2024-06-30', 1, 4, 5, 4, 5, 5, 4.6,
 'Excellent teaching skills, good student engagement',
 'Could improve on administrative tasks',
 'completed', '2024-07-15'),
(2, '2024-01-01', '2024-06-30', 1, 5, 4, 5, 4, 5, 4.6,
 'Strong technical skills, proactive problem solver',
 'Could improve documentation',
 'completed', '2024-07-15');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check synced employees
SELECT 
    'Total Employees' as metric,
    COUNT(*) as count
FROM employees
UNION ALL
SELECT 
    'Employees with User Accounts',
    COUNT(*)
FROM employees
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
    'Teachers with Employee Records',
    COUNT(*)
FROM teachers
WHERE employee_id IS NOT NULL;

-- Show employee-user mapping
SELECT 
    e.employee_number,
    e.first_name,
    e.last_name,
    e.email,
    d.department_name,
    des.designation_name,
    e.basic_salary,
    CASE WHEN e.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_login
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN designations des ON e.designation_id = des.id
ORDER BY e.id;
