<?php
/**
 * Roles API
 * Manage system roles
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
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
    $includePermissions = isset($_GET['include_permissions']);

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single role
                $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
                $stmt->execute([$id]);
                $role = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$role) {
                    throw new Exception('Role not found');
                }

                // Include permissions if requested
                if ($includePermissions) {
                    $stmt = $pdo->prepare("
                        SELECT p.* 
                        FROM permissions p
                        JOIN role_permissions rp ON p.id = rp.permission_id
                        WHERE rp.role_id = ?
                        ORDER BY p.module, p.permission_name
                    ");
                    $stmt->execute([$id]);
                    $permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode(['success' => true, 'role' => $role, 'permissions' => $permissions]);
                } else {
                    echo json_encode(['success' => true, 'role' => $role]);
                }
            } else {
                // Get all roles
                $stmt = $pdo->query("SELECT * FROM roles ORDER BY role_name");
                $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'roles' => $roles]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                INSERT INTO roles (role_name, display_name, description, is_system_role) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['role_name'],
                $data['display_name'] ?? $data['role_name'],
                $data['description'] ?? null,
                $data['is_system_role'] ?? 0
            ]);
            
            $newId = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
            $stmt->execute([$newId]);
            $role = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'role' => $role]);
            break;

        case 'PUT':
            if (!$id) {
                throw new Exception('Role ID is required');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE roles 
                SET role_name = ?, display_name = ?, description = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $data['role_name'],
                $data['display_name'] ?? $data['role_name'],
                $data['description'] ?? null,
                $id
            ]);
            
            $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
            $stmt->execute([$id]);
            $role = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'role' => $role]);
            break;

        case 'DELETE':
            if (!$id) {
                throw new Exception('Role ID is required');
            }
            
            $stmt = $pdo->prepare("DELETE FROM roles WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true, 'message' => 'Role deleted successfully']);
            break;

        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
