<?php
/**
 * Teacher Subjects API
 * Manage teacher-subject assignments
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

// Try multiple config paths for compatibility
$configPaths = [
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php',
    dirname(__DIR__, 2) . '/config/database.php'
];
$configLoaded = false;
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $configLoaded = true;
        break;
    }
}
if (!$configLoaded) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Config file not found']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$teacher_id = $_GET['teacher_id'] ?? null;

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $action = $_GET['action'] ?? null;
    
    if ($method === 'POST') {
        assignTeacherToSubject($pdo);
    } elseif ($method === 'DELETE') {
        removeTeacherFromSubject($pdo);
    } elseif ($method === 'GET') {
        if (!$teacher_id && !$action) {
            // Get all assignments
            getAllSubjectAssignments($pdo);
            exit();
        }
        if (!$teacher_id) {
            http_response_code(400);
            echo json_encode(['error' => 'teacher_id is required']);
            exit();
        }

        $teacherSubjects = [];
        $teacherClasses = [];
        
        // Try to get subjects via class_subjects table
        try {
            $stmt = $pdo->prepare("
                SELECT cs.id, cs.class_id, cs.subject_id, cs.teacher_id, cs.periods_per_week, cs.is_mandatory,
                       c.class_name, c.education_level,
                       s.subject_name, s.subject_code, s.category
                FROM class_subjects cs
                LEFT JOIN classes c ON cs.class_id = c.id
                LEFT JOIN subjects s ON cs.subject_id = s.id
                WHERE cs.teacher_id = ?
                ORDER BY c.class_name, s.subject_name
            ");
            $stmt->execute([$teacher_id]);
            $teacherSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // class_subjects table might not exist, try teacher_subjects table
            try {
                $stmt = $pdo->prepare("
                    SELECT ts.id, ts.subject_id, ts.teacher_id,
                           s.subject_name, s.subject_code, s.category
                    FROM teacher_subjects ts
                    LEFT JOIN subjects s ON ts.subject_id = s.id
                    WHERE ts.teacher_id = ?
                    ORDER BY s.subject_name
                ");
                $stmt->execute([$teacher_id]);
                $teacherSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e2) {
                // Neither table exists, return empty
                $teacherSubjects = [];
            }
        }
        
        // Also get teacher's classes (for pages that need class list)
        try {
            // First try via class_subjects
            $stmt = $pdo->prepare("
                SELECT DISTINCT c.id as class_id, c.class_name, c.level
                FROM classes c
                INNER JOIN class_subjects cs ON c.id = cs.class_id
                WHERE cs.teacher_id = ? AND c.status = 'active'
                ORDER BY c.class_name
            ");
            $stmt->execute([$teacher_id]);
            $teacherClasses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $teacherClasses = [];
        }
        
        // If empty, try via class_teacher_id in classes table
        if (empty($teacherClasses)) {
            try {
                $stmt = $pdo->prepare("
                    SELECT id as class_id, class_name, level
                    FROM classes
                    WHERE class_teacher_id = ? AND status = 'active'
                    ORDER BY class_name
                ");
                $stmt->execute([$teacher_id]);
                $teacherClasses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                $teacherClasses = [];
            }
        }
        
        // If still empty, get all active classes as fallback
        if (empty($teacherClasses)) {
            try {
                $stmt = $pdo->query("SELECT id as class_id, class_name, level FROM classes WHERE status = 'active' ORDER BY class_name LIMIT 20");
                $teacherClasses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                $teacherClasses = [];
            }
        }

        echo json_encode([
            'success' => true,
            'teacher_subjects' => $teacherSubjects,
            'teacher_classes' => $teacherClasses,
            'count' => count($teacherSubjects)
        ]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

function getAllSubjectAssignments($pdo) {
    $stmt = $pdo->query("
        SELECT ts.id, ts.teacher_id, ts.subject_id, ts.class_id, ts.academic_year,
               t.first_name, t.last_name, t.teacher_id as teacher_code,
               s.subject_name, s.subject_code,
               c.class_name, c.level
        FROM teacher_subjects ts
        JOIN teachers t ON ts.teacher_id = t.id
        JOIN subjects s ON ts.subject_id = s.id
        LEFT JOIN classes c ON ts.class_id = c.id
        ORDER BY t.last_name, s.subject_name
    ");
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'assignments' => $assignments]);
}

function assignTeacherToSubject($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $teacherId = $data['teacher_id'] ?? null;
    $subjectId = $data['subject_id'] ?? null;
    $classId = $data['class_id'] ?? null;
    $academicYear = $data['academic_year'] ?? date('Y') . '/' . (date('Y') + 1);
    
    if (!$teacherId || !$subjectId) {
        echo json_encode(['success' => false, 'error' => 'teacher_id and subject_id required']);
        return;
    }
    
    // Check if assignment already exists
    $sql = "SELECT id FROM teacher_subjects WHERE teacher_id = ? AND subject_id = ?";
    $params = [$teacherId, $subjectId];
    if ($classId) {
        $sql .= " AND class_id = ?";
        $params[] = $classId;
    } else {
        $sql .= " AND class_id IS NULL";
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'This assignment already exists']);
        return;
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, academic_year)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$teacherId, $subjectId, $classId, $academicYear]);
    
    $id = $pdo->lastInsertId();
    
    // Also update class_subjects if class is specified
    if ($classId) {
        $stmt = $pdo->prepare("
            INSERT INTO class_subjects (class_id, subject_id, teacher_id)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE teacher_id = ?
        ");
        $stmt->execute([$classId, $subjectId, $teacherId, $teacherId]);
    }
    
    echo json_encode(['success' => true, 'id' => $id, 'message' => 'Teacher assigned to subject']);
}

function removeTeacherFromSubject($pdo) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'Assignment ID required']);
        return;
    }
    
    // Get assignment details first
    $stmt = $pdo->prepare("SELECT * FROM teacher_subjects WHERE id = ?");
    $stmt->execute([$id]);
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$assignment) {
        echo json_encode(['success' => false, 'error' => 'Assignment not found']);
        return;
    }
    
    // Delete from teacher_subjects
    $stmt = $pdo->prepare("DELETE FROM teacher_subjects WHERE id = ?");
    $stmt->execute([$id]);
    
    // Also clear from class_subjects if applicable
    if ($assignment['class_id']) {
        $stmt = $pdo->prepare("
            UPDATE class_subjects SET teacher_id = NULL 
            WHERE class_id = ? AND subject_id = ? AND teacher_id = ?
        ");
        $stmt->execute([$assignment['class_id'], $assignment['subject_id'], $assignment['teacher_id']]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Assignment removed']);
}
