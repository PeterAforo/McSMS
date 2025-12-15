<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single department with head and subject count
                $stmt = $pdo->prepare("
                    SELECT d.*, 
                           (SELECT COUNT(*) FROM subjects WHERE department_id = d.id) as subject_count
                    FROM departments d
                    WHERE d.id = ?
                ");
                $stmt->execute([$id]);
                $department = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Get subjects in this department
                $stmt2 = $pdo->prepare("SELECT id, subject_name, subject_code FROM subjects WHERE department_id = ?");
                $stmt2->execute([$id]);
                $department['subjects'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'department' => $department]);
            } else {
                // Get all departments with stats
                $stmt = $pdo->query("
                    SELECT d.*, 
                           (SELECT COUNT(*) FROM subjects WHERE department_id = d.id) as subject_count
                    FROM departments d
                    ORDER BY d.department_name
                ");
                $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'departments' => $departments]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['department_name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Department name is required']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO departments (department_name, department_code, head_of_department, description, status) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['department_name'],
                $data['department_code'] ?? null,
                $data['head_of_department'] ?? null,
                $data['description'] ?? null,
                $data['status'] ?? 'active'
            ]);
            
            $id = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM departments WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'department' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE departments 
                SET department_name = ?, department_code = ?, head_of_department = ?, description = ?, status = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $data['department_name'],
                $data['department_code'] ?? null,
                $data['head_of_department'] ?? null,
                $data['description'] ?? null,
                $data['status'] ?? 'active',
                $id
            ]);
            
            $stmt = $pdo->prepare("SELECT * FROM departments WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'department' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'DELETE':
            // Check if department has subjects
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM subjects WHERE department_id = ?");
            $stmt->execute([$id]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Cannot delete department with assigned subjects']);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM departments WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
