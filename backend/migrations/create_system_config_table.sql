-- System Configuration Table
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Hubtel Payment Gateway Configuration
    hubtel_client_id VARCHAR(255),
    hubtel_client_secret VARCHAR(255),
    hubtel_merchant_number VARCHAR(100),
    hubtel_mode ENUM('sandbox', 'live') DEFAULT 'sandbox',
    hubtel_enabled BOOLEAN DEFAULT FALSE,
    
    -- mNotify SMS API Configuration
    mnotify_api_key VARCHAR(255),
    mnotify_sender_id VARCHAR(11),
    mnotify_enabled BOOLEAN DEFAULT FALSE,
    
    -- SMS Notification Settings
    sms_payment_confirmation BOOLEAN DEFAULT TRUE,
    sms_invoice_reminder BOOLEAN DEFAULT TRUE,
    sms_enrollment_confirmation BOOLEAN DEFAULT TRUE,
    sms_attendance_alert BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configuration
INSERT INTO system_config (id) VALUES (1)
ON DUPLICATE KEY UPDATE id=id;
