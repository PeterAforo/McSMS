-- Biometric Integration System Tables

-- Biometric devices
CREATE TABLE IF NOT EXISTS biometric_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_name VARCHAR(255) NOT NULL,
    device_type ENUM('fingerprint', 'face_recognition', 'rfid', 'iris', 'palm') DEFAULT 'fingerprint',
    device_model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    ip_address VARCHAR(50),
    port INT,
    location VARCHAR(255),
    api_endpoint VARCHAR(500),
    api_key VARCHAR(255),
    status ENUM('active', 'inactive', 'maintenance', 'error') DEFAULT 'active',
    last_sync DATETIME,
    firmware_version VARCHAR(50),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_device_type (device_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Biometric enrollments (user biometric data)
CREATE TABLE IF NOT EXISTS biometric_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type ENUM('student', 'teacher', 'employee', 'parent') NOT NULL,
    device_id INT NOT NULL,
    biometric_type ENUM('fingerprint', 'face', 'rfid', 'iris', 'palm') NOT NULL,
    template_data LONGTEXT NOT NULL COMMENT 'Encrypted biometric template',
    template_hash VARCHAR(255),
    finger_position ENUM('left_thumb', 'left_index', 'left_middle', 'left_ring', 'left_pinky',
                         'right_thumb', 'right_index', 'right_middle', 'right_ring', 'right_pinky'),
    rfid_card_number VARCHAR(100),
    quality_score INT,
    enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_verified DATETIME,
    verification_count INT DEFAULT 0,
    status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
    expiry_date DATE,
    notes TEXT,
    FOREIGN KEY (device_id) REFERENCES biometric_devices(id),
    INDEX idx_user (user_id, user_type),
    INDEX idx_device (device_id),
    INDEX idx_rfid (rfid_card_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Biometric attendance logs
CREATE TABLE IF NOT EXISTS biometric_attendance_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    device_id INT NOT NULL,
    user_id INT NOT NULL,
    user_type ENUM('student', 'teacher', 'employee') NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time DATETIME,
    check_out_time DATETIME,
    verification_method ENUM('fingerprint', 'face', 'rfid', 'iris', 'palm', 'manual') NOT NULL,
    match_score DECIMAL(5,2),
    verification_status ENUM('success', 'failed', 'duplicate', 'rejected') DEFAULT 'success',
    location VARCHAR(255),
    temperature DECIMAL(4,1) COMMENT 'Body temperature if available',
    photo_path VARCHAR(255) COMMENT 'Captured photo during verification',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES biometric_enrollments(id),
    FOREIGN KEY (device_id) REFERENCES biometric_devices(id),
    INDEX idx_user (user_id, user_type),
    INDEX idx_date (attendance_date),
    INDEX idx_device (device_id),
    INDEX idx_status (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Access control rules
CREATE TABLE IF NOT EXISTS access_control_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    device_id INT,
    user_type ENUM('student', 'teacher', 'employee', 'parent', 'visitor', 'all') DEFAULT 'all',
    user_group VARCHAR(100) COMMENT 'Class, department, or custom group',
    access_type ENUM('entry', 'exit', 'both') DEFAULT 'both',
    allowed_days VARCHAR(100) DEFAULT 'Monday,Tuesday,Wednesday,Thursday,Friday',
    start_time TIME,
    end_time TIME,
    require_temperature_check BOOLEAN DEFAULT FALSE,
    max_temperature DECIMAL(4,1) DEFAULT 37.5,
    require_mask BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    priority INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES biometric_devices(id),
    INDEX idx_device (device_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Access logs
CREATE TABLE IF NOT EXISTS access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT,
    device_id INT NOT NULL,
    user_id INT,
    user_type ENUM('student', 'teacher', 'employee', 'parent', 'visitor', 'unknown'),
    access_type ENUM('entry', 'exit') NOT NULL,
    access_time DATETIME NOT NULL,
    verification_method ENUM('fingerprint', 'face', 'rfid', 'iris', 'palm', 'manual', 'override') NOT NULL,
    access_granted BOOLEAN DEFAULT TRUE,
    denial_reason VARCHAR(255),
    temperature DECIMAL(4,1),
    mask_detected BOOLEAN,
    photo_path VARCHAR(255),
    location VARCHAR(255),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES biometric_enrollments(id),
    FOREIGN KEY (device_id) REFERENCES biometric_devices(id),
    INDEX idx_user (user_id, user_type),
    INDEX idx_device (device_id),
    INDEX idx_time (access_time),
    INDEX idx_granted (access_granted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Visitor management
CREATE TABLE IF NOT EXISTS visitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    id_type ENUM('national_id', 'passport', 'drivers_license', 'other'),
    id_number VARCHAR(100),
    photo_path VARCHAR(255),
    purpose_of_visit TEXT NOT NULL,
    host_name VARCHAR(255),
    host_department VARCHAR(100),
    host_phone VARCHAR(20),
    expected_duration INT COMMENT 'Expected duration in minutes',
    check_in_time DATETIME,
    check_out_time DATETIME,
    actual_duration INT,
    visitor_badge_number VARCHAR(50),
    temperature DECIMAL(4,1),
    health_declaration BOOLEAN DEFAULT FALSE,
    status ENUM('scheduled', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_check_in (check_in_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Biometric sync queue
CREATE TABLE IF NOT EXISTS biometric_sync_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    sync_type ENUM('enrollment', 'attendance', 'access_log', 'full_sync') NOT NULL,
    data LONGTEXT NOT NULL,
    priority INT DEFAULT 0,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (device_id) REFERENCES biometric_devices(id),
    INDEX idx_status (status),
    INDEX idx_device (device_id),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Device health monitoring
CREATE TABLE IF NOT EXISTS device_health_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    check_time DATETIME NOT NULL,
    status ENUM('online', 'offline', 'error', 'maintenance') NOT NULL,
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    storage_usage DECIMAL(5,2),
    network_latency INT,
    error_count INT DEFAULT 0,
    last_error TEXT,
    uptime_seconds BIGINT,
    temperature DECIMAL(5,2),
    notes TEXT,
    FOREIGN KEY (device_id) REFERENCES biometric_devices(id),
    INDEX idx_device (device_id),
    INDEX idx_time (check_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Biometric audit trail
CREATE TABLE IF NOT EXISTS biometric_audit_trail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_type ENUM('enrollment', 'verification', 'deletion', 'update', 'access_grant', 'access_deny', 'device_config') NOT NULL,
    user_id INT,
    user_type VARCHAR(50),
    device_id INT,
    enrollment_id INT,
    performed_by INT,
    action_details TEXT,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    status ENUM('success', 'failed') DEFAULT 'success',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES biometric_devices(id),
    FOREIGN KEY (enrollment_id) REFERENCES biometric_enrollments(id),
    FOREIGN KEY (performed_by) REFERENCES users(id),
    INDEX idx_action (action_type),
    INDEX idx_user (user_id, user_type),
    INDEX idx_device (device_id),
    INDEX idx_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Temperature screening logs
CREATE TABLE IF NOT EXISTS temperature_screening_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    user_type ENUM('student', 'teacher', 'employee', 'visitor'),
    device_id INT,
    screening_time DATETIME NOT NULL,
    temperature DECIMAL(4,1) NOT NULL,
    status ENUM('normal', 'elevated', 'high') NOT NULL,
    action_taken ENUM('allowed', 'denied', 'referred') NOT NULL,
    symptoms TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES biometric_devices(id),
    INDEX idx_user (user_id, user_type),
    INDEX idx_time (screening_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample devices
INSERT INTO biometric_devices (device_name, device_type, location, status) VALUES
('Main Gate Fingerprint Scanner', 'fingerprint', 'Main Entrance', 'active'),
('Admin Block Face Recognition', 'face_recognition', 'Admin Building', 'active'),
('Student RFID Reader', 'rfid', 'Student Gate', 'active'),
('Staff Biometric Terminal', 'fingerprint', 'Staff Room', 'active')
ON DUPLICATE KEY UPDATE device_name = VALUES(device_name);

-- Insert default access control rules
INSERT INTO access_control_rules (rule_name, user_type, access_type, allowed_days, start_time, end_time, status) VALUES
('Student Entry Hours', 'student', 'entry', 'Monday,Tuesday,Wednesday,Thursday,Friday', '06:00:00', '08:00:00', 'active'),
('Staff All Day Access', 'teacher', 'both', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', '00:00:00', '23:59:59', 'active'),
('Employee Access', 'employee', 'both', 'Monday,Tuesday,Wednesday,Thursday,Friday', '07:00:00', '18:00:00', 'active')
ON DUPLICATE KEY UPDATE rule_name = VALUES(rule_name);
