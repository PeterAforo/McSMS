-- ============================================
-- Fix Pro Features Errors
-- ============================================

-- Fix 1: Add missing 'applications' table for Analytics
-- This table is referenced but wasn't in the core system
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    class_id INT,
    academic_year VARCHAR(20),
    term_id INT,
    application_date DATE,
    status ENUM('pending', 'approved', 'rejected', 'withdrawn') DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (term_id) REFERENCES terms(id),
    INDEX idx_status (status),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fix 2: Add branch_id column to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS branch_id INT DEFAULT 1 AFTER id,
ADD INDEX idx_branch (branch_id);

-- Fix 3: Add branch_id column to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS branch_id INT DEFAULT 1 AFTER id,
ADD INDEX idx_branch (branch_id);

-- Fix 4: Add branch_id column to employees table (if not exists)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS branch_id INT DEFAULT 1 AFTER id,
ADD INDEX idx_branch (branch_id);

-- Fix 5: Add branch_id column to classes table
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS branch_id INT DEFAULT 1 AFTER id,
ADD INDEX idx_branch (branch_id);

SELECT 'Fixes applied successfully!' as status;
SELECT 'Analytics API should now work' as fix1;
SELECT 'Multi-School API should now work' as fix2;
