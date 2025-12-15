-- ============================================
-- ASSIGN PERMISSIONS TO ROLES
-- ============================================

-- ============================================
-- 1. SUPER ADMIN - ALL PERMISSIONS
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'SUPER_ADMIN'),
  id
FROM permissions;

-- ============================================
-- 2. ADMIN - MOST PERMISSIONS (except some system)
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'ADMIN'),
  id
FROM permissions
WHERE permission_key NOT IN ('system.settings.edit');

-- ============================================
-- 3. PRINCIPAL - Executive access
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'PRINCIPAL'),
  id
FROM permissions
WHERE permission_key IN (
  'students.view', 'academic.view', 'academic.results.view', 'academic.grades.approve',
  'academic.promotions', 'attendance.view', 'attendance.reports',
  'finance.view', 'finance.reports', 'admissions.view', 'admissions.approve',
  'reports.academic', 'reports.financial', 'reports.executive',
  'communication.view', 'communication.announcements', 'system.users.view'
);

-- ============================================
-- 4. VICE PRINCIPAL - Similar to Principal
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'VICE_PRINCIPAL'),
  id
FROM permissions
WHERE permission_key IN (
  'students.view', 'academic.view', 'academic.results.view', 'academic.grades.approve',
  'attendance.view', 'attendance.reports',
  'finance.view', 'admissions.view',
  'reports.academic', 'reports.financial', 'communication.view', 'communication.send'
);

-- ============================================
-- 5. TEACHER - Teaching & Grading
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'TEACHER'),
  id
FROM permissions
WHERE permission_key IN (
  'students.view', 'academic.view', 'academic.grades.enter', 'academic.results.view',
  'attendance.view', 'attendance.mark', 'communication.view', 'communication.send'
);

-- ============================================
-- 6. HEAD OF SECTION - Department oversight
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'HEAD_SECTION'),
  id
FROM permissions
WHERE permission_key IN (
  'students.view', 'academic.view', 'academic.classes.manage', 'academic.grades.approve',
  'academic.results.view', 'academic.results.print', 'attendance.view', 'attendance.reports',
  'reports.academic', 'communication.view', 'communication.send'
);

-- ============================================
-- 7. EXAM OFFICER - Exams & Results
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'EXAM_OFFICER'),
  id
FROM permissions
WHERE permission_key IN (
  'students.view', 'academic.view', 'academic.exams.manage', 'academic.grades.approve',
  'academic.results.view', 'academic.results.print', 'academic.promotions',
  'reports.academic'
);

-- ============================================
-- 8. FINANCE STAFF - Full finance access
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'FINANCE'),
  id
FROM permissions
WHERE module = 'finance' OR permission_key IN ('students.view', 'reports.financial');

-- ============================================
-- 9. CASHIER - Payment recording only
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'CASHIER'),
  id
FROM permissions
WHERE permission_key IN (
  'finance.view', 'finance.payments.record', 'finance.invoices.view',
  'finance.receipts.print', 'students.view'
);

-- ============================================
-- 10. ADMISSIONS OFFICER - Admissions
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'ADMISSIONS'),
  id
FROM permissions
WHERE permission_key IN (
  'students.view', 'students.create', 'students.edit', 'students.documents',
  'admissions.view', 'admissions.process', 'communication.view', 'communication.send'
);

-- ============================================
-- 11. ADMINISTRATIVE STAFF - Student records
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'ADMIN_STAFF'),
  id
FROM permissions
WHERE permission_key IN (
  'students.view', 'students.edit', 'students.documents', 'students.transfer',
  'admissions.view', 'admissions.process', 'communication.view'
);

-- ============================================
-- 12. RECEPTIONIST - Front desk
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'RECEPTIONIST'),
  id
FROM permissions
WHERE permission_key IN (
  'students.view', 'attendance.view', 'communication.view'
);

-- ============================================
-- 13. ICT OFFICER - System support
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'ICT_OFFICER'),
  id
FROM permissions
WHERE permission_key IN (
  'system.users.view', 'system.users.manage', 'system.settings.view',
  'system.logs', 'system.support'
);

-- ============================================
-- 14. TRANSPORT MANAGER - Transport
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'TRANSPORT_MGR'),
  id
FROM permissions
WHERE module = 'transport' OR permission_key IN ('students.view', 'communication.send');

-- ============================================
-- 15. SCHOOL NURSE - Medical
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'NURSE'),
  id
FROM permissions
WHERE module = 'medical' OR permission_key IN ('students.view', 'communication.send');

-- ============================================
-- 16. LIBRARIAN - Library
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'LIBRARIAN'),
  id
FROM permissions
WHERE module = 'library' OR permission_key IN ('students.view');

-- ============================================
-- 17. HOSTEL MASTER - Hostel
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'HOSTEL_MASTER'),
  id
FROM permissions
WHERE module = 'hostel' OR permission_key IN ('students.view', 'attendance.view', 'communication.send');

-- ============================================
-- 18. PARENT - Limited access
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'PARENT'),
  id
FROM permissions
WHERE permission_key IN (
  'students.view', 'academic.results.view', 'attendance.view',
  'finance.view', 'finance.invoices.view', 'finance.payments.record',
  'communication.view'
);

-- ============================================
-- PERMISSIONS ASSIGNMENT COMPLETE
-- ============================================
