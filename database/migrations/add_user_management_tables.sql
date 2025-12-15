-- =====================================================
-- Enhanced User Management Tables Migration
-- =====================================================

-- Drop existing tables if they exist (to recreate with correct structure)
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS user_activity_logs;
DROP TABLE IF EXISTS login_history;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS user_2fa;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS user_import_logs;
DROP TABLE IF EXISTS failed_login_attempts;
DROP TABLE IF EXISTS user_account_locks;

-- =====================================================
-- 1. ROLES AND PERMISSIONS
-- =====================================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);

-- User-Role mapping (for multiple roles per user)
CREATE TABLE IF NOT EXISTS user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_by INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_role (user_id, role_id)
);

-- =====================================================
-- 2. ACTIVITY LOGGING / AUDIT TRAIL
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action_type ENUM('login', 'logout', 'create', 'update', 'delete', 'view', 'export', 'import', 'password_change', 'password_reset', 'role_change', 'status_change', 'failed_login', 'other') NOT NULL,
    module VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id INT,
    description TEXT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_activity (user_id, created_at),
    INDEX idx_action_type (action_type),
    INDEX idx_module (module)
);

-- =====================================================
-- 3. LOGIN HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS login_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type ENUM('desktop', 'mobile', 'tablet', 'unknown') DEFAULT 'unknown',
    browser VARCHAR(100),
    os VARCHAR(100),
    location VARCHAR(255),
    status ENUM('success', 'failed', 'blocked') DEFAULT 'success',
    failure_reason VARCHAR(255),
    session_token VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_login (user_id, login_time),
    INDEX idx_login_status (status)
);

-- =====================================================
-- 4. PASSWORD RESET TOKENS
-- =====================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);

-- =====================================================
-- 5. TWO-FACTOR AUTHENTICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS user_2fa (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    secret_key VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    backup_codes JSON,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 6. USER SESSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSON,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_sessions (user_id, is_active)
);

-- =====================================================
-- 7. USER PREFERENCES
-- =====================================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    theme ENUM('light', 'dark', 'system') DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    notifications_email BOOLEAN DEFAULT TRUE,
    notifications_sms BOOLEAN DEFAULT TRUE,
    notifications_push BOOLEAN DEFAULT TRUE,
    dashboard_layout JSON,
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 8. USER IMPORT/EXPORT LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_import_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    imported_by INT NOT NULL,
    file_name VARCHAR(255),
    total_records INT DEFAULT 0,
    successful_imports INT DEFAULT 0,
    failed_imports INT DEFAULT 0,
    error_details JSON,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (imported_by) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 9. FAILED LOGIN ATTEMPTS (Security)
-- =====================================================

CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_attempts (email, attempt_time),
    INDEX idx_ip_attempts (ip_address, attempt_time)
);

-- =====================================================
-- 10. USER ACCOUNT LOCKS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_account_locks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    email VARCHAR(255),
    ip_address VARCHAR(45),
    lock_type ENUM('user', 'ip', 'email') NOT NULL,
    locked_until TIMESTAMP NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_lock_check (email, ip_address, locked_until)
);

-- =====================================================
-- INSERT DEFAULT ROLES
-- =====================================================

INSERT INTO roles (role_name, display_name, description, is_system_role) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', TRUE),
('admin', 'Administrator', 'Administrative access to manage school operations', TRUE),
('principal', 'Principal', 'School principal with oversight access', TRUE),
('teacher', 'Teacher', 'Teaching staff with class and student management', TRUE),
('class_teacher', 'Class Teacher', 'Class teacher with additional class management', TRUE),
('finance', 'Finance Officer', 'Financial management and reporting', TRUE),
('accountant', 'Accountant', 'Accounting and fee management', TRUE),
('librarian', 'Librarian', 'Library management access', TRUE),
('parent', 'Parent/Guardian', 'Parent portal access for their children', TRUE),
('student', 'Student', 'Student portal access', TRUE),
('receptionist', 'Receptionist', 'Front desk and visitor management', TRUE),
('hr_manager', 'HR Manager', 'Human resources management', TRUE)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- =====================================================
-- INSERT DEFAULT PERMISSIONS
-- =====================================================

INSERT INTO permissions (permission_name, display_name, module, description) VALUES
-- Dashboard
('dashboard.view', 'View Dashboard', 'dashboard', 'Access to view dashboard'),
('dashboard.analytics', 'View Analytics', 'dashboard', 'Access to analytics and reports'),

-- User Management
('users.view', 'View Users', 'users', 'View user list'),
('users.create', 'Create Users', 'users', 'Create new users'),
('users.edit', 'Edit Users', 'users', 'Edit user details'),
('users.delete', 'Delete Users', 'users', 'Delete users'),
('users.approve', 'Approve Users', 'users', 'Approve pending registrations'),
('users.roles', 'Manage User Roles', 'users', 'Assign and manage user roles'),
('users.import', 'Import Users', 'users', 'Bulk import users'),
('users.export', 'Export Users', 'users', 'Export user data'),

-- Students
('students.view', 'View Students', 'students', 'View student list'),
('students.create', 'Create Students', 'students', 'Add new students'),
('students.edit', 'Edit Students', 'students', 'Edit student details'),
('students.delete', 'Delete Students', 'students', 'Delete students'),
('students.import', 'Import Students', 'students', 'Bulk import students'),
('students.export', 'Export Students', 'students', 'Export student data'),

-- Teachers
('teachers.view', 'View Teachers', 'teachers', 'View teacher list'),
('teachers.create', 'Create Teachers', 'teachers', 'Add new teachers'),
('teachers.edit', 'Edit Teachers', 'teachers', 'Edit teacher details'),
('teachers.delete', 'Delete Teachers', 'teachers', 'Delete teachers'),

-- Classes
('classes.view', 'View Classes', 'classes', 'View class list'),
('classes.create', 'Create Classes', 'classes', 'Create new classes'),
('classes.edit', 'Edit Classes', 'classes', 'Edit class details'),
('classes.delete', 'Delete Classes', 'classes', 'Delete classes'),
('classes.assign_students', 'Assign Students', 'classes', 'Assign students to classes'),
('classes.assign_teachers', 'Assign Teachers', 'classes', 'Assign teachers to classes'),

-- Attendance
('attendance.view', 'View Attendance', 'attendance', 'View attendance records'),
('attendance.mark', 'Mark Attendance', 'attendance', 'Mark student attendance'),
('attendance.edit', 'Edit Attendance', 'attendance', 'Edit attendance records'),
('attendance.reports', 'Attendance Reports', 'attendance', 'Generate attendance reports'),

-- Exams
('exams.view', 'View Exams', 'exams', 'View exam schedules'),
('exams.create', 'Create Exams', 'exams', 'Create exam schedules'),
('exams.edit', 'Edit Exams', 'exams', 'Edit exam details'),
('exams.results', 'Manage Results', 'exams', 'Enter and manage exam results'),
('exams.reports', 'Exam Reports', 'exams', 'Generate exam reports'),

-- Finance
('finance.view', 'View Finance', 'finance', 'View financial data'),
('finance.invoices', 'Manage Invoices', 'finance', 'Create and manage invoices'),
('finance.payments', 'Record Payments', 'finance', 'Record fee payments'),
('finance.reports', 'Financial Reports', 'finance', 'Generate financial reports'),
('finance.settings', 'Finance Settings', 'finance', 'Manage fee structures'),

-- Communication
('communication.sms', 'Send SMS', 'communication', 'Send SMS messages'),
('communication.email', 'Send Email', 'communication', 'Send email messages'),
('communication.whatsapp', 'Send WhatsApp', 'communication', 'Send WhatsApp messages'),
('communication.announcements', 'Announcements', 'communication', 'Create announcements'),

-- Reports
('reports.view', 'View Reports', 'reports', 'Access reports module'),
('reports.generate', 'Generate Reports', 'reports', 'Generate various reports'),
('reports.export', 'Export Reports', 'reports', 'Export reports to PDF/Excel'),

-- Settings
('settings.view', 'View Settings', 'settings', 'View system settings'),
('settings.edit', 'Edit Settings', 'settings', 'Modify system settings'),
('settings.school', 'School Settings', 'settings', 'Manage school information'),
('settings.academic', 'Academic Settings', 'settings', 'Manage academic year settings'),

-- Audit
('audit.view', 'View Audit Logs', 'audit', 'View activity logs'),
('audit.export', 'Export Audit Logs', 'audit', 'Export audit trail')
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- =====================================================
-- ASSIGN DEFAULT PERMISSIONS TO ROLES
-- =====================================================

-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.role_name = 'super_admin'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Admin gets most permissions except super admin specific
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.role_name = 'admin' AND p.permission_name NOT IN ('settings.edit')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Teacher permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.role_name = 'teacher' AND p.permission_name IN (
    'dashboard.view', 'students.view', 'classes.view', 
    'attendance.view', 'attendance.mark', 'exams.view', 'exams.results',
    'communication.announcements'
)
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Finance permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.role_name = 'finance' AND p.permission_name IN (
    'dashboard.view', 'dashboard.analytics', 'students.view',
    'finance.view', 'finance.invoices', 'finance.payments', 'finance.reports',
    'reports.view', 'reports.generate', 'reports.export'
)
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Parent permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.role_name = 'parent' AND p.permission_name IN (
    'dashboard.view', 'students.view', 'attendance.view', 
    'exams.view', 'finance.view'
)
ON DUPLICATE KEY UPDATE role_id = role_id;

-- =====================================================
-- ADD NEW COLUMNS TO USERS TABLE (ignore errors if exists)
-- =====================================================

-- Using stored procedure to safely add columns
DELIMITER //

DROP PROCEDURE IF EXISTS add_column_if_not_exists//

CREATE PROCEDURE add_column_if_not_exists()
BEGIN
    -- Add profile_picture column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_picture') THEN
        ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) DEFAULT NULL;
    END IF;
    
    -- Add last_login column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login') THEN
        ALTER TABLE users ADD COLUMN last_login DATETIME NULL;
    END IF;
    
    -- Add email_verified_at column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verified_at') THEN
        ALTER TABLE users ADD COLUMN email_verified_at DATETIME NULL;
    END IF;
    
    -- Add phone_verified_at column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_verified_at') THEN
        ALTER TABLE users ADD COLUMN phone_verified_at DATETIME NULL;
    END IF;
    
    -- Add must_change_password column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'must_change_password') THEN
        ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add failed_login_attempts column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'failed_login_attempts') THEN
        ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0;
    END IF;
    
    -- Add locked_until column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'locked_until') THEN
        ALTER TABLE users ADD COLUMN locked_until DATETIME NULL;
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
    END IF;
END//

DELIMITER ;

CALL add_column_if_not_exists();

DROP PROCEDURE IF EXISTS add_column_if_not_exists;
