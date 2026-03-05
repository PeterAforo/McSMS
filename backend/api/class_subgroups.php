<?php
/**
 * Class Subgroups API
 * Manage subgroups within classes for large student populations
 */
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
$classId = $_GET['class_id'] ?? null;
$action = $_GET['action'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Ensure tables exist
    createTablesIfNotExist($pdo);

    switch ($method) {
        case 'GET':
            if ($action === 'students') {
                // Get students in a subgroup
                getSubgroupStudents($pdo, $id);
            } elseif ($action === 'subjects') {
                // Get subjects/curriculum for a subgroup
                getSubgroupSubjects($pdo, $id);
            } elseif ($id) {
                // Get single subgroup
                getSubgroup($pdo, $id);
            } elseif ($classId) {
                // Get all subgroups for a class
                getClassSubgroups($pdo, $classId);
            } else {
                // Get all subgroups
                getAllSubgroups($pdo);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'assign_students') {
                assignStudentsToSubgroup($pdo, $data);
            } elseif ($action === 'remove_student') {
                removeStudentFromSubgroup($pdo, $data);
            } elseif ($action === 'assign_subject') {
                assignSubjectToSubgroup($pdo, $data);
            } elseif ($action === 'remove_subject') {
                removeSubjectFromSubgroup($pdo, $data);
            } else {
                createSubgroup($pdo, $data);
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            updateSubgroup($pdo, $id, $data);
            break;

        case 'DELETE':
            deleteSubgroup($pdo, $id);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// ============================================
// Helper Functions
// ============================================

function createTablesIfNotExist($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS class_subgroups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            subgroup_name VARCHAR(100) NOT NULL,
            subgroup_code VARCHAR(20) DEFAULT NULL,
            teacher_id INT DEFAULT NULL,
            capacity INT DEFAULT NULL,
            description TEXT DEFAULT NULL,
            room VARCHAR(100) DEFAULT NULL,
            schedule_notes TEXT DEFAULT NULL,
            has_separate_curriculum TINYINT(1) DEFAULT 0,
            status ENUM('active','inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY class_subgroup_unique (class_id, subgroup_name),
            KEY idx_class_id (class_id),
            KEY idx_teacher_id (teacher_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_subgroups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            subgroup_id INT NOT NULL,
            academic_year VARCHAR(20) DEFAULT NULL,
            term_id INT DEFAULT NULL,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY student_subgroup_unique (student_id, subgroup_id, academic_year),
            KEY idx_student_id (student_id),
            KEY idx_subgroup_id (subgroup_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS subgroup_subjects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            subgroup_id INT NOT NULL,
            subject_id INT NOT NULL,
            teacher_id INT DEFAULT NULL,
            periods_per_week INT DEFAULT 3,
            is_mandatory TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY subgroup_subject_unique (subgroup_id, subject_id),
            KEY idx_subgroup_id (subgroup_id),
            KEY idx_subject_id (subject_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function getAllSubgroups($pdo) {
    $stmt = $pdo->query("
        SELECT sg.*, c.class_name, c.level,
               CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
               (SELECT COUNT(*) FROM student_subgroups ss WHERE ss.subgroup_id = sg.id) as student_count
        FROM class_subgroups sg
        LEFT JOIN classes c ON sg.class_id = c.id
        LEFT JOIN teachers t ON sg.teacher_id = t.id
        ORDER BY c.class_name, sg.subgroup_name
    ");
    echo json_encode(['success' => true, 'subgroups' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function getClassSubgroups($pdo, $classId) {
    $stmt = $pdo->prepare("
        SELECT sg.*, 
               CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
               t.email as teacher_email,
               (SELECT COUNT(*) FROM student_subgroups ss WHERE ss.subgroup_id = sg.id) as student_count
        FROM class_subgroups sg
        LEFT JOIN teachers t ON sg.teacher_id = t.id
        WHERE sg.class_id = ?
        ORDER BY sg.subgroup_name
    ");
    $stmt->execute([$classId]);
    echo json_encode(['success' => true, 'subgroups' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function getSubgroup($pdo, $id) {
    $stmt = $pdo->prepare("
        SELECT sg.*, c.class_name, c.level,
               CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
               t.email as teacher_email
        FROM class_subgroups sg
        LEFT JOIN classes c ON sg.class_id = c.id
        LEFT JOIN teachers t ON sg.teacher_id = t.id
        WHERE sg.id = ?
    ");
    $stmt->execute([$id]);
    $subgroup = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($subgroup) {
        // Get student count
        $stmt2 = $pdo->prepare("SELECT COUNT(*) FROM student_subgroups WHERE subgroup_id = ?");
        $stmt2->execute([$id]);
        $subgroup['student_count'] = $stmt2->fetchColumn();
        
        // Get subjects if has separate curriculum
        if ($subgroup['has_separate_curriculum']) {
            $stmt3 = $pdo->prepare("
                SELECT ss.*, s.subject_name, s.subject_code,
                       CONCAT(t.first_name, ' ', t.last_name) as teacher_name
                FROM subgroup_subjects ss
                JOIN subjects s ON ss.subject_id = s.id
                LEFT JOIN teachers t ON ss.teacher_id = t.id
                WHERE ss.subgroup_id = ?
            ");
            $stmt3->execute([$id]);
            $subgroup['subjects'] = $stmt3->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    echo json_encode(['success' => true, 'subgroup' => $subgroup]);
}

function getSubgroupStudents($pdo, $subgroupId) {
    $stmt = $pdo->prepare("
        SELECT s.id, s.student_id as admission_number, s.first_name, s.last_name, 
               s.gender, s.email, ss.assigned_at
        FROM student_subgroups ss
        JOIN students s ON ss.student_id = s.id
        WHERE ss.subgroup_id = ?
        ORDER BY s.last_name, s.first_name
    ");
    $stmt->execute([$subgroupId]);
    echo json_encode(['success' => true, 'students' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function getSubgroupSubjects($pdo, $subgroupId) {
    $stmt = $pdo->prepare("
        SELECT ss.*, s.subject_name, s.subject_code, s.category,
               CONCAT(t.first_name, ' ', t.last_name) as teacher_name
        FROM subgroup_subjects ss
        JOIN subjects s ON ss.subject_id = s.id
        LEFT JOIN teachers t ON ss.teacher_id = t.id
        WHERE ss.subgroup_id = ?
        ORDER BY s.subject_name
    ");
    $stmt->execute([$subgroupId]);
    echo json_encode(['success' => true, 'subjects' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function createSubgroup($pdo, $data) {
    if (empty($data['class_id']) || empty($data['subgroup_name'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'class_id and subgroup_name are required']);
        return;
    }

    $stmt = $pdo->prepare("
        INSERT INTO class_subgroups 
        (class_id, subgroup_name, subgroup_code, teacher_id, capacity, description, room, schedule_notes, has_separate_curriculum, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['class_id'],
        $data['subgroup_name'],
        $data['subgroup_code'] ?? null,
        $data['teacher_id'] ?: null,
        $data['capacity'] ?? null,
        $data['description'] ?? null,
        $data['room'] ?? null,
        $data['schedule_notes'] ?? null,
        $data['has_separate_curriculum'] ?? 0,
        $data['status'] ?? 'active'
    ]);

    $id = $pdo->lastInsertId();
    
    // Fetch the created subgroup
    $stmt = $pdo->prepare("
        SELECT sg.*, c.class_name,
               CONCAT(t.first_name, ' ', t.last_name) as teacher_name
        FROM class_subgroups sg
        LEFT JOIN classes c ON sg.class_id = c.id
        LEFT JOIN teachers t ON sg.teacher_id = t.id
        WHERE sg.id = ?
    ");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true, 'subgroup' => $stmt->fetch(PDO::FETCH_ASSOC)]);
}

function updateSubgroup($pdo, $id, $data) {
    $stmt = $pdo->prepare("
        UPDATE class_subgroups SET
            subgroup_name = ?,
            subgroup_code = ?,
            teacher_id = ?,
            capacity = ?,
            description = ?,
            room = ?,
            schedule_notes = ?,
            has_separate_curriculum = ?,
            status = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $data['subgroup_name'],
        $data['subgroup_code'] ?? null,
        $data['teacher_id'] ?: null,
        $data['capacity'] ?? null,
        $data['description'] ?? null,
        $data['room'] ?? null,
        $data['schedule_notes'] ?? null,
        $data['has_separate_curriculum'] ?? 0,
        $data['status'] ?? 'active',
        $id
    ]);

    // Fetch updated subgroup
    $stmt = $pdo->prepare("
        SELECT sg.*, c.class_name,
               CONCAT(t.first_name, ' ', t.last_name) as teacher_name
        FROM class_subgroups sg
        LEFT JOIN classes c ON sg.class_id = c.id
        LEFT JOIN teachers t ON sg.teacher_id = t.id
        WHERE sg.id = ?
    ");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true, 'subgroup' => $stmt->fetch(PDO::FETCH_ASSOC)]);
}

function deleteSubgroup($pdo, $id) {
    $stmt = $pdo->prepare("DELETE FROM class_subgroups WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Subgroup deleted']);
}

function assignStudentsToSubgroup($pdo, $data) {
    if (empty($data['subgroup_id']) || empty($data['student_ids'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'subgroup_id and student_ids are required']);
        return;
    }

    $subgroupId = $data['subgroup_id'];
    $studentIds = $data['student_ids'];
    $academicYear = $data['academic_year'] ?? date('Y') . '/' . (date('Y') + 1);
    
    $assigned = 0;
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO student_subgroups (student_id, subgroup_id, academic_year)
        VALUES (?, ?, ?)
    ");
    
    foreach ($studentIds as $studentId) {
        $stmt->execute([$studentId, $subgroupId, $academicYear]);
        $assigned += $stmt->rowCount();
    }

    echo json_encode(['success' => true, 'message' => "$assigned student(s) assigned to subgroup"]);
}

function removeStudentFromSubgroup($pdo, $data) {
    if (empty($data['subgroup_id']) || empty($data['student_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'subgroup_id and student_id are required']);
        return;
    }

    $stmt = $pdo->prepare("DELETE FROM student_subgroups WHERE subgroup_id = ? AND student_id = ?");
    $stmt->execute([$data['subgroup_id'], $data['student_id']]);
    
    echo json_encode(['success' => true, 'message' => 'Student removed from subgroup']);
}

function assignSubjectToSubgroup($pdo, $data) {
    if (empty($data['subgroup_id']) || empty($data['subject_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'subgroup_id and subject_id are required']);
        return;
    }

    $stmt = $pdo->prepare("
        INSERT INTO subgroup_subjects (subgroup_id, subject_id, teacher_id, periods_per_week, is_mandatory)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE teacher_id = VALUES(teacher_id), periods_per_week = VALUES(periods_per_week)
    ");
    $stmt->execute([
        $data['subgroup_id'],
        $data['subject_id'],
        $data['teacher_id'] ?: null,
        $data['periods_per_week'] ?? 3,
        $data['is_mandatory'] ?? 1
    ]);

    echo json_encode(['success' => true, 'message' => 'Subject assigned to subgroup']);
}

function removeSubjectFromSubgroup($pdo, $data) {
    if (empty($data['subgroup_id']) || empty($data['subject_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'subgroup_id and subject_id are required']);
        return;
    }

    $stmt = $pdo->prepare("DELETE FROM subgroup_subjects WHERE subgroup_id = ? AND subject_id = ?");
    $stmt->execute([$data['subgroup_id'], $data['subject_id']]);
    
    echo json_encode(['success' => true, 'message' => 'Subject removed from subgroup']);
}
