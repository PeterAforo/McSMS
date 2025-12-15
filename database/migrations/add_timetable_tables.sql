-- Timetable Management Tables

-- Time slots (periods)
CREATE TABLE IF NOT EXISTS time_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slot_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_order INT NOT NULL,
    is_break TINYINT(1) DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order (slot_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Timetable templates
CREATE TABLE IF NOT EXISTS timetable_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    academic_year VARCHAR(20),
    term_id INT,
    status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (term_id) REFERENCES academic_terms(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Timetable entries
CREATE TABLE IF NOT EXISTS timetable_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    time_slot_id INT NOT NULL,
    room_number VARCHAR(50),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES timetable_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (time_slot_id) REFERENCES time_slots(id),
    UNIQUE KEY unique_slot (template_id, class_id, day_of_week, time_slot_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_class (class_id),
    INDEX idx_day (day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Teacher substitutions
CREATE TABLE IF NOT EXISTS teacher_substitutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timetable_entry_id INT NOT NULL,
    original_teacher_id INT NOT NULL,
    substitute_teacher_id INT NOT NULL,
    substitution_date DATE NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (timetable_entry_id) REFERENCES timetable_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (original_teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (substitute_teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_date (substitution_date),
    INDEX idx_substitute (substitute_teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rooms/Venues
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(50) NOT NULL UNIQUE,
    room_name VARCHAR(255),
    room_type ENUM('classroom', 'lab', 'library', 'hall', 'sports', 'other') DEFAULT 'classroom',
    capacity INT,
    facilities TEXT,
    status ENUM('available', 'maintenance', 'unavailable') DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Timetable conflicts log
CREATE TABLE IF NOT EXISTS timetable_conflicts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    conflict_type ENUM('teacher_double_booking', 'room_double_booking', 'class_double_booking') NOT NULL,
    entry_id_1 INT NOT NULL,
    entry_id_2 INT NOT NULL,
    conflict_details JSON,
    resolved TINYINT(1) DEFAULT 0,
    resolved_at DATETIME,
    resolved_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES timetable_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (entry_id_1) REFERENCES timetable_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (entry_id_2) REFERENCES timetable_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id),
    INDEX idx_resolved (resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default time slots
INSERT INTO time_slots (slot_name, start_time, end_time, slot_order, is_break) VALUES
('Period 1', '08:00:00', '08:45:00', 1, 0),
('Period 2', '08:45:00', '09:30:00', 2, 0),
('Break', '09:30:00', '09:50:00', 3, 1),
('Period 3', '09:50:00', '10:35:00', 4, 0),
('Period 4', '10:35:00', '11:20:00', 5, 0),
('Period 5', '11:20:00', '12:05:00', 6, 0),
('Lunch Break', '12:05:00', '13:00:00', 7, 1),
('Period 6', '13:00:00', '13:45:00', 8, 0),
('Period 7', '13:45:00', '14:30:00', 9, 0),
('Period 8', '14:30:00', '15:15:00', 10, 0)
ON DUPLICATE KEY UPDATE slot_name = VALUES(slot_name);

-- Insert sample rooms
INSERT INTO rooms (room_number, room_name, room_type, capacity) VALUES
('R101', 'Classroom 101', 'classroom', 40),
('R102', 'Classroom 102', 'classroom', 40),
('R103', 'Classroom 103', 'classroom', 40),
('LAB1', 'Science Lab 1', 'lab', 30),
('LAB2', 'Computer Lab', 'lab', 35),
('LIB', 'Library', 'library', 100),
('HALL', 'Assembly Hall', 'hall', 500),
('SPORT', 'Sports Field', 'sports', 200)
ON DUPLICATE KEY UPDATE room_name = VALUES(room_name);
