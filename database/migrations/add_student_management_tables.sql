-- =====================================================
-- Enhanced Student Management Tables Migration
-- =====================================================

-- =====================================================
-- 1. STUDENT DOCUMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS student_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    document_type ENUM('birth_certificate', 'passport', 'id_card', 'report_card', 'transfer_letter', 'medical_record', 'immunization', 'photo', 'other') NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    file_type VARCHAR(50),
    description TEXT,
    uploaded_by INT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INT,
    verified_at DATETIME,
    expiry_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_docs (student_id, document_type)
);

-- =====================================================
-- 2. STUDENT PROMOTIONS / CLASS TRANSFERS
-- =====================================================

CREATE TABLE IF NOT EXISTS student_promotions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    from_class_id INT,
    to_class_id INT,
    from_academic_year VARCHAR(20),
    to_academic_year VARCHAR(20),
    promotion_type ENUM('promotion', 'demotion', 'transfer', 'repeat') NOT NULL,
    reason TEXT,
    promoted_by INT,
    promotion_date DATE NOT NULL,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (from_class_id) REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (to_class_id) REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (promoted_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_promotions (student_id, promotion_date)
);

-- =====================================================
-- 3. STUDENT TIMELINE / ACTIVITY HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS student_timeline (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    event_type ENUM('admission', 'promotion', 'transfer', 'suspension', 'graduation', 'award', 'discipline', 'medical', 'fee_payment', 'exam_result', 'attendance', 'document', 'note', 'other') NOT NULL,
    event_title VARCHAR(255) NOT NULL,
    event_description TEXT,
    event_date DATE NOT NULL,
    reference_type VARCHAR(50),
    reference_id INT,
    is_important BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_timeline (student_id, event_date)
);

-- =====================================================
-- 4. STUDENT IMPORT LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS student_import_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    imported_by INT NOT NULL,
    file_name VARCHAR(255),
    total_records INT DEFAULT 0,
    successful_imports INT DEFAULT 0,
    failed_imports INT DEFAULT 0,
    error_details JSON,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (imported_by) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 5. STUDENT ID CARDS
-- =====================================================

CREATE TABLE IF NOT EXISTS student_id_cards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL UNIQUE,
    card_number VARCHAR(50) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status ENUM('active', 'expired', 'lost', 'replaced', 'cancelled') DEFAULT 'active',
    barcode VARCHAR(100),
    qr_code VARCHAR(500),
    photo_path VARCHAR(500),
    issued_by INT,
    replaced_card_id INT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (replaced_card_id) REFERENCES student_id_cards(id) ON DELETE SET NULL,
    INDEX idx_card_number (card_number),
    INDEX idx_card_status (status)
);

-- =====================================================
-- 6. STUDENT AWARDS / ACHIEVEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS student_awards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    award_type ENUM('academic', 'sports', 'arts', 'leadership', 'community', 'attendance', 'behavior', 'other') NOT NULL,
    award_name VARCHAR(255) NOT NULL,
    description TEXT,
    award_date DATE NOT NULL,
    academic_year VARCHAR(20),
    term VARCHAR(20),
    certificate_path VARCHAR(500),
    awarded_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (awarded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_awards (student_id, award_date)
);

-- =====================================================
-- 7. STUDENT DISCIPLINE RECORDS
-- =====================================================

CREATE TABLE IF NOT EXISTS student_discipline (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    incident_type ENUM('minor', 'moderate', 'major', 'severe') NOT NULL,
    incident_category ENUM('attendance', 'behavior', 'academic_dishonesty', 'bullying', 'property_damage', 'dress_code', 'substance', 'violence', 'other') NOT NULL,
    incident_date DATE NOT NULL,
    incident_time TIME,
    location VARCHAR(255),
    description TEXT NOT NULL,
    witnesses TEXT,
    action_taken ENUM('warning', 'detention', 'suspension', 'expulsion', 'parent_meeting', 'counseling', 'community_service', 'other') NOT NULL,
    action_details TEXT,
    suspension_start DATE,
    suspension_end DATE,
    parent_notified BOOLEAN DEFAULT FALSE,
    parent_notified_date DATE,
    reported_by INT,
    handled_by INT,
    status ENUM('open', 'under_review', 'resolved', 'appealed') DEFAULT 'open',
    resolution_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_discipline (student_id, incident_date)
);

-- =====================================================
-- 8. STUDENT MEDICAL RECORDS
-- =====================================================

CREATE TABLE IF NOT EXISTS student_medical_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    record_type ENUM('checkup', 'vaccination', 'illness', 'injury', 'allergy', 'medication', 'surgery', 'other') NOT NULL,
    record_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    doctor_name VARCHAR(255),
    hospital_clinic VARCHAR(255),
    diagnosis TEXT,
    treatment TEXT,
    medications TEXT,
    follow_up_date DATE,
    attachments JSON,
    recorded_by INT,
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_medical (student_id, record_date)
);

-- =====================================================
-- 9. PARENT-STUDENT LINKING
-- =====================================================

CREATE TABLE IF NOT EXISTS parent_student_links (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_id INT NOT NULL,
    student_id INT NOT NULL,
    relationship ENUM('father', 'mother', 'guardian', 'grandparent', 'sibling', 'other') NOT NULL,
    is_primary_contact BOOLEAN DEFAULT FALSE,
    is_emergency_contact BOOLEAN DEFAULT FALSE,
    can_pickup BOOLEAN DEFAULT TRUE,
    has_custody BOOLEAN DEFAULT TRUE,
    notes TEXT,
    linked_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_parent_student (parent_id, student_id),
    INDEX idx_student_parents (student_id),
    INDEX idx_parent_students (parent_id)
);

-- =====================================================
-- 10. STUDENT NOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS student_notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    note_type ENUM('general', 'academic', 'behavioral', 'medical', 'counseling', 'parent_communication', 'other') NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_notes (student_id, note_type)
);

-- =====================================================
-- ADD NEW COLUMNS TO STUDENTS TABLE
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS enhance_students_table//

CREATE PROCEDURE enhance_students_table()
BEGIN
    -- Add profile_picture column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'profile_picture') THEN
        ALTER TABLE students ADD COLUMN profile_picture VARCHAR(500) DEFAULT NULL;
    END IF;
    
    -- Add parent_id column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'parent_id') THEN
        ALTER TABLE students ADD COLUMN parent_id INT DEFAULT NULL;
    END IF;
    
    -- Add academic_year column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'academic_year') THEN
        ALTER TABLE students ADD COLUMN academic_year VARCHAR(20) DEFAULT NULL;
    END IF;
    
    -- Add term column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'term') THEN
        ALTER TABLE students ADD COLUMN term VARCHAR(20) DEFAULT NULL;
    END IF;
    
    -- Add graduation_date column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'graduation_date') THEN
        ALTER TABLE students ADD COLUMN graduation_date DATE DEFAULT NULL;
    END IF;
    
    -- Add withdrawal_date column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'withdrawal_date') THEN
        ALTER TABLE students ADD COLUMN withdrawal_date DATE DEFAULT NULL;
    END IF;
    
    -- Add withdrawal_reason column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'withdrawal_reason') THEN
        ALTER TABLE students ADD COLUMN withdrawal_reason TEXT DEFAULT NULL;
    END IF;
    
    -- Add special_needs column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'special_needs') THEN
        ALTER TABLE students ADD COLUMN special_needs TEXT DEFAULT NULL;
    END IF;
    
    -- Add transportation column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'transportation') THEN
        ALTER TABLE students ADD COLUMN transportation ENUM('school_bus', 'parent', 'self', 'other') DEFAULT NULL;
    END IF;
    
    -- Add bus_route column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'bus_route') THEN
        ALTER TABLE students ADD COLUMN bus_route VARCHAR(100) DEFAULT NULL;
    END IF;
    
    -- Add hostel_id column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'hostel_id') THEN
        ALTER TABLE students ADD COLUMN hostel_id INT DEFAULT NULL;
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'updated_at') THEN
        ALTER TABLE students ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
    END IF;
END//

DELIMITER ;

CALL enhance_students_table();

DROP PROCEDURE IF EXISTS enhance_students_table;

-- =====================================================
-- INSERT SAMPLE DOCUMENT TYPES
-- =====================================================

-- Document types are defined in the ENUM, no separate table needed

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Add index on students table if not exists
-- These are safe to run multiple times
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);
