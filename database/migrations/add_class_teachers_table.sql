-- Migration: Add class_teachers junction table for multiple teachers per class
-- Run this migration to enable assigning multiple teachers to a class

-- ============================================
-- 1. CLASS_TEACHERS JUNCTION TABLE
-- Allows multiple teachers per class with roles
-- ============================================
CREATE TABLE IF NOT EXISTS `class_teachers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `role` enum('class_teacher', 'assistant', 'subject_teacher', 'support') DEFAULT 'subject_teacher',
  `is_primary` tinyint(1) DEFAULT 0,
  `assigned_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('active', 'inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_teacher_unique` (`class_id`, `teacher_id`),
  KEY `class_id` (`class_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `role` (`role`),
  KEY `is_primary` (`is_primary`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 2. MIGRATE EXISTING CLASS TEACHERS
-- Copy existing class_teacher_id to new table
-- ============================================
INSERT IGNORE INTO `class_teachers` (`class_id`, `teacher_id`, `role`, `is_primary`, `assigned_date`, `status`)
SELECT id, class_teacher_id, 'class_teacher', 1, CURDATE(), 'active'
FROM classes
WHERE class_teacher_id IS NOT NULL AND class_teacher_id > 0;

-- ============================================
-- 3. ADD INDEXES TO TEACHER_SUBJECTS IF MISSING
-- ============================================
-- Ensure teacher_subjects has proper unique constraint
-- ALTER TABLE `teacher_subjects` ADD UNIQUE KEY IF NOT EXISTS `teacher_subject_class_unique` (`teacher_id`, `subject_id`, `class_id`);
