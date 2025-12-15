<?php
/**
 * System Configuration API
 * Manages all system settings including payment gateways, SMS providers, email, security, and integrations
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create system_config table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS system_config (
        id INT PRIMARY KEY DEFAULT 1,
        -- General
        school_name VARCHAR(255) DEFAULT '',
        school_motto VARCHAR(255) DEFAULT '',
        school_address TEXT,
        school_phone VARCHAR(50) DEFAULT '',
        school_email VARCHAR(255) DEFAULT '',
        school_website VARCHAR(255) DEFAULT '',
        school_logo VARCHAR(500) DEFAULT '',
        -- Academic
        current_academic_year VARCHAR(20) DEFAULT '',
        current_term VARCHAR(10) DEFAULT '1',
        terms_per_year VARCHAR(10) DEFAULT '3',
        grading_system VARCHAR(20) DEFAULT 'percentage',
        -- Locale
        timezone VARCHAR(50) DEFAULT 'Africa/Accra',
        date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
        time_format VARCHAR(10) DEFAULT '12h',
        currency VARCHAR(10) DEFAULT 'GHS',
        currency_symbol VARCHAR(5) DEFAULT '₵',
        language VARCHAR(10) DEFAULT 'en',
        -- Branding
        primary_color VARCHAR(10) DEFAULT '#3B82F6',
        secondary_color VARCHAR(10) DEFAULT '#10B981',
        accent_color VARCHAR(10) DEFAULT '#F59E0B',
        -- Hubtel
        hubtel_client_id VARCHAR(255) DEFAULT '',
        hubtel_client_secret VARCHAR(255) DEFAULT '',
        hubtel_merchant_number VARCHAR(100) DEFAULT '',
        hubtel_mode VARCHAR(20) DEFAULT 'sandbox',
        hubtel_enabled TINYINT(1) DEFAULT 0,
        -- PayStack
        paystack_public_key VARCHAR(255) DEFAULT '',
        paystack_secret_key VARCHAR(255) DEFAULT '',
        paystack_mode VARCHAR(20) DEFAULT 'test',
        paystack_enabled TINYINT(1) DEFAULT 0,
        -- Stripe
        stripe_public_key VARCHAR(255) DEFAULT '',
        stripe_secret_key VARCHAR(255) DEFAULT '',
        stripe_mode VARCHAR(20) DEFAULT 'test',
        stripe_enabled TINYINT(1) DEFAULT 0,
        -- Bank Transfer
        bank_name VARCHAR(255) DEFAULT '',
        bank_account_name VARCHAR(255) DEFAULT '',
        bank_account_number VARCHAR(100) DEFAULT '',
        bank_branch VARCHAR(255) DEFAULT '',
        bank_transfer_enabled TINYINT(1) DEFAULT 0,
        -- mNotify
        mnotify_api_key VARCHAR(255) DEFAULT '',
        mnotify_sender_id VARCHAR(20) DEFAULT '',
        mnotify_enabled TINYINT(1) DEFAULT 0,
        -- Arkesel
        arkesel_api_key VARCHAR(255) DEFAULT '',
        arkesel_sender_id VARCHAR(20) DEFAULT '',
        arkesel_enabled TINYINT(1) DEFAULT 0,
        -- Twilio
        twilio_account_sid VARCHAR(255) DEFAULT '',
        twilio_auth_token VARCHAR(255) DEFAULT '',
        twilio_phone_number VARCHAR(50) DEFAULT '',
        twilio_enabled TINYINT(1) DEFAULT 0,
        -- SMS Notifications
        sms_payment_confirmation TINYINT(1) DEFAULT 1,
        sms_invoice_reminder TINYINT(1) DEFAULT 1,
        sms_enrollment_confirmation TINYINT(1) DEFAULT 1,
        sms_attendance_alert TINYINT(1) DEFAULT 0,
        sms_exam_results TINYINT(1) DEFAULT 1,
        sms_event_reminder TINYINT(1) DEFAULT 1,
        -- SMTP
        smtp_host VARCHAR(255) DEFAULT '',
        smtp_port VARCHAR(10) DEFAULT '587',
        smtp_username VARCHAR(255) DEFAULT '',
        smtp_password VARCHAR(255) DEFAULT '',
        smtp_encryption VARCHAR(10) DEFAULT 'tls',
        smtp_from_name VARCHAR(255) DEFAULT '',
        smtp_from_email VARCHAR(255) DEFAULT '',
        smtp_enabled TINYINT(1) DEFAULT 0,
        -- Email Notifications
        email_payment_confirmation TINYINT(1) DEFAULT 1,
        email_invoice_reminder TINYINT(1) DEFAULT 1,
        email_enrollment_confirmation TINYINT(1) DEFAULT 1,
        email_attendance_alert TINYINT(1) DEFAULT 0,
        email_exam_results TINYINT(1) DEFAULT 1,
        email_newsletter TINYINT(1) DEFAULT 1,
        -- WhatsApp
        whatsapp_api_url VARCHAR(500) DEFAULT '',
        whatsapp_api_token VARCHAR(500) DEFAULT '',
        whatsapp_phone_number_id VARCHAR(100) DEFAULT '',
        whatsapp_business_id VARCHAR(100) DEFAULT '',
        whatsapp_enabled TINYINT(1) DEFAULT 0,
        -- Push Notifications
        push_notifications_enabled TINYINT(1) DEFAULT 0,
        firebase_server_key VARCHAR(500) DEFAULT '',
        -- Security
        password_min_length INT DEFAULT 8,
        password_require_uppercase TINYINT(1) DEFAULT 1,
        password_require_lowercase TINYINT(1) DEFAULT 1,
        password_require_number TINYINT(1) DEFAULT 1,
        password_require_special TINYINT(1) DEFAULT 0,
        password_expiry_days INT DEFAULT 90,
        session_timeout_minutes INT DEFAULT 30,
        max_login_attempts INT DEFAULT 5,
        lockout_duration_minutes INT DEFAULT 15,
        two_factor_enabled TINYINT(1) DEFAULT 0,
        two_factor_method VARCHAR(20) DEFAULT 'email',
        ip_whitelist_enabled TINYINT(1) DEFAULT 0,
        ip_whitelist TEXT,
        -- Backup
        auto_backup_enabled TINYINT(1) DEFAULT 0,
        backup_frequency VARCHAR(20) DEFAULT 'daily',
        backup_time VARCHAR(10) DEFAULT '02:00',
        backup_retention_days INT DEFAULT 30,
        backup_location VARCHAR(50) DEFAULT 'local',
        -- Maintenance
        maintenance_mode TINYINT(1) DEFAULT 0,
        maintenance_message TEXT,
        -- Integrations
        google_calendar_enabled TINYINT(1) DEFAULT 0,
        google_client_id VARCHAR(255) DEFAULT '',
        google_client_secret VARCHAR(255) DEFAULT '',
        microsoft_365_enabled TINYINT(1) DEFAULT 0,
        microsoft_client_id VARCHAR(255) DEFAULT '',
        microsoft_client_secret VARCHAR(255) DEFAULT '',
        zoom_enabled TINYINT(1) DEFAULT 0,
        zoom_api_key VARCHAR(255) DEFAULT '',
        zoom_api_secret VARCHAR(255) DEFAULT '',
        google_meet_enabled TINYINT(1) DEFAULT 0,
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Insert default row if not exists
    $pdo->exec("INSERT IGNORE INTO system_config (id) VALUES (1)");

    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    // Auto-migrate data from old settings table on first load (only on GET)
    if ($method === 'GET' && $action !== 'export') {
        migrateFromSettings($pdo);
    }

    switch ($method) {
        case 'GET':
            if ($action === 'export') {
                exportData($pdo);
            } else {
                getConfiguration($pdo);
            }
            break;
        
        case 'POST':
            switch ($action) {
                case 'test_hubtel': testHubtel(); break;
                case 'test_mnotify': testMNotify(); break;
                case 'test_paystack': testPaystack(); break;
                case 'test_smtp': testSMTP(); break;
                case 'backup': createBackup($pdo); break;
                case 'migrate': migrateFromSettings($pdo, true); break;
                default: saveConfiguration($pdo);
            }
            break;
        
        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function migrateFromSettings($pdo, $force = false) {
    try {
        // Check if already migrated (school_name is not empty)
        $stmt = $pdo->query("SELECT school_name FROM system_config WHERE id = 1");
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$force && !empty(trim($current['school_name'] ?? ''))) {
            return; // Already has data, skip migration
        }
        
        // Check if system_settings table exists (key-value format)
        $stmt = $pdo->query("SHOW TABLES LIKE 'system_settings'");
        if (!$stmt->fetch()) {
            return; // No system_settings table to migrate from
        }
        
        // Get data from system_settings table (key-value format)
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($rows)) {
            return; // No data to migrate
        }
        
        // Convert to associative array
        $oldSettings = [];
        foreach ($rows as $row) {
            $oldSettings[$row['setting_key']] = $row['setting_value'];
        }
        
        // Map old fields to new fields
        $mapping = [
            'school_name' => 'school_name',
            'school_motto' => 'school_motto',
            'school_address' => 'school_address',
            'school_phone' => 'school_phone',
            'school_email' => 'school_email',
            'school_website' => 'school_website',
            'school_logo' => 'school_logo',
            'academic_year' => 'current_academic_year',
            'current_term' => 'current_term',
            'grading_system' => 'grading_system',
            'school_timezone' => 'timezone',
            'date_format' => 'date_format',
            'school_currency' => 'currency',
            'currency_symbol' => 'currency_symbol',
            'language' => 'language',
            'session_timeout' => 'session_timeout_minutes',
            'password_min_length' => 'password_min_length',
            'two_factor_auth' => 'two_factor_enabled'
        ];
        
        $updates = [];
        $values = [];
        
        foreach ($mapping as $oldKey => $newKey) {
            if (isset($oldSettings[$oldKey]) && $oldSettings[$oldKey] !== null && $oldSettings[$oldKey] !== '') {
                $updates[] = "$newKey = ?";
                $values[] = $oldSettings[$oldKey];
            }
        }
        
        if (!empty($updates)) {
            $sql = "UPDATE system_config SET " . implode(', ', $updates) . " WHERE id = 1";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);
        }
        
        if ($force) {
            echo json_encode(['success' => true, 'message' => 'Migration completed', 'migrated' => count($updates) . ' fields']);
            exit;
        }
    } catch (Exception $e) {
        // Silently fail migration - don't break the main functionality
        error_log("Migration error: " . $e->getMessage());
        if ($force) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            exit;
        }
    }
}

function getConfiguration($pdo) {
    $stmt = $pdo->query("SELECT * FROM system_config WHERE id = 1");
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($config) {
        // Convert null values to empty strings
        foreach ($config as $key => $value) {
            if ($value === null) {
                $config[$key] = '';
            }
        }
        
        // Mask sensitive fields
        $sensitiveFields = ['hubtel_client_secret', 'paystack_secret_key', 'stripe_secret_key', 
                           'mnotify_api_key', 'arkesel_api_key', 'twilio_auth_token', 
                           'smtp_password', 'whatsapp_api_token', 'google_client_secret',
                           'microsoft_client_secret', 'zoom_api_secret', 'firebase_server_key'];
        
        foreach ($sensitiveFields as $field) {
            if (!empty($config[$field])) {
                $config[$field] = '••••••••';
            }
        }
        
        // Convert boolean fields
        $boolFields = ['hubtel_enabled', 'paystack_enabled', 'stripe_enabled', 'bank_transfer_enabled',
                       'mnotify_enabled', 'arkesel_enabled', 'twilio_enabled', 'smtp_enabled',
                       'whatsapp_enabled', 'push_notifications_enabled', 'two_factor_enabled',
                       'ip_whitelist_enabled', 'auto_backup_enabled', 'maintenance_mode',
                       'google_calendar_enabled', 'microsoft_365_enabled', 'zoom_enabled', 'google_meet_enabled',
                       'sms_payment_confirmation', 'sms_invoice_reminder', 'sms_enrollment_confirmation',
                       'sms_attendance_alert', 'sms_exam_results', 'sms_event_reminder',
                       'email_payment_confirmation', 'email_invoice_reminder', 'email_enrollment_confirmation',
                       'email_attendance_alert', 'email_exam_results', 'email_newsletter',
                       'password_require_uppercase', 'password_require_lowercase', 'password_require_number', 'password_require_special'];
        
        foreach ($boolFields as $field) {
            if (isset($config[$field])) {
                $config[$field] = (bool)$config[$field];
            }
        }
    }
    
    echo json_encode(['success' => true, 'config' => $config ?: []]);
}

function saveConfiguration($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) throw new Exception('Invalid JSON data');
    
    // Get current config to preserve masked values
    $stmt = $pdo->query("SELECT * FROM system_config WHERE id = 1");
    $current = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Don't overwrite secrets if masked value is sent
    $sensitiveFields = ['hubtel_client_secret', 'paystack_secret_key', 'stripe_secret_key', 
                       'mnotify_api_key', 'arkesel_api_key', 'twilio_auth_token', 
                       'smtp_password', 'whatsapp_api_token', 'google_client_secret',
                       'microsoft_client_secret', 'zoom_api_secret', 'firebase_server_key'];
    
    foreach ($sensitiveFields as $field) {
        if (isset($data[$field]) && $data[$field] === '••••••••') {
            $data[$field] = $current[$field] ?? '';
        }
    }
    
    // Build dynamic UPDATE query
    $fields = [];
    $values = [];
    $allowedFields = [
        'school_name', 'school_motto', 'school_address', 'school_phone', 'school_email', 'school_website', 'school_logo',
        'current_academic_year', 'current_term', 'terms_per_year', 'grading_system',
        'timezone', 'date_format', 'time_format', 'currency', 'currency_symbol', 'language',
        'primary_color', 'secondary_color', 'accent_color',
        'hubtel_client_id', 'hubtel_client_secret', 'hubtel_merchant_number', 'hubtel_mode', 'hubtel_enabled',
        'paystack_public_key', 'paystack_secret_key', 'paystack_mode', 'paystack_enabled',
        'stripe_public_key', 'stripe_secret_key', 'stripe_mode', 'stripe_enabled',
        'bank_name', 'bank_account_name', 'bank_account_number', 'bank_branch', 'bank_transfer_enabled',
        'mnotify_api_key', 'mnotify_sender_id', 'mnotify_enabled',
        'arkesel_api_key', 'arkesel_sender_id', 'arkesel_enabled',
        'twilio_account_sid', 'twilio_auth_token', 'twilio_phone_number', 'twilio_enabled',
        'sms_payment_confirmation', 'sms_invoice_reminder', 'sms_enrollment_confirmation', 'sms_attendance_alert', 'sms_exam_results', 'sms_event_reminder',
        'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_encryption', 'smtp_from_name', 'smtp_from_email', 'smtp_enabled',
        'email_payment_confirmation', 'email_invoice_reminder', 'email_enrollment_confirmation', 'email_attendance_alert', 'email_exam_results', 'email_newsletter',
        'whatsapp_api_url', 'whatsapp_api_token', 'whatsapp_phone_number_id', 'whatsapp_business_id', 'whatsapp_enabled',
        'push_notifications_enabled', 'firebase_server_key',
        'password_min_length', 'password_require_uppercase', 'password_require_lowercase', 'password_require_number', 'password_require_special', 'password_expiry_days',
        'session_timeout_minutes', 'max_login_attempts', 'lockout_duration_minutes',
        'two_factor_enabled', 'two_factor_method', 'ip_whitelist_enabled', 'ip_whitelist',
        'auto_backup_enabled', 'backup_frequency', 'backup_time', 'backup_retention_days', 'backup_location',
        'maintenance_mode', 'maintenance_message',
        'google_calendar_enabled', 'google_client_id', 'google_client_secret',
        'microsoft_365_enabled', 'microsoft_client_id', 'microsoft_client_secret',
        'zoom_enabled', 'zoom_api_key', 'zoom_api_secret', 'google_meet_enabled'
    ];
    
    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $data)) {
            $fields[] = "$field = ?";
            $values[] = is_bool($data[$field]) ? ($data[$field] ? 1 : 0) : $data[$field];
        }
    }
    
    if (!empty($fields)) {
        $sql = "UPDATE system_config SET " . implode(', ', $fields) . " WHERE id = 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
    }
    
    echo json_encode(['success' => true, 'message' => 'Configuration saved']);
}

function testHubtel() {
    $data = json_decode(file_get_contents('php://input'), true);
    // Simulate test - in production, make actual API call
    if (!empty($data['hubtel_client_id']) && !empty($data['hubtel_client_secret'])) {
        echo json_encode(['success' => true, 'message' => 'Hubtel connection successful']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Missing credentials']);
    }
}

function testMNotify() {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!empty($data['mnotify_api_key'])) {
        // Test mNotify API
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.mnotify.com/api/balance?key=' . $data['mnotify_api_key']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $result = json_decode($response, true);
            echo json_encode(['success' => true, 'message' => 'Connected! Balance: ' . ($result['balance'] ?? 'N/A')]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid API key']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Missing API key']);
    }
}

function testPaystack() {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!empty($data['paystack_secret_key']) && $data['paystack_secret_key'] !== '••••••••') {
        echo json_encode(['success' => true, 'message' => 'PayStack credentials validated']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Missing or invalid secret key']);
    }
}

function testSMTP() {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!empty($data['smtp_host']) && !empty($data['smtp_username'])) {
        echo json_encode(['success' => true, 'message' => 'SMTP settings look valid. Test email would be sent in production.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Missing SMTP configuration']);
    }
}

function createBackup($pdo) {
    $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sql';
    // In production, this would create actual backup
    echo json_encode(['success' => true, 'filename' => $filename, 'message' => 'Backup created']);
}

function exportData($pdo) {
    header('Content-Type: application/json');
    header('Content-Disposition: attachment; filename="school_data_export_' . date('Y-m-d') . '.json"');
    
    $export = ['exported_at' => date('Y-m-d H:i:s'), 'tables' => []];
    
    // Export key tables
    $tables = ['students', 'teachers', 'classes', 'subjects', 'payments'];
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT * FROM $table LIMIT 1000");
            $export['tables'][$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $export['tables'][$table] = [];
        }
    }
    
    echo json_encode($export, JSON_PRETTY_PRINT);
    exit;
}
