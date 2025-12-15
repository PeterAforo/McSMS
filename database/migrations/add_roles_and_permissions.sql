-- ============================================
-- ROLES AND PERMISSIONS SYSTEM MIGRATION
-- ============================================
-- This migration adds a comprehensive RBAC system
-- with 18+ roles and granular permissions

-- ============================================
-- 1. CREATE ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  role_code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  category ENUM('academic', 'administrative', 'finance', 'student_services', 'leadership', 'support') NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 2. CREATE PERMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permission_key VARCHAR(100) UNIQUE NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  description TEXT,
  module VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 3. CREATE ROLE_PERMISSIONS TABLE (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 4. UPDATE USERS TABLE
-- ============================================
-- Add role_id column (keep user_type for backward compatibility)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role_id INT NULL AFTER user_type,
ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- ============================================
-- 5. INSERT ROLES
-- ============================================

-- EXISTING ROLES (migrated from user_type)
INSERT INTO roles (role_name, role_code, description, category, status) VALUES
('Administrator', 'ADMIN', 'Full system access and control', 'leadership', 'active'),
('Finance Officer', 'FINANCE', 'Manage financial operations and approvals', 'finance', 'active'),
('Teacher', 'TEACHER', 'Teaching, grading, and class management', 'academic', 'active'),
('Parent', 'PARENT', 'Student enrollment and fee payments', 'student_services', 'active');

-- CORE ADDITIONAL ROLES (Priority 1)
INSERT INTO roles (role_name, role_code, description, category, status) VALUES
('Cashier', 'CASHIER', 'Handle physical payments and receipts', 'finance', 'active'),
('Administrative Staff', 'ADMIN_STAFF', 'Support admin functions without full admin rights', 'administrative', 'active'),
('Receptionist', 'RECEPTIONIST', 'Front desk operations and visitor management', 'administrative', 'active'),
('Head of Section', 'HEAD_SECTION', 'Oversee department (Creche/KG/Primary/JHS/SHS)', 'academic', 'active'),
('Exam Officer', 'EXAM_OFFICER', 'Manage exams, results, and grading', 'academic', 'active'),
('Transport Manager', 'TRANSPORT_MGR', 'Manage school buses and routing', 'student_services', 'active'),
('School Nurse', 'NURSE', 'Handle student health profiles and medical records', 'student_services', 'active'),
('Librarian', 'LIBRARIAN', 'Manage library operations and resources', 'student_services', 'active'),
('Hostel Master', 'HOSTEL_MASTER', 'Manage boarding facilities and students', 'student_services', 'active'),
('ICT Officer', 'ICT_OFFICER', 'Manage technology and system support', 'administrative', 'active'),
('Vice Principal', 'VICE_PRINCIPAL', 'Deputy head with oversight responsibilities', 'leadership', 'active'),
('Principal', 'PRINCIPAL', 'School head with complete oversight', 'leadership', 'active');

-- SUPPORT ROLES (Priority 2)
INSERT INTO roles (role_name, role_code, description, category, status) VALUES
('Curriculum Developer', 'CURRICULUM_DEV', 'Manage syllabus and study materials', 'academic', 'active'),
('Parent Relations Officer', 'PARENT_RELATIONS', 'Manage parent communication and complaints', 'support', 'active'),
('Events Coordinator', 'EVENTS_COORD', 'Manage school events and activities', 'support', 'active'),
('Store Manager', 'STORE_MGR', 'Manage uniforms, textbooks, and inventory', 'support', 'active');

-- FINANCE SPECIALIZATIONS (Priority 2)
INSERT INTO roles (role_name, role_code, description, category, status) VALUES
('Accountant', 'ACCOUNTANT', 'Financial reporting and reconciliation', 'finance', 'active'),
('Bursar', 'BURSAR', 'Oversee finance team and high-value approvals', 'finance', 'active');

-- ============================================
-- 6. INSERT PERMISSIONS
-- ============================================

-- STUDENTS MODULE
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('students.view', 'View Students', 'View student records and information', 'students'),
('students.create', 'Create Students', 'Add new student records', 'students'),
('students.edit', 'Edit Students', 'Modify student information', 'students'),
('students.delete', 'Delete Students', 'Remove student records', 'students'),
('students.documents', 'Manage Documents', 'Upload and manage student documents', 'students'),
('students.transfer', 'Manage Transfers', 'Handle student transfers and withdrawals', 'students');

-- FINANCE MODULE
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('finance.view', 'View Finance', 'View financial data and reports', 'finance'),
('finance.payments.record', 'Record Payments', 'Record student payments', 'finance'),
('finance.payments.approve', 'Approve Payments', 'Approve payment transactions', 'finance'),
('finance.invoices.view', 'View Invoices', 'View student invoices', 'finance'),
('finance.invoices.create', 'Create Invoices', 'Generate student invoices', 'finance'),
('finance.invoices.approve', 'Approve Invoices', 'Approve pending invoices', 'finance'),
('finance.structure.view', 'View Fee Structure', 'View fee groups and items', 'finance'),
('finance.structure.edit', 'Edit Fee Structure', 'Modify fee structure', 'finance'),
('finance.receipts.print', 'Print Receipts', 'Generate and print payment receipts', 'finance'),
('finance.reports', 'Financial Reports', 'Generate financial reports', 'finance'),
('finance.discounts', 'Manage Discounts', 'Apply discounts and waivers', 'finance');

-- ACADEMIC MODULE
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('academic.view', 'View Academic Data', 'View academic information', 'academic'),
('academic.classes.manage', 'Manage Classes', 'Create and manage classes', 'academic'),
('academic.subjects.manage', 'Manage Subjects', 'Create and manage subjects', 'academic'),
('academic.grades.enter', 'Enter Grades', 'Enter student grades', 'academic'),
('academic.grades.approve', 'Approve Grades', 'Approve submitted grades', 'academic'),
('academic.exams.manage', 'Manage Exams', 'Create and manage exam sessions', 'academic'),
('academic.results.view', 'View Results', 'View student results', 'academic'),
('academic.results.print', 'Print Results', 'Print result sheets', 'academic'),
('academic.promotions', 'Manage Promotions', 'Handle student promotions', 'academic'),
('academic.curriculum', 'Manage Curriculum', 'Manage syllabus and materials', 'academic');

-- ATTENDANCE MODULE
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('attendance.view', 'View Attendance', 'View attendance records', 'attendance'),
('attendance.mark', 'Mark Attendance', 'Mark student attendance', 'attendance'),
('attendance.reports', 'Attendance Reports', 'Generate attendance reports', 'attendance');

-- ADMISSIONS MODULE
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('admissions.view', 'View Admissions', 'View admission applications', 'admissions'),
('admissions.process', 'Process Admissions', 'Process admission applications', 'admissions'),
('admissions.approve', 'Approve Admissions', 'Approve admission applications', 'admissions');

-- TRANSPORT MODULE
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('transport.view', 'View Transport', 'View transport information', 'transport'),
('transport.manage', 'Manage Transport', 'Manage buses and routes', 'transport'),
('transport.students', 'Assign Students', 'Assign students to buses', 'transport'),
('transport.payments', 'Transport Payments', 'View transport payment status', 'transport');

-- MEDICAL MODULE
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('medical.view', 'View Medical Records', 'View student medical records', 'medical'),
('medical.edit', 'Edit Medical Records', 'Update medical information', 'medical'),
('medical.clinic', 'Clinic Visits', 'Record clinic visits', 'medical'),
('medical.reports', 'Medical Reports', 'Generate medical reports', 'medical');

-- LIBRARY MODULE
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('library.view', 'View Library', 'View library catalog', 'library'),
('library.manage', 'Manage Library', 'Manage books and resources', 'library'),
('library.checkout', 'Checkout Books', 'Check-in and check-out books', 'library'),
('library.fines', 'Manage Fines', 'Manage library fines', 'library');

-- HOSTEL MODULE
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('hostel.view', 'View Hostel', 'View hostel information', 'hostel'),
('hostel.manage', 'Manage Hostel', 'Manage hostel operations', 'hostel'),
('hostel.students', 'Hostel Students', 'Manage boarding students', 'hostel'),
('hostel.payments', 'Hostel Payments', 'View hostel payment status', 'hostel');

-- SYSTEM MODULE
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('system.users.view', 'View Users', 'View system users', 'system'),
('system.users.manage', 'Manage Users', 'Create and manage users', 'system'),
('system.settings.view', 'View Settings', 'View system settings', 'system'),
('system.settings.edit', 'Edit Settings', 'Modify system settings', 'system'),
('system.logs', 'View Logs', 'View system logs', 'system'),
('system.support', 'System Support', 'Provide system support', 'system');

-- REPORTS MODULE
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('reports.academic', 'Academic Reports', 'Generate academic reports', 'reports'),
('reports.financial', 'Financial Reports', 'Generate financial reports', 'reports'),
('reports.executive', 'Executive Reports', 'View executive dashboards', 'reports'),
('reports.custom', 'Custom Reports', 'Create custom reports', 'reports');

-- COMMUNICATION MODULE
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('communication.view', 'View Messages', 'View communications', 'communication'),
('communication.send', 'Send Messages', 'Send messages to parents/staff', 'communication'),
('communication.announcements', 'Manage Announcements', 'Create school-wide announcements', 'communication');

-- ============================================
-- 7. ASSIGN PERMISSIONS TO ROLES
-- ============================================

-- Note: This is a sample. You should customize based on your needs.
-- Use a script or admin UI to assign permissions to roles.

-- Example: Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'ADMIN'),
  id
FROM permissions;

-- Example: Cashier permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'CASHIER'),
  id
FROM permissions
WHERE permission_key IN (
  'finance.view',
  'finance.payments.record',
  'finance.invoices.view',
  'finance.receipts.print'
);

-- ============================================
-- 8. MIGRATE EXISTING USERS
-- ============================================

-- Map existing user_type to role_id
UPDATE users u
SET role_id = (SELECT id FROM roles WHERE role_code = 'ADMIN')
WHERE u.user_type = 'admin';

UPDATE users u
SET role_id = (SELECT id FROM roles WHERE role_code = 'FINANCE')
WHERE u.user_type = 'finance';

UPDATE users u
SET role_id = (SELECT id FROM roles WHERE role_code = 'TEACHER')
WHERE u.user_type = 'teacher';

UPDATE users u
SET role_id = (SELECT id FROM roles WHERE role_code = 'PARENT')
WHERE u.user_type = 'parent';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
