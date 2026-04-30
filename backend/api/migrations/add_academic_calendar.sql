-- Add academic calendar tables for managing academic years and terms
-- Migration date: 2025-04-30

-- Academic Years Table
CREATE TABLE IF NOT EXISTS academic_years (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year_name VARCHAR(20) NOT NULL UNIQUE COMMENT 'e.g., 2024/2025',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active TINYINT(1) DEFAULT 0 COMMENT 'Currently active academic year',
  status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_status (status),
  INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add year_id column to academic_terms if it doesn't exist
ALTER TABLE academic_terms 
ADD COLUMN IF NOT EXISTS year_id INT NULL AFTER id,
ADD COLUMN IF NOT EXISTS is_current TINYINT(1) DEFAULT 0 AFTER is_active,
ADD INDEX IF NOT EXISTS idx_year_id (year_id),
ADD INDEX IF NOT EXISTS idx_is_current (is_current);

-- Add automation fields to system_config
ALTER TABLE system_config
ADD COLUMN IF NOT EXISTS auto_transition_terms TINYINT(1) DEFAULT 1 COMMENT 'Automatically transition terms when they end',
ADD COLUMN IF NOT EXISTS term_transition_notice_days INT DEFAULT 7 COMMENT 'Days before term end to send notification',
ADD COLUMN IF NOT EXISTS default_term_duration_days INT DEFAULT 90 COMMENT 'Default duration of each term in days';

