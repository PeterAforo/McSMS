-- Final 4 Modules: Enrollment, Attendance, Grading, Homework
-- Complete School Management System

SET FOREIGN_KEY_CHECKS=0;

-- ============================================
-- 1. ATTENDANCE SYSTEM
-- ============================================
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `term_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','late','excused') DEFAULT 'present',
  `time_in` time DEFAULT NULL,
  `time_out` time DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `marked_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_date_unique` (`student_id`, `date`),
  KEY `student_id` (`student_id`),
  KEY `class_id` (`class_id`),
  KEY `date` (`date`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample attendance data
INSERT INTO `attendance` (`student_id`, `class_id`, `term_id`, `date`, `status`, `time_in`, `marked_by`) VALUES
(1, 9, 1, '2024-11-25', 'present', '07:45:00', 1),
(2, 9, 1, '2024-11-25', 'present', '07:50:00', 1),
(3, 9, 1, '2024-11-25', 'late', '08:15:00', 1),
(1, 9, 1, '2024-11-26', 'present', '07:40:00', 1),
(2, 9, 1, '2024-11-26', 'absent', NULL, 1);

-- ============================================
-- 2. GRADING SYSTEM
-- ============================================
DROP TABLE IF EXISTS `assessments`;
CREATE TABLE `assessments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `term_id` int(11) NOT NULL,
  `assessment_name` varchar(200) NOT NULL,
  `assessment_type` enum('quiz','test','exam','assignment','project','midterm','final') DEFAULT 'test',
  `total_marks` decimal(5,2) NOT NULL,
  `weight_percentage` decimal(5,2) DEFAULT 100.00,
  `assessment_date` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `class_id` (`class_id`),
  KEY `subject_id` (`subject_id`),
  KEY `term_id` (`term_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample assessments
INSERT INTO `assessments` (`class_id`, `subject_id`, `term_id`, `assessment_name`, `assessment_type`, `total_marks`, `weight_percentage`, `assessment_date`, `created_by`) VALUES
(9, 1, 1, 'Mathematics Quiz 1', 'quiz', 20.00, 10.00, '2024-11-20', 1),
(9, 1, 1, 'Mathematics Midterm', 'midterm', 50.00, 30.00, '2024-12-05', 1),
(9, 2, 1, 'English Test 1', 'test', 30.00, 20.00, '2024-11-22', 1);

DROP TABLE IF EXISTS `grades`;
CREATE TABLE `grades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assessment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `marks_obtained` decimal(5,2) DEFAULT NULL,
  `grade` varchar(5) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `graded_by` int(11) DEFAULT NULL,
  `graded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assessment_student_unique` (`assessment_id`, `student_id`),
  KEY `assessment_id` (`assessment_id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample grades
INSERT INTO `grades` (`assessment_id`, `student_id`, `marks_obtained`, `grade`, `graded_by`, `graded_at`) VALUES
(1, 1, 18.00, 'A', 1, NOW()),
(1, 2, 15.00, 'B', 1, NOW()),
(1, 3, 12.00, 'C', 1, NOW()),
(2, 1, 45.00, 'A', 1, NOW()),
(2, 2, 40.00, 'B', 1, NOW());

DROP TABLE IF EXISTS `report_cards`;
CREATE TABLE `report_cards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `term_id` int(11) NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `total_marks` decimal(6,2) DEFAULT NULL,
  `average_marks` decimal(5,2) DEFAULT NULL,
  `overall_grade` varchar(5) DEFAULT NULL,
  `position` int(11) DEFAULT NULL,
  `total_students` int(11) DEFAULT NULL,
  `teacher_remarks` text DEFAULT NULL,
  `head_remarks` text DEFAULT NULL,
  `status` enum('draft','published') DEFAULT 'draft',
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_term_unique` (`student_id`, `term_id`),
  KEY `student_id` (`student_id`),
  KEY `term_id` (`term_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 3. HOMEWORK SYSTEM
-- ============================================
DROP TABLE IF EXISTS `homework`;
CREATE TABLE `homework` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `term_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `due_date` date NOT NULL,
  `total_marks` decimal(5,2) DEFAULT 100.00,
  `attachment` varchar(255) DEFAULT NULL,
  `status` enum('active','closed','cancelled') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `class_id` (`class_id`),
  KEY `subject_id` (`subject_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `due_date` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample homework
INSERT INTO `homework` (`class_id`, `subject_id`, `term_id`, `teacher_id`, `title`, `description`, `due_date`, `total_marks`) VALUES
(9, 1, 1, 1, 'Algebra Practice', 'Complete exercises 1-20 from chapter 3', '2024-11-30', 20.00),
(9, 2, 1, 2, 'Essay Writing', 'Write a 500-word essay on "My School"', '2024-12-02', 30.00),
(9, 3, 1, 3, 'Science Project', 'Create a model of the solar system', '2024-12-10', 50.00);

DROP TABLE IF EXISTS `homework_submissions`;
CREATE TABLE `homework_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `homework_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submission_text` text DEFAULT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','submitted','late','graded') DEFAULT 'pending',
  `marks_obtained` decimal(5,2) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `graded_by` int(11) DEFAULT NULL,
  `graded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `homework_student_unique` (`homework_id`, `student_id`),
  KEY `homework_id` (`homework_id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample submissions
INSERT INTO `homework_submissions` (`homework_id`, `student_id`, `submission_text`, `submitted_at`, `status`, `marks_obtained`, `graded_by`, `graded_at`) VALUES
(1, 1, 'Completed all exercises', '2024-11-28 14:30:00', 'graded', 18.00, 1, '2024-11-29 09:00:00'),
(1, 2, 'Completed exercises 1-15', '2024-11-29 16:00:00', 'graded', 15.00, 1, '2024-11-29 17:00:00'),
(2, 1, 'Essay submitted', '2024-12-01 10:00:00', 'submitted', NULL, NULL, NULL);

-- ============================================
-- 4. ENHANCED ENROLLMENT (Already exists, adding more fields)
-- ============================================
-- Update existing enrollments table
ALTER TABLE `enrollments` 
ADD COLUMN `enrollment_type` enum('new','continuing','transfer') DEFAULT 'continuing' AFTER `status`,
ADD COLUMN `previous_class_id` int(11) DEFAULT NULL AFTER `enrollment_type`,
ADD COLUMN `approved_by` int(11) DEFAULT NULL AFTER `invoice_id`,
ADD COLUMN `approved_at` timestamp NULL DEFAULT NULL AFTER `approved_by`;

-- ============================================
-- 5. NOTIFICATIONS SYSTEM
-- ============================================
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('homework','grade','attendance','fee','announcement','general') DEFAULT 'general',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `is_read` (`is_read`),
  KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample notifications
INSERT INTO `notifications` (`user_id`, `type`, `title`, `message`, `is_read`) VALUES
(1, 'homework', 'New Homework Assigned', 'Mathematics homework due on 2024-11-30', 0),
(1, 'grade', 'Grade Published', 'Your Mathematics Quiz 1 grade is available', 0);

-- ============================================
-- 6. MESSAGES SYSTEM
-- ============================================
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `parent_message_id` int(11) DEFAULT NULL COMMENT 'For threading',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  KEY `is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=1;

-- Summary:
-- Attendance: Track daily student attendance
-- Grading: Assessments, grades, report cards
-- Homework: Assignments and submissions
-- Enrollment: Enhanced with approval workflow
-- Notifications: System notifications
-- Messages: Parent-Teacher communication
