<?php
/**
 * Classes API Endpoint
 */

header('Content-Type: application/json');

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) || strpos($origin, 'eea.mcaforo.com') !== false) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

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
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM classes WHERE id = ?");
                $stmt->execute([$id]);
                $class = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$class) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Class not found']);
                    exit;
                }
                
                echo json_encode(['success' => true, 'class' => $class]);
            } else {
                $status = $_GET['status'] ?? '';
                $level = $_GET['level'] ?? '';
                $teacher_id = $_GET['teacher_id'] ?? '';
                
                $sql = "SELECT c.*, 
                        CONCAT(t.first_name, ' ', t.last_name) as teacher_name
                        FROM classes c
                        LEFT JOIN teachers t ON c.class_teacher_id = t.id
                        WHERE 1=1";
                $params = [];
                
                if ($status) {
                    $sql .= " AND c.status = ?";
                    $params[] = $status;
                }
                
                if ($level) {
                    $sql .= " AND c.level = ?";
                    $params[] = $level;
                }
                
                if ($teacher_id) {
                    $sql .= " AND c.class_teacher_id = ?";
                    $params[] = $teacher_id;
                }
                
                $sql .= " ORDER BY c.level, c.grade, c.section";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'classes' => $classes]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $required = ['class_name', 'class_code', 'level'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => ucfirst(str_replace('_', ' ', $field)) . ' is required']);
                    exit;
                }
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO classes (
                    class_name, class_code, level, grade, section, capacity, 
                    class_teacher_id, room_number, academic_year, status, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['class_name'],
                $data['class_code'],
                $data['level'],
                $data['grade'] ?? null,
                $data['section'] ?? null,
                $data['capacity'] ?? 30,
                $data['class_teacher_id'] ?? null,
                $data['room_number'] ?? null,
                $data['academic_year'] ?? date('Y') . '/' . (date('Y') + 1),
                $data['status'] ?? 'active',
                $data['description'] ?? null
            ]);
            
            $classId = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM classes WHERE id = ?");
            $stmt->execute([$classId]);
            $class = $stmt->fetch(PDO::FETCH_ASSOC);
            
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Class created successfully', 'class' => $class]);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Class ID required']);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $updates = [];
            $params = [];
            
            $allowedFields = [
                'class_name', 'class_code', 'level', 'grade', 'section', 'capacity',
                'class_teacher_id', 'room_number', 'academic_year', 'status', 'description'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                exit;
            }
            
            $params[] = $id;
            $sql = "UPDATE classes SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            $stmt = $pdo->prepare("SELECT * FROM classes WHERE id = ?");
            $stmt->execute([$id]);
            $class = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'message' => 'Class updated successfully', 'class' => $class]);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Class ID required']);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM classes WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true, 'message' => 'Class deleted successfully']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
