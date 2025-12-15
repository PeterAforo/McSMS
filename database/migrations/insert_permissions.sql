-- ============================================
-- INSERT PERMISSIONS - Phase 2
-- ============================================
-- This script inserts 62+ granular permissions

-- ============================================
-- STUDENTS MODULE (6 permissions)
-- ============================================
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('students.view', 'View Students', 'View student records and information', 'students'),
('students.create', 'Create Students', 'Add new student records', 'students'),
('students.edit', 'Edit Students', 'Modify student information', 'students'),
('students.delete', 'Delete Students', 'Remove student records', 'students'),
('students.documents', 'Manage Documents', 'Upload and manage student documents', 'students'),
('students.transfer', 'Manage Transfers', 'Handle student transfers and withdrawals', 'students');

-- ============================================
-- FINANCE MODULE (11 permissions)
-- ============================================
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

-- ============================================
-- ACADEMIC MODULE (10 permissions)
-- ============================================
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

-- ============================================
-- ATTENDANCE MODULE (3 permissions)
-- ============================================
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('attendance.view', 'View Attendance', 'View attendance records', 'attendance'),
('attendance.mark', 'Mark Attendance', 'Mark student attendance', 'attendance'),
('attendance.reports', 'Attendance Reports', 'Generate attendance reports', 'attendance');

-- ============================================
-- ADMISSIONS MODULE (3 permissions)
-- ============================================
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('admissions.view', 'View Admissions', 'View admission applications', 'admissions'),
('admissions.process', 'Process Admissions', 'Process admission applications', 'admissions'),
('admissions.approve', 'Approve Admissions', 'Approve admission applications', 'admissions');

-- ============================================
-- TRANSPORT MODULE (4 permissions)
-- ============================================
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('transport.view', 'View Transport', 'View transport information', 'transport'),
('transport.manage', 'Manage Transport', 'Manage buses and routes', 'transport'),
('transport.students', 'Assign Students', 'Assign students to buses', 'transport'),
('transport.payments', 'Transport Payments', 'View transport payment status', 'transport');

-- ============================================
-- MEDICAL MODULE (4 permissions)
-- ============================================
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('medical.view', 'View Medical Records', 'View student medical records', 'medical'),
('medical.edit', 'Edit Medical Records', 'Update medical information', 'medical'),
('medical.clinic', 'Clinic Visits', 'Record clinic visits', 'medical'),
('medical.reports', 'Medical Reports', 'Generate medical reports', 'medical');

-- ============================================
-- LIBRARY MODULE (4 permissions)
-- ============================================
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('library.view', 'View Library', 'View library catalog', 'library'),
('library.manage', 'Manage Library', 'Manage books and resources', 'library'),
('library.checkout', 'Checkout Books', 'Check-in and check-out books', 'library'),
('library.fines', 'Manage Fines', 'Manage library fines', 'library');

-- ============================================
-- HOSTEL MODULE (4 permissions)
-- ============================================
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('hostel.view', 'View Hostel', 'View hostel information', 'hostel'),
('hostel.manage', 'Manage Hostel', 'Manage hostel operations', 'hostel'),
('hostel.students', 'Hostel Students', 'Manage boarding students', 'hostel'),
('hostel.payments', 'Hostel Payments', 'View hostel payment status', 'hostel');

-- ============================================
-- SYSTEM MODULE (6 permissions)
-- ============================================
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('system.users.view', 'View Users', 'View system users', 'system'),
('system.users.manage', 'Manage Users', 'Create and manage users', 'system'),
('system.settings.view', 'View Settings', 'View system settings', 'system'),
('system.settings.edit', 'Edit Settings', 'Modify system settings', 'system'),
('system.logs', 'View Logs', 'View system logs', 'system'),
('system.support', 'System Support', 'Provide system support', 'system');

-- ============================================
-- REPORTS MODULE (4 permissions)
-- ============================================
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('reports.academic', 'Academic Reports', 'Generate academic reports', 'reports'),
('reports.financial', 'Financial Reports', 'Generate financial reports', 'reports'),
('reports.executive', 'Executive Reports', 'View executive dashboards', 'reports'),
('reports.custom', 'Custom Reports', 'Create custom reports', 'reports');

-- ============================================
-- COMMUNICATION MODULE (3 permissions)
-- ============================================
INSERT INTO permissions (permission_key, permission_name, description, module) VALUES
('communication.view', 'View Messages', 'View communications', 'communication'),
('communication.send', 'Send Messages', 'Send messages to parents/staff', 'communication'),
('communication.announcements', 'Manage Announcements', 'Create school-wide announcements', 'communication');

-- ============================================
-- TOTAL: 62 PERMISSIONS INSERTED
-- ============================================
