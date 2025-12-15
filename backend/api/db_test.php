<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    require_once __DIR__ . '/../../config/database.php';
    
    // Create PDO connection
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    // Test query
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Database connected!',
        'users_count' => $result['count']
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>
