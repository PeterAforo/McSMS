-- ============================================
-- Subject Teachers Junction Table
-- Allows multiple teachers per subject
-- ============================================

CREATE TABLE IF NOT EXISTS `subject_teachers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0 COMMENT 'Primary/lead teacher for this subject',
  `academic_year` varchar(20) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subject_teacher_unique` (`subject_id`, `teacher_id`),
  KEY `idx_subject_id` (`subject_id`),
  KEY `idx_teacher_id` (`teacher_id`),
  KEY `idx_is_primary` (`is_primary`),
  CONSTRAINT `fk_subject_teachers_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subject_teachers_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subject_teachers_academic_year ON subject_teachers(academic_year);
