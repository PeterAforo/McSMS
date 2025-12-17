-- =====================================================
-- Student Guardians Table Migration
-- Supports multiple parents/guardians per child
-- =====================================================

-- Student Guardians - Links multiple parents to children
CREATE TABLE IF NOT EXISTS student_guardians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    parent_id INT NOT NULL,
    relationship ENUM('father', 'mother', 'guardian', 'grandparent', 'step_parent', 'other') NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    can_pickup BOOLEAN DEFAULT TRUE,
    emergency_contact BOOLEAN DEFAULT TRUE,
    receives_notifications BOOLEAN DEFAULT TRUE,
    receives_reports BOOLEAN DEFAULT TRUE,
    receives_fee_alerts BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    UNIQUE KEY unique_guardian (child_id, parent_id),
    INDEX idx_parent (parent_id),
    INDEX idx_child (child_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Family Link Codes - For second parent to link to existing child
CREATE TABLE IF NOT EXISTS family_link_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    link_code VARCHAR(20) NOT NULL UNIQUE,
    created_by INT NOT NULL,
    expires_at DATETIME NOT NULL,
    used_by INT NULL,
    used_at DATETIME NULL,
    status ENUM('active', 'used', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (used_by) REFERENCES parents(id) ON DELETE SET NULL,
    INDEX idx_link_code (link_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Parent Notification Preferences
CREATE TABLE IF NOT EXISTS parent_notification_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    notification_type ENUM('attendance', 'grades', 'homework', 'fees', 'announcements', 'messages', 'events') NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    UNIQUE KEY unique_pref (parent_id, notification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Parent-Teacher Meeting Requests
CREATE TABLE IF NOT EXISTS meeting_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    teacher_id INT NOT NULL,
    student_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT,
    preferred_date DATE,
    preferred_time TIME,
    status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    meeting_date DATE,
    meeting_time TIME,
    meeting_location VARCHAR(255),
    meeting_link VARCHAR(500),
    teacher_notes TEXT,
    parent_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_parent (parent_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- School Events
CREATE TABLE IF NOT EXISTS school_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type ENUM('holiday', 'exam', 'meeting', 'sports', 'cultural', 'academic', 'other') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    is_all_day BOOLEAN DEFAULT FALSE,
    target_audience ENUM('all', 'students', 'parents', 'teachers', 'specific_class') DEFAULT 'all',
    target_class_id INT NULL,
    requires_rsvp BOOLEAN DEFAULT FALSE,
    max_attendees INT NULL,
    created_by INT,
    status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (target_class_id) REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_dates (start_date, end_date),
    INDEX idx_type (event_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Event RSVPs
CREATE TABLE IF NOT EXISTS event_rsvps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    parent_id INT NOT NULL,
    student_id INT,
    response ENUM('attending', 'not_attending', 'maybe') NOT NULL,
    attendee_count INT DEFAULT 1,
    notes TEXT,
    responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES school_events(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    UNIQUE KEY unique_rsvp (event_id, parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Report Card Acknowledgments
CREATE TABLE IF NOT EXISTS report_acknowledgments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    parent_id INT NOT NULL,
    academic_term VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    digital_signature TEXT,
    ip_address VARCHAR(45),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    UNIQUE KEY unique_ack (student_id, parent_id, academic_term, academic_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migrate existing children to student_guardians
-- This will link existing children to their parent_id as primary guardian
INSERT IGNORE INTO student_guardians (child_id, parent_id, relationship, is_primary, can_pickup, emergency_contact, receives_notifications, receives_reports, receives_fee_alerts)
SELECT id, parent_id, 'guardian', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE
FROM children
WHERE parent_id IS NOT NULL;
