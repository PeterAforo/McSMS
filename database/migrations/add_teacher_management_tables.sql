-- Teacher Management Enhancement Tables
-- Run this migration to add enhanced teacher management features

-- Add new columns to teachers table if they don't exist
DELIMITER //
CREATE PROCEDURE AddTeacherColumns()
BEGIN
    -- Profile picture
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'profile_picture') THEN
        ALTER TABLE teachers ADD COLUMN profile_picture VARCHAR(255) NULL;
    END IF;
    
    -- National ID
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'national_id') THEN
        ALTER TABLE teachers ADD COLUMN national_id VARCHAR(50) NULL;
    END IF;
    
    -- Emergency contact
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'emergency_contact_name') THEN
        ALTER TABLE teachers ADD COLUMN emergency_contact_name VARCHAR(100) NULL;
    END IF;
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'emergency_contact_phone') THEN
        ALTER TABLE teachers ADD COLUMN emergency_contact_phone VARCHAR(20) NULL;
    END IF;
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'emergency_contact_relationship') THEN
        ALTER TABLE teachers ADD COLUMN emergency_contact_relationship VARCHAR(50) NULL;
    END IF;
    
    -- Bank details
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'bank_name') THEN
        ALTER TABLE teachers ADD COLUMN bank_name VARCHAR(100) NULL;
    END IF;
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'bank_account_number') THEN
        ALTER TABLE teachers ADD COLUMN bank_account_number VARCHAR(50) NULL;
    END IF;
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'bank_branch') THEN
        ALTER TABLE teachers ADD COLUMN bank_branch VARCHAR(100) NULL;
    END IF;
    
    -- Salary info
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'salary') THEN
        ALTER TABLE teachers ADD COLUMN salary DECIMAL(10,2) NULL;
    END IF;
    
    -- Contract dates
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'contract_start_date') THEN
        ALTER TABLE teachers ADD COLUMN contract_start_date DATE NULL;
    END IF;
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'contract_end_date') THEN
        ALTER TABLE teachers ADD COLUMN contract_end_date DATE NULL;
    END IF;
    
    -- Bio
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'bio') THEN
        ALTER TABLE teachers ADD COLUMN bio TEXT NULL;
    END IF;
    
    -- Updated timestamp
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'updated_at') THEN
        ALTER TABLE teachers ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
    END IF;
END //
DELIMITER ;

CALL AddTeacherColumns();
DROP PROCEDURE IF EXISTS AddTeacherColumns;

-- Teacher Documents Table
CREATE TABLE IF NOT EXISTS teacher_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    document_type ENUM('cv', 'certificate', 'id_card', 'contract', 'qualification', 'reference', 'medical', 'other') NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NULL,
    uploaded_by INT NULL,
    notes TEXT NULL,
    expiry_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- Teacher Leave Management Table
CREATE TABLE IF NOT EXISTS teacher_leaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    leave_type ENUM('annual', 'sick', 'maternity', 'paternity', 'unpaid', 'study', 'emergency', 'other') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    approved_by INT NULL,
    approved_date DATETIME NULL,
    rejection_reason TEXT NULL,
    attachment VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- Teacher Leave Balance Table
CREATE TABLE IF NOT EXISTS teacher_leave_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    annual_leave_total INT DEFAULT 21,
    annual_leave_used INT DEFAULT 0,
    sick_leave_total INT DEFAULT 10,
    sick_leave_used INT DEFAULT 0,
    maternity_leave_total INT DEFAULT 90,
    maternity_leave_used INT DEFAULT 0,
    paternity_leave_total INT DEFAULT 14,
    paternity_leave_used INT DEFAULT 0,
    study_leave_total INT DEFAULT 5,
    study_leave_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_teacher_year (teacher_id, academic_year),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- Teacher Performance/Evaluation Table
CREATE TABLE IF NOT EXISTS teacher_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    term VARCHAR(20) NOT NULL,
    evaluator_id INT NULL,
    evaluation_date DATE NOT NULL,
    
    -- Performance Metrics (1-5 scale)
    teaching_quality INT CHECK (teaching_quality BETWEEN 1 AND 5),
    classroom_management INT CHECK (classroom_management BETWEEN 1 AND 5),
    student_engagement INT CHECK (student_engagement BETWEEN 1 AND 5),
    lesson_planning INT CHECK (lesson_planning BETWEEN 1 AND 5),
    punctuality INT CHECK (punctuality BETWEEN 1 AND 5),
    professionalism INT CHECK (professionalism BETWEEN 1 AND 5),
    communication INT CHECK (communication BETWEEN 1 AND 5),
    teamwork INT CHECK (teamwork BETWEEN 1 AND 5),
    
    overall_rating DECIMAL(3,2) NULL,
    strengths TEXT NULL,
    areas_for_improvement TEXT NULL,
    goals TEXT NULL,
    comments TEXT NULL,
    teacher_response TEXT NULL,
    
    status ENUM('draft', 'submitted', 'acknowledged') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- Teacher Schedule/Workload Table
CREATE TABLE IF NOT EXISTS teacher_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    term VARCHAR(20) NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    period_number INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    class_id INT NULL,
    subject_id INT NULL,
    room VARCHAR(50) NULL,
    schedule_type ENUM('teaching', 'free', 'duty', 'meeting', 'other') DEFAULT 'teaching',
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- Teacher Qualifications/Certifications Table
CREATE TABLE IF NOT EXISTS teacher_qualifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    qualification_type ENUM('degree', 'diploma', 'certificate', 'license', 'training', 'workshop', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    year_obtained INT NOT NULL,
    grade VARCHAR(50) NULL,
    document_path VARCHAR(500) NULL,
    expiry_date DATE NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INT NULL,
    verified_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- Teacher Awards/Recognition Table
CREATE TABLE IF NOT EXISTS teacher_awards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    award_type ENUM('excellence', 'innovation', 'service', 'leadership', 'performance', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    awarded_by VARCHAR(255) NULL,
    award_date DATE NOT NULL,
    certificate_path VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- Teacher Notes (internal admin notes)
CREATE TABLE IF NOT EXISTS teacher_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    note_type ENUM('general', 'performance', 'disciplinary', 'commendation', 'meeting', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_confidential BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- Teacher Timeline/Activity Log
CREATE TABLE IF NOT EXISTS teacher_timeline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    event_type ENUM('hired', 'promoted', 'leave', 'evaluation', 'award', 'training', 'warning', 'contract_renewed', 'status_change', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    event_date DATE NOT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- Teacher ID Cards Table
CREATE TABLE IF NOT EXISTS teacher_id_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    card_number VARCHAR(50) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    photo_path VARCHAR(500) NULL,
    status ENUM('active', 'expired', 'lost', 'replaced') DEFAULT 'active',
    printed_by INT NULL,
    printed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- Insert sample timeline entry for existing teachers
INSERT INTO teacher_timeline (teacher_id, event_type, title, description, event_date, created_at)
SELECT id, 'hired', 'Joined the school', CONCAT('Started as ', COALESCE(employment_type, 'full-time'), ' teacher'), COALESCE(hire_date, CURDATE()), NOW()
FROM teachers
WHERE id NOT IN (SELECT DISTINCT teacher_id FROM teacher_timeline WHERE event_type = 'hired');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_leaves_teacher ON teacher_leaves(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_leaves_status ON teacher_leaves(status);
CREATE INDEX IF NOT EXISTS idx_teacher_evaluations_teacher ON teacher_evaluations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_teacher ON teacher_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_timeline_teacher ON teacher_timeline(teacher_id);
