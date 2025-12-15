<?php
/**
 * Parents API
 * Handles parent data and linking to users
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $method = $_SERVER['REQUEST_METHOD'];
    $userId = $_GET['user_id'] ?? null;
    $parentId = $_GET['id'] ?? null;

    switch ($method) {
        case 'GET':
            if ($userId) {
                // Get parent info by user_id
                // First check if user is a parent
                $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? AND user_type = 'parent'");
                $stmt->execute([$userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$user) {
                    echo json_encode(['success' => true, 'parents' => []]);
                    exit;
                }
                
                // Get children linked to this parent by email or phone
                $children = [];
                try {
                    $stmt = $pdo->prepare("
                        SELECT s.*, c.class_name 
                        FROM students s
                        LEFT JOIN classes c ON s.class_id = c.id
                        WHERE s.guardian_email = ? OR s.guardian_phone = ?
                    ");
                    $stmt->execute([$user['email'], $user['phone']]);
                    $children = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (Exception $e) {}
                
                // Build parent record
                $parent = [
                    'id' => $user['id'], // Use user_id as parent_id for consistency
                    'user_id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'phone' => $user['phone'],
                    'children' => $children
                ];
                
                echo json_encode(['success' => true, 'parents' => [$parent]]);
            } else if ($parentId) {
                // Get parent by ID
                $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? AND user_type = 'parent'");
                $stmt->execute([$parentId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($user) {
                    echo json_encode(['success' => true, 'parent' => [
                        'id' => $user['id'],
                        'user_id' => $user['id'],
                        'name' => $user['name'],
                        'email' => $user['email'],
                        'phone' => $user['phone']
                    ]]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Parent not found']);
                }
            } else {
                // Get all parents
                $stmt = $pdo->query("SELECT id, id as user_id, name, email, phone FROM users WHERE user_type = 'parent'");
                $parents = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'parents' => $parents]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
