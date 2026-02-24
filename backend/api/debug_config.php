<?php
/**
 * Debug config path
 * PROTECTED: Only accessible in development or with debug key
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../middleware/debug_protection.php';
DebugProtection::check();
DebugProtection::logAccess('debug_config.php');

error_reporting(E_ALL);
ini_set('display_errors', 1);

$configPath = __DIR__ . '/../../config/database.php';

$result = [
    'current_dir' => __DIR__,
    'config_path' => $configPath,
    'config_exists' => file_exists($configPath),
    'config_readable' => is_readable($configPath)
];

if (file_exists($configPath)) {
    require_once $configPath;
    $result['db_host'] = defined('DB_HOST') ? DB_HOST : 'NOT DEFINED';
    $result['db_name'] = defined('DB_NAME') ? DB_NAME : 'NOT DEFINED';
    $result['db_user'] = defined('DB_USER') ? 'SET' : 'NOT DEFINED';
    
    // Try to connect
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        $result['connection'] = 'SUCCESS';
    } catch (Exception $e) {
        $result['connection'] = 'FAILED: ' . $e->getMessage();
    }
}

echo json_encode($result, JSON_PRETTY_PRINT);
