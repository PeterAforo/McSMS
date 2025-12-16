<?php
header('Content-Type: application/json');
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
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("
                    SELECT s.id, s.subject_name, s.subject_code, s.category, s.description, 
                           s.credit_hours, s.department_id, s.level, s.status, s.created_at,
                           d.department_name, d.department_code
                    FROM subjects s
                    LEFT JOIN departments d ON s.department_id = d.id
                    WHERE s.id = ?
                ");
                $stmt->execute([$id]);
                $subject = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Get prerequisites
                $stmt2 = $pdo->prepare("
                    SELECT sp.*, sub.subject_name as prerequisite_name, sub.subject_code as prerequisite_code
                    FROM subject_prerequisites sp
                    JOIN subjects sub ON sp.prerequisite_id = sub.id
                    WHERE sp.subject_id = ?
                ");
                $stmt2->execute([$id]);
                $subject['prerequisites'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'subject' => $subject]);
            } else {
                $stmt = $pdo->query("
                    SELECT s.id, s.subject_name, s.subject_code, s.category, s.description, 
                           s.credit_hours, s.department_id, s.level, s.status, s.created_at,
                           d.department_name, d.department_code
                    FROM subjects s
                    LEFT JOIN departments d ON s.department_id = d.id
                    ORDER BY s.subject_name
                ");
                $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'subjects' => $subjects]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                INSERT INTO subjects (subject_name, subject_code, category, description, status, credit_hours, department_id, level) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['subject_name'], 
                $data['subject_code'], 
                $data['category'] ?? 'core',
                $data['description'] ?? null, 
                $data['status'] ?? 'active',
                $data['credit_hours'] ?? 3,
                $data['department_id'] ?: null,
                $data['level'] ?? 'all'
            ]);
            $id = $pdo->lastInsertId();
            $stmt = $pdo->prepare("
                SELECT s.id, s.subject_name, s.subject_code, s.category, s.description, 
                       s.credit_hours, s.department_id, s.level, s.status,
                       d.department_name, d.department_code
                FROM subjects s
                LEFT JOIN departments d ON s.department_id = d.id
                WHERE s.id = ?
            ");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'subject' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                UPDATE subjects 
                SET subject_name=?, subject_code=?, category=?, description=?, status=?, credit_hours=?, department_id=?, level=? 
                WHERE id=?
            ");
            $stmt->execute([
                $data['subject_name'], 
                $data['subject_code'], 
                $data['category'] ?? 'core',
                $data['description'], 
                $data['status'],
                $data['credit_hours'] ?? 3,
                $data['department_id'] ?: null,
                $data['level'] ?? 'all',
                $id
            ]);
            $stmt = $pdo->prepare("
                SELECT s.id, s.subject_name, s.subject_code, s.category, s.description, 
                       s.credit_hours, s.department_id, s.level, s.status,
                       d.department_name, d.department_code
                FROM subjects s
                LEFT JOIN departments d ON s.department_id = d.id
                WHERE s.id = ?
            ");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'subject' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'DELETE':
            $stmt = $pdo->prepare("DELETE FROM subjects WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
