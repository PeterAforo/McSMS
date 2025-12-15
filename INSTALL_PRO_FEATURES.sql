-- ============================================
-- McSMS Pro Features - Master Installation Script
-- ============================================
-- This script will install ALL Pro feature tables
-- Run this in phpMyAdmin or MySQL command line
-- ============================================

-- Display installation start
SELECT '========================================' as '';
SELECT 'McSMS Pro Features Installation' as '';
SELECT 'Starting installation...' as '';
SELECT '========================================' as '';

-- PHASE 1: Mobile Support
SELECT 'Installing Phase 1: Mobile Support...' as '';
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_mobile_support.sql;
SELECT '✓ Phase 1 Complete' as '';

-- PHASE 2.1: Timetable Management
SELECT 'Installing Phase 2.1: Timetable Management...' as '';
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_timetable_tables.sql;
SELECT '✓ Phase 2.1 Complete' as '';

-- PHASE 2.2: Exam Management
SELECT 'Installing Phase 2.2: Exam Management...' as '';
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_exam_management_tables.sql;
SELECT '✓ Phase 2.2 Complete' as '';

-- PHASE 2.3: Learning Management System
SELECT 'Installing Phase 2.3: LMS...' as '';
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_lms_tables.sql;
SELECT '✓ Phase 2.3 Complete' as '';

-- PHASE 3.1: Transport Management
SELECT 'Installing Phase 3.1: Transport Management...' as '';
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_transport_management_tables.sql;
SELECT '✓ Phase 3.1 Complete' as '';

-- PHASE 3.2: HR & Payroll
SELECT 'Installing Phase 3.2: HR & Payroll...' as '';
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_hr_payroll_tables.sql;
SELECT '✓ Phase 3.2 Complete' as '';

-- PHASE 3.3: Biometric Integration
SELECT 'Installing Phase 3.3: Biometric Integration...' as '';
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_biometric_integration_tables.sql;
SELECT '✓ Phase 3.3 Complete' as '';

-- PHASE 3.4: Multi-School Management
SELECT 'Installing Phase 3.4: Multi-School Management...' as '';
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_multi_school_tables.sql;
SELECT '✓ Phase 3.4 Complete' as '';

-- PHASE 3.5: AI Features
SELECT 'Installing Phase 3.5: AI Features...' as '';
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_ai_features_tables.sql;
SELECT '✓ Phase 3.5 Complete' as '';

-- Display completion summary
SELECT '========================================' as '';
SELECT 'Installation Complete!' as '';
SELECT '========================================' as '';
SELECT 'Installed Modules:' as '';
SELECT '✓ Mobile Support (6 tables)' as '';
SELECT '✓ Timetable Management (7 tables)' as '';
SELECT '✓ Exam Management (10 tables)' as '';
SELECT '✓ Learning Management System (17 tables)' as '';
SELECT '✓ Transport Management (12 tables)' as '';
SELECT '✓ HR & Payroll (17 tables)' as '';
SELECT '✓ Biometric Integration (11 tables)' as '';
SELECT '✓ Multi-School Management (10 tables)' as '';
SELECT '✓ AI Features (11 tables)' as '';
SELECT '========================================' as '';
SELECT 'Total: 100+ tables installed' as '';
SELECT 'All Pro Features are now ready to use!' as '';
SELECT '========================================' as '';
