<?php
/**
 * Debug endpoint for teacher_dashboard.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$debug = [];

// Check config paths
$configPaths = [
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php',
    dirname(__DIR__, 2) . '/config/database.php'
];

$debug['document_root'] = $_SERVER['DOCUMENT_ROOT'];
$debug['__DIR__'] = __DIR__;
$debug['dirname_2'] = dirname(__DIR__, 2);

foreach ($configPaths as $path) {
    $debug['config_paths'][] = [
        'path' => $path,
        'exists' => file_exists($path)
    ];
}

// Try to load config
$configLoaded = false;
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $configLoaded = true;
        $debug['config_loaded_from'] = $path;
        break;
    }
}

if (!$configLoaded) {
    $debug['error'] = 'Config file not found';
    echo json_encode($debug, JSON_PRETTY_PRINT);
    exit();
}

// Check if constants are defined
$debug['DB_HOST_defined'] = defined('DB_HOST');
$debug['DB_NAME_defined'] = defined('DB_NAME');
$debug['DB_USER_defined'] = defined('DB_USER');
$debug['DB_PASS_defined'] = defined('DB_PASS');

// Try database connection
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $debug['db_connection'] = 'success';
    
    // Check tables exist
    $tables = ['teachers', 'classes', 'subjects', 'students', 'attendance', 'homework', 'grades'];
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT 1 FROM $table LIMIT 1");
            $debug['tables'][$table] = 'exists';
        } catch (PDOException $e) {
            $debug['tables'][$table] = 'missing: ' . $e->getMessage();
        }
    }
    
    // Test teacher query
    $user_id = $_GET['user_id'] ?? 12;
    $stmt = $pdo->prepare("SELECT id FROM teachers WHERE user_id = ? LIMIT 1");
    $stmt->execute([$user_id]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    $debug['teacher_for_user_' . $user_id] = $teacher ?: 'not found';
    
} catch (PDOException $e) {
    $debug['db_error'] = $e->getMessage();
}

echo json_encode($debug, JSON_PRETTY_PRINT);
