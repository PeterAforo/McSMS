<?php
/**
 * Role Permissions API
 * Manage role-permission assignments
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
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

    switch ($method) {
        case 'POST':
            // Assign permission to role
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                INSERT IGNORE INTO role_permissions (role_id, permission_id) 
                VALUES (?, ?)
            ");
            $stmt->execute([
                $data['role_id'],
                $data['permission_id']
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Permission assigned successfully']);
            break;

        case 'DELETE':
            // Remove permission from role
            $roleId = $_GET['role_id'] ?? null;
            $permissionId = $_GET['permission_id'] ?? null;
            
            if (!$roleId || !$permissionId) {
                throw new Exception('Role ID and Permission ID are required');
            }
            
            $stmt = $pdo->prepare("
                DELETE FROM role_permissions 
                WHERE role_id = ? AND permission_id = ?
            ");
            $stmt->execute([$roleId, $permissionId]);
            
            echo json_encode(['success' => true, 'message' => 'Permission removed successfully']);
            break;

        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
