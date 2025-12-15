-- Sync users to employees
-- Run this in phpMyAdmin after creating the trigger

INSERT INTO employees (
    user_id, employee_number, first_name, last_name, email, 
    department_id, designation_id, category_id, employment_type,
    join_date, basic_salary, status
)
SELECT 
    u.id,
    NULL as employee_number,
    SUBSTRING_INDEX(u.name, ' ', 1) as first_name,
    SUBSTRING_INDEX(u.name, ' ', -1) as last_name,
    u.email,
    CASE 
        WHEN u.user_type = 'teacher' THEN 1
        WHEN u.user_type = 'admin' THEN 2
        ELSE 2
    END as department_id,
    CASE 
        WHEN u.user_type = 'teacher' THEN 4
        WHEN u.user_type = 'admin' THEN 6
        ELSE 6
    END as designation_id,
    1 as category_id,
    'full_time' as employment_type,
    COALESCE(u.created_at, NOW()) as join_date,
    3000.00 as basic_salary,
    CASE WHEN u.status = 'active' THEN 'active' ELSE 'inactive' END as status
FROM users u
WHERE u.user_type IN ('admin', 'teacher')
AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.user_id = u.id);

-- Update teachers with employee_id
UPDATE teachers t
JOIN employees e ON t.user_id = e.user_id
SET t.employee_id = e.id
WHERE t.employee_id IS NULL OR t.employee_id = 0;

-- Verify
SELECT 
    'Total Employees' as Metric,
    COUNT(*) as Count
FROM employees
UNION ALL
SELECT 
    'With Auto Numbers',
    COUNT(*)
FROM employees
WHERE employee_number LIKE 'EMP%'
UNION ALL
SELECT 
    'Users Synced',
    COUNT(*)
FROM users u
WHERE u.user_type IN ('admin', 'teacher')
AND EXISTS (SELECT 1 FROM employees e WHERE e.user_id = u.id);
