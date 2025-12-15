<?php
/**
 * Users API Endpoint
 * Direct endpoint without routing
 */

header('Content-Type: application/json');

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load database config
require_once __DIR__ . '/../../config/database.php';

// Get method and ID from query string
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single user
                $stmt = $pdo->prepare("SELECT id, name, email, phone, user_type, status, created_at FROM users WHERE id = ?");
                $stmt->execute([$id]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$user) {
                    http_response_code(404);
                    echo json_encode(['error' => 'User not found']);
                    exit;
                }
                
                echo json_encode(['success' => true, 'user' => $user]);
            } else {
                // Get all users
                $stmt = $pdo->query("SELECT id, name, email, phone, user_type, status, created_at FROM users ORDER BY created_at DESC");
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'users' => $users]);
            }
            break;

        case 'POST':
            // Create user
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name, email, and password are required']);
                exit;
            }
            
            // Check email exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$data['email']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Email already exists']);
                exit;
            }
            
            // Insert user
            $stmt = $pdo->prepare("INSERT INTO users (name, email, phone, user_type, password, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'] ?? '',
                $data['user_type'] ?? 'teacher',
                password_hash($data['password'], PASSWORD_DEFAULT),
                $data['status'] ?? 'active'
            ]);
            
            $userId = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT id, name, email, phone, user_type, status, created_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'User created successfully', 'user' => $user]);
            break;

        case 'PUT':
            // Update user
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $updates = [];
            $params = [];
            
            if (isset($data['name'])) { $updates[] = "name = ?"; $params[] = $data['name']; }
            if (isset($data['email'])) { $updates[] = "email = ?"; $params[] = $data['email']; }
            if (isset($data['phone'])) { $updates[] = "phone = ?"; $params[] = $data['phone']; }
            if (isset($data['user_type'])) { $updates[] = "user_type = ?"; $params[] = $data['user_type']; }
            if (isset($data['status'])) { $updates[] = "status = ?"; $params[] = $data['status']; }
            if (isset($data['password']) && !empty($data['password'])) {
                $updates[] = "password = ?";
                $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                exit;
            }
            
            $params[] = $id;
            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            $stmt = $pdo->prepare("SELECT id, name, email, phone, user_type, status, created_at FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'message' => 'User updated successfully', 'user' => $user]);
            break;

        case 'DELETE':
            // Delete user
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
