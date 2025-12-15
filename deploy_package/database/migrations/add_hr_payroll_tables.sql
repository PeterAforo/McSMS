-- HR & Payroll Management System Tables

-- Employee categories
CREATE TABLE IF NOT EXISTS employee_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(50) UNIQUE,
    head_of_department INT,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (head_of_department) REFERENCES users(id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Designations/Positions
CREATE TABLE IF NOT EXISTS designations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    designation_name VARCHAR(100) NOT NULL,
    department_id INT,
    level INT,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Employees (extends teachers table)
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    teacher_id INT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Ghana',
    
    -- Employment details
    department_id INT,
    designation_id INT,
    category_id INT,
    employment_type ENUM('full_time', 'part_time', 'contract', 'temporary') DEFAULT 'full_time',
    join_date DATE NOT NULL,
    confirmation_date DATE,
    termination_date DATE,
    
    -- Salary details
    basic_salary DECIMAL(10,2) NOT NULL,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_branch VARCHAR(100),
    
    -- Documents
    photo_path VARCHAR(255),
    resume_path VARCHAR(255),
    id_card_path VARCHAR(255),
    
    -- Status
    status ENUM('active', 'on_leave', 'suspended', 'terminated') DEFAULT 'active',
    
    -- Emergency contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (designation_id) REFERENCES designations(id),
    FOREIGN KEY (category_id) REFERENCES employee_categories(id),
    INDEX idx_status (status),
    INDEX idx_employee_number (employee_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Salary components
CREATE TABLE IF NOT EXISTS salary_components (
    id INT AUTO_INCREMENT PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL,
    component_type ENUM('earning', 'deduction') NOT NULL,
    calculation_type ENUM('fixed', 'percentage') DEFAULT 'fixed',
    default_amount DECIMAL(10,2),
    is_taxable BOOLEAN DEFAULT TRUE,
    is_mandatory BOOLEAN DEFAULT FALSE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (component_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Employee salary structure
CREATE TABLE IF NOT EXISTS employee_salary_structure (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    component_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2),
    effective_from DATE NOT NULL,
    effective_to DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (component_id) REFERENCES salary_components(id),
    INDEX idx_employee (employee_id),
    INDEX idx_effective (effective_from, effective_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payroll
CREATE TABLE IF NOT EXISTS payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_month VARCHAR(7) NOT NULL COMMENT 'Format: YYYY-MM',
    employee_id INT NOT NULL,
    
    -- Salary breakdown
    basic_salary DECIMAL(10,2) NOT NULL,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) DEFAULT 0,
    gross_salary DECIMAL(10,2) NOT NULL,
    net_salary DECIMAL(10,2) NOT NULL,
    
    -- Attendance
    working_days INT,
    present_days INT,
    absent_days INT,
    leave_days INT,
    
    -- Tax
    tax_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    status ENUM('draft', 'processed', 'paid', 'cancelled') DEFAULT 'draft',
    payment_date DATE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    
    notes TEXT,
    generated_by INT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_by INT,
    processed_at DATETIME,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (generated_by) REFERENCES users(id),
    FOREIGN KEY (processed_by) REFERENCES users(id),
    UNIQUE KEY unique_payroll (employee_id, payroll_month),
    INDEX idx_month (payroll_month),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payroll details (component-wise breakdown)
CREATE TABLE IF NOT EXISTS payroll_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_id INT NOT NULL,
    component_id INT NOT NULL,
    component_type ENUM('earning', 'deduction') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_id) REFERENCES payroll(id) ON DELETE CASCADE,
    FOREIGN KEY (component_id) REFERENCES salary_components(id),
    INDEX idx_payroll (payroll_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Leave types
CREATE TABLE IF NOT EXISTS leave_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    leave_type_name VARCHAR(100) NOT NULL,
    days_allowed INT NOT NULL,
    carry_forward BOOLEAN DEFAULT FALSE,
    max_carry_forward_days INT,
    requires_approval BOOLEAN DEFAULT TRUE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Leave applications
CREATE TABLE IF NOT EXISTS leave_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT NOT NULL,
    contact_during_leave VARCHAR(20),
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_by INT,
    approved_date DATETIME,
    rejection_reason TEXT,
    notes TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Employee attendance
CREATE TABLE IF NOT EXISTS employee_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    working_hours DECIMAL(5,2),
    status ENUM('present', 'absent', 'late', 'half_day', 'on_leave') DEFAULT 'present',
    remarks TEXT,
    marked_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (marked_by) REFERENCES users(id),
    UNIQUE KEY unique_attendance (employee_id, attendance_date),
    INDEX idx_date (attendance_date),
    INDEX idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Performance reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    reviewer_id INT NOT NULL,
    
    -- Ratings (1-5 scale)
    work_quality INT,
    productivity INT,
    communication INT,
    teamwork INT,
    punctuality INT,
    overall_rating DECIMAL(3,2),
    
    strengths TEXT,
    areas_for_improvement TEXT,
    goals TEXT,
    comments TEXT,
    
    status ENUM('draft', 'submitted', 'reviewed', 'acknowledged') DEFAULT 'draft',
    review_date DATE,
    employee_acknowledgement BOOLEAN DEFAULT FALSE,
    acknowledgement_date DATE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    INDEX idx_employee (employee_id),
    INDEX idx_period (review_period_start, review_period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Training programs
CREATE TABLE IF NOT EXISTS training_programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_name VARCHAR(255) NOT NULL,
    description TEXT,
    trainer_name VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_hours INT,
    location VARCHAR(255),
    cost DECIMAL(10,2),
    max_participants INT,
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Training participants
CREATE TABLE IF NOT EXISTS training_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    training_id INT NOT NULL,
    employee_id INT NOT NULL,
    enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    attendance_status ENUM('enrolled', 'attended', 'absent', 'completed') DEFAULT 'enrolled',
    completion_date DATE,
    certificate_issued BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    rating INT,
    FOREIGN KEY (training_id) REFERENCES training_programs(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE KEY unique_participant (training_id, employee_id),
    INDEX idx_training (training_id),
    INDEX idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Employee documents
CREATE TABLE IF NOT EXISTS employee_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100),
    file_path VARCHAR(500) NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    uploaded_by INT,
    notes TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default data
INSERT INTO employee_categories (category_name, description) VALUES
('Teaching Staff', 'Teachers and academic staff'),
('Administrative Staff', 'Office and administrative personnel'),
('Support Staff', 'Maintenance, security, and support staff'),
('Management', 'School management and leadership')
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

INSERT INTO departments (department_name, department_code, description) VALUES
('Academic', 'ACAD', 'Academic department'),
('Administration', 'ADMIN', 'Administrative department'),
('Finance', 'FIN', 'Finance and accounts'),
('IT', 'IT', 'Information Technology'),
('Maintenance', 'MAINT', 'Maintenance and facilities')
ON DUPLICATE KEY UPDATE department_name = VALUES(department_name);

INSERT INTO salary_components (component_name, component_type, calculation_type, is_mandatory) VALUES
('Basic Salary', 'earning', 'fixed', TRUE),
('Housing Allowance', 'earning', 'percentage', FALSE),
('Transport Allowance', 'earning', 'fixed', FALSE),
('Medical Allowance', 'earning', 'fixed', FALSE),
('Tax', 'deduction', 'percentage', TRUE),
('SSNIT', 'deduction', 'percentage', TRUE),
('Loan Deduction', 'deduction', 'fixed', FALSE)
ON DUPLICATE KEY UPDATE component_name = VALUES(component_name);

INSERT INTO leave_types (leave_type_name, days_allowed, carry_forward, requires_approval) VALUES
('Annual Leave', 21, TRUE, TRUE),
('Sick Leave', 14, FALSE, TRUE),
('Maternity Leave', 90, FALSE, TRUE),
('Paternity Leave', 7, FALSE, TRUE),
('Casual Leave', 7, FALSE, TRUE),
('Study Leave', 30, FALSE, TRUE)
ON DUPLICATE KEY UPDATE leave_type_name = VALUES(leave_type_name);
