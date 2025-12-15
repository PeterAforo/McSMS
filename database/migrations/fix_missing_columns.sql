-- ============================================
-- FIX MISSING COLUMNS
-- Add columns that failed due to missing reference columns
-- ============================================

-- Add missing columns without AFTER clause (will be added at the end)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS reports_to INT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS supervisor_id INT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_grade VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pay_frequency ENUM('monthly', 'bi-weekly', 'weekly') DEFAULT 'monthly';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS payment_method ENUM('bank_transfer', 'cash', 'cheque', 'mobile_money') DEFAULT 'bank_transfer';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS social_security_number VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pension_number VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cv_document VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_document VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS id_document VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS biometric_id VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fingerprint_data TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS face_recognition_data TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_shift ENUM('morning', 'afternoon', 'evening', 'night', 'flexible') DEFAULT 'morning';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_hours_per_day DECIMAL(4,2) DEFAULT 8.00;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_days_per_week INT DEFAULT 5;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS annual_leave_days INT DEFAULT 21;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS sick_leave_days INT DEFAULT 14;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS casual_leave_days INT DEFAULT 7;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_review_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS next_review_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS performance_rating DECIMAL(3,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS disabilities TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS languages_spoken TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS qualifications TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS certifications TEXT;

-- Add missing columns to employee_attendance
ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS biometric_device_id INT;
ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS check_in_method ENUM('manual', 'biometric', 'mobile', 'web') DEFAULT 'manual';
ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS check_out_method ENUM('manual', 'biometric', 'mobile', 'web') DEFAULT 'manual';
ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS location_check_in VARCHAR(255);
ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS location_check_out VARCHAR(255);

-- Add foreign keys
ALTER TABLE employees ADD CONSTRAINT fk_reports_to FOREIGN KEY (reports_to) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE employees ADD CONSTRAINT fk_supervisor FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Create auto-increment trigger
DROP TRIGGER IF EXISTS before_employee_insert;

DELIMITER //
CREATE TRIGGER before_employee_insert
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
    DECLARE next_num INT;
    
    IF NEW.employee_number IS NULL OR NEW.employee_number = '' THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number, 4) AS UNSIGNED)), 0) + 1 
        INTO next_num
        FROM employees 
        WHERE employee_number REGEXP '^EMP[0-9]+$';
        
        SET NEW.employee_number = CONCAT('EMP', LPAD(next_num, 5, '0'));
    END IF;
END//
DELIMITER ;

-- Sync users to employees
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

SELECT '✅ ALL MISSING COLUMNS ADDED!' as Status;
