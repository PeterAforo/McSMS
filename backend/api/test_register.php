<?php
/**
 * Test Registration Endpoint
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
    
    // Check if email exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Email already exists']);
        exit;
    }
    
    // Hash password
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    
    // Insert user
    $stmt = $pdo->prepare("
        INSERT INTO users (name, email, phone, user_type, password, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([
        $data['name'],
        $data['email'],
        $data['phone'] ?? '',
        $data['user_type'] ?? 'parent',
        $hashedPassword,
        'pending_activation'
    ]);
    
    $userId = $pdo->lastInsertId();
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully',
        'user_id' => $userId
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Registration failed',
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
