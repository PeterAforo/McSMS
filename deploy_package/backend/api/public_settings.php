<?php
/**
 * Public Settings API
 * Get school branding info without authentication
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

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

    // Get public school settings
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
    
    $settings = [
        'school_name' => 'McSMS Pro',
        'school_abbreviation' => '',
        'school_logo' => null,
        'school_tagline' => 'School Management System',
        'school_address' => '',
        'school_phone' => '',
        'school_email' => ''
    ];
    
    foreach ($rows as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
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
