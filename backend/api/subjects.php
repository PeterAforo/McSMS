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
$action = $_GET['action'] ?? null;

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
                
                // Get assigned teachers
                $subject['teachers'] = getSubjectTeachers($pdo, $id);
                
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
                
                // Get teachers for each subject
                foreach ($subjects as &$subject) {
                    $subject['teachers'] = getSubjectTeachers($pdo, $subject['id']);
                }
                
                echo json_encode(['success' => true, 'subjects' => $subjects]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Handle teacher assignment actions
            if ($action === 'assign_teacher') {
                assignTeacherToSubject($pdo, $data);
                exit();
            }
            if ($action === 'remove_teacher') {
                removeTeacherFromSubject($pdo, $data);
                exit();
            }
            if ($action === 'set_primary_teacher') {
                setPrimaryTeacher($pdo, $data);
                exit();
            }
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

// ============================================
// Helper Functions for Subject Teachers
// ============================================

function getSubjectTeachers($pdo, $subjectId) {
    try {
        // Check if subject_teachers table exists
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'subject_teachers'");
        if ($tableCheck->rowCount() === 0) {
            return [];
        }
        
        $stmt = $pdo->prepare("
            SELECT st.id, st.teacher_id, st.is_primary, st.academic_year, st.notes,
                   CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                   t.email, t.phone, t.specialization
            FROM subject_teachers st
            JOIN teachers t ON st.teacher_id = t.id
            WHERE st.subject_id = ?
            ORDER BY st.is_primary DESC, t.first_name
        ");
        $stmt->execute([$subjectId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        return [];
    }
}

function assignTeacherToSubject($pdo, $data) {
    if (!isset($data['subject_id']) || !isset($data['teacher_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'subject_id and teacher_id are required']);
        return;
    }
    
    // Create table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS subject_teachers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            subject_id INT NOT NULL,
            teacher_id INT NOT NULL,
            is_primary TINYINT(1) DEFAULT 0,
            academic_year VARCHAR(20) DEFAULT NULL,
            notes TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY subject_teacher_unique (subject_id, teacher_id),
            KEY idx_subject_id (subject_id),
            KEY idx_teacher_id (teacher_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO subject_teachers (subject_id, teacher_id, is_primary, academic_year, notes)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['subject_id'],
            $data['teacher_id'],
            $data['is_primary'] ?? 0,
            $data['academic_year'] ?? date('Y') . '/' . (date('Y') + 1),
            $data['notes'] ?? null
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Teacher assigned successfully',
            'teachers' => getSubjectTeachers($pdo, $data['subject_id'])
        ]);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Teacher is already assigned to this subject']);
        } else {
            throw $e;
        }
    }
}

function removeTeacherFromSubject($pdo, $data) {
    if (!isset($data['subject_id']) || !isset($data['teacher_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'subject_id and teacher_id are required']);
        return;
    }
    
    $stmt = $pdo->prepare("DELETE FROM subject_teachers WHERE subject_id = ? AND teacher_id = ?");
    $stmt->execute([$data['subject_id'], $data['teacher_id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Teacher removed successfully',
        'teachers' => getSubjectTeachers($pdo, $data['subject_id'])
    ]);
}

function setPrimaryTeacher($pdo, $data) {
    if (!isset($data['subject_id']) || !isset($data['teacher_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'subject_id and teacher_id are required']);
        return;
    }
    
    // Remove primary from all teachers for this subject
    $stmt = $pdo->prepare("UPDATE subject_teachers SET is_primary = 0 WHERE subject_id = ?");
    $stmt->execute([$data['subject_id']]);
    
    // Set new primary teacher
    $stmt = $pdo->prepare("UPDATE subject_teachers SET is_primary = 1 WHERE subject_id = ? AND teacher_id = ?");
    $stmt->execute([$data['subject_id'], $data['teacher_id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Primary teacher updated',
        'teachers' => getSubjectTeachers($pdo, $data['subject_id'])
    ]);
}
