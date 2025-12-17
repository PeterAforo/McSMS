<?php
/**
 * Public Settings API
 * Get school branding info without authentication
 */

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Try multiple config paths for compatibility
$configPaths = [
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php',
    dirname(__DIR__, 2) . '/config/database.php'
];
$configLoaded = false;
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $configLoaded = true;
        break;
    }
}
if (!$configLoaded) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Config file not found']);
    exit();
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $settings = [
        'school_name' => 'McSMS Pro',
        'school_abbreviation' => '',
        'school_logo' => null,
        'school_tagline' => 'School Management System',
        'school_address' => '',
        'school_phone' => '',
        'school_email' => ''
    ];

    // Try to get from system_config table first (new table used by SystemConfiguration)
    try {
        $stmt = $pdo->query("SELECT * FROM system_config WHERE id = 1 LIMIT 1");
        $configRow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($configRow) {
            // Map from system_config columns
            if (!empty($configRow['school_name'])) {
                $settings['school_name'] = $configRow['school_name'];
            }
            if (!empty($configRow['school_logo'])) {
                $settings['school_logo'] = $configRow['school_logo'];
            }
            if (!empty($configRow['school_motto'])) {
                $settings['school_tagline'] = $configRow['school_motto'];
            }
            if (!empty($configRow['school_address'])) {
                $settings['school_address'] = $configRow['school_address'];
            }
            if (!empty($configRow['school_phone'])) {
                $settings['school_phone'] = $configRow['school_phone'];
            }
            if (!empty($configRow['school_email'])) {
                $settings['school_email'] = $configRow['school_email'];
            }
        }
    } catch (PDOException $e) {
        // system_config table might not exist, try legacy table
    }
    
    // Fallback: Try legacy system_settings table
    if (empty($configRow)) {
        try {
            $stmt = $pdo->prepare("
                SELECT setting_key, setting_value 
                FROM system_settings 
                WHERE setting_key IN (
                    'school_name',
                    'school_abbreviation',
                    'school_logo', 
                    'school_tagline',
                    'school_address',
                    'school_phone',
                    'school_email'
                )
            ");
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($rows as $row) {
                if (!empty($row['setting_value'])) {
                    $settings[$row['setting_key']] = $row['setting_value'];
                }
            }
        } catch (PDOException $e) {
            // system_settings table might not exist either
        }
    }
    
    echo json_encode([
        'success' => true, 
        'settings' => $settings
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
