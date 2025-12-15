<?php
/**
 * Permissions API
 * Manage system permissions
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
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
    $id = $_GET['id'] ?? null;

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single permission
                $stmt = $pdo->prepare("SELECT * FROM permissions WHERE id = ?");
                $stmt->execute([$id]);
                $permission = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$permission) {
                    throw new Exception('Permission not found');
                }
                
                echo json_encode(['success' => true, 'permission' => $permission]);
            } else {
                // Get all permissions
                $stmt = $pdo->query("SELECT * FROM permissions ORDER BY module, permission_key");
                $permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'permissions' => $permissions]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                INSERT INTO permissions (permission_key, permission_name, description, module) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['permission_key'],
                $data['permission_name'],
                $data['description'] ?? null,
                $data['module'] ?? null
            ]);
            
            $newId = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM permissions WHERE id = ?");
            $stmt->execute([$newId]);
            $permission = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'permission' => $permission]);
            break;

        case 'PUT':
            if (!$id) {
                throw new Exception('Permission ID is required');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE permissions 
                SET permission_key = ?, permission_name = ?, description = ?, module = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $data['permission_key'],
                $data['permission_name'],
                $data['description'] ?? null,
                $data['module'] ?? null,
                $id
            ]);
            
            $stmt = $pdo->prepare("SELECT * FROM permissions WHERE id = ?");
            $stmt->execute([$id]);
            $permission = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'permission' => $permission]);
            break;

        case 'DELETE':
            if (!$id) {
                throw new Exception('Permission ID is required');
            }
            
            $stmt = $pdo->prepare("DELETE FROM permissions WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true, 'message' => 'Permission deleted successfully']);
            break;

        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
