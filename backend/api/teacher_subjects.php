<?php
/**
 * Teacher Subjects API
 * Get subjects taught by a specific teacher
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

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

    if ($method === 'GET') {
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
                SELECT DISTINCT c.id as class_id, c.class_name, c.education_level
                FROM classes c
                INNER JOIN class_subjects cs ON c.id = cs.class_id
                WHERE cs.teacher_id = ? AND c.status = 'active'
                ORDER BY c.class_name
            ");
            $stmt->execute([$teacher_id]);
            $teacherClasses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // Try via teachers table class_id
            try {
                $stmt = $pdo->prepare("
                    SELECT c.id as class_id, c.class_name, c.education_level
                    FROM classes c
                    INNER JOIN teachers t ON c.id = t.class_id
                    WHERE t.id = ? AND c.status = 'active'
                    ORDER BY c.class_name
                ");
                $stmt->execute([$teacher_id]);
                $teacherClasses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e2) {
                $teacherClasses = [];
            }
        }
        
        // If no classes found via relationships, get all active classes as fallback
        if (empty($teacherClasses)) {
            try {
                $stmt = $pdo->query("SELECT id as class_id, class_name, education_level FROM classes WHERE status = 'active' ORDER BY class_name LIMIT 20");
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
