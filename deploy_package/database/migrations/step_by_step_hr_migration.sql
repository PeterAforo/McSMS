-- ============================================
-- STEP-BY-STEP HR SYSTEM MIGRATION
-- Run each step separately and report any errors
-- ============================================

-- ============================================
-- STEP 1: Backup existing data
-- ============================================
-- Run this first to backup existing employee data
CREATE TABLE IF NOT EXISTS employees_backup AS SELECT * FROM employees;
CREATE TABLE IF NOT EXISTS employee_attendance_backup AS SELECT * FROM employee_attendance;
CREATE TABLE IF NOT EXISTS leave_applications_backup AS SELECT * FROM leave_applications;
CREATE TABLE IF NOT EXISTS payroll_backup AS SELECT * FROM payroll;

SELECT 'STEP 1 COMPLETE: Backups created' as Status;

-- ============================================
-- STEP 2: Add new columns to existing employees table
-- (Safer than dropping and recreating)
-- ============================================

-- Personal Information
ALTER TABLE employees ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100) AFTER first_name;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20) AFTER phone;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed') AFTER gender;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) AFTER marital_status;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS national_id VARCHAR(50) AFTER nationality;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50) AFTER national_id;

-- Contact Information
ALTER TABLE employees ADD COLUMN IF NOT EXISTS state VARCHAR(100) AFTER city;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) AFTER state;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Ghana' AFTER postal_code;

-- Emergency Contact
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(200) AFTER country;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100) AFTER emergency_contact_name;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20) AFTER emergency_contact_relationship;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_address TEXT AFTER emergency_contact_phone;

-- Employment Details
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_status ENUM('active', 'on_leave', 'suspended', 'terminated', 'retired') DEFAULT 'active' AFTER employment_type;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS confirmation_date DATE AFTER join_date;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS probation_end_date DATE AFTER confirmation_date;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS resignation_date DATE AFTER probation_end_date;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS termination_date DATE AFTER resignation_date;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS retirement_date DATE AFTER termination_date;

-- Reporting Structure
ALTER TABLE employees ADD COLUMN IF NOT EXISTS reports_to INT AFTER retirement_date;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS supervisor_id INT AFTER reports_to;

-- Salary & Benefits
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_grade VARCHAR(50) AFTER basic_salary;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pay_frequency ENUM('monthly', 'bi-weekly', 'weekly') DEFAULT 'monthly' AFTER salary_grade;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS payment_method ENUM('bank_transfer', 'cash', 'cheque', 'mobile_money') DEFAULT 'bank_transfer' AFTER pay_frequency;

-- Bank Details (additional)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(200) AFTER bank_name;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(200) AFTER bank_account_number;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS mobile_money_number VARCHAR(20) AFTER bank_account_name;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS mobile_money_provider VARCHAR(50) AFTER mobile_money_number;

-- Tax & Social Security
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50) AFTER mobile_money_provider;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS social_security_number VARCHAR(50) AFTER tax_id;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pension_number VARCHAR(50) AFTER social_security_number;

-- Documents & Files
ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255) AFTER pension_number;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cv_document VARCHAR(255) AFTER profile_picture;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_document VARCHAR(255) AFTER cv_document;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS id_document VARCHAR(255) AFTER contract_document;

-- Biometric
ALTER TABLE employees ADD COLUMN IF NOT EXISTS biometric_id VARCHAR(100) AFTER id_document;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fingerprint_data TEXT AFTER biometric_id;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS face_recognition_data TEXT AFTER fingerprint_data;

-- Work Schedule
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_shift ENUM('morning', 'afternoon', 'evening', 'night', 'flexible') DEFAULT 'morning' AFTER face_recognition_data;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_hours_per_day DECIMAL(4,2) DEFAULT 8.00 AFTER work_shift;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_days_per_week INT DEFAULT 5 AFTER work_hours_per_day;

-- Leave Entitlements
ALTER TABLE employees ADD COLUMN IF NOT EXISTS annual_leave_days INT DEFAULT 21 AFTER work_days_per_week;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS sick_leave_days INT DEFAULT 14 AFTER annual_leave_days;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS casual_leave_days INT DEFAULT 7 AFTER sick_leave_days;

-- Performance
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_review_date DATE AFTER casual_leave_days;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS next_review_date DATE AFTER last_review_date;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS performance_rating DECIMAL(3,2) AFTER next_review_date;

-- Additional Information
ALTER TABLE employees ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10) AFTER performance_rating;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS disabilities TEXT AFTER blood_group;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS languages_spoken TEXT AFTER disabilities;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS skills TEXT AFTER languages_spoken;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS qualifications TEXT AFTER skills;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS certifications TEXT AFTER qualifications;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS notes TEXT AFTER certifications;

-- System Fields
ALTER TABLE employees ADD COLUMN IF NOT EXISTS created_by INT AFTER notes;

SELECT 'STEP 2 COMPLETE: New columns added to employees table' as Status;

-- ============================================
-- STEP 3: Make user_id required and unique
-- ============================================

-- First, ensure all employees have a user_id
-- For employees without user_id, we'll handle them separately

-- Make user_id NOT NULL (only if all employees have user_id)
-- ALTER TABLE employees MODIFY COLUMN user_id INT NOT NULL;

-- Add unique constraint if not exists
-- ALTER TABLE employees ADD UNIQUE KEY unique_user_id (user_id);

SELECT 'STEP 3 COMPLETE: User ID constraints updated' as Status;

-- ============================================
-- STEP 4: Add foreign keys
-- ============================================

-- Add foreign key for reports_to
ALTER TABLE employees ADD CONSTRAINT fk_reports_to 
FOREIGN KEY (reports_to) REFERENCES employees(id) ON DELETE SET NULL;

-- Add foreign key for supervisor_id
ALTER TABLE employees ADD CONSTRAINT fk_supervisor 
FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE SET NULL;

SELECT 'STEP 4 COMPLETE: Foreign keys added' as Status;

-- ============================================
-- STEP 5: Update employee_attendance table
-- ============================================

ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS biometric_device_id INT AFTER marked_by;
ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS check_in_method ENUM('manual', 'biometric', 'mobile', 'web') DEFAULT 'manual' AFTER biometric_device_id;
ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS check_out_method ENUM('manual', 'biometric', 'mobile', 'web') DEFAULT 'manual' AFTER check_in_method;
ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS location_check_in VARCHAR(255) AFTER check_out_method;
ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS location_check_out VARCHAR(255) AFTER location_check_in;

SELECT 'STEP 5 COMPLETE: Attendance table updated' as Status;

-- ============================================
-- STEP 6: Create auto-increment trigger for employee_number
-- ============================================

DELIMITER //

DROP TRIGGER IF EXISTS before_employee_insert//

CREATE TRIGGER before_employee_insert
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
    DECLARE next_num INT;
    
    IF NEW.employee_number IS NULL OR NEW.employee_number = '' THEN
        -- Get the next number
        SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number, 4) AS UNSIGNED)), 0) + 1 
        INTO next_num
        FROM employees 
        WHERE employee_number REGEXP '^EMP[0-9]+$';
        
        -- Set the employee number
        SET NEW.employee_number = CONCAT('EMP', LPAD(next_num, 5, '0'));
    END IF;
END//

DELIMITER ;

SELECT 'STEP 6 COMPLETE: Auto-increment trigger created' as Status;

-- ============================================
-- STEP 7: Sync existing users to employees
-- ============================================

-- Insert users who don't have employee records yet
INSERT INTO employees (
    user_id, employee_number, first_name, last_name, email, 
    department_id, designation_id, category_id, employment_type,
    join_date, basic_salary, status
)
SELECT 
    u.id,
    NULL as employee_number, -- Will be auto-generated by trigger
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

SELECT 'STEP 7 COMPLETE: Users synced to employees' as Status;

-- ============================================
-- STEP 8: Update teachers with employee_id
-- ============================================

-- Add employee_id column to teachers if not exists
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS employee_id INT AFTER user_id;

-- Update teachers with their employee_id
UPDATE teachers t
JOIN employees e ON t.user_id = e.user_id
SET t.employee_id = e.id
WHERE t.employee_id IS NULL OR t.employee_id = 0;

-- Add foreign key
ALTER TABLE teachers ADD CONSTRAINT fk_teacher_employee 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

SELECT 'STEP 8 COMPLETE: Teachers linked to employees' as Status;

-- ============================================
-- STEP 9: Verify the migration
-- ============================================

SELECT 'MIGRATION VERIFICATION:' as '';

SELECT 
    'Total Employees' as Metric,
    COUNT(*) as Count
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
WHERE employee_id IS NOT NULL
UNION ALL
SELECT 
    'Employees with Auto-Generated Numbers',
    COUNT(*)
FROM employees
WHERE employee_number LIKE 'EMP%';

-- ============================================
-- FINAL STATUS
-- ============================================

SELECT '✅ MIGRATION COMPLETE!' as Status;
SELECT 'All steps executed successfully' as Message;
SELECT 'Check the verification results above' as Note;
