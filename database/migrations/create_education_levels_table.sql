-- Education Levels Table
-- Allows administrators to configure custom education levels instead of hardcoded values

CREATE TABLE IF NOT EXISTS education_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level_code VARCHAR(50) NOT NULL UNIQUE,
    level_name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default levels (can be modified by admin)
INSERT INTO education_levels (level_code, level_name, display_order, is_active) VALUES
('creche', 'Creche', 1, 1),
('nursery', 'Nursery', 2, 1),
('kg', 'Kindergarten', 3, 1),
('primary', 'Primary', 4, 1),
('jhs', 'Junior High School', 5, 1),
('shs', 'Senior High School', 6, 1)
ON DUPLICATE KEY UPDATE level_name = VALUES(level_name);
