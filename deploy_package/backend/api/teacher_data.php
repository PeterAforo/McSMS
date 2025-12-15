<?php
/**
 * Teacher-Specific Data API
 * Returns only data assigned to the authenticated teacher
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
$resource = $_GET['resource'] ?? null;
$teacher_id = $_GET['teacher_id'] ?? null;

if (!$teacher_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Teacher ID is required']);
    exit();
}

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // ============================================
    // GET TEACHER'S ASSIGNED CLASSES
    // ============================================
    if ($resource === 'classes') {
        $sql = "SELECT DISTINCT c.* 
                FROM classes c
                INNER JOIN teacher_subjects ts ON c.id = ts.class_id
                WHERE ts.teacher_id = ?
                AND c.status = 'active'
                ORDER BY c.class_name";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$teacher_id]);
        $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'classes' => $classes]);
    }

    // ============================================
    // GET TEACHER'S ASSIGNED SUBJECTS
    // ============================================
    elseif ($resource === 'subjects') {
        $sql = "SELECT DISTINCT s.* 
                FROM subjects s
                INNER JOIN teacher_subjects ts ON s.id = ts.subject_id
                WHERE ts.teacher_id = ?
                ORDER BY s.subject_name";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$teacher_id]);
        $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'subjects' => $subjects]);
    }

    // ============================================
    // GET STUDENTS IN TEACHER'S CLASSES
    // ============================================
    elseif ($resource === 'students') {
        $class_id = $_GET['class_id'] ?? null;
        
        if ($class_id) {
            // Verify teacher is assigned to this class
            $verify = $pdo->prepare("SELECT COUNT(*) FROM teacher_subjects WHERE teacher_id = ? AND class_id = ?");
            $verify->execute([$teacher_id, $class_id]);
            
            if ($verify->fetchColumn() == 0) {
                http_response_code(403);
                echo json_encode(['error' => 'You are not assigned to this class']);
                exit();
            }
            
            // Get students in this class
            $sql = "SELECT * FROM students WHERE class_id = ? AND status = 'active' ORDER BY first_name, last_name";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$class_id]);
        } else {
            // Get all students in teacher's classes
            $sql = "SELECT DISTINCT s.* 
                    FROM students s
                    INNER JOIN teacher_subjects ts ON s.class_id = ts.class_id
                    WHERE ts.teacher_id = ?
                    AND s.status = 'active'
                    ORDER BY s.first_name, s.last_name";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$teacher_id]);
        }
        
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'students' => $students]);
    }

    // ============================================
    // GET TEACHER'S CLASS-SUBJECT ASSIGNMENTS
    // ============================================
    elseif ($resource === 'assignments') {
        $sql = "SELECT ts.*, c.class_name, s.subject_name, s.code as subject_code
                FROM teacher_subjects ts
                LEFT JOIN classes c ON ts.class_id = c.id
                LEFT JOIN subjects s ON ts.subject_id = s.id
                WHERE ts.teacher_id = ?
                ORDER BY c.class_name, s.subject_name";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$teacher_id]);
        $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'assignments' => $assignments]);
    }

    // ============================================
    // VERIFY TEACHER ACCESS TO CLASS
    // ============================================
    elseif ($resource === 'verify_access') {
        $class_id = $_GET['class_id'] ?? null;
        $subject_id = $_GET['subject_id'] ?? null;
        
        if (!$class_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Class ID is required']);
            exit();
        }
        
        $sql = "SELECT COUNT(*) FROM teacher_subjects WHERE teacher_id = ? AND class_id = ?";
        $params = [$teacher_id, $class_id];
        
        if ($subject_id) {
            $sql .= " AND subject_id = ?";
            $params[] = $subject_id;
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $has_access = $stmt->fetchColumn() > 0;
        
        echo json_encode(['success' => true, 'has_access' => $has_access]);
    }

    // ============================================
    // GET DASHBOARD STATS
    // ============================================
    elseif ($resource === 'dashboard_stats') {
        // Count assigned classes
        $stmt = $pdo->prepare("SELECT COUNT(DISTINCT class_id) FROM teacher_subjects WHERE teacher_id = ?");
        $stmt->execute([$teacher_id]);
        $class_count = $stmt->fetchColumn();
        
        // Count students in assigned classes
        $stmt = $pdo->prepare("SELECT COUNT(DISTINCT s.id) FROM students s INNER JOIN teacher_subjects ts ON s.class_id = ts.class_id WHERE ts.teacher_id = ? AND s.status = 'active'");
        $stmt->execute([$teacher_id]);
        $student_count = $stmt->fetchColumn();
        
        // Count homework
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM homework WHERE teacher_id = ?");
        $stmt->execute([$teacher_id]);
        $homework_count = $stmt->fetchColumn();
        
        // Count active homework
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM homework WHERE teacher_id = ? AND status = 'active'");
        $stmt->execute([$teacher_id]);
        $active_homework = $stmt->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'stats' => [
                'classes' => $class_count,
                'students' => $student_count,
                'homework' => $homework_count,
                'active_homework' => $active_homework
            ]
        ]);
    }

    else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid resource']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
