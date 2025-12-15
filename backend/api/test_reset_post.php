<?php
/**
 * Test system_reset POST functionality
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $method = $_SERVER['REQUEST_METHOD'];
    
    // Get raw input
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?? [];
    
    $result = [
        'method' => $method,
        'raw_input' => $rawInput,
        'parsed_input' => $input,
        'admin_user_id' => $input['admin_user_id'] ?? 'NOT PROVIDED',
        'confirmation_code' => $input['confirmation_code'] ?? 'NOT PROVIDED'
    ];
    
    // Test verifyAdmin logic
    $userId = $input['admin_user_id'] ?? $input['user_id'] ?? null;
    $result['user_id_found'] = $userId;
    
    if ($userId) {
        $stmt = $pdo->prepare("SELECT id, user_type, status FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $result['user_found'] = $user ?: 'NOT FOUND';
        
        // Check if admin
        $stmt2 = $pdo->prepare("SELECT id, user_type FROM users WHERE id = ? AND user_type = 'admin' AND status = 'active'");
        $stmt2->execute([$userId]);
        $adminUser = $stmt2->fetch(PDO::FETCH_ASSOC);
        $result['is_admin'] = $adminUser !== false;
    }
    
    echo json_encode($result, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
