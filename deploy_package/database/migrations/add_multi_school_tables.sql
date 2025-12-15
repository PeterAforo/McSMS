-- Multi-School Management System Tables

-- School branches/campuses
CREATE TABLE IF NOT EXISTS school_branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_name VARCHAR(255) NOT NULL,
    branch_code VARCHAR(50) UNIQUE NOT NULL,
    branch_type ENUM('main', 'branch', 'franchise') DEFAULT 'branch',
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Ghana',
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Branding
    logo_path VARCHAR(255),
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    custom_domain VARCHAR(255),
    
    -- Configuration
    timezone VARCHAR(50) DEFAULT 'Africa/Accra',
    currency VARCHAR(10) DEFAULT 'GHS',
    language VARCHAR(10) DEFAULT 'en',
    date_format VARCHAR(20) DEFAULT 'Y-m-d',
    
    -- Subscription
    subscription_plan ENUM('free', 'pro', 'enterprise', 'ultimate') DEFAULT 'pro',
    subscription_start DATE,
    subscription_end DATE,
    max_students INT DEFAULT 2000,
    max_staff INT DEFAULT 200,
    
    -- Contact person
    contact_person_name VARCHAR(255),
    contact_person_phone VARCHAR(20),
    contact_person_email VARCHAR(255),
    
    -- Status
    status ENUM('active', 'inactive', 'suspended', 'trial') DEFAULT 'active',
    is_headquarters BOOLEAN DEFAULT FALSE,
    
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_branch_code (branch_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Branch administrators
CREATE TABLE IF NOT EXISTS branch_administrators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('super_admin', 'admin', 'manager', 'viewer') DEFAULT 'admin',
    permissions TEXT COMMENT 'JSON array of permissions',
    assigned_date DATE NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES school_branches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_branch_user (branch_id, user_id),
    INDEX idx_branch (branch_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Consolidated reports
CREATE TABLE IF NOT EXISTS consolidated_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_type ENUM('financial', 'academic', 'attendance', 'enrollment', 'custom') NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_period VARCHAR(50),
    start_date DATE,
    end_date DATE,
    branches TEXT COMMENT 'JSON array of branch IDs',
    report_data LONGTEXT COMMENT 'JSON report data',
    generated_by INT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(500),
    status ENUM('generating', 'completed', 'failed') DEFAULT 'completed',
    FOREIGN KEY (generated_by) REFERENCES users(id),
    INDEX idx_type (report_type),
    INDEX idx_date (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Branch performance metrics
CREATE TABLE IF NOT EXISTS branch_performance_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    metric_date DATE NOT NULL,
    
    -- Student metrics
    total_students INT DEFAULT 0,
    new_enrollments INT DEFAULT 0,
    student_retention_rate DECIMAL(5,2),
    average_attendance_rate DECIMAL(5,2),
    
    -- Academic metrics
    average_exam_score DECIMAL(5,2),
    pass_rate DECIMAL(5,2),
    top_performers INT DEFAULT 0,
    at_risk_students INT DEFAULT 0,
    
    -- Financial metrics
    revenue_generated DECIMAL(15,2) DEFAULT 0,
    fees_collected DECIMAL(15,2) DEFAULT 0,
    collection_rate DECIMAL(5,2),
    outstanding_fees DECIMAL(15,2) DEFAULT 0,
    
    -- Staff metrics
    total_staff INT DEFAULT 0,
    staff_attendance_rate DECIMAL(5,2),
    staff_turnover_rate DECIMAL(5,2),
    
    -- Operational metrics
    active_courses INT DEFAULT 0,
    completed_assignments INT DEFAULT 0,
    parent_engagement_rate DECIMAL(5,2),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES school_branches(id) ON DELETE CASCADE,
    UNIQUE KEY unique_branch_date (branch_id, metric_date),
    INDEX idx_branch (branch_id),
    INDEX idx_date (metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data synchronization logs
CREATE TABLE IF NOT EXISTS data_sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_branch_id INT,
    target_branch_id INT,
    sync_type ENUM('full', 'incremental', 'selective') NOT NULL,
    data_type VARCHAR(100) COMMENT 'students, staff, courses, etc.',
    records_synced INT DEFAULT 0,
    sync_status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_branch_id) REFERENCES school_branches(id),
    FOREIGN KEY (target_branch_id) REFERENCES school_branches(id),
    INDEX idx_status (sync_status),
    INDEX idx_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Branch settings
CREATE TABLE IF NOT EXISTS branch_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    setting_category VARCHAR(100) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES school_branches(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id),
    UNIQUE KEY unique_branch_setting (branch_id, setting_category, setting_key),
    INDEX idx_branch (branch_id),
    INDEX idx_category (setting_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inter-branch transfers
CREATE TABLE IF NOT EXISTS inter_branch_transfers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transfer_type ENUM('student', 'staff', 'resource') NOT NULL,
    entity_id INT NOT NULL COMMENT 'ID of student, staff, or resource',
    from_branch_id INT NOT NULL,
    to_branch_id INT NOT NULL,
    transfer_date DATE NOT NULL,
    effective_date DATE,
    reason TEXT,
    transfer_data TEXT COMMENT 'JSON data about the transfer',
    status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    requested_by INT,
    approved_by INT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_branch_id) REFERENCES school_branches(id),
    FOREIGN KEY (to_branch_id) REFERENCES school_branches(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_type (transfer_type),
    INDEX idx_status (status),
    INDEX idx_from (from_branch_id),
    INDEX idx_to (to_branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Shared resources
CREATE TABLE IF NOT EXISTS shared_resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resource_type ENUM('curriculum', 'assessment', 'document', 'template', 'policy') NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    owner_branch_id INT NOT NULL,
    shared_with TEXT COMMENT 'JSON array of branch IDs, or "all"',
    category VARCHAR(100),
    tags TEXT,
    version VARCHAR(20),
    is_public BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_branch_id) REFERENCES school_branches(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_type (resource_type),
    INDEX idx_owner (owner_branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Branch communication
CREATE TABLE IF NOT EXISTS branch_communications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    communication_type ENUM('announcement', 'notice', 'alert', 'message') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    from_branch_id INT,
    to_branches TEXT COMMENT 'JSON array of branch IDs, or "all"',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    sent_by INT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    status ENUM('draft', 'sent', 'archived') DEFAULT 'sent',
    FOREIGN KEY (from_branch_id) REFERENCES school_branches(id),
    FOREIGN KEY (sent_by) REFERENCES users(id),
    INDEX idx_type (communication_type),
    INDEX idx_date (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Branch comparison reports
CREATE TABLE IF NOT EXISTS branch_comparison_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    comparison_type ENUM('performance', 'financial', 'academic', 'operational') NOT NULL,
    branches TEXT COMMENT 'JSON array of branch IDs',
    metrics TEXT COMMENT 'JSON array of metrics to compare',
    period_start DATE,
    period_end DATE,
    report_data LONGTEXT COMMENT 'JSON comparison data',
    generated_by INT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(id),
    INDEX idx_type (comparison_type),
    INDEX idx_date (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert headquarters/main branch
INSERT INTO school_branches (
    branch_name, branch_code, branch_type, city, country, 
    phone, email, subscription_plan, status, is_headquarters
) VALUES (
    'Main Campus', 'HQ-001', 'main', 'Accra', 'Ghana',
    '+233XXXXXXXXX', 'admin@school.edu.gh', 'ultimate', 'active', TRUE
) ON DUPLICATE KEY UPDATE branch_name = VALUES(branch_name);

-- Insert sample branches
INSERT INTO school_branches (branch_name, branch_code, branch_type, city, subscription_plan, status) VALUES
('East Campus', 'EAST-001', 'branch', 'Tema', 'enterprise', 'active'),
('West Campus', 'WEST-001', 'branch', 'Takoradi', 'enterprise', 'active'),
('North Campus', 'NORTH-001', 'branch', 'Kumasi', 'pro', 'active')
ON DUPLICATE KEY UPDATE branch_name = VALUES(branch_name);
