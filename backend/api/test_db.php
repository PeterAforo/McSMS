<?php
/**
 * Database Connection Test
 * Use this to verify database connectivity on production
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);

$result = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'tests' => []
];

// Test 1: Check if config file exists
$configFile = __DIR__ . '/../../config/database.php';
$result['tests']['config_exists'] = file_exists($configFile);

// Test 2: Try to load config
try {
    require_once $configFile;
    $result['tests']['config_loaded'] = true;
    $result['tests']['db_host'] = defined('DB_HOST') ? DB_HOST : 'NOT DEFINED';
    $result['tests']['db_name'] = defined('DB_NAME') ? DB_NAME : 'NOT DEFINED';
    $result['tests']['db_user'] = defined('DB_USER') ? DB_USER : 'NOT DEFINED';
    $result['tests']['db_pass_set'] = defined('DB_PASS') && DB_PASS !== '';
} catch (Exception $e) {
    $result['tests']['config_loaded'] = false;
    $result['tests']['config_error'] = $e->getMessage();
}

// Test 3: Try database connection
if (defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER') && defined('DB_PASS')) {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        $result['tests']['db_connection'] = 'SUCCESS';
        
        // Test query
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $result['tests']['users_count'] = $row['count'];
    } catch (PDOException $e) {
        $result['tests']['db_connection'] = 'FAILED';
        $result['tests']['db_error'] = $e->getMessage();
    }
}

echo json_encode($result, JSON_PRETTY_PRINT);
