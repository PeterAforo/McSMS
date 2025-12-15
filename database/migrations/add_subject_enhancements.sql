-- Subject Enhancements Migration
-- Adds: credit_hours, department support, prerequisites, and level

-- ============================================
-- 1. DEPARTMENTS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `department_name` varchar(100) NOT NULL,
  `department_code` varchar(20) NOT NULL UNIQUE,
  `head_teacher_id` int(11) DEFAULT NULL,
  `description` text,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample departments
INSERT IGNORE INTO `departments` (`department_name`, `department_code`, `description`) VALUES
('Languages', 'LANG', 'English, French, and other language subjects'),
('Mathematics', 'MATH', 'Mathematics and related subjects'),
('Sciences', 'SCI', 'Physics, Chemistry, Biology, and General Science'),
('Social Studies', 'SOC', 'History, Geography, Civics, and Social Studies'),
('Creative Arts', 'ART', 'Music, Art, Drama, and Creative subjects'),
('Technical/Vocational', 'TECH', 'ICT, Technical Drawing, and Vocational subjects'),
('Physical Education', 'PE', 'Sports and Physical Education'),
('Religious Studies', 'REL', 'Religious and Moral Education');

-- ============================================
-- 2. ADD NEW COLUMNS TO SUBJECTS TABLE
-- ============================================

-- Add credit_hours column if not exists
SET @dbname = DATABASE();
SET @tablename = 'subjects';
SET @columnname = 'credit_hours';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE subjects ADD COLUMN credit_hours INT DEFAULT 3 AFTER description'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add department_id column if not exists
SET @columnname = 'department_id';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE subjects ADD COLUMN department_id INT DEFAULT NULL AFTER credit_hours'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add level column if not exists
SET @columnname = 'level';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE subjects ADD COLUMN level ENUM(''all'',''primary'',''jhs'',''shs'') DEFAULT ''all'' AFTER department_id'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for department_id
-- ALTER TABLE subjects ADD INDEX idx_department (department_id);

-- ============================================
-- 3. SUBJECT PREREQUISITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `subject_prerequisites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_id` int(11) NOT NULL COMMENT 'The subject that has prerequisites',
  `prerequisite_id` int(11) NOT NULL COMMENT 'The prerequisite subject',
  `is_mandatory` tinyint(1) DEFAULT 1 COMMENT '1=required, 0=recommended',
  `min_grade` varchar(5) DEFAULT NULL COMMENT 'Minimum grade required (e.g., C, B)',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_prerequisite` (`subject_id`, `prerequisite_id`),
  KEY `subject_id` (`subject_id`),
  KEY `prerequisite_id` (`prerequisite_id`),
  CONSTRAINT `fk_prereq_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prereq_prerequisite` FOREIGN KEY (`prerequisite_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 4. UPDATE EXISTING SUBJECTS WITH DEPARTMENTS
-- ============================================
-- Update Mathematics subjects
UPDATE subjects SET department_id = (SELECT id FROM departments WHERE department_code = 'MATH') 
WHERE subject_code LIKE 'MATH%' OR subject_name LIKE '%Mathematics%';

-- Update English/Language subjects
UPDATE subjects SET department_id = (SELECT id FROM departments WHERE department_code = 'LANG') 
WHERE subject_code LIKE 'ENG%' OR subject_name LIKE '%English%' OR subject_name LIKE '%French%';

-- Update Science subjects
UPDATE subjects SET department_id = (SELECT id FROM departments WHERE department_code = 'SCI') 
WHERE subject_code LIKE 'SCI%' OR subject_name LIKE '%Science%' OR subject_name LIKE '%Physics%' 
   OR subject_name LIKE '%Chemistry%' OR subject_name LIKE '%Biology%';

-- Update Social Studies subjects
UPDATE subjects SET department_id = (SELECT id FROM departments WHERE department_code = 'SOC') 
WHERE subject_name LIKE '%Social%' OR subject_name LIKE '%History%' OR subject_name LIKE '%Geography%';

-- Update ICT subjects
UPDATE subjects SET department_id = (SELECT id FROM departments WHERE department_code = 'TECH') 
WHERE subject_code LIKE 'ICT%' OR subject_name LIKE '%ICT%' OR subject_name LIKE '%Computer%';

-- Update Creative Arts subjects
UPDATE subjects SET department_id = (SELECT id FROM departments WHERE department_code = 'ART') 
WHERE subject_name LIKE '%Art%' OR subject_name LIKE '%Music%' OR subject_name LIKE '%Creative%';

-- Update PE subjects
UPDATE subjects SET department_id = (SELECT id FROM departments WHERE department_code = 'PE') 
WHERE subject_name LIKE '%Physical%' OR subject_name LIKE '%PE%' OR subject_name LIKE '%Sport%';

-- Update RME subjects
UPDATE subjects SET department_id = (SELECT id FROM departments WHERE department_code = 'REL') 
WHERE subject_code LIKE 'RME%' OR subject_name LIKE '%Religious%' OR subject_name LIKE '%Moral%';

-- Set default credit hours for existing subjects
UPDATE subjects SET credit_hours = 3 WHERE credit_hours IS NULL;
