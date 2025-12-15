-- Academic Foundation Tables
-- Classes, Subjects, Terms, Teachers, and their relationships

-- ============================================
-- 1. CLASSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_name` varchar(100) NOT NULL,
  `class_code` varchar(20) NOT NULL UNIQUE,
  `level` enum('creche','nursery','kg','primary','jhs','shs') NOT NULL,
  `grade` int(11) DEFAULT NULL,
  `section` varchar(10) DEFAULT NULL,
  `capacity` int(11) DEFAULT 30,
  `current_students` int(11) DEFAULT 0,
  `class_teacher_id` int(11) DEFAULT NULL,
  `room_number` varchar(50) DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `class_teacher_id` (`class_teacher_id`),
  KEY `level` (`level`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample classes
INSERT INTO `classes` (`class_name`, `class_code`, `level`, `grade`, `section`, `capacity`, `room_number`, `academic_year`, `status`) VALUES
('Creche', 'CRE-A', 'creche', 0, 'A', 20, 'Room 101', '2024/2025', 'active'),
('Nursery 1', 'NUR1-A', 'nursery', 1, 'A', 25, 'Room 102', '2024/2025', 'active'),
('Nursery 2', 'NUR2-A', 'nursery', 2, 'A', 25, 'Room 103', '2024/2025', 'active'),
('KG 1', 'KG1-A', 'kg', 1, 'A', 30, 'Room 104', '2024/2025', 'active'),
('KG 2', 'KG2-A', 'kg', 2, 'A', 30, 'Room 105', '2024/2025', 'active'),
('Primary 1', 'PRI1-A', 'primary', 1, 'A', 35, 'Room 201', '2024/2025', 'active'),
('Primary 2', 'PRI2-A', 'primary', 2, 'A', 35, 'Room 202', '2024/2025', 'active'),
('Primary 3', 'PRI3-A', 'primary', 3, 'A', 35, 'Room 203', '2024/2025', 'active'),
('Form 1', 'JHS1-A', 'jhs', 1, 'A', 40, 'Room 301', '2024/2025', 'active'),
('Form 2', 'JHS2-A', 'jhs', 2, 'A', 40, 'Room 302', '2024/2025', 'active'),
('Form 3', 'JHS3-A', 'jhs', 3, 'A', 40, 'Room 303', '2024/2025', 'active');

-- ============================================
-- 2. SUBJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_name` varchar(100) NOT NULL,
  `subject_code` varchar(20) NOT NULL UNIQUE,
  `category` enum('core','elective','optional','extra') DEFAULT 'core',
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category` (`category`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample subjects
INSERT INTO `subjects` (`subject_name`, `subject_code`, `category`, `description`, `status`) VALUES
('Mathematics', 'MATH', 'core', 'Core mathematics curriculum', 'active'),
('English Language', 'ENG', 'core', 'English language and literature', 'active'),
('Science', 'SCI', 'core', 'General science', 'active'),
('Social Studies', 'SOC', 'core', 'Social studies and citizenship', 'active'),
('ICT', 'ICT', 'core', 'Information and Communication Technology', 'active'),
('French', 'FRE', 'elective', 'French language', 'active'),
('Religious & Moral Education', 'RME', 'core', 'Religious and moral studies', 'active'),
('Creative Arts', 'ART', 'elective', 'Arts and crafts', 'active'),
('Physical Education', 'PE', 'core', 'Physical education and sports', 'active'),
('Music', 'MUS', 'optional', 'Music and performing arts', 'active'),
('Ghanaian Language', 'GHA', 'core', 'Local language studies', 'active');

-- ============================================
-- 3. ACADEMIC TERMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `academic_terms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `term_name` varchar(100) NOT NULL,
  `term_code` varchar(20) NOT NULL UNIQUE,
  `academic_year` varchar(20) NOT NULL,
  `term_number` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `status` enum('upcoming','active','completed') DEFAULT 'upcoming',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `academic_year` (`academic_year`),
  KEY `is_active` (`is_active`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample terms
INSERT INTO `academic_terms` (`term_name`, `term_code`, `academic_year`, `term_number`, `start_date`, `end_date`, `is_active`, `status`) VALUES
('First Term 2024/2025', 'T1-2024', '2024/2025', 1, '2024-09-01', '2024-12-15', 1, 'active'),
('Second Term 2024/2025', 'T2-2024', '2024/2025', 2, '2025-01-06', '2025-04-15', 0, 'upcoming'),
('Third Term 2024/2025', 'T3-2024', '2024/2025', 3, '2025-04-28', '2025-07-25', 0, 'upcoming');

-- ============================================
-- 4. TEACHERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `teacher_id` varchar(50) NOT NULL UNIQUE,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `address` text DEFAULT NULL,
  `qualification` varchar(200) DEFAULT NULL,
  `specialization` varchar(200) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `employment_type` enum('full-time','part-time','contract') DEFAULT 'full-time',
  `status` enum('active','inactive','on-leave') DEFAULT 'active',
  `photo` varchar(255) DEFAULT NULL,
  `emergency_contact_name` varchar(200) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample teachers
INSERT INTO `teachers` (`user_id`, `teacher_id`, `first_name`, `last_name`, `email`, `phone`, `gender`, `qualification`, `specialization`, `hire_date`, `status`) VALUES
(1, 'TCH2024001', 'John', 'Mensah', 'john.mensah@school.com', '0244111222', 'male', 'B.Ed Mathematics', 'Mathematics', '2020-09-01', 'active'),
(1, 'TCH2024002', 'Grace', 'Asante', 'grace.asante@school.com', '0244222333', 'female', 'B.Ed English', 'English Language', '2019-09-01', 'active'),
(1, 'TCH2024003', 'Peter', 'Boateng', 'peter.boateng@school.com', '0244333444', 'male', 'B.Sc Science', 'Science', '2021-01-15', 'active');

-- ============================================
-- 5. CLASS-SUBJECT MAPPING
-- ============================================
CREATE TABLE IF NOT EXISTS `class_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `periods_per_week` int(11) DEFAULT 3,
  `is_mandatory` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_subject_unique` (`class_id`, `subject_id`),
  KEY `class_id` (`class_id`),
  KEY `subject_id` (`subject_id`),
  KEY `teacher_id` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 6. TEACHER-SUBJECT ASSIGNMENT
-- ============================================
CREATE TABLE IF NOT EXISTS `teacher_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `subject_id` (`subject_id`),
  KEY `class_id` (`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample assignments
INSERT INTO `teacher_subjects` (`teacher_id`, `subject_id`, `class_id`, `academic_year`) VALUES
(1, 1, 9, '2024/2025'),
(1, 1, 10, '2024/2025'),
(2, 2, 9, '2024/2025'),
(2, 2, 10, '2024/2025'),
(3, 3, 9, '2024/2025');
