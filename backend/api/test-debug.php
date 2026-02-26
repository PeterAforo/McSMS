<?php
/**
 * Debug test file - DELETE AFTER DEBUGGING
 * Tests each step of notifications.php to find the error
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$debug = ['steps' => []];

try {
    $debug['steps'][] = 'Step 1: Starting';
    
    // Step 2: Load config
    $configPath = __DIR__ . '/../../config/database.php';
    $debug['steps'][] = 'Step 2: Config path = ' . $configPath;
    $debug['config_exists'] = file_exists($configPath);
    
    if (file_exists($configPath)) {
        require_once $configPath;
        $debug['steps'][] = 'Step 3: Config loaded';
        $debug['db_host_defined'] = defined('DB_HOST');
        $debug['db_name_defined'] = defined('DB_NAME');
    } else {
        $debug['steps'][] = 'Step 3: Config NOT FOUND';
    }
    
    // Step 4: Try database connection
    if (defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER') && defined('DB_PASS')) {
        $debug['steps'][] = 'Step 4: Attempting DB connection';
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        $debug['steps'][] = 'Step 5: DB connected successfully';
        $debug['db_connected'] = true;
        
        // Step 6: Check notifications table
        $stmt = $pdo->query("SHOW TABLES LIKE 'notifications'");
        $debug['notifications_table_exists'] = $stmt->rowCount() > 0;
        $debug['steps'][] = 'Step 6: Table check done';
        
        // Step 7: Try a simple query
        if ($debug['notifications_table_exists']) {
            $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM notifications");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $debug['notification_count'] = $result['cnt'];
            $debug['steps'][] = 'Step 7: Query successful';
        }
    } else {
        $debug['steps'][] = 'Step 4: DB constants not defined';
    }
    
    $debug['success'] = true;
    
} catch (Exception $e) {
    $debug['success'] = false;
    $debug['error'] = $e->getMessage();
    $debug['error_file'] = $e->getFile();
    $debug['error_line'] = $e->getLine();
} catch (Error $e) {
    $debug['success'] = false;
    $debug['error'] = $e->getMessage();
    $debug['error_file'] = $e->getFile();
    $debug['error_line'] = $e->getLine();
}

echo json_encode($debug, JSON_PRETTY_PRINT);
