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
$subject_id = $_GET['subject_id'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    switch ($method) {
        case 'GET':
            if ($subject_id) {
                // Get prerequisites for a specific subject
                $stmt = $pdo->prepare("
                    SELECT sp.*, 
                           s.subject_name as prerequisite_name,
                           s.subject_code as prerequisite_code
                    FROM subject_prerequisites sp
                    JOIN subjects s ON sp.prerequisite_id = s.id
                    WHERE sp.subject_id = ?
                    ORDER BY sp.is_mandatory DESC, s.subject_name
                ");
                $stmt->execute([$subject_id]);
                $prerequisites = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Also get subjects that require this subject as prerequisite
                $stmt2 = $pdo->prepare("
                    SELECT sp.*, 
                           s.subject_name,
                           s.subject_code
                    FROM subject_prerequisites sp
                    JOIN subjects s ON sp.subject_id = s.id
                    WHERE sp.prerequisite_id = ?
                    ORDER BY s.subject_name
                ");
                $stmt2->execute([$subject_id]);
                $required_by = $stmt2->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true, 
                    'prerequisites' => $prerequisites,
                    'required_by' => $required_by
                ]);
            } else {
                // Get all prerequisites
                $stmt = $pdo->query("
                    SELECT sp.*, 
                           s1.subject_name,
                           s1.subject_code,
                           s2.subject_name as prerequisite_name,
                           s2.subject_code as prerequisite_code
                    FROM subject_prerequisites sp
                    JOIN subjects s1 ON sp.subject_id = s1.id
                    JOIN subjects s2 ON sp.prerequisite_id = s2.id
                    ORDER BY s1.subject_name, s2.subject_name
                ");
                $prerequisites = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'prerequisites' => $prerequisites]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['subject_id']) || empty($data['prerequisite_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Subject ID and Prerequisite ID are required']);
                exit;
            }
            
            // Prevent self-reference
            if ($data['subject_id'] == $data['prerequisite_id']) {
                http_response_code(400);
                echo json_encode(['error' => 'A subject cannot be its own prerequisite']);
                exit;
            }
            
            // Check for circular dependency
            $stmt = $pdo->prepare("
                SELECT COUNT(*) FROM subject_prerequisites 
                WHERE subject_id = ? AND prerequisite_id = ?
            ");
            $stmt->execute([$data['prerequisite_id'], $data['subject_id']]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'This would create a circular dependency']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO subject_prerequisites (subject_id, prerequisite_id, is_mandatory, min_grade, notes) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['subject_id'],
                $data['prerequisite_id'],
                $data['is_mandatory'] ?? 1,
                $data['min_grade'] ?? null,
                $data['notes'] ?? null
            ]);
            
            $id = $pdo->lastInsertId();
            
            // Return the created prerequisite with subject names
            $stmt = $pdo->prepare("
                SELECT sp.*, 
                       s.subject_name as prerequisite_name,
                       s.subject_code as prerequisite_code
                FROM subject_prerequisites sp
                JOIN subjects s ON sp.prerequisite_id = s.id
                WHERE sp.id = ?
            ");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'prerequisite' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE subject_prerequisites 
                SET is_mandatory = ?, min_grade = ?, notes = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $data['is_mandatory'] ?? 1,
                $data['min_grade'] ?? null,
                $data['notes'] ?? null,
                $id
            ]);
            
            $stmt = $pdo->prepare("
                SELECT sp.*, 
                       s.subject_name as prerequisite_name,
                       s.subject_code as prerequisite_code
                FROM subject_prerequisites sp
                JOIN subjects s ON sp.prerequisite_id = s.id
                WHERE sp.id = ?
            ");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'prerequisite' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'DELETE':
            $stmt = $pdo->prepare("DELETE FROM subject_prerequisites WHERE id = ?");
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
