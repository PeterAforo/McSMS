-- Mobile App Support Tables
-- Run this migration to add mobile app support

-- User devices table for push notifications
CREATE TABLE IF NOT EXISTS user_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    device_token TEXT,
    device_type ENUM('ios', 'android', 'web') DEFAULT 'android',
    device_name VARCHAR(255),
    app_version VARCHAR(50),
    os_version VARCHAR(50),
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_device (user_id, device_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- API rate limiting
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    ip_address VARCHAR(45),
    endpoint VARCHAR(255),
    request_count INT DEFAULT 1,
    window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_ip (ip_address),
    INDEX idx_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Push notifications queue
CREATE TABLE IF NOT EXISTS push_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSON,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Offline sync queue
CREATE TABLE IF NOT EXISTS sync_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    action ENUM('create', 'update', 'delete') NOT NULL,
    data JSON,
    synced TINYINT(1) DEFAULT 0,
    synced_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_synced (synced),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default app settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description) VALUES
('api_version', '1.0', 'string', 'Current API version'),
('min_app_version_ios', '1.0.0', 'string', 'Minimum required iOS app version'),
('min_app_version_android', '1.0.0', 'string', 'Minimum required Android app version'),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode'),
('force_update', 'false', 'boolean', 'Force users to update app'),
('api_rate_limit', '100', 'number', 'API requests per minute per user')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
