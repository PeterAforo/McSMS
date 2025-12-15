-- Exam Management System Tables

-- Exam types
CREATE TABLE IF NOT EXISTS exam_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_type_name VARCHAR(100) NOT NULL,
    description TEXT,
    weight_percentage DECIMAL(5,2) DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Exams
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_name VARCHAR(255) NOT NULL,
    exam_type_id INT,
    academic_year VARCHAR(20),
    term_id INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
    instructions TEXT,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_type_id) REFERENCES exam_types(id),
    FOREIGN KEY (term_id) REFERENCES academic_terms(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Exam schedules (individual subject exams)
CREATE TABLE IF NOT EXISTS exam_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    room_id INT,
    max_marks DECIMAL(10,2) DEFAULT 100,
    pass_marks DECIMAL(10,2) DEFAULT 40,
    instructions TEXT,
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    UNIQUE KEY unique_exam_schedule (exam_id, class_id, subject_id),
    INDEX idx_date (exam_date),
    INDEX idx_class (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seating arrangements
CREATE TABLE IF NOT EXISTS exam_seating (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_schedule_id INT NOT NULL,
    student_id INT NOT NULL,
    room_id INT NOT NULL,
    seat_number VARCHAR(20),
    roll_number VARCHAR(50),
    status ENUM('assigned', 'present', 'absent', 'expelled') DEFAULT 'assigned',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    UNIQUE KEY unique_seating (exam_schedule_id, student_id),
    INDEX idx_room (room_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Invigilators
CREATE TABLE IF NOT EXISTS exam_invigilators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_schedule_id INT NOT NULL,
    teacher_id INT NOT NULL,
    room_id INT,
    role ENUM('chief', 'assistant', 'relief') DEFAULT 'assistant',
    status ENUM('assigned', 'confirmed', 'absent', 'replaced') DEFAULT 'assigned',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_schedule (exam_schedule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Exam results/marks
CREATE TABLE IF NOT EXISTS exam_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_schedule_id INT NOT NULL,
    student_id INT NOT NULL,
    marks_obtained DECIMAL(10,2),
    max_marks DECIMAL(10,2) DEFAULT 100,
    percentage DECIMAL(5,2),
    grade VARCHAR(5),
    remarks TEXT,
    status ENUM('pending', 'submitted', 'verified', 'published') DEFAULT 'pending',
    entered_by INT,
    verified_by INT,
    entry_date DATETIME,
    verification_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (entered_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    UNIQUE KEY unique_result (exam_schedule_id, student_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Exam attendance
CREATE TABLE IF NOT EXISTS exam_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_schedule_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('present', 'absent', 'late', 'expelled') DEFAULT 'present',
    arrival_time TIME,
    notes TEXT,
    marked_by INT,
    marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (marked_by) REFERENCES users(id),
    UNIQUE KEY unique_attendance (exam_schedule_id, student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Exam admit cards
CREATE TABLE IF NOT EXISTS exam_admit_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    admit_card_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE,
    photo_path VARCHAR(255),
    barcode VARCHAR(100),
    status ENUM('generated', 'issued', 'cancelled') DEFAULT 'generated',
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE KEY unique_admit_card (exam_id, student_id),
    INDEX idx_admit_number (admit_card_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Grade scales
CREATE TABLE IF NOT EXISTS grade_scales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scale_name VARCHAR(100) NOT NULL,
    min_percentage DECIMAL(5,2) NOT NULL,
    max_percentage DECIMAL(5,2) NOT NULL,
    grade VARCHAR(5) NOT NULL,
    grade_point DECIMAL(3,2),
    description VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_percentage (min_percentage, max_percentage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Exam statistics
CREATE TABLE IF NOT EXISTS exam_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_schedule_id INT NOT NULL,
    total_students INT DEFAULT 0,
    present_students INT DEFAULT 0,
    absent_students INT DEFAULT 0,
    highest_marks DECIMAL(10,2),
    lowest_marks DECIMAL(10,2),
    average_marks DECIMAL(10,2),
    pass_count INT DEFAULT 0,
    fail_count INT DEFAULT 0,
    pass_percentage DECIMAL(5,2),
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
    UNIQUE KEY unique_stats (exam_schedule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default exam types
INSERT INTO exam_types (exam_type_name, description, weight_percentage) VALUES
('Mid-Term Exam', 'Mid-term examination', 30.00),
('End-Term Exam', 'End of term examination', 70.00),
('Class Test', 'Regular class test', 10.00),
('Mock Exam', 'Practice examination', 0.00),
('Final Exam', 'Final examination', 100.00)
ON DUPLICATE KEY UPDATE exam_type_name = VALUES(exam_type_name);

-- Insert default grade scales
INSERT INTO grade_scales (scale_name, min_percentage, max_percentage, grade, grade_point, description) VALUES
('A+ Grade', 90.00, 100.00, 'A+', 4.00, 'Outstanding'),
('A Grade', 80.00, 89.99, 'A', 3.75, 'Excellent'),
('B+ Grade', 70.00, 79.99, 'B+', 3.50, 'Very Good'),
('B Grade', 60.00, 69.99, 'B', 3.00, 'Good'),
('C+ Grade', 50.00, 59.99, 'C+', 2.50, 'Above Average'),
('C Grade', 40.00, 49.99, 'C', 2.00, 'Average'),
('D Grade', 30.00, 39.99, 'D', 1.00, 'Below Average'),
('F Grade', 0.00, 29.99, 'F', 0.00, 'Fail')
ON DUPLICATE KEY UPDATE scale_name = VALUES(scale_name);
