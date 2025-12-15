<?php
/**
 * Class Subjects API
 * Manage subject assignments to classes (curriculum)
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

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$class_id = $_GET['class_id'] ?? null;

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // ============================================
    // GET - Retrieve class subjects
    // ============================================
    if ($method === 'GET') {
        if ($id) {
            // Get single class subject
            $stmt = $pdo->prepare("
                SELECT cs.*, 
                       s.subject_name, s.subject_code,
                       CONCAT(t.first_name, ' ', t.last_name) as teacher_name
                FROM class_subjects cs
                LEFT JOIN subjects s ON cs.subject_id = s.id
                LEFT JOIN teachers t ON cs.teacher_id = t.id
                WHERE cs.id = ?
            ");
            $stmt->execute([$id]);
            $classSubject = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($classSubject) {
                echo json_encode(['success' => true, 'class_subject' => $classSubject]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Class subject not found']);
            }
        } elseif ($class_id) {
            // Get all subjects for a class
            $stmt = $pdo->prepare("
                SELECT cs.*, 
                       s.subject_name, s.subject_code, s.category,
                       CONCAT(t.first_name, ' ', t.last_name) as teacher_name
                FROM class_subjects cs
                LEFT JOIN subjects s ON cs.subject_id = s.id
                LEFT JOIN teachers t ON cs.teacher_id = t.id
                WHERE cs.class_id = ?
                ORDER BY cs.is_mandatory DESC, s.subject_name
            ");
            $stmt->execute([$class_id]);
            $classSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'class_subjects' => $classSubjects]);
        } else {
            // Get all class subjects
            $stmt = $pdo->query("
                SELECT cs.*, 
                       c.class_name,
                       s.subject_name, s.subject_code,
                       CONCAT(t.first_name, ' ', t.last_name) as teacher_name
                FROM class_subjects cs
                LEFT JOIN classes c ON cs.class_id = c.id
                LEFT JOIN subjects s ON cs.subject_id = s.id
                LEFT JOIN teachers t ON cs.teacher_id = t.id
                ORDER BY c.class_name, s.subject_name
            ");
            $classSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'class_subjects' => $classSubjects]);
        }
    }

    // ============================================
    // POST - Create new class subject or toggle
    // ============================================
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Handle toggle action (add/remove)
        if (isset($data['action'])) {
            if (!isset($data['class_id']) || !isset($data['subject_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Class ID and Subject ID are required']);
                exit();
            }
            
            if ($data['action'] === 'add') {
                // Check if already exists
                $check = $pdo->prepare("SELECT id FROM class_subjects WHERE class_id = ? AND subject_id = ?");
                $check->execute([$data['class_id'], $data['subject_id']]);
                if (!$check->fetch()) {
                    $stmt = $pdo->prepare("INSERT INTO class_subjects (class_id, subject_id) VALUES (?, ?)");
                    $stmt->execute([$data['class_id'], $data['subject_id']]);
                }
                echo json_encode(['success' => true, 'message' => 'Subject added to class']);
                exit();
            } elseif ($data['action'] === 'remove') {
                $stmt = $pdo->prepare("DELETE FROM class_subjects WHERE class_id = ? AND subject_id = ?");
                $stmt->execute([$data['class_id'], $data['subject_id']]);
                echo json_encode(['success' => true, 'message' => 'Subject removed from class']);
                exit();
            }
        }
        
        // Validate required fields
        if (!isset($data['class_id']) || !isset($data['subject_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Class ID and Subject ID are required']);
            exit();
        }
        
        // Check if subject already assigned to this class
        $check = $pdo->prepare("SELECT id FROM class_subjects WHERE class_id = ? AND subject_id = ?");
        $check->execute([$data['class_id'], $data['subject_id']]);
        if ($check->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'This subject is already assigned to this class']);
            exit();
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO class_subjects (
                class_id, subject_id, teacher_id, 
                periods_per_week, is_mandatory
            ) VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['class_id'],
            $data['subject_id'],
            $data['teacher_id'] ?? null,
            $data['periods_per_week'] ?? 3,
            $data['is_mandatory'] ?? 1
        ]);
        
        $newId = $pdo->lastInsertId();
        
        // Fetch the created record with joins
        $stmt = $pdo->prepare("
            SELECT cs.*, 
                   s.subject_name, s.subject_code,
                   CONCAT(t.first_name, ' ', t.last_name) as teacher_name
            FROM class_subjects cs
            LEFT JOIN subjects s ON cs.subject_id = s.id
            LEFT JOIN teachers t ON cs.teacher_id = t.id
            WHERE cs.id = ?
        ");
        $stmt->execute([$newId]);
        $classSubject = $stmt->fetch(PDO::FETCH_ASSOC);
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Subject assigned to class successfully',
            'class_subject' => $classSubject
        ]);
    }

    // ============================================
    // PUT - Update class subject
    // ============================================
    elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $pdo->prepare("
            UPDATE class_subjects 
            SET teacher_id = ?, 
                periods_per_week = ?, 
                is_mandatory = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $data['teacher_id'] ?? null,
            $data['periods_per_week'] ?? 3,
            $data['is_mandatory'] ?? 1,
            $id
        ]);
        
        // Fetch updated record
        $stmt = $pdo->prepare("
            SELECT cs.*, 
                   s.subject_name, s.subject_code,
                   CONCAT(t.first_name, ' ', t.last_name) as teacher_name
            FROM class_subjects cs
            LEFT JOIN subjects s ON cs.subject_id = s.id
            LEFT JOIN teachers t ON cs.teacher_id = t.id
            WHERE cs.id = ?
        ");
        $stmt->execute([$id]);
        $classSubject = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Class subject updated successfully',
            'class_subject' => $classSubject
        ]);
    }

    // ============================================
    // DELETE - Remove subject from class
    // ============================================
    elseif ($method === 'DELETE' && $id) {
        $stmt = $pdo->prepare("DELETE FROM class_subjects WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Subject removed from class successfully'
        ]);
    }

    else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
