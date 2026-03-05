-- ============================================
-- Class Subgroups Table
-- Allows large classes to be divided into smaller groups
-- Each subgroup can have its own teacher and curriculum
-- ============================================

CREATE TABLE IF NOT EXISTS `class_subgroups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `subgroup_name` varchar(100) NOT NULL COMMENT 'e.g., Group A, Group B, Morning Session',
  `subgroup_code` varchar(20) DEFAULT NULL COMMENT 'Short code like G1A, G1B',
  `teacher_id` int(11) DEFAULT NULL COMMENT 'Teacher assigned to this subgroup',
  `capacity` int(11) DEFAULT NULL COMMENT 'Max students in this subgroup',
  `description` text DEFAULT NULL,
  `room` varchar(100) DEFAULT NULL COMMENT 'Classroom/room for this subgroup',
  `schedule_notes` text DEFAULT NULL COMMENT 'e.g., Morning shift, Afternoon shift',
  `has_separate_curriculum` tinyint(1) DEFAULT 0 COMMENT 'If 1, subgroup can have its own curriculum',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_subgroup_unique` (`class_id`, `subgroup_name`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_teacher_id` (`teacher_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_subgroup_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subgroup_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Student Subgroup Assignment
-- Links students to their subgroups
-- ============================================

CREATE TABLE IF NOT EXISTS `student_subgroups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `subgroup_id` int(11) NOT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `term_id` int(11) DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_subgroup_unique` (`student_id`, `subgroup_id`, `academic_year`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_subgroup_id` (`subgroup_id`),
  CONSTRAINT `fk_student_subgroup_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_student_subgroup_subgroup` FOREIGN KEY (`subgroup_id`) REFERENCES `class_subgroups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Subgroup Subjects (Curriculum per subgroup)
-- Allows different subjects/teachers per subgroup
-- ============================================

CREATE TABLE IF NOT EXISTS `subgroup_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subgroup_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `periods_per_week` int(11) DEFAULT 3,
  `is_mandatory` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subgroup_subject_unique` (`subgroup_id`, `subject_id`),
  KEY `idx_subgroup_id` (`subgroup_id`),
  KEY `idx_subject_id` (`subject_id`),
  KEY `idx_teacher_id` (`teacher_id`),
  CONSTRAINT `fk_subgroup_subjects_subgroup` FOREIGN KEY (`subgroup_id`) REFERENCES `class_subgroups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subgroup_subjects_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subgroup_subjects_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
