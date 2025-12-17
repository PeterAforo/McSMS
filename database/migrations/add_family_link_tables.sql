-- Family Link Tables for Multi-Parent Support
-- Run this migration to enable multiple parents per child

-- Student Guardians Table - Links multiple parents to students
CREATE TABLE IF NOT EXISTS student_guardians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    parent_id INT NOT NULL,
    relationship ENUM('father', 'mother', 'guardian', 'grandparent', 'uncle', 'aunt', 'other') DEFAULT 'guardian',
    is_primary BOOLEAN DEFAULT FALSE,
    can_pickup BOOLEAN DEFAULT TRUE,
    receives_notifications BOOLEAN DEFAULT TRUE,
    receives_reports BOOLEAN DEFAULT TRUE,
    emergency_contact BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_guardian (student_id, parent_id),
    INDEX idx_student (student_id),
    INDEX idx_parent (parent_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Family Link Codes Table - For secure parent linking
CREATE TABLE IF NOT EXISTS family_link_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    student_id INT NOT NULL,
    generated_by INT NOT NULL,
    used_by INT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    status ENUM('active', 'used', 'expired', 'revoked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_student (student_id),
    INDEX idx_status (status),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Migrate existing parent_id relationships to student_guardians
-- This preserves existing parent-child links
INSERT IGNORE INTO student_guardians (student_id, parent_id, relationship, is_primary, can_pickup, receives_notifications)
SELECT id, parent_id, 'guardian', TRUE, TRUE, TRUE
FROM students 
WHERE parent_id IS NOT NULL AND parent_id > 0;

-- Create index on students.parent_id if not exists (for backward compatibility)
-- ALTER TABLE students ADD INDEX idx_parent_id (parent_id);
