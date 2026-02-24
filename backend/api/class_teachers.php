<?php
/**
 * Class Teachers API
 * Manages multiple teacher assignments per class
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    switch ($method) {
        case 'GET':
            if ($action === 'by_class') {
                getTeachersByClass($pdo);
            } elseif ($action === 'by_teacher') {
                getClassesByTeacher($pdo);
            } else {
                getAllAssignments($pdo);
            }
            break;
        case 'POST':
            assignTeacher($pdo);
            break;
        case 'PUT':
            updateAssignment($pdo);
            break;
        case 'DELETE':
            removeAssignment($pdo);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function getTeachersByClass($pdo) {
    $classId = $_GET['class_id'] ?? null;
    
    if (!$classId) {
        echo json_encode(['success' => false, 'error' => 'class_id required']);
        return;
    }
    
    $stmt = $pdo->prepare("
        SELECT ct.*, 
               t.first_name, t.last_name, t.email, t.phone, t.teacher_id as teacher_code,
               t.qualification, t.specialization, t.photo,
               c.class_name
        FROM class_teachers ct
        JOIN teachers t ON ct.teacher_id = t.id
        JOIN classes c ON ct.class_id = c.id
        WHERE ct.class_id = ? AND ct.status = 'active'
        ORDER BY ct.is_primary DESC, ct.role, t.last_name
    ");
    $stmt->execute([$classId]);
    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'teachers' => $teachers]);
}

function getClassesByTeacher($pdo) {
    $teacherId = $_GET['teacher_id'] ?? null;
    
    if (!$teacherId) {
        echo json_encode(['success' => false, 'error' => 'teacher_id required']);
        return;
    }
    
    $stmt = $pdo->prepare("
        SELECT ct.*, 
               c.class_name, c.class_code, c.level, c.grade, c.section,
               c.room_number, c.capacity
        FROM class_teachers ct
        JOIN classes c ON ct.class_id = c.id
        WHERE ct.teacher_id = ? AND ct.status = 'active'
        ORDER BY c.level, c.grade, c.section
    ");
    $stmt->execute([$teacherId]);
    $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'classes' => $classes]);
}

function getAllAssignments($pdo) {
    $stmt = $pdo->query("
        SELECT ct.*, 
               t.first_name, t.last_name, t.teacher_id as teacher_code,
               c.class_name, c.class_code, c.level
        FROM class_teachers ct
        JOIN teachers t ON ct.teacher_id = t.id
        JOIN classes c ON ct.class_id = c.id
        WHERE ct.status = 'active'
        ORDER BY c.level, c.class_name, ct.is_primary DESC
    ");
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'assignments' => $assignments]);
}

function assignTeacher($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $classId = $data['class_id'] ?? null;
    $teacherId = $data['teacher_id'] ?? null;
    $role = $data['role'] ?? 'subject_teacher';
    $isPrimary = $data['is_primary'] ?? false;
    $notes = $data['notes'] ?? null;
    
    if (!$classId || !$teacherId) {
        echo json_encode(['success' => false, 'error' => 'class_id and teacher_id required']);
        return;
    }
    
    // Check if assignment already exists
    $stmt = $pdo->prepare("SELECT id FROM class_teachers WHERE class_id = ? AND teacher_id = ?");
    $stmt->execute([$classId, $teacherId]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Teacher already assigned to this class']);
        return;
    }
    
    // If setting as primary, unset other primaries for this class
    if ($isPrimary) {
        $stmt = $pdo->prepare("UPDATE class_teachers SET is_primary = 0 WHERE class_id = ?");
        $stmt->execute([$classId]);
        
        // Also update the classes table
        $stmt = $pdo->prepare("UPDATE classes SET class_teacher_id = ? WHERE id = ?");
        $stmt->execute([$teacherId, $classId]);
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO class_teachers (class_id, teacher_id, role, is_primary, assigned_date, notes, status)
        VALUES (?, ?, ?, ?, CURDATE(), ?, 'active')
    ");
    $stmt->execute([$classId, $teacherId, $role, $isPrimary ? 1 : 0, $notes]);
    
    $id = $pdo->lastInsertId();
    
    echo json_encode(['success' => true, 'id' => $id, 'message' => 'Teacher assigned successfully']);
}

function updateAssignment($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'] ?? $_GET['id'] ?? null;
    
    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'Assignment ID required']);
        return;
    }
    
    // Get current assignment
    $stmt = $pdo->prepare("SELECT * FROM class_teachers WHERE id = ?");
    $stmt->execute([$id]);
    $current = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$current) {
        echo json_encode(['success' => false, 'error' => 'Assignment not found']);
        return;
    }
    
    $role = $data['role'] ?? $current['role'];
    $isPrimary = isset($data['is_primary']) ? ($data['is_primary'] ? 1 : 0) : $current['is_primary'];
    $notes = $data['notes'] ?? $current['notes'];
    $status = $data['status'] ?? $current['status'];
    
    // If setting as primary, unset other primaries
    if ($isPrimary && !$current['is_primary']) {
        $stmt = $pdo->prepare("UPDATE class_teachers SET is_primary = 0 WHERE class_id = ?");
        $stmt->execute([$current['class_id']]);
        
        // Update classes table
        $stmt = $pdo->prepare("UPDATE classes SET class_teacher_id = ? WHERE id = ?");
        $stmt->execute([$current['teacher_id'], $current['class_id']]);
    }
    
    $stmt = $pdo->prepare("
        UPDATE class_teachers 
        SET role = ?, is_primary = ?, notes = ?, status = ?, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$role, $isPrimary, $notes, $status, $id]);
    
    echo json_encode(['success' => true, 'message' => 'Assignment updated']);
}

function removeAssignment($pdo) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'Assignment ID required']);
        return;
    }
    
    // Get assignment details first
    $stmt = $pdo->prepare("SELECT * FROM class_teachers WHERE id = ?");
    $stmt->execute([$id]);
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$assignment) {
        echo json_encode(['success' => false, 'error' => 'Assignment not found']);
        return;
    }
    
    // If this was the primary teacher, clear from classes table
    if ($assignment['is_primary']) {
        $stmt = $pdo->prepare("UPDATE classes SET class_teacher_id = NULL WHERE id = ? AND class_teacher_id = ?");
        $stmt->execute([$assignment['class_id'], $assignment['teacher_id']]);
    }
    
    // Delete the assignment
    $stmt = $pdo->prepare("DELETE FROM class_teachers WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true, 'message' => 'Teacher removed from class']);
}
