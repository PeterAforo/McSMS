-- ============================================
-- Onboarding System Tables
-- ============================================

-- User onboarding progress tracking
CREATE TABLE IF NOT EXISTS user_onboarding (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    step VARCHAR(50) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    skipped BOOLEAN DEFAULT FALSE,
    data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_step (user_id, step)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- System-wide onboarding status
CREATE TABLE IF NOT EXISTS system_onboarding (
    id INT PRIMARY KEY AUTO_INCREMENT,
    school_setup_completed BOOLEAN DEFAULT FALSE,
    academic_config_completed BOOLEAN DEFAULT FALSE,
    classes_created BOOLEAN DEFAULT FALSE,
    subjects_created BOOLEAN DEFAULT FALSE,
    users_added BOOLEAN DEFAULT FALSE,
    first_term_created BOOLEAN DEFAULT FALSE,
    data_imported BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Import history tracking
CREATE TABLE IF NOT EXISTS import_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    import_type VARCHAR(50) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    total_rows INT DEFAULT 0,
    successful_rows INT DEFAULT 0,
    failed_rows INT DEFAULT 0,
    errors JSON NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default system onboarding record
INSERT INTO system_onboarding (id) VALUES (1)
ON DUPLICATE KEY UPDATE id=1;

SELECT 'Onboarding tables created successfully!' as status;
