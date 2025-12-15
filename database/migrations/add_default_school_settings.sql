-- ============================================
-- Add Default School Settings
-- ============================================

-- Insert default school branding settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category) VALUES
('school_name', 'McSMS Pro', 'string', 'general'),
('school_tagline', 'School Management System', 'string', 'general'),
('school_address', 'Accra, Ghana', 'string', 'general'),
('school_phone', '+233 XX XXX XXXX', 'string', 'general'),
('school_email', 'info@school.edu.gh', 'string', 'general'),
('school_logo', NULL, 'string', 'general')
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    category = VALUES(category);

SELECT 'Default school settings added successfully!' as status;
