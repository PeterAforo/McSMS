<?php
/**
 * Debug Login - Test the login directly
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../../config/database.php';

try {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Connect to database
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    // Find user
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'User not found', 'email' => $data['email']]);
        exit;
    }
    
    // Verify password
    $passwordMatch = password_verify($data['password'], $user['password']);
    
    if (!$passwordMatch) {
        http_response_code(401);
        echo json_encode([
            'error' => 'Invalid password',
            'debug' => [
                'provided_password' => $data['password'],
                'hash_in_db' => substr($user['password'], 0, 20) . '...'
            ]
        ]);
        exit;
    }
    
    // Success
    unset($user['password']);
    echo json_encode([
        'success' => true,
        'user' => $user,
        'token' => 'test-token-' . time()
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
