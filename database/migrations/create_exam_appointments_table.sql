-- Exam/Interview Appointments Table
-- Allows admissions to set available dates and parents to confirm

CREATE TABLE IF NOT EXISTS exam_appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    appointment_type ENUM('exam', 'interview', 'both') NOT NULL DEFAULT 'exam',
    
    -- Available slots set by admin
    available_dates JSON,  -- Array of available date/time slots
    selected_date DATETIME,  -- Date selected/confirmed by parent
    
    -- Location details
    location VARCHAR(255),
    room VARCHAR(100),
    instructions TEXT,
    
    -- Subjects for exam
    subjects VARCHAR(500),
    
    -- Confirmation status
    admin_confirmed TINYINT(1) DEFAULT 0,
    parent_confirmed TINYINT(1) DEFAULT 0,
    confirmed_at DATETIME,
    
    -- Reminder tracking
    reminder_sent_24h TINYINT(1) DEFAULT 0,
    reminder_sent_1h TINYINT(1) DEFAULT 0,
    email_reminder_sent TINYINT(1) DEFAULT 0,
    sms_reminder_sent TINYINT(1) DEFAULT 0,
    
    -- Status
    status ENUM('pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
    
    -- Results (after exam/interview)
    result ENUM('passed', 'failed', 'pending') DEFAULT 'pending',
    score DECIMAL(5,2),
    feedback TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_application (application_id),
    INDEX idx_status (status),
    INDEX idx_selected_date (selected_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Appointment Reminders Queue
CREATE TABLE IF NOT EXISTS appointment_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    reminder_type ENUM('email', 'sms', 'push', 'in_app') NOT NULL,
    recipient_type ENUM('parent', 'admin') NOT NULL,
    recipient_id INT NOT NULL,
    recipient_contact VARCHAR(255),  -- email or phone
    scheduled_for DATETIME NOT NULL,
    sent_at DATETIME,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_scheduled (scheduled_for, status),
    INDEX idx_appointment (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
