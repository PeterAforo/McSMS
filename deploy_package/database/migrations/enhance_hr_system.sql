-- ============================================
-- COMPREHENSIVE HR SYSTEM ENHANCEMENT
-- ============================================

-- Step 1: Drop and recreate employees table with comprehensive fields
DROP TABLE IF EXISTS employee_attendance;
DROP TABLE IF EXISTS employee_salary_structure;
DROP TABLE IF EXISTS leave_applications;
DROP TABLE IF EXISTS performance_reviews;
DROP TABLE IF EXISTS payroll_details;
DROP TABLE IF EXISTS payroll;
DROP TABLE IF EXISTS employees;

-- Comprehensive Employees Table
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
    nationality VARCHAR(100),
    national_id VARCHAR(50),
    passport_number VARCHAR(50),
    
    -- Contact Information
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Ghana',
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_relationship VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_address TEXT,
    
    -- Employment Details
    department_id INT,
    designation_id INT,
    category_id INT,
    employment_type ENUM('full_time', 'part_time', 'contract', 'intern', 'consultant') DEFAULT 'full_time',
    employment_status ENUM('active', 'on_leave', 'suspended', 'terminated', 'retired') DEFAULT 'active',
    join_date DATE NOT NULL,
    confirmation_date DATE,
    probation_end_date DATE,
    resignation_date DATE,
    termination_date DATE,
    retirement_date DATE,
    
    -- Reporting Structure
    reports_to INT,
    supervisor_id INT,
    
    -- Salary & Benefits
    basic_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    salary_grade VARCHAR(50),
    pay_frequency ENUM('monthly', 'bi-weekly', 'weekly') DEFAULT 'monthly',
    payment_method ENUM('bank_transfer', 'cash', 'cheque', 'mobile_money') DEFAULT 'bank_transfer',
    
    -- Bank Details
    bank_name VARCHAR(200),
    bank_branch VARCHAR(200),
    bank_account_number VARCHAR(50),
    bank_account_name VARCHAR(200),
    mobile_money_number VARCHAR(20),
    mobile_money_provider VARCHAR(50),
    
    -- Tax & Social Security
    tax_id VARCHAR(50),
    social_security_number VARCHAR(50),
    pension_number VARCHAR(50),
    
    -- Documents & Files
    profile_picture VARCHAR(255),
    cv_document VARCHAR(255),
    contract_document VARCHAR(255),
    id_document VARCHAR(255),
    
    -- Biometric
    biometric_id VARCHAR(100),
    fingerprint_data TEXT,
    face_recognition_data TEXT,
    
    -- Work Schedule
    work_shift ENUM('morning', 'afternoon', 'evening', 'night', 'flexible') DEFAULT 'morning',
    work_hours_per_day DECIMAL(4,2) DEFAULT 8.00,
    work_days_per_week INT DEFAULT 5,
    
    -- Leave Entitlements
    annual_leave_days INT DEFAULT 21,
    sick_leave_days INT DEFAULT 14,
    casual_leave_days INT DEFAULT 7,
    
    -- Performance
    last_review_date DATE,
    next_review_date DATE,
    performance_rating DECIMAL(3,2),
    
    -- Additional Information
    blood_group VARCHAR(10),
    disabilities TEXT,
    languages_spoken TEXT,
    skills TEXT,
    qualifications TEXT,
    certifications TEXT,
    notes TEXT,
    
    -- System Fields
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES employee_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (reports_to) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Recreate dependent tables
CREATE TABLE payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_month VARCHAR(7) NOT NULL,
    employee_id INT NOT NULL,
    basic_salary DECIMAL(10,2) NOT NULL,
    total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
    gross_salary DECIMAL(10,2) NOT NULL,
    net_salary DECIMAL(10,2) NOT NULL,
    status ENUM('draft', 'processed', 'paid', 'cancelled') DEFAULT 'draft',
    payment_date DATE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    generated_by INT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by INT,
    processed_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_payroll (employee_id, payroll_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payroll_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_id INT NOT NULL,
    component_id INT NOT NULL,
    component_type ENUM('earning', 'deduction') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (payroll_id) REFERENCES payroll(id) ON DELETE CASCADE,
    FOREIGN KEY (component_id) REFERENCES salary_components(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE leave_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT,
    contact_during_leave VARCHAR(100),
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INT,
    approved_date TIMESTAMP NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE employee_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    working_hours DECIMAL(4,2),
    status ENUM('present', 'absent', 'late', 'half_day', 'on_leave', 'holiday') DEFAULT 'present',
    remarks TEXT,
    marked_by INT,
    biometric_device_id INT,
    check_in_method ENUM('manual', 'biometric', 'mobile', 'web') DEFAULT 'manual',
    check_out_method ENUM('manual', 'biometric', 'mobile', 'web') DEFAULT 'manual',
    location_check_in VARCHAR(255),
    location_check_out VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (employee_id, attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE employee_salary_structure (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    component_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (component_id) REFERENCES salary_components(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE performance_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    reviewer_id INT,
    work_quality INT CHECK (work_quality BETWEEN 1 AND 5),
    productivity INT CHECK (productivity BETWEEN 1 AND 5),
    communication INT CHECK (communication BETWEEN 1 AND 5),
    teamwork INT CHECK (teamwork BETWEEN 1 AND 5),
    punctuality INT CHECK (punctuality BETWEEN 1 AND 5),
    overall_rating DECIMAL(3,2),
    strengths TEXT,
    areas_for_improvement TEXT,
    goals TEXT,
    comments TEXT,
    status ENUM('draft', 'completed', 'acknowledged') DEFAULT 'draft',
    review_date DATE,
    acknowledged_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Auto-increment function for employee number
DELIMITER //
CREATE TRIGGER before_employee_insert
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
    IF NEW.employee_number IS NULL OR NEW.employee_number = '' THEN
        SET NEW.employee_number = CONCAT('EMP', LPAD((SELECT COALESCE(MAX(id), 0) + 1 FROM employees e), 5, '0'));
    END IF;
END//
DELIMITER ;

-- Sync existing users to employees
INSERT INTO employees (
    user_id, employee_number, first_name, last_name, email, phone,
    department_id, designation_id, category_id, employment_type,
    join_date, basic_salary, status
)
SELECT 
    u.id,
    CONCAT('EMP', LPAD(u.id, 5, '00000')) as employee_number,
    SUBSTRING_INDEX(u.name, ' ', 1) as first_name,
    SUBSTRING_INDEX(u.name, ' ', -1) as last_name,
    u.email,
    NULL as phone,
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
AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.user_id = u.id)
ON DUPLICATE KEY UPDATE user_id = u.id;

-- Update teachers with employee_id
UPDATE teachers t
JOIN employees e ON t.user_id = e.user_id
SET t.employee_id = e.id
WHERE t.employee_id IS NULL OR t.employee_id = 0;

-- Create uploads directory structure
-- Note: This needs to be done via PHP or manually
-- /public/uploads/employees/
-- /public/uploads/employees/profiles/
-- /public/uploads/employees/documents/
-- /public/uploads/employees/contracts/

SELECT 'HR System Enhancement Complete!' as Status;
