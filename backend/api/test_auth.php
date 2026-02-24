<?php
/**
 * Auth Test - Debug auth.php issues
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

error_reporting(E_ALL);
ini_set('display_errors', 0);

$result = [
    'timestamp' => date('Y-m-d H:i:s'),
    'tests' => []
];

// Test 1: Check rate limiter
$rateLimiterFile = __DIR__ . '/../middleware/rate_limiter.php';
$result['tests']['rate_limiter_exists'] = file_exists($rateLimiterFile);

if (file_exists($rateLimiterFile)) {
    try {
        require_once $rateLimiterFile;
        $result['tests']['rate_limiter_loaded'] = class_exists('RateLimiter');
        
        // Test rate limiter
        $testResult = RateLimiter::check('test_key', 100, 60);
        $result['tests']['rate_limiter_works'] = $testResult;
    } catch (Throwable $e) {
        $result['tests']['rate_limiter_error'] = $e->getMessage();
        $result['tests']['rate_limiter_line'] = $e->getLine();
    }
}

// Test 2: Check database config
$configFile = __DIR__ . '/../../config/database.php';
try {
    require_once $configFile;
    $result['tests']['db_config_loaded'] = true;
} catch (Throwable $e) {
    $result['tests']['db_config_error'] = $e->getMessage();
}

// Test 3: Try to connect to DB
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $result['tests']['db_connection'] = 'SUCCESS';
} catch (PDOException $e) {
    $result['tests']['db_connection_error'] = $e->getMessage();
}

// Test 4: Check if users table has expected columns
try {
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $result['tests']['users_columns'] = $columns;
} catch (PDOException $e) {
    $result['tests']['users_table_error'] = $e->getMessage();
}

echo json_encode($result, JSON_PRETTY_PRINT);
